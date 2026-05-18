/**
 * Script de enriquecimento de representantes
 * Faz match aproximado por nome entre representatives e cnpj_representatives
 * Estratégias:
 *   1. Match exato (já feito via SQL)
 *   2. Match após normalizar (remover LTDA, ME, EIRELI, S/A, etc.)
 *   3. Match por prefixo (primeiros 20 chars normalizados)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

// Parse MySQL URL
function parseDbUrl(url) {
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

// Normalize company name: remove legal suffixes, punctuation, extra spaces
function normalizeName(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .replace(/\b(LTDA|ME|EIRELI|EPP|S\/A|SA|COMERCIAL|COMERCIAIS|REPRESENTACOES|REPRESENTACAO|REPRESENTAÇÕES|REPRESENTAÇÃO|INDUSTRIA|INDUSTRIAS|SERVICOS|SERVICO|SERVIÇOS|SERVIÇO|EMPRESA|EMPRESAS|E CIA|CIA|LIMITADA|MICROEMPRESA|INDIVIDUAL|UNIPESSOAL)\b/g, '')
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('Connected to database');

  // Get all reps without CNPJ
  const [reps] = await conn.execute(
    `SELECT id, fullName FROM representatives WHERE cnpj IS NULL OR cnpj = ''`
  );
  console.log(`Found ${reps.length} representatives without CNPJ`);

  // Load all cnpj_representatives into memory for fast lookup
  console.log('Loading cnpj_representatives into memory...');
  const [cnpjReps] = await conn.execute(
    `SELECT cnpj, razao_social, nome_fantasia, telefone, email, uf, municipio FROM cnpj_representatives`
  );
  console.log(`Loaded ${cnpjReps.length} CNPJ records`);

  // Build normalized lookup maps
  const normalizedMap = new Map(); // normalized_name -> cnpj record
  const prefixMap = new Map();     // first 15 chars -> array of cnpj records

  for (const cr of cnpjReps) {
    const norm = normalizeName(cr.razao_social);
    if (norm.length >= 5) {
      if (!normalizedMap.has(norm)) normalizedMap.set(norm, cr);
      const prefix = norm.slice(0, 15);
      if (!prefixMap.has(prefix)) prefixMap.set(prefix, []);
      prefixMap.get(prefix).push(cr);
    }
    // Also index by nome_fantasia
    if (cr.nome_fantasia) {
      const normFantasia = normalizeName(cr.nome_fantasia);
      if (normFantasia.length >= 5 && !normalizedMap.has(normFantasia)) {
        normalizedMap.set(normFantasia, cr);
      }
    }
  }

  console.log(`Built lookup maps: ${normalizedMap.size} normalized names, ${prefixMap.size} prefixes`);

  let matched = 0;
  let noMatch = 0;
  const updates = [];

  for (const rep of reps) {
    const normRep = normalizeName(rep.fullName);
    
    // Strategy 1: normalized exact match
    let found = normalizedMap.get(normRep);
    
    // Strategy 2: prefix match (first 15 chars)
    if (!found && normRep.length >= 10) {
      const prefix = normRep.slice(0, 15);
      const candidates = prefixMap.get(prefix) || [];
      if (candidates.length === 1) {
        found = candidates[0];
      } else if (candidates.length > 1) {
        // Pick best match: highest overlap
        let bestScore = 0;
        for (const c of candidates) {
          const normC = normalizeName(c.razao_social);
          const score = overlapScore(normRep, normC);
          if (score > bestScore && score > 0.7) {
            bestScore = score;
            found = c;
          }
        }
      }
    }

    if (found) {
      matched++;
      updates.push({
        id: rep.id,
        cnpj: found.cnpj,
        phone: found.telefone || null,
      });
    } else {
      noMatch++;
    }
  }

  console.log(`Matched: ${matched}, No match: ${noMatch}`);

  // Apply updates in batches of 500
  const BATCH = 500;
  let updated = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    for (const u of batch) {
      await conn.execute(
        `UPDATE representatives SET cnpj = ?, phone = COALESCE(NULLIF(phone, ''), ?) WHERE id = ? AND (cnpj IS NULL OR cnpj = '')`,
        [u.cnpj, u.phone, u.id]
      );
    }
    updated += batch.length;
    process.stdout.write(`\rUpdated ${updated}/${updates.length}...`);
  }

  console.log(`\nDone! Updated ${updated} representatives`);

  // Final stats
  const [[stats]] = await conn.execute(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 ELSE 0 END) as com_cnpj,
      SUM(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END) as com_telefone
    FROM representatives`
  );
  console.log('\nFinal stats:', stats);

  await conn.end();
}

// Simple overlap score between two strings (word-level Jaccard)
function overlapScore(a, b) {
  const wordsA = new Set(a.split(' ').filter(w => w.length > 2));
  const wordsB = new Set(b.split(' ').filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  let intersection = 0;
  for (const w of wordsA) if (wordsB.has(w)) intersection++;
  const union = wordsA.size + wordsB.size - intersection;
  return intersection / union;
}

main().catch(e => { console.error(e); process.exit(1); });
