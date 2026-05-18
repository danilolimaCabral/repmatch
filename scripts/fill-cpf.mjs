/**
 * Fill CPF column for pessoa física representatives from Excel data
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

  // Get all DB reps without CNPJ (likely pessoa física)
  const [dbReps] = await conn.execute(
    `SELECT id, fullName, cnpj, cpf FROM representatives WHERE cpf IS NULL OR cpf = ''`
  );
  console.log(`DB reps without CPF: ${dbReps.length}`);

  // Build name → DB row map
  const dbByName = new Map();
  for (const r of dbReps) {
    dbByName.set(r.fullName.toUpperCase().trim(), r);
  }

  // Find reps with CPF in Excel
  let updated = 0;
  let skipped = 0;

  for (const xlsxRow of xlsxData) {
    if (!xlsxRow.cpf) continue; // skip if no CPF in Excel

    const name = xlsxRow.nome.toUpperCase().trim();
    const dbRow = dbByName.get(name);

    if (dbRow) {
      await conn.execute(
        `UPDATE representatives SET cpf = ? WHERE id = ? AND (cpf IS NULL OR cpf = '')`,
        [xlsxRow.cpf, dbRow.id]
      );
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nCPF updates applied: ${updated}`);
  console.log(`Not found in DB: ${skipped}`);

  // Final stats
  const [[stats]] = await conn.execute(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 ELSE 0 END) as com_cnpj,
      SUM(CASE WHEN cpf IS NOT NULL AND cpf != '' THEN 1 ELSE 0 END) as com_cpf,
      SUM(CASE WHEN (cnpj IS NULL OR cnpj = '') AND (cpf IS NULL OR cpf = '') THEN 1 ELSE 0 END) as sem_id_fiscal
    FROM representatives`
  );
  console.log('\n=== FINAL STATS ===');
  console.log(`Total: ${stats.total}`);
  console.log(`Com CNPJ: ${stats.com_cnpj}`);
  console.log(`Com CPF: ${stats.com_cpf}`);
  console.log(`Sem ID fiscal: ${stats.sem_id_fiscal}`);

  await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
