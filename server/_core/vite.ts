import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

// Compatibility shim for import.meta.dirname (Node.js 21.2+ only)
// This ensures compatibility with Node.js 18 and 20 used in Railway
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(__dirname, "../..", "dist", "public")
      : path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Serve pre-compressed .br and .gz files when available
  app.use((req, res, next) => {
    const acceptEncoding = req.headers["accept-encoding"] || "";
    // Only try pre-compressed for hashed assets (have content hash in filename)
    const isHashedAsset = /\/assets\/[^/]+\.(js|css|woff2?)$/.test(req.path);
    if (!isHashedAsset) return next();

    const filePath = path.join(distPath, req.path);

    if (acceptEncoding.includes("br") && fs.existsSync(filePath + ".br")) {
      res.set("Content-Encoding", "br");
      res.set("Vary", "Accept-Encoding");
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      const ext = path.extname(req.path);
      if (ext === ".js") res.set("Content-Type", "application/javascript; charset=UTF-8");
      else if (ext === ".css") res.set("Content-Type", "text/css; charset=UTF-8");
      res.sendFile(filePath + ".br");
      return;
    }
    if (acceptEncoding.includes("gzip") && fs.existsSync(filePath + ".gz")) {
      res.set("Content-Encoding", "gzip");
      res.set("Vary", "Accept-Encoding");
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      const ext = path.extname(req.path);
      if (ext === ".js") res.set("Content-Type", "application/javascript; charset=UTF-8");
      else if (ext === ".css") res.set("Content-Type", "text/css; charset=UTF-8");
      res.sendFile(filePath + ".gz");
      return;
    }
    next();
  });

  // Assets com hash no nome: cache de 1 ano (imutáveis)
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.set("Vary", "Accept-Encoding");
    },
  }));

  // Demais arquivos estáticos: cache curto
  app.use(express.static(distPath, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      // HTML nunca deve ser cacheado por muito tempo (pode mudar)
      if (filePath.endsWith(".html")) {
        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
