import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getSeoRoute, renderSeoHtml } from "./_core/seo";

const htmlTemplate = `<!doctype html><html><head>
<title>RepMatch | Contratar Representante Comercial — Marketplace #1 do Brasil</title>
<meta name="description" content="Descrição da home" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://repmatch.com.br/" />
<meta property="og:title" content="RepMatch" />
<meta property="og:description" content="Descrição da home" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://repmatch.com.br/" />
<meta name="twitter:title" content="RepMatch" />
<meta name="twitter:description" content="Descrição da home" />
<meta name="twitter:url" content="https://repmatch.com.br/" />
<script type="application/ld+json">{"@type":"FAQPage"}</script>
</head><body><div id="root"></div></body></html>`;

describe("SEO por rota", () => {
  it("retorna canonical e metadados únicos para landing de leads", () => {
    const route = getSeoRoute("/pacotes-leads");
    expect(route.status).toBe(200);
    expect(route.page.canonicalPath).toBe("/pacotes-leads");

    const html = renderSeoHtml(htmlTemplate, route.page);
    expect(html).toContain("https://repmatch.com.br/pacotes-leads");
    expect(html).toContain("Lista de Empresas para Prospecção B2B");
    expect(html).not.toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"Service"');
  });

  it("produz Article schema e canonical próprio para cada artigo existente", () => {
    const route = getSeoRoute("/blog/como-contratar-representante-comercial");
    expect(route.status).toBe(200);
    expect(route.page.ogType).toBe("article");
    expect(route.page.canonicalPath).toBe("/blog/como-contratar-representante-comercial");

    const html = renderSeoHtml(htmlTemplate, route.page);
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain("Como Contratar um Representante Comercial");
  });

  it("protege telas transacionais com noindex no primeiro HTML", () => {
    const route = getSeoRoute("/redefinir-senha");
    expect(route.status).toBe(200);
    expect(route.page.robots).toContain("noindex");
    expect(renderSeoHtml(htmlTemplate, route.page)).toContain('content="noindex, nofollow, noarchive"');
  });

  it("envia aliases para a URL canônica e URLs desconhecidas para 404", () => {
    expect(getSeoRoute("/buscar-reps").redirectTo).toBe("/buscar");
    expect(getSeoRoute("/nao-existe").status).toBe(404);
    expect(getSeoRoute("/blog/slug-invalido").status).toBe(404);
  });

  it("preserva a URL original no fallback estático do Express", () => {
    const viteSource = fs.readFileSync(path.resolve(process.cwd(), "server/_core/vite.ts"), "utf8");
    expect(viteSource).toContain('new URL(req.originalUrl, "http://localhost").pathname');
    expect(viteSource).toContain("index: false");
  });
});
