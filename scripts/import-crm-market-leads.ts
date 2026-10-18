import "dotenv/config";
import fs from "node:fs";
import process from "node:process";
import mysql from "mysql2/promise";

type SourceLead = {
  id: number;
  orgId: number;
  razaoSocial: string;
  nomeFantasia: string | null;
  cnpj: string | null;
  cnae: string | null;
  cnaeDescricao: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  segmento: string | null;
  situacaoCadastral: string | null;
  nomeMercado: string | null;
  porte: string | null;
  dataAbertura: string | null;
  site: string | null;
  instagram: string | null;
  updatedAt: Date | null;
};

const SOURCE_PROJECT = "mkthubcrmTop";
const DEFAULT_BATCH_SIZE = 2_000;

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function clean(value: string | null | undefined, max?: number) {
  const normalized = value?.trim() || null;
  return max && normalized ? normalized.slice(0, max) : normalized;
}

function audienceFromSource(value: string | null) {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "b2b") return "b2b";
  if (normalized === "b2c") return "b2c";
  return "both";
}

function getArgument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function sourceUrl() {
  const direct = process.env.CRM_SOURCE_DATABASE_URL;
  const path = getArgument("--source-url-file");
  if (direct) return direct;
  if (path && fs.existsSync(path)) return fs.readFileSync(path, "utf8").trim();
  throw new Error("Informe CRM_SOURCE_DATABASE_URL ou --source-url-file /caminho/seguro/da-url");
}

async function run() {
  const targetUrl = process.env.DATABASE_URL;
  if (!targetUrl) throw new Error("DATABASE_URL do RepMatch não está configurada.");

  const batchSize = Math.max(100, Math.min(Number(getArgument("--batch-size") || DEFAULT_BATCH_SIZE), 5_000));
  const source = await mysql.createConnection({ uri: sourceUrl(), charset: "utf8mb4" });
  const target = await mysql.createConnection({ uri: targetUrl, charset: "utf8mb4" });

  let cursor = 0;
  let processed = 0;
  let imported = 0;
  let skipped = 0;
  const startedAt = new Date();

  try {
    while (true) {
      const [rows] = await source.query<mysql.RowDataPacket[]>(`
        SELECT
          id, orgId, razaoSocial, nomeFantasia, cnpj, cnae, cnaeDescricao,
          telefone, email, endereco, cidade, estado, cep, segmento,
          situacaoCadastral, tipoMercado AS nomeMercado, porte, dataAbertura,
          site, instagram, updatedAt
        FROM clientes
        WHERE id > ?
          AND UPPER(TRIM(COALESCE(situacaoCadastral, ''))) = 'ATIVA'
          AND tipoMercado IN ('B2B', 'B2C', 'Ambos')
        ORDER BY id ASC
        LIMIT ?
      `, [Number(cursor), Number(batchSize)]);

      if (!rows.length) break;
      cursor = Number(rows[rows.length - 1].id);
      const values: unknown[][] = [];

      for (const raw of rows as unknown as SourceLead[]) {
        const cnpj = digits(raw.cnpj);
        const razaoSocial = clean(raw.razaoSocial, 255);
        if (cnpj.length !== 14 || !razaoSocial) {
          skipped += 1;
          continue;
        }
        values.push([
          SOURCE_PROJECT,
          raw.orgId,
          raw.id,
          cnpj,
          razaoSocial,
          clean(raw.nomeFantasia, 255),
          clean(raw.cnae, 20),
          clean(raw.cnaeDescricao, 255),
          clean(raw.segmento, 150),
          audienceFromSource(raw.nomeMercado),
          "ATIVA",
          clean(raw.porte, 60),
          clean(raw.dataAbertura, 20),
          clean(raw.cidade, 120),
          clean(raw.estado, 2)?.toUpperCase() ?? null,
          clean(raw.cep, 10),
          clean(raw.endereco),
          clean(raw.telefone, 50),
          clean(raw.email, 255)?.toLowerCase() ?? null,
          clean(raw.site, 255),
          clean(raw.instagram, 255),
          raw.updatedAt,
        ]);
      }

      if (values.length) {
        const placeholders = values.map(() => "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").join(",");
        const updateColumns = [
          "source_project = VALUES(source_project)",
          "source_org_id = VALUES(source_org_id)",
          "source_record_id = VALUES(source_record_id)",
          "razao_social = VALUES(razao_social)",
          "nome_fantasia = VALUES(nome_fantasia)",
          "cnae = VALUES(cnae)",
          "cnae_descricao = VALUES(cnae_descricao)",
          "segmento = VALUES(segmento)",
          "audience = VALUES(audience)",
          "situacao_cadastral = VALUES(situacao_cadastral)",
          "porte = VALUES(porte)",
          "data_abertura = VALUES(data_abertura)",
          "cidade = VALUES(cidade)",
          "estado = VALUES(estado)",
          "cep = VALUES(cep)",
          "endereco = VALUES(endereco)",
          "telefone = VALUES(telefone)",
          "email = VALUES(email)",
          "site = VALUES(site)",
          "instagram = VALUES(instagram)",
          "available = true",
          "source_updated_at = VALUES(source_updated_at)",
        ].join(", ");
        await target.query(
          `INSERT INTO market_leads (
            source_project, source_org_id, source_record_id, cnpj, razao_social,
            nome_fantasia, cnae, cnae_descricao, segmento, audience,
            situacao_cadastral, porte, data_abertura, cidade, estado, cep,
            endereco, telefone, email, site, instagram, source_updated_at
          ) VALUES ${placeholders}
          ON DUPLICATE KEY UPDATE ${updateColumns}`,
          values.flat(),
        );
        imported += values.length;
      }
      processed += rows.length;
      console.log(`[import] processados: ${processed.toLocaleString("pt-BR")} | válidos: ${imported.toLocaleString("pt-BR")} | ignorados: ${skipped.toLocaleString("pt-BR")}`);
    }

    const [summary] = await target.query<mysql.RowDataPacket[]>(`
      SELECT
        COUNT(*) AS total,
        SUM(audience = 'b2b') AS b2b,
        SUM(audience = 'b2c') AS b2c,
        SUM(audience = 'both') AS bothCount,
        SUM(telefone IS NOT NULL AND TRIM(telefone) <> '') AS withPhone,
        SUM(email IS NOT NULL AND TRIM(email) <> '') AS withEmail
      FROM market_leads
      WHERE source_project = ? AND available = true
    `, [SOURCE_PROJECT]);
    console.log(JSON.stringify({
      status: "completed",
      durationSeconds: Math.round((Date.now() - startedAt.getTime()) / 1000),
      processed,
      imported,
      skipped,
      catalog: summary[0],
    }));
  } finally {
    await source.end();
    await target.end();
  }
}

run().catch((error) => {
  console.error("[import] falhou:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
