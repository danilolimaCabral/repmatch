/**
 * Full CNPJA Enrichment Script
 * Fetches ALL available data from CNPJA Commercial API for each representative:
 * - Email, Phone, Address (full)
 * - Situação cadastral, Data abertura, Natureza jurídica, Porte
 * - Capital social, Simples Nacional, MEI
 * - CNAE principal e secundários
 * - Sócios completos
 * - Inscrições estaduais
 * - Raw JSON for future use
 */
import mysql from 'mysql2/promise';

const CNPJA_API_KEY = process.env.CNPJA_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CNPJA_API_KEY) throw new Error('CNPJA_API_KEY not set');
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

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
    const res = await fetch(`https://api.cnpja.com/office/${clean}?strategy=CACHE_IF_ERROR`, {
      headers: {
        'Authorization': CNPJA_API_KEY,
        'User-Agent': 'RepMatch/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (res.status === 429) {
        console.log('  Rate limited, waiting 3s...');
        await sleep(3000);
        return null;
      }
      if (res.status === 404) return null;
      return null;
    }
    return await res.json();
  } catch (e) {
    return null;
  }
}

function formatPhone(phoneObj) {
  if (!phoneObj) return null;
  return `(${phoneObj.area}) ${phoneObj.number}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return null;
  }
}

async function main() {
  const conn = await mysql.createConnection(parseMysqlUrl(DATABASE_URL));
  console.log('Connected to database');

  // Get all reps with CNPJ that haven't been enriched yet (cnpjaUpdatedAt is null)
  const [rows] = await conn.execute(`
    SELECT id, cnpj, fullName, phone
    FROM representatives
    WHERE cnpj IS NOT NULL AND cnpj != ''
    AND cnpjaUpdatedAt IS NULL
    ORDER BY id
  `);

  console.log(`Found ${rows.length} representatives to enrich`);

  let updated = 0;
  let failed = 0;
  let noData = 0;

  for (let i = 0; i < rows.length; i++) {
    const rep = rows[i];

    if (i % 50 === 0) {
      console.log(`Progress: ${i}/${rows.length} | Updated: ${updated} | Failed: ${failed} | NoData: ${noData}`);
    }

    const data = await lookupCnpja(rep.cnpj);
    if (!data) {
      noData++;
      // Mark as attempted so we don't retry
      await conn.execute(
        `UPDATE representatives SET cnpjaUpdatedAt = NOW() WHERE id = ?`,
        [rep.id]
      );
      continue;
    }

    // Extract all fields
    const email = data.emails?.[0]?.address || null;
    const phone = rep.phone ? null : formatPhone(data.phones?.[0]); // Only fill if empty
    const nomeFantasia = data.alias || null;

    // Address
    const logradouro = data.address?.street || null;
    const numero = data.address?.number || null;
    const bairro = data.address?.district || null;
    const cidade = data.address?.city || null;
    const estado = data.address?.state || null;
    const cep = data.address?.zip || null;
    const complemento = data.address?.details || null;

    // Company info
    const situacaoCadastral = data.status?.text || null;
    const dataAbertura = formatDate(data.founded);
    const naturezaJuridica = data.company?.nature?.text || null;
    const porte = data.company?.size?.text || null;
    const capitalSocial = data.company?.equity || null;
    const simplesNacional = data.company?.simples?.optant ? 1 : 0;
    const mei = data.company?.simei?.optant ? 1 : 0;

    // CNAE
    const cnaeCode = data.mainActivity?.id ? String(data.mainActivity.id) : null;
    const cnaeDescricao = data.mainActivity?.text || null;

    // Sócios (members)
    const socios = data.company?.members?.length
      ? JSON.stringify(data.company.members.map(m => ({
          nome: m.person?.name,
          tipo: m.person?.type,
          cargo: m.role?.text,
          desde: m.since,
          cpf: m.person?.taxId,
        })))
      : null;

    // Inscrições estaduais
    const inscricoesEstaduais = data.registrations?.length
      ? JSON.stringify(data.registrations.map(r => ({
          uf: r.state,
          numero: r.number,
          situacao: r.status?.text,
        })))
      : null;

    // Raw data (without heavy fields to save space)
    const rawData = JSON.stringify({
      taxId: data.taxId,
      status: data.status,
      founded: data.founded,
      company: {
        name: data.company?.name,
        size: data.company?.size,
        nature: data.company?.nature,
        simples: data.company?.simples,
        simei: data.company?.simei,
      },
      address: data.address,
      phones: data.phones,
      emails: data.emails,
      mainActivity: data.mainActivity,
      sideActivities: data.sideActivities?.slice(0, 5),
      suframa: data.suframa,
    });

    await conn.execute(
      `UPDATE representatives SET
        email = COALESCE(NULLIF(email, ''), ?),
        phone = COALESCE(NULLIF(phone, ''), ?),
        nomeFantasia = COALESCE(NULLIF(nomeFantasia, ''), ?),
        logradouro = ?,
        numero = ?,
        bairro = ?,
        cidade = COALESCE(NULLIF(cidade, ''), ?),
        estado = COALESCE(NULLIF(estado, ''), ?),
        cep = COALESCE(NULLIF(cep, ''), ?),
        complemento = ?,
        situacaoCadastral = ?,
        dataAbertura = ?,
        naturezaJuridica = ?,
        porte = ?,
        capitalSocial = ?,
        simplesNacional = ?,
        mei = ?,
        cnaeCode = ?,
        cnaeDescricao = ?,
        socios = ?,
        inscricoesEstaduais = ?,
        cnpjaUpdatedAt = NOW(),
        cnpjaRawData = ?
      WHERE id = ?`,
      [
        email, phone, nomeFantasia,
        logradouro, numero, bairro,
        cidade, estado, cep, complemento,
        situacaoCadastral, dataAbertura,
        naturezaJuridica, porte, capitalSocial,
        simplesNacional, mei,
        cnaeCode, cnaeDescricao,
        socios, inscricoesEstaduais,
        rawData,
        rep.id,
      ]
    );
    updated++;

    // ~10 req/s for commercial API (100ms delay)
    await sleep(100);
  }

  console.log(`\n=== ENRICHMENT COMPLETE ===`);
  console.log(`Total processed: ${rows.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`No data (404/error): ${noData}`);
  console.log(`Failed: ${failed}`);

  await conn.end();
}

main().catch(console.error);
