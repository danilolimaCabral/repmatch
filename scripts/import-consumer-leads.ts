import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import process from "node:process";
import mysql from "mysql2/promise";
import XLSX from "xlsx";
import { formatBrazilianConsumerPhone, isValidConsumerEmail } from "../shared/consumerLeads";
import { encryptConsumerLeadValue } from "../server/consumerLeadCrypto";

const ALLOWED_HEADERS = ["ClienteNome", "ClienteTelefone", "ClienteEmail"] as const;
const SOURCE_LABEL = "TRMOTORS_B2C_CONSENTED";
const CONSENT_POLICY_VERSION = "source-attestation-v1";
const INSERT_BATCH_SIZE = 500;

type SourceRow = Record<string, unknown>;
type CleanConsumerLead = {
  fullName: string;
  phone: string | null;
  email: string | null;
  phoneHash: string | null;
  emailHash: string | null;
  contactKey: string;
};

function getArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function getHashSecret() {
  const secret = process.env.CONSUMER_LEAD_HASH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("Configure CONSUMER_LEAD_HASH_SECRET antes de importar contatos PF.");
  return secret;
}

function hashIdentity(secret: string, kind: "phone" | "email", value: string) {
  return crypto.createHmac("sha256", secret).update(`${kind}:${value}`).digest("hex");
}

function normalizeName(value: unknown) {
  const normalized = String(value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim();
  return normalized.length >= 2 ? normalized.slice(0, 255) : null;
}

function cleanRows(filePath: string, hashSecret: string) {
  const workbook = XLSX.readFile(filePath, { raw: false, cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("A planilha não possui uma aba com contatos.");
  const rows = XLSX.utils.sheet_to_json<SourceRow>(workbook.Sheets[sheetName], { defval: "" });
  const headers = new Set(Object.keys(rows[0] ?? {}));
  const missingHeaders = ALLOWED_HEADERS.filter((header) => !headers.has(header));
  if (missingHeaders.length) throw new Error(`Cabeçalhos obrigatórios ausentes: ${missingHeaders.join(", ")}.`);

  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();
  const accepted: CleanConsumerLead[] = [];
  let duplicateRows = 0;
  let rejectedRows = 0;

  for (const row of rows) {
    const fullName = normalizeName(row.ClienteNome);
    const phone = formatBrazilianConsumerPhone(String(row.ClienteTelefone ?? ""));
    const email = isValidConsumerEmail(String(row.ClienteEmail ?? ""));
    if (!fullName || (!phone && !email)) {
      rejectedRows += 1;
      continue;
    }
    if ((phone && seenPhones.has(phone)) || (email && seenEmails.has(email))) {
      duplicateRows += 1;
      continue;
    }
    if (phone) seenPhones.add(phone);
    if (email) seenEmails.add(email);
    const phoneHash = phone ? hashIdentity(hashSecret, "phone", phone) : null;
    const emailHash = email ? hashIdentity(hashSecret, "email", email) : null;
    accepted.push({
      fullName,
      phone,
      email,
      phoneHash,
      emailHash,
      contactKey: phoneHash ?? emailHash!,
    });
  }

  return { totalRows: rows.length, accepted, duplicateRows, rejectedRows };
}

async function run() {
  const filePath = getArgument("--file");
  if (!filePath || !fs.existsSync(filePath)) throw new Error("Informe --file /caminho/para/base.xlsx.");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não está configurada.");
  const hashSecret = getHashSecret();
  const fileSha256 = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  const parsed = cleanRows(filePath, hashSecret);
  const connection = await mysql.createConnection({ uri: databaseUrl, charset: "utf8mb4" });
  let batchId: number | null = null;

  try {
    const [existingRows] = await connection.query<mysql.RowDataPacket[]>(
      "SELECT id, status FROM consumer_lead_import_batches WHERE file_sha256 = ? LIMIT 1",
      [fileSha256],
    );
    if (existingRows.length) {
      console.log(JSON.stringify({ status: "already_imported", batchId: existingRows[0].id, batchStatus: existingRows[0].status }, null, 2));
      return;
    }

    const [batchResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO consumer_lead_import_batches (
        source_label, file_sha256, consent_attested, consent_policy_version,
        total_rows, accepted_rows, duplicate_rows, rejected_rows, status
      ) VALUES (?, ?, true, ?, ?, 0, ?, ?, 'processing')`,
      [SOURCE_LABEL, fileSha256, CONSENT_POLICY_VERSION, parsed.totalRows, parsed.duplicateRows, parsed.rejectedRows],
    );
    batchId = batchResult.insertId;
    let insertedRows = 0;

    for (let start = 0; start < parsed.accepted.length; start += INSERT_BATCH_SIZE) {
      const chunk = parsed.accepted.slice(start, start + INSERT_BATCH_SIZE);
      const placeholders = chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, 'declared', true)").join(",");
      const values = chunk.flatMap((lead) => [
        batchId!,
        encryptConsumerLeadValue(lead.fullName),
        encryptConsumerLeadValue(lead.phone),
        encryptConsumerLeadValue(lead.email),
        lead.phoneHash,
        lead.emailHash,
        lead.contactKey,
      ]);
      const [result] = await connection.execute<mysql.ResultSetHeader>(
        `INSERT IGNORE INTO consumer_leads (
          import_batch_id, full_name, phone, email, phone_hash, email_hash,
          contact_key, consent_status, available
        ) VALUES ${placeholders}`,
        values,
      );
      insertedRows += result.affectedRows;
    }
    const existingRowsSkipped = parsed.accepted.length - insertedRows;

    await connection.execute(
      `UPDATE consumer_lead_import_batches
       SET accepted_rows = ?, duplicate_rows = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [insertedRows, parsed.duplicateRows + existingRowsSkipped, batchId],
    );
    console.log(JSON.stringify({
      status: "completed",
      batchId,
      totalRows: parsed.totalRows,
      imported: insertedRows,
      duplicatesSkipped: parsed.duplicateRows + existingRowsSkipped,
      rejected: parsed.rejectedRows,
      fieldsPersisted: ["full_name", "phone", "email"],
    }, null, 2));
  } catch (error) {
    if (batchId) {
      await connection.execute("UPDATE consumer_lead_import_batches SET status = 'failed' WHERE id = ?", [batchId]);
    }
    console.error("[consumer-leads-import] Falha sem expor dados de contato:", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error("[consumer-leads-import] Execução interrompida:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
