/**
 * Enrich representatives with CNPJA Commercial API
 * Fills: email, phone, address (city, state, zip), status, nome_fantasia
 * Runs at ~10 req/s (commercial API allows much higher limits)
 */
import mysql from 'mysql2/promise';

const CNPJA_API_KEY = process.env.CNPJA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CNPJA_API_KEY) throw new Error('CNPJA_API_KEY not set');
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

// Parse DATABASE_URL: mysql://user:pass@host:port/dbname
function parseMysqlUrl(url) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: parseInt(u.port) || 3306,
    user: u.username,
    password: u.password,
    database: u.pathname.slice(1),
    ssl: { rejectUnauthorized: false },
  };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function lookupCnpja(cnpj) {
  const clean = cnpj.replace(/\D/g, '');
  if (clean.length !== 14) return null;
  try {
    const res = await fetch(`https://api.cnpja.com/office/${clean}`, {
      headers: {
        'Authorization': CNPJA_API_KEY,
        'User-Agent': 'RepMatch/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.log('  Rate limited, waiting 5s...');
        await sleep(5000);
        return null;
      }
      return null;
    }
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function main() {
  const conn = await mysql.createConnection(parseMysqlUrl(DATABASE_URL));
  console.log('Connected to database');

  // Get all reps with CNPJ but missing email or phone
  const [rows] = await conn.execute(`
    SELECT id, cnpj, fullName, phone, email
    FROM representatives
    WHERE cnpj IS NOT NULL AND cnpj != ''
    AND (email IS NULL OR email = '' OR phone IS NULL OR phone = '')
    ORDER BY id
  `);

  console.log(`Found ${rows.length} representatives to enrich`);

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const rep = rows[i];
    const cnpjClean = rep.cnpj.replace(/\D/g, '');

    if (i % 100 === 0) {
      console.log(`Progress: ${i}/${rows.length} | Updated: ${updated} | Failed: ${failed}`);
    }

    const data = await lookupCnpja(cnpjClean);
    if (!data) {
      failed++;
      continue;
    }

    // Extract email
    const email = data.emails?.[0]?.address || null;
    // Extract phone
    const phoneObj = data.phones?.[0];
    const phone = phoneObj ? `(${phoneObj.area}) ${phoneObj.number}` : null;
    // Extract address
    const city = data.address?.city || null;
    const state = data.address?.state || null;
    const zip = data.address?.zip || null;
    // Extract nome fantasia
    const nomeFantasia = data.alias || null;
    // Extract status
    const status = data.status?.text || null;

    // Build update
    const updates = [];
    const params = [];

    if (email && (!rep.email || rep.email === '')) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone && (!rep.phone || rep.phone === '')) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (nomeFantasia) {
      updates.push('nomeFantasia = ?');
      params.push(nomeFantasia);
    }
    if (city) {
      updates.push('cidade = ?');
      params.push(city);
    }
    if (state) {
      updates.push('estado = ?');
      params.push(state);
    }
    if (zip) {
      updates.push('cep = ?');
      params.push(zip);
    }

    if (updates.length === 0) {
      skipped++;
      continue;
    }

    params.push(rep.id);
    await conn.execute(
      `UPDATE representatives SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    updated++;

    // Small delay to be respectful (commercial API allows ~10 req/s)
    await sleep(100);
  }

  console.log(`\n=== ENRICHMENT COMPLETE ===`);
  console.log(`Total processed: ${rows.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Failed/no data: ${failed}`);
  console.log(`Skipped (already had data): ${skipped}`);

  await conn.end();
}

main().catch(console.error);
