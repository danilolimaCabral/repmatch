/**
 * Cross-reference Excel data with database representatives
 * Updates CNPJ and CPF from Excel where DB has none
 */
import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
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

async function main() {
  const conn = await mysql.createConnection(parseDbUrl(DB_URL));
  console.log('Connected to database');

  // Load Excel data
  const xlsxData = JSON.parse(readFileSync('/home/ubuntu/xlsx_reps.json', 'utf8'));
  console.log(`Excel rows: ${xlsxData.length}`);
  console.log(`Excel with CNPJ: ${xlsxData.filter(r => r.cnpj).length}`);
  console.log(`Excel with CPF only: ${xlsxData.filter(r => !r.cnpj && r.cpf).length}`);

  // Get all DB reps
  const [dbReps] = await conn.execute('SELECT id, fullName, cnpj, phone FROM representatives');
  console.log(`\nDB reps: ${dbReps.length}`);
  console.log(`DB with CNPJ: ${dbReps.filter(r => r.cnpj).length}`);
  console.log(`DB without CNPJ: ${dbReps.filter(r => !r.cnpj).length}`);

  // Build lookup maps
  const dbByName = new Map();
  for (const r of dbReps) {
    dbByName.set(r.fullName.toUpperCase().trim(), r);
  }

  const xlsxByCnpj = new Map();
  const xlsxByName = new Map();
  for (const r of xlsxData) {
    if (r.cnpj) xlsxByCnpj.set(r.cnpj, r);
    xlsxByName.set(r.nome.toUpperCase().trim(), r);
  }

  // Stats
  let matchedByCnpj = 0;
  let matchedByName = 0;
  let cnpjMismatch = 0;
  let onlyInXlsx = 0;
  const updates = [];
  const cpfUpdates = [];

  for (const xlsxRow of xlsxData) {
    const name = xlsxRow.nome.toUpperCase().trim();
    const dbRow = dbByName.get(name);

    if (dbRow) {
      if (xlsxRow.cnpj) {
        if (dbRow.cnpj && dbRow.cnpj !== xlsxRow.cnpj) {
          cnpjMismatch++;
        } else if (!dbRow.cnpj) {
          // Can update!
          updates.push({ id: dbRow.id, cnpj: xlsxRow.cnpj });
          matchedByName++;
        } else {
          matchedByCnpj++;
        }
      } else if (xlsxRow.cpf && !dbRow.cnpj) {
        // Person with CPF
        cpfUpdates.push({ id: dbRow.id, cpf: xlsxRow.cpf });
      }
    } else {
      onlyInXlsx++;
    }
  }

  console.log('\n=== CROSS-REFERENCE RESULTS ===');
  console.log(`Already matched (CNPJ in both): ${matchedByCnpj}`);
  console.log(`Can update CNPJ from Excel: ${updates.length}`);
  console.log(`Can update CPF from Excel: ${cpfUpdates.length}`);
  console.log(`CNPJ mismatch (conflict): ${cnpjMismatch}`);
  console.log(`Only in Excel (not in DB): ${onlyInXlsx}`);

  // Apply CNPJ updates from Excel
  if (updates.length > 0) {
    console.log(`\nApplying ${updates.length} CNPJ updates from Excel...`);
    let done = 0;
    for (const u of updates) {
      await conn.execute(
        `UPDATE representatives SET cnpj = ? WHERE id = ? AND (cnpj IS NULL OR cnpj = '')`,
        [u.cnpj, u.id]
      );
      done++;
      if (done % 100 === 0) process.stdout.write(`\r${done}/${updates.length}...`);
    }
    console.log(`\nDone! Updated ${done} CNPJs from Excel`);
  }

  // Apply CPF updates (store in cnpj field prefixed with CPF: for identification)
  // Actually store in a separate field - check if cpf column exists
  const [cols] = await conn.execute(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'representatives' AND column_name = 'cpf' AND table_schema = DATABASE()`
  );
  
  if (cols.length > 0 && cpfUpdates.length > 0) {
    console.log(`\nApplying ${cpfUpdates.length} CPF updates...`);
    for (const u of cpfUpdates) {
      await conn.execute(
        `UPDATE representatives SET cpf = ? WHERE id = ? AND (cpf IS NULL OR cpf = '')`,
        [u.cpf, u.id]
      );
    }
    console.log('CPF updates done!');
  } else if (cpfUpdates.length > 0) {
    console.log(`\nNote: ${cpfUpdates.length} reps have CPF in Excel but no cpf column in DB`);
    console.log('Sample CPF reps:', cpfUpdates.slice(0, 3));
  }

  // Final stats
  const [[stats]] = await conn.execute(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 ELSE 0 END) as com_cnpj,
      SUM(CASE WHEN cnpj IS NULL OR cnpj = '' THEN 1 ELSE 0 END) as sem_cnpj
    FROM representatives`
  );
  console.log('\n=== FINAL DB STATS ===');
  console.log(stats);

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
