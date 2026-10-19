import "dotenv/config";
import { webcrypto } from "crypto";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
// Polyfill globalThis.crypto for jose@6 (Web Crypto API) on older Node.js versions
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}
import express from "express";
import compression from "compression";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { stripeRouter } from "../stripe/stripeRoutes";
import { mpRouter } from "../mercadopago/mpRoutes";
import { registerAuthRoutes } from "../authRoutes";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function ensurePurchaseInterestTable() {
  const { getDb } = await import("../db");
  const { sql } = await import("drizzle-orm");
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Idempotente: a tabela é criada apenas quando ainda não existe.
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS representative_purchase_clicks (
      id int AUTO_INCREMENT NOT NULL,
      companyId int NOT NULL,
      representativeId int NOT NULL,
      source varchar(40) NOT NULL DEFAULT 'search',
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX rpc_rep_created_idx (representativeId, createdAt),
      INDEX rpc_company_created_idx (companyId, createdAt),
      INDEX rpc_created_idx (createdAt)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      \`key\` varchar(100) NOT NULL,
      value varchar(100) NOT NULL,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`key\`)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS lead_package_orders (
      id int AUTO_INCREMENT NOT NULL,
      userId int NOT NULL,
      audience enum('b2b','b2c') NOT NULL,
      quantity int NOT NULL DEFAULT 2000,
      segment varchar(120),
      region varchar(120),
      notes text,
      legalConsent boolean NOT NULL DEFAULT false,
      paymentMethod enum('pix') NOT NULL DEFAULT 'pix',
      status enum('pending_payment','pending_approval','approved','rejected','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
      totalAmount decimal(10,2) NOT NULL,
      mpPaymentId varchar(100),
      adminNotes text,
      reviewedBy int,
      reviewedAt timestamp NULL,
      deliveredAt timestamp NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX lead_order_user_created_idx (userId, createdAt),
      INDEX lead_order_status_created_idx (status, createdAt)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS market_leads (
      id int AUTO_INCREMENT NOT NULL,
      source_project varchar(80) NOT NULL,
      source_org_id int NOT NULL,
      source_record_id int NOT NULL,
      cnpj varchar(14) NOT NULL,
      razao_social varchar(255) NOT NULL,
      nome_fantasia varchar(255),
      cnae varchar(20),
      cnae_descricao varchar(255),
      segmento varchar(150),
      audience enum('b2b','b2c','both') NOT NULL,
      situacao_cadastral varchar(50) NOT NULL,
      porte varchar(60),
      data_abertura varchar(20),
      cidade varchar(120),
      estado char(2),
      cep varchar(10),
      endereco text,
      telefone varchar(50),
      email varchar(255),
      site varchar(255),
      instagram varchar(255),
      available boolean NOT NULL DEFAULT true,
      imported_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      source_updated_at timestamp NULL,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY market_leads_cnpj_unique (cnpj),
      INDEX market_leads_audience_state_idx (audience, estado, available),
      INDEX market_leads_segment_idx (segmento),
      INDEX market_leads_source_record_idx (source_project, source_org_id, source_record_id)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS market_lead_accesses (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      plan enum('unlimited_monthly') NOT NULL DEFAULT 'unlimited_monthly',
      status enum('pending_payment','pending_approval','active','rejected','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
      amount decimal(10,2) NOT NULL,
      mp_payment_id varchar(100),
      reviewed_by int,
      reviewed_at timestamp NULL,
      starts_at timestamp NULL,
      expires_at timestamp NULL,
      admin_notes text,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX market_access_user_status_expiry_idx (user_id, status, expires_at),
      INDEX market_access_status_created_idx (status, created_at)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS saved_market_leads (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      lead_package_order_id int NOT NULL,
      market_lead_id int NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY saved_market_leads_user_lead_unique (user_id, market_lead_id),
      INDEX saved_market_leads_user_created_idx (user_id, created_at),
      INDEX saved_market_leads_order_idx (lead_package_order_id)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS consumer_lead_import_batches (
      id int AUTO_INCREMENT NOT NULL,
      source_label varchar(120) NOT NULL,
      file_sha256 char(64) NOT NULL,
      consent_attested boolean NOT NULL DEFAULT false,
      consent_policy_version varchar(60) NOT NULL,
      total_rows int NOT NULL DEFAULT 0,
      accepted_rows int NOT NULL DEFAULT 0,
      duplicate_rows int NOT NULL DEFAULT 0,
      rejected_rows int NOT NULL DEFAULT 0,
      imported_by int,
      status enum('processing','completed','failed') NOT NULL DEFAULT 'processing',
      completed_at timestamp NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY consumer_lead_import_batches_file_sha256_unique (file_sha256)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS consumer_leads (
      id int AUTO_INCREMENT NOT NULL,
      import_batch_id int NOT NULL,
      full_name varchar(700) NOT NULL,
      phone varchar(120),
      email varchar(400),
      phone_hash char(64),
      email_hash char(64),
      contact_key char(64) NOT NULL,
      consent_status enum('declared','revoked') NOT NULL DEFAULT 'declared',
      available boolean NOT NULL DEFAULT true,
      consent_declared_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY consumer_leads_contact_key_unique (contact_key),
      UNIQUE KEY consumer_leads_phone_hash_unique (phone_hash),
      UNIQUE KEY consumer_leads_email_hash_unique (email_hash),
      INDEX consumer_leads_available_consent_idx (available, consent_status),
      INDEX consumer_leads_batch_idx (import_batch_id)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS consumer_lead_orders (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      quantity int NOT NULL,
      legal_consent boolean NOT NULL DEFAULT false,
      payment_method enum('pix') NOT NULL DEFAULT 'pix',
      status enum('pending_payment','pending_approval','approved','rejected','delivered','cancelled') NOT NULL DEFAULT 'pending_payment',
      total_amount decimal(10,2) NOT NULL,
      mp_payment_id varchar(100),
      admin_notes text,
      reviewed_by int,
      reviewed_at timestamp NULL,
      delivered_at timestamp NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX consumer_lead_order_user_created_idx (user_id, created_at),
      INDEX consumer_lead_order_status_created_idx (status, created_at)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS consumer_lead_accesses (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      legal_consent boolean NOT NULL DEFAULT false,
      status enum('pending_payment','pending_approval','active','rejected','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
      amount decimal(10,2) NOT NULL,
      selection_limit int NOT NULL DEFAULT 500,
      mp_payment_id varchar(100),
      reviewed_by int,
      reviewed_at timestamp NULL,
      starts_at timestamp NULL,
      expires_at timestamp NULL,
      admin_notes text,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX consumer_lead_access_user_status_expiry_idx (user_id, status, expires_at),
      INDEX consumer_lead_access_status_created_idx (status, created_at)
    )
  `));
  // MySQL/TiDB da Railway não suporta ADD COLUMN IF NOT EXISTS em todas as
  // versões. A tabela recém-criada já contém a coluna; nos bancos existentes,
  // tenta acrescentá-la e ignora somente o erro de coluna duplicada.
  try {
    await db.execute(sql.raw(`ALTER TABLE consumer_lead_accesses ADD COLUMN selection_limit int NOT NULL DEFAULT 500`));
  } catch (error: any) {
    const databaseMessage = [error?.message, error?.cause?.message, error?.cause?.sqlMessage, error].filter(Boolean).map(String).join(" ");
    if (!/duplicate column|duplicate field|already exists/i.test(databaseMessage)) throw error;
  }
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS saved_consumer_leads (
      id int AUTO_INCREMENT NOT NULL,
      user_id int NOT NULL,
      consumer_lead_order_id int NULL,
      consumer_lead_access_id int NULL,
      consumer_lead_id int NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY saved_consumer_leads_user_lead_unique (user_id, consumer_lead_id),
      INDEX saved_consumer_leads_user_created_idx (user_id, created_at),
      INDEX saved_consumer_leads_order_idx (consumer_lead_order_id),
      INDEX saved_consumer_leads_access_idx (consumer_lead_access_id)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS representative_monthly_accesses (
      id int AUTO_INCREMENT NOT NULL,
      company_id int NOT NULL,
      user_id int NOT NULL,
      status enum('pending_payment','pending_approval','active','rejected','expired','cancelled') NOT NULL DEFAULT 'pending_payment',
      amount decimal(10,2) NOT NULL,
      unlock_limit int NOT NULL DEFAULT 100,
      mp_payment_id varchar(100),
      reviewed_by int,
      reviewed_at timestamp NULL,
      starts_at timestamp NULL,
      expires_at timestamp NULL,
      admin_notes text,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      INDEX rep_monthly_access_company_status_expiry_idx (company_id, status, expires_at),
      INDEX rep_monthly_access_user_status_expiry_idx (user_id, status, expires_at),
      INDEX rep_monthly_access_status_created_idx (status, created_at)
    )
  `));
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS representative_monthly_unlocks (
      id int AUTO_INCREMENT NOT NULL,
      representative_monthly_access_id int NOT NULL,
      company_id int NOT NULL,
      representative_id int NOT NULL,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY rep_monthly_unlock_access_rep_unique (representative_monthly_access_id, representative_id),
      INDEX rep_monthly_unlock_access_created_idx (representative_monthly_access_id, created_at)
    )
  `));
  console.log("[db] commercial catalog tables ready");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Segurança: remover header que expõe tecnologia ─────────────────────────
  // Trust proxy (Railway/Cloudflare) — necessário para express-rate-limit ler o IP real
  app.set("trust proxy", 1);

  app.disable("x-powered-by");

  // ─── Redirect www -> non-www (evita conteúdo duplicado no Google) ────────────
  app.use((req, res, next) => {
    const host = req.headers.host || "";
    if (host.startsWith("www.")) {
      const newHost = host.slice(4);
      return res.redirect(301, `https://${newHost}${req.url}`);
    }
    next();
  });

  // ─── Headers de segurança HTTP ───────────────────────────────────────────────
  app.use((_req, res, next) => {
    // Previne clickjacking
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    // Previne MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Controla informações de referrer
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Limita acesso a features do browser
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    // HSTS: força HTTPS por 1 ano
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    next();
  });

  // ─── Rate Limiting ───────────────────────────────────────────────────────
  // Limite geral para todas as rotas de API
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
  });
  // Limite mais restrito para rotas de autenticação (evita brute force)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Muitas tentativas de login. Tente novamente em 15 minutos." },
  });
  app.use("/api/trpc", apiLimiter);
  app.use("/api/auth", authLimiter);

  // Gzip/Brotli compression for all responses (improves load time significantly)
  app.use(compression());

  // Raw body for Stripe webhook signature verification (must be BEFORE express.json)
  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(cookieParser());
  registerStorageProxy(app);
  registerAuthRoutes(app);

  // Stripe routes
  app.use("/api/stripe", stripeRouter);

  // Mercado Pago routes
  app.use("/api/mp", mpRouter);

  // Scheduled task endpoint: availability reminder
  app.post("/api/scheduled/availability-reminder", async (req, res) => {
    try {
      const { getDb } = await import("../db");
      const { representatives } = await import("../../drizzle/schema");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      // Count reps who haven't updated availability in 30+ days
      const result = await db!.select({ count: sql<number>`count(*)` })
        .from(representatives)
        .where(sql`updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY) OR availability IS NULL`);
      const count = Number(result[0]?.count ?? 0);
      const { notifyOwner } = await import("../_core/notification");
      await notifyOwner({
        title: "\uD83D\uDCC5 Lembrete de Disponibilidade",
        content: `${count} representantes n\u00e3o atualizam a disponibilidade h\u00e1 mais de 30 dias. Considere enviar um e-mail de lembrete.`,
      });
      res.json({ success: true, count });
    } catch (err) {
      console.error("[availability-reminder]", err);
      res.status(500).json({ error: String(err) });
    }
  });

  // ─── Setup Admin (executar uma vez em produção) ─────────────────────────────
  // Cria o admin demo@repmatch.com.br se não existir
  app.get("/api/admin/setup-admin", async (req, res) => {
    const secret = req.query.secret;
    if (secret !== "repmatch-setup-2026") {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const bcrypt = await import("bcryptjs");
      const { getDb } = await import("../db");
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB not available" });

      // Verificar se já existe
      const existing = await db.select().from(users).where(eq(users.email, "demo@repmatch.com.br")).limit(1);
      if (existing.length > 0) {
        // Atualizar senha e role
        const hash = bcrypt.default.hashSync("Rawail", 12);
        await db.update(users).set({ passwordHash: hash, role: "admin" }).where(eq(users.email, "demo@repmatch.com.br"));
        return res.json({ success: true, action: "updated", email: "demo@repmatch.com.br" });
      }

      // Criar novo admin
      const hash = bcrypt.default.hashSync("Rawail", 12);
      await db.insert(users).values({
        name: "Demo Admin",
        email: "demo@repmatch.com.br",
        role: "admin",
        userType: "company",
        passwordHash: hash,
        emailVerified: true,
        openId: "local_demo_admin_prod_001",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      res.json({ success: true, action: "created", email: "demo@repmatch.com.br", password: "Rawail" });
    } catch (err: any) {
      console.error("[setup-admin]", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // ─── Rota de vídeo — serve arquivos do volume Railway montado em /video ────
  app.get("/api/video/:filename", async (req, res) => {
    try {
      const safeName = path.basename(req.params.filename);
      const filePath = path.join("/video", safeName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).send("Video not found");
      }
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=86400",
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=86400",
        });
        fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {
      res.status(500).send("Server error");
    }
  });

  // ─── Servir vídeo hero — tenta volume Railway /video/ ou faz proxy do GitHub Release ──
  const GITHUB_VIDEO_URL = "https://github.com/danilolimaCabral/repmatch/releases/download/v1.0-assets/repmatch-hero-bg.mp4";
  app.get("/hero-bg.mp4", async (req, res) => {
    try {
      const candidates = [
        "/video/repmatch-hero-bg.mp4",
        "/video/hero-bg.mp4",
        process.env.VIDEO_PATH || "",
      ].filter(Boolean);
      const videoPath = candidates.find(p => fs.existsSync(p));
      if (!videoPath) {
        // Fallback: proxy do GitHub Release com content-type correto
        const ghUrl = new URL(GITHUB_VIDEO_URL);
        const makeRequest = (url: URL): void => {
          const mod = url.protocol === "https:" ? https : http;
          const reqOptions = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            headers: { "User-Agent": "RepMatch/1.0" },
          };
          mod.get(reqOptions, (ghRes: any) => {
            if (ghRes.statusCode === 301 || ghRes.statusCode === 302 || ghRes.statusCode === 307) {
              makeRequest(new URL(ghRes.headers.location));
              ghRes.resume();
              return;
            }
            res.writeHead(200, {
              "Content-Type": "video/mp4",
              "Accept-Ranges": "none",
              "Cache-Control": "public, max-age=604800",
            });
            ghRes.pipe(res);
          }).on("error", () => res.status(500).send("Proxy error"));
        };
        makeRequest(ghUrl);
        return;
      }
      const stat = fs.statSync(videoPath);
      const fileSize = stat.size;
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=604800",
        });
        fs.createReadStream(videoPath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=604800",
        });
        fs.createReadStream(videoPath).pipe(res);
      }
    } catch (err) {
      res.status(500).send("Error");
    }
  });

  // Health check endpoint for Railway
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Migration endpoint — runs Drizzle migrations on demand (protected by secret)
  app.post("/api/admin/migrate", async (req, res) => {
    const secret = req.headers["x-migrate-secret"];
    if (secret !== "repmatch-migrate-2026") {
      return res.status(403).json({ error: "Forbidden" });
    }
    try {
      const { migrate } = await import("drizzle-orm/mysql2/migrator");
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB not available" });
      // Em desenvolvimento e no bundle do Railway, a raiz do processo contém /drizzle.
      const migrationsFolder = path.join(process.cwd(), "drizzle");
      await migrate(db as any, { migrationsFolder });
      res.json({ success: true, message: "Migrations applied successfully" });
    } catch (err: any) {
      console.error("[migrate]", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // ─── Rastreamento de visitas (page views) ─────────────────────────────────
  // Endpoint leve e anônimo — sem autenticação, sem rate limit pesado
  app.post("/api/track-pv", async (req, res) => {
    try {
      const { path: pagePath, sessionId, referrer } = req.body ?? {};
      if (!pagePath || !sessionId) return res.json({ ok: false });
      const ua = req.headers["user-agent"]?.substring(0, 500) ?? null;
      const ref = (referrer ?? req.headers["referer"] ?? null)?.toString().substring(0, 500);
      const { getDb } = await import("../db");
      const { pageViews } = await import("../../drizzle/schema");
      const db = await getDb();
      if (db) {
        await db.insert(pageViews).values({
          sessionId: String(sessionId).substring(0, 64),
          path: String(pagePath).substring(0, 500),
          referrer: ref ?? null,
          userAgent: ua,
          createdAt: new Date(),
        } as any);
      }
      res.json({ ok: true });
    } catch {
      res.json({ ok: false });
    }
  });

  // Upload de imagens (logo da empresa, etc.)
  app.post("/api/upload", async (req, res) => {
    try {
      // Parse multipart form data manually using busboy
      const busboy = (await import("busboy")).default;
      const bb = busboy({ headers: req.headers, limits: { fileSize: 2 * 1024 * 1024 } });
      let fileBuffer: Buffer | null = null;
      let mimeType = "image/png";
      let fileName = "upload.png";
      await new Promise<void>((resolve, reject) => {
        bb.on("file", (_name: string, file: NodeJS.ReadableStream & { on(event: 'limit', listener: () => void): NodeJS.ReadableStream }, info: { mimeType: string; filename: string }) => {
          mimeType = info.mimeType || "image/png";
          fileName = info.filename || "upload.png";
          const chunks: Buffer[] = [];
          file.on("data", (d: Buffer) => chunks.push(d));
          file.on("end", () => { fileBuffer = Buffer.concat(chunks); });
          file.on("limit", () => reject(new Error("Arquivo muito grande. Máximo 2MB.")));
        });
        bb.on("finish", resolve);
        bb.on("error", reject);
        req.pipe(bb);
      });
      if (!fileBuffer) return res.status(400).json({ error: "Nenhum arquivo enviado" });
      const { storagePut } = await import("../storage");
      const ext = fileName.split(".").pop() ?? "png";
      const key = `logos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { url } = await storagePut(key, fileBuffer, mimeType);
      res.json({ url, key });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      res.status(500).json({ error: msg });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  await ensurePurchaseInterestTable();

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
