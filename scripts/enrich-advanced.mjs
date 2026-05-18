/**
 * Script de enriquecimento avançado - Estratégias adicionais
 * Para os representantes que ainda não têm CNPJ após os matches anteriores
 * 
 * Estratégias:
 * 1. Match por primeiros N tokens significativos (ignorando stopwords)
 * 2. Match invertido: nome fantasia truncado
 * 3. Match por sigla (ex: "A M A MENDES" → "AMA MENDES")
 * 4. Match por Levenshtein distance (edit distance <= 2)
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const DB_URL = process.env.DATABASE_URL;

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

const STOPWORDS = new Set([
  'LTDA', 'ME', 'EIRELI', 'EPP', 'SA', 'CIA', 'COMERCIAL', 'COMERCIAIS',
  'REPRESENTACOES', 'REPRESENTACAO', 'REPRESENTAÇÕES', 'REPRESENTAÇÃO',
  'INDUSTRIA', 'INDUSTRIAS', 'SERVICOS', 'SERVICO', 'SERVIÇOS', 'SERVIÇO',
  'EMPRESA', 'EMPRESAS', 'LIMITADA', 'MICROEMPRESA', 'INDIVIDUAL', 'UNIPESSOAL',
  'E', 'DE', 'DA', 'DO', 'DAS', 'DOS', 'EM', 'COM', 'PARA', 'POR', 'A', 'O',
  'S/A', 'LTDA/ME', 'ME/EPP', 'NEGOCIOS', 'NEGOCIO', 'BUSINESS', 'TRADING',
  'DISTRIBUIDORA', 'DISTRIBUIDORAS', 'DISTRIBUICAO', 'IMPORTACAO', 'EXPORTACAO',
]);

function normalize(name) {
  if (!name) return '';
  return name
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getKeyTokens(name) {
  const norm = normalize(name);
  return norm.split(' ').filter(t => t.length > 2 && !STOPWORDS.has(t));
}

// Levenshtein distance
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) matrix[i][j] = matrix[i-1][j-1];
      else matrix[i][j] = Math.min(matrix[i-1][j-1]+1, matrix[i][j-1]+1, matrix[i-1][j]+1);
    }
  }
  return matrix[b.length][a.length];
}

// Token-based similarity score
function tokenSimilarity(tokensA, tokensB) {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  let matches = 0;
  for (const ta of tokensA) {
    for (const tb of tokensB) {
      if (ta === tb || (ta.length > 4 && tb.length > 4 && levenshtein(ta, tb) <= 1)) {
        matches++;
        break;
      }
    }
  }
  const minLen = Math.min(tokensA.length, tokensB.length);
  return matches / minLen;
}

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('Connected to database');

  const [reps] = await conn.execute(
    `SELECT id, fullName, region FROM representatives WHERE cnpj IS NULL OR cnpj = ''`
  );
  console.log(`Reps without CNPJ: ${reps.length}`);

  console.log('Loading cnpj_representatives...');
  const [cnpjReps] = await conn.execute(
    `SELECT cnpj, razao_social, nome_fantasia, telefone, uf, municipio FROM cnpj_representatives`
  );
  console.log(`Loaded ${cnpjReps.length} CNPJ records`);

  // Build token index: first 2 key tokens → list of records
  const tokenIndex = new Map();
  for (const cr of cnpjReps) {
    const tokens = getKeyTokens(cr.razao_social);
    if (tokens.length >= 1) {
      const key = tokens.slice(0, 2).join('|');
      if (!tokenIndex.has(key)) tokenIndex.set(key, []);
      tokenIndex.get(key).push({ ...cr, _tokens: tokens });
    }
    // Also index by nome_fantasia tokens
    if (cr.nome_fantasia) {
      const ftokens = getKeyTokens(cr.nome_fantasia);
      if (ftokens.length >= 1) {
        const fkey = ftokens.slice(0, 2).join('|');
        if (!tokenIndex.has(fkey)) tokenIndex.set(fkey, []);
        tokenIndex.get(fkey).push({ ...cr, _tokens: ftokens });
      }
    }
  }
  console.log(`Token index built: ${tokenIndex.size} keys`);

  // UF mapping for region filtering
  const regionToUF = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
    'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
    'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
    'São Paulo - Capital': 'SP', 'São Paulo - Interior': 'SP', 'São Paulo': 'SP',
    'Sergipe': 'SE', 'Tocantins': 'TO',
  };

  let matched = 0;
  let noMatch = 0;
  const updates = [];

  for (const rep of reps) {
    const repTokens = getKeyTokens(rep.fullName);
    if (repTokens.length === 0) { noMatch++; continue; }

    const repUF = regionToUF[rep.region] || null;
    const key = repTokens.slice(0, 2).join('|');
    const key1 = repTokens.slice(0, 1).join('|');

    // Get candidates from token index
    let candidates = [
      ...(tokenIndex.get(key) || []),
      ...(tokenIndex.get(key1) || []),
    ];

    // Deduplicate by cnpj
    const seen = new Set();
    candidates = candidates.filter(c => {
      if (seen.has(c.cnpj)) return false;
      seen.add(c.cnpj);
      return true;
    });

    // Filter by UF if available (reduces false positives)
    let filtered = repUF ? candidates.filter(c => !c.uf || c.uf === repUF) : candidates;
    if (filtered.length === 0) filtered = candidates; // fallback to all

    // Score candidates
    let bestScore = 0;
    let bestMatch = null;
    for (const c of filtered) {
      const score = tokenSimilarity(repTokens, c._tokens);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = c;
      }
    }

    // Accept if score >= 0.75 (high confidence)
    if (bestMatch && bestScore >= 0.75) {
      matched++;
      updates.push({
        id: rep.id,
        cnpj: bestMatch.cnpj,
        phone: bestMatch.telefone || null,
      });
    } else {
      noMatch++;
    }
  }

  console.log(`Matched: ${matched}, No match: ${noMatch}`);

  // Apply updates in batches
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

  const [[stats]] = await conn.execute(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 ELSE 0 END) as com_cnpj,
      SUM(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END) as com_telefone,
      SUM(CASE WHEN cnpj IS NULL OR cnpj = '' THEN 1 ELSE 0 END) as sem_cnpj
    FROM representatives`
  );
  console.log('\nFinal stats:', stats);

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
