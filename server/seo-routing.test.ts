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
  it("retorna canonical, metadados sociais e schema coerente para landing de leads", () => {
    const route = getSeoRoute("/pacotes-leads");
    expect(route.status).toBe(200);
    expect(route.page.canonicalPath).toBe("/pacotes-leads");

    const html = renderSeoHtml(htmlTemplate, route.page);
    expect(html).toContain("https://repmatch.com.br/pacotes-leads");
    expect(html).toContain("Busque Leads B2B e B2C");
    expect(html).not.toContain('"@type":"FAQPage"');
    expect(html).toContain('"@type":"Service"');
    expect(html).toContain('"@graph"');
    expect(html).toContain('property="og:image:alt"');
    expect(html).toContain('name="twitter:image:alt"');
    expect(html).toContain('data-canonical="https://repmatch.com.br/pacotes-leads"');
  });

  it("produz Article schema e canonical próprio para cada artigo existente", () => {
    const route = getSeoRoute("/blog/como-contratar-representante-comercial");
    expect(route.status).toBe(200);
    expect(route.page.ogType).toBe("article");
    expect(route.page.canonicalPath).toBe("/blog/como-contratar-representante-comercial");

    const html = renderSeoHtml(htmlTemplate, route.page);
    expect(html).toContain('"@type":"BlogPosting"');
    expect(html).toContain("Como Contratar um Representante Comercial");
    expect(html).toContain('"dateModified":"2025-07-15"');
  });

  it("entrega o conteúdo editorial do novo guia B2B mesmo sem JavaScript", () => {
    const route = getSeoRoute("/blog/como-montar-lista-empresas-b2b-prospeccao");
    const html = renderSeoHtml(htmlTemplate, route.page);

    expect(route.status).toBe(200);
    expect(html).toContain("Como Montar uma Lista de Empresas B2B para Prospecção");
    expect(html).toContain("Defina o perfil de cliente ideal");
    expect(html).toContain('href="/pacotes-leads"');
    expect(html).toContain('"dateModified":"2026-10-19"');
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

  it("descreve oportunidades disponíveis e links úteis no HTML inicial", () => {
    const route = getSeoRoute("/oportunidades-reps");
    const html = renderSeoHtml(htmlTemplate, route.page);

    expect(route.status).toBe(200);
    expect(html).toContain('"@type":"CollectionPage"');
    expect(html).toContain('href="/buscar"');
    expect(html).toContain('href="/pacotes-leads"');
  });

  it("entrega conteúdo próprio e links internos nas páginas comerciais sem JavaScript", () => {
    const homeHtml = renderSeoHtml(htmlTemplate, getSeoRoute("/").page);
    const searchHtml = renderSeoHtml(htmlTemplate, getSeoRoute("/buscar").page);
    const leadsHtml = renderSeoHtml(htmlTemplate, getSeoRoute("/pacotes-leads").page);
    const blogHtml = renderSeoHtml(htmlTemplate, getSeoRoute("/blog").page);

    expect(homeHtml).toContain("Busque leads B2B e representantes comerciais");
    expect(homeHtml).toContain('href="/pacotes-leads"');
    expect(searchHtml).toContain("Buscar representantes comerciais por região e segmento");
    expect(searchHtml).toContain('href="/oportunidades-reps"');
    expect(leadsHtml).toContain("Busque seus leads B2B e B2C para campanhas comerciais");
    expect(leadsHtml).toContain('href="/blog/como-montar-lista-empresas-b2b-prospeccao"');
    expect(blogHtml).toContain("Guias recentes");
    expect(blogHtml).toContain("Como Montar uma Lista de Empresas B2B para Prospecção");
  });
});
