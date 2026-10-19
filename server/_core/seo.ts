import { BLOG_POSTS } from "../../client/src/data/blogPosts";

const BASE_URL = "https://repmatch.com.br";
const LOGO_URL = `${BASE_URL}/manus-storage/repmatch-logo-nobg_ec328e76.png`;
const DEFAULT_SOCIAL_IMAGE = LOGO_URL;
const DEFAULT_SOCIAL_IMAGE_ALT = "RepMatch — representantes comerciais e prospecção B2B";

export interface SeoPage {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  ogImageAlt?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
  fallbackHtml?: string;
}

export interface SeoRouteResult {
  page: SeoPage;
  status: 200 | 404;
  redirectTo?: string;
}

const INDEXABLE_PAGES: Record<string, SeoPage> = {
  "/": {
    title: "Representantes Comerciais e Campanhas de Leads B2B | RepMatch",
    description: "Encontre representantes comerciais ou monte uma campanha B2B segmentada por setor, CNAE e região. Base nacional para prospecção comercial organizada.",
    canonicalPath: "/",
    structuredData: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        name: "RepMatch",
        url: BASE_URL,
        inLanguage: "pt-BR",
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: "RepMatch",
        url: BASE_URL,
        logo: LOGO_URL,
        areaServed: { "@type": "Country", name: "Brasil" },
        contactPoint: [{
          "@type": "ContactPoint",
          telephone: "+55-41-99949-9815",
          contactType: "customer service",
          areaServed: "BR",
          availableLanguage: "pt-BR",
        }],
      },
    ],
  },
  "/buscar": {
    title: "Buscar Representantes Comerciais por Região e Segmento | RepMatch",
    description: "Pesquise representantes comerciais por região, segmento e disponibilidade. Conheça a plataforma RepMatch para encontrar parceiros de vendas em todo o Brasil.",
    canonicalPath: "/buscar",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Buscar representantes comerciais",
      description: "Página de pesquisa de representantes comerciais por região e segmento.",
      url: `${BASE_URL}/buscar`,
      inLanguage: "pt-BR",
    },
  },
  "/vagas": {
    title: "Vagas para Representantes Comerciais por Região | RepMatch",
    description: "Veja vagas de representação comercial por região e segmento. Cadastre seu perfil gratuitamente e encontre oportunidades compatíveis com sua experiência.",
    canonicalPath: "/vagas",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Vagas para representantes comerciais",
      url: `${BASE_URL}/vagas`,
      inLanguage: "pt-BR",
    },
  },
  "/oportunidades-reps": {
    title: "Representantes Comerciais Disponíveis | RepMatch",
    description: "Encontre representantes comerciais disponíveis para representação no Brasil. Profissionais publicam disponibilidade por região e segmento.",
    canonicalPath: "/oportunidades-reps",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Representantes comerciais disponíveis",
      description: "Página de representantes comerciais disponíveis por região e segmento.",
      url: `${BASE_URL}/oportunidades-reps`,
      inLanguage: "pt-BR",
    },
  },
  "/parcerias": {
    title: "Parcerias Comerciais e Expansão de Vendas | RepMatch",
    description: "Conheça as parcerias comerciais do RepMatch para empresas, representantes e profissionais que querem ampliar canais de venda no Brasil.",
    canonicalPath: "/parcerias",
  },
  "/pacotes-leads": {
    title: "Leads B2B e B2C para Campanhas | Empresas Ativas por Segmento | RepMatch",
    description: "Monte uma campanha com empresas B2B ou B2C, com recorte por segmento e região. Escolha os registros individualmente e exporte sua lista para CRM.",
    canonicalPath: "/pacotes-leads",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Listas de empresas B2B para prospecção",
      provider: { "@type": "Organization", name: "RepMatch", url: BASE_URL },
      areaServed: { "@type": "Country", name: "Brasil" },
      description: "Serviço de listas empresariais para prospecção segmentadas por segmento, CNAE e região.",
      url: `${BASE_URL}/pacotes-leads`,
    },
  },
  "/contatos-b2c": {
    title: "Contatos B2C para Imobiliárias, Automotivo e Produtos Digitais | RepMatch",
    description: "Base B2C de contatos com consentimento declarado na origem. Escolha contatos individualmente, mantenha sua lista e exporte em Excel.",
    canonicalPath: "/contatos-b2c",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: "Base de contatos B2C para campanhas comerciais",
      provider: { "@type": "Organization", name: "RepMatch", url: BASE_URL },
      areaServed: { "@type": "Country", name: "Brasil" },
      description: "Serviço de seleção individual de contatos B2C para campanhas comerciais responsáveis.",
      url: `${BASE_URL}/contatos-b2c`,
    },
  },
  "/blog": {
    title: "Blog de Representação Comercial e Prospecção B2B | RepMatch",
    description: "Guias sobre representação comercial, contratação de representantes, prospecção B2B, listas de empresas, vendas externas e expansão comercial no Brasil.",
    canonicalPath: "/blog",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Blog RepMatch",
      description: "Guias sobre representação comercial, prospecção B2B e expansão de vendas.",
      url: `${BASE_URL}/blog`,
      inLanguage: "pt-BR",
    },
  },
  "/termos": {
    title: "Termos de Uso | RepMatch",
    description: "Leia os termos de uso do RepMatch, plataforma para representantes comerciais, empresas e campanhas de prospecção.",
    canonicalPath: "/termos",
  },
  "/privacidade": {
    title: "Política de Privacidade e LGPD | RepMatch",
    description: "Entenda como o RepMatch trata e protege dados pessoais e empresariais, além dos direitos dos titulares nos termos da LGPD.",
    canonicalPath: "/privacidade",
  },
};

const NOINDEX_PAGES: Record<string, SeoPage> = {
  "/login": {
    title: "Entrar | RepMatch",
    description: "Acesso à conta RepMatch.",
    canonicalPath: "/login",
    robots: "noindex, nofollow, noarchive",
  },
  "/register": {
    title: "Criar conta | RepMatch",
    description: "Cadastro de conta RepMatch.",
    canonicalPath: "/register",
    robots: "noindex, nofollow, noarchive",
  },
  "/esqueci-senha": {
    title: "Recuperar senha | RepMatch",
    description: "Recuperação de acesso à conta RepMatch.",
    canonicalPath: "/esqueci-senha",
    robots: "noindex, nofollow, noarchive",
  },
  "/redefinir-senha": {
    title: "Redefinir senha | RepMatch",
    description: "Redefinição de acesso à conta RepMatch.",
    canonicalPath: "/redefinir-senha",
    robots: "noindex, nofollow, noarchive",
  },
  "/verificar-email": {
    title: "Verificar e-mail | RepMatch",
    description: "Verificação de conta RepMatch.",
    canonicalPath: "/verificar-email",
    robots: "noindex, nofollow, noarchive",
  },
  "/onboarding": {
    title: "Configurar conta | RepMatch",
    description: "Configuração de conta RepMatch.",
    canonicalPath: "/onboarding",
    robots: "noindex, nofollow, noarchive",
  },
  "/dashboard/rep": {
    title: "Painel de representante | RepMatch",
    description: "Painel privado RepMatch.",
    canonicalPath: "/dashboard/rep",
    robots: "noindex, nofollow, noarchive",
  },
  "/dashboard/company": {
    title: "Painel da empresa | RepMatch",
    description: "Painel privado RepMatch.",
    canonicalPath: "/dashboard/company",
    robots: "noindex, nofollow, noarchive",
  },
  "/dashboard/manager": {
    title: "Painel do gerente | RepMatch",
    description: "Painel privado RepMatch.",
    canonicalPath: "/dashboard/manager",
    robots: "noindex, nofollow, noarchive",
  },
  "/admin": {
    title: "Administração | RepMatch",
    description: "Área administrativa privada RepMatch.",
    canonicalPath: "/admin",
    robots: "noindex, nofollow, noarchive",
  },
  "/perfil": {
    title: "Perfil | RepMatch",
    description: "Perfil privado RepMatch.",
    canonicalPath: "/perfil",
    robots: "noindex, nofollow, noarchive",
  },
  "/verificacao": {
    title: "Verificação | RepMatch",
    description: "Verificação privada RepMatch.",
    canonicalPath: "/verificacao",
    robots: "noindex, nofollow, noarchive",
  },
  "/planos-gerente": {
    title: "Planos do gerente | RepMatch",
    description: "Área privada RepMatch.",
    canonicalPath: "/planos-gerente",
    robots: "noindex, nofollow, noarchive",
  },
};

const NOT_FOUND_PAGE: SeoPage = {
  title: "Página não encontrada | RepMatch",
  description: "A página solicitada não foi encontrada.",
  canonicalPath: "/404",
  robots: "noindex, nofollow, noarchive",
};

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function getBlogPage(pathname: string): SeoPage | null {
  const match = pathname.match(/^\/blog\/([^/]+)$/);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  const post = BLOG_POSTS.find((item) => item.slug === slug);
  if (!post) return null;
  const canonicalUrl = `${BASE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} | RepMatch`,
    description: post.excerpt,
    canonicalPath: `/blog/${post.slug}`,
    ogType: "article",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.updatedAt ?? post.date,
      author: { "@type": "Organization", name: post.author, url: BASE_URL },
      publisher: {
        "@type": "Organization",
        name: "RepMatch",
        logo: { "@type": "ImageObject", url: LOGO_URL },
      },
      mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
      articleSection: post.category,
      inLanguage: "pt-BR",
    },
    fallbackHtml: renderBlogFallback(post),
  };
}

/** Obtém metadados e status HTTP reais para cada rota da SPA. */
export function getSeoRoute(pathname: string): SeoRouteResult {
  const normalizedPath = normalizePathname(pathname);
  const redirects: Record<string, string> = {
    "/buscar-reps": "/buscar",
    "/reps-disponiveis": "/oportunidades-reps",
    "/faq": "/#faq",
    "/planos": "/#planos",
  };
  if (redirects[normalizedPath]) {
    return { page: INDEXABLE_PAGES["/"], status: 200, redirectTo: redirects[normalizedPath] };
  }

  const blogPage = getBlogPage(normalizedPath);
  if (blogPage) return { page: blogPage, status: 200 };
  if (INDEXABLE_PAGES[normalizedPath]) return { page: INDEXABLE_PAGES[normalizedPath], status: 200 };
  if (NOINDEX_PAGES[normalizedPath]) return { page: NOINDEX_PAGES[normalizedPath], status: 200 };
  return { page: NOT_FOUND_PAGE, status: 404 };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character] ?? character);
}

function renderInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
}

function renderMarkdownFallback(content: string): string {
  return content.trim().split(/\n{2,}/).map((rawBlock) => {
    const block = rawBlock.trim();
    if (!block) return "";
    if (block.startsWith("## ")) return `<h2>${renderInlineMarkdown(block.slice(3))}</h2>`;
    if (block.startsWith("### ")) return `<h3>${renderInlineMarkdown(block.slice(4))}</h3>`;

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => /^[-*] /.test(line))) {
      return `<ul>${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^[-*] /, ""))}</li>`).join("")}</ul>`;
    }
    if (lines.every((line) => /^\d+\. /.test(line))) {
      return `<ol>${lines.map((line) => `<li>${renderInlineMarkdown(line.replace(/^\d+\. /, ""))}</li>`).join("")}</ol>`;
    }
    if (block.startsWith("> ")) return `<blockquote><p>${renderInlineMarkdown(block.replace(/^>\s?/gm, "").replace(/\n/g, " "))}</p></blockquote>`;
    if (lines.every((line) => line.startsWith("|"))) return `<p>${renderInlineMarkdown(lines.join(" ").replace(/\|/g, " · "))}</p>`;
    return `<p>${renderInlineMarkdown(block.replace(/\n/g, " "))}</p>`;
  }).join("\n");
}

function renderBlogFallback(post: (typeof BLOG_POSTS)[number]): string {
  const published = escapeHtml(post.date);
  const modified = escapeHtml(post.updatedAt ?? post.date);
  return `<main><article><header><p>${escapeHtml(post.category)}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p><p>Publicado em <time datetime="${published}">${published}</time>${post.updatedAt ? ` · Atualizado em <time datetime="${modified}">${modified}</time>` : ""}</p></header>${renderMarkdownFallback(post.content)}<p><a href="/pacotes-leads">Conheça as campanhas de leads B2B</a> ou <a href="/buscar">busque representantes comerciais</a>.</p></article></main>`;
}

function upsertMeta(html: string, attribute: "name" | "property", key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const expression = new RegExp(`<meta\\s+${attribute}="${escapedKey}"\\s+content="[^"]*"\\s*\\/?>`, "i");
  const meta = `<meta ${attribute}="${key}" content="${escapeHtml(value)}" />`;
  return expression.test(html) ? html.replace(expression, meta) : html.replace("</head>", `    ${meta}\n  </head>`);
}

function getSchemaNodes(page: SeoPage): Array<Record<string, unknown>> {
  const canonicalUrl = `${BASE_URL}${page.canonicalPath}`;
  const pageNode: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: page.title,
    description: page.description,
    inLanguage: "pt-BR",
  };

  if (!page.structuredData) return [pageNode];
  const suppliedNodes = Array.isArray(page.structuredData) ? page.structuredData : [page.structuredData];
  return [
    ...suppliedNodes.map(({ "@context": _context, ...node }) => node),
    pageNode,
  ];
}

function serializePageStructuredData(page: SeoPage): string {
  if (page.robots?.includes("noindex")) return "";
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": getSchemaNodes(page),
  }).replace(/</g, "\\u003c");
  return `<script id="page-structured-data" data-canonical="${escapeHtml(`${BASE_URL}${page.canonicalPath}`)}" type="application/ld+json">${json}</script>`;
}

function renderNoScriptFallback(page: SeoPage): string {
  if (page.robots?.includes("noindex")) return "";
  if (page.fallbackHtml) return `<noscript>${page.fallbackHtml}</noscript>`;
  return `<noscript><main><h1>${escapeHtml(page.title)}</h1><p>${escapeHtml(page.description)}</p><nav aria-label="Navegação do RepMatch"><a href="/buscar">Buscar representantes</a> <a href="/vagas">Ver vagas</a> <a href="/pacotes-leads">Conhecer campanhas B2B</a> <a href="/blog">Ler o blog</a></nav><p>Ative o JavaScript para usar filtros, cadastro e os demais recursos da plataforma.</p></main></noscript>`;
}

/** Injeta metadados por rota no HTML antes de a SPA carregar. */
export function renderSeoHtml(template: string, page: SeoPage): string {
  const canonicalUrl = `${BASE_URL}${page.canonicalPath}`;
  const robots = page.robots ?? "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const ogType = page.ogType ?? "website";
  const socialImage = page.ogImage ?? DEFAULT_SOCIAL_IMAGE;
  const socialImageAlt = page.ogImageAlt ?? DEFAULT_SOCIAL_IMAGE_ALT;
  let html = template
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(page.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);

  html = upsertMeta(html, "name", "description", page.description);
  html = upsertMeta(html, "name", "robots", robots);
  html = upsertMeta(html, "property", "og:title", page.title);
  html = upsertMeta(html, "property", "og:description", page.description);
  html = upsertMeta(html, "property", "og:url", canonicalUrl);
  html = upsertMeta(html, "property", "og:type", ogType);
  html = upsertMeta(html, "property", "og:image", socialImage);
  html = upsertMeta(html, "property", "og:image:alt", socialImageAlt);
  html = upsertMeta(html, "property", "og:site_name", "RepMatch");
  html = upsertMeta(html, "property", "og:locale", "pt_BR");
  html = upsertMeta(html, "name", "twitter:card", "summary_large_image");
  html = upsertMeta(html, "name", "twitter:title", page.title);
  html = upsertMeta(html, "name", "twitter:description", page.description);
  html = upsertMeta(html, "name", "twitter:url", canonicalUrl);
  html = upsertMeta(html, "name", "twitter:image", socialImage);
  html = upsertMeta(html, "name", "twitter:image:alt", socialImageAlt);

  html = html.replace("</head>", `    ${serializePageStructuredData(page)}\n  </head>`);
  return html.replace("<div id=\"root\"></div>", `${renderNoScriptFallback(page)}<div id="root"></div>`);
}
