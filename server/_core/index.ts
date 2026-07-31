import "dotenv/config";
import { webcrypto } from "crypto";
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
  // O volume Railway está montado em /video (configurado no painel Railway)
  // Acesso via: /api/video/nome-do-arquivo.mp4
  app.get("/api/video/:filename", (req, res) => {
    const { createReadStream, statSync, existsSync } = require("fs");
    const path = require("path");
    const filename = req.params.filename;
    // Sanitizar nome do arquivo (evitar path traversal)
    const safeName = path.basename(filename);
    const filePath = path.join("/video", safeName);

    if (!existsSync(filePath)) {
      res.status(404).send("Video not found");
      return;
    }

    const stat = statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Suporte a Range requests (necessário para vídeo HTML5)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "video/mp4",
        "Cache-Control": "public, max-age=86400",
      });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=86400",
      });
      createReadStream(filePath).pipe(res);
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
      const { fileURLToPath } = await import("url");
      const { dirname, join } = await import("path");
      const { migrate } = await import("drizzle-orm/mysql2/migrator");
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "DB not available" });
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const migrationsFolder = join(__dirname, "../../drizzle");
      await migrate(db as any, { migrationsFolder });
      res.json({ success: true, message: "Migrations applied successfully" });
    } catch (err: any) {
      console.error("[migrate]", err);
      res.status(500).json({ error: err.message || String(err) });
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
