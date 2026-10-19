import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const BASE_URL = "https://repmatch.com.br";
const DEFAULT_IMAGE = "https://repmatch.com.br/manus-storage/repmatch-logo-nobg_ec328e76.png";
const SITE_NAME = "RepMatch";

function setMeta(name: string, content: string, attr = "name") {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function SEO({
  title,
  description = "RepMatch conecta empresas a representantes comerciais e apoia operações de prospecção B2B no Brasil.",
  keywords,
  canonical,
  ogImage = DEFAULT_IMAGE,
  ogType = "website",
  noIndex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title
    ? title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — Marketplace de Representantes Comerciais no Brasil`;

  const canonicalUrl = canonical ? `${BASE_URL}${canonical}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Meta básico
    setMeta("description", description);
    if (keywords) setMeta("keywords", keywords);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");

    // Canonical
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", description, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:url", canonicalUrl, "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:image:alt", `${fullTitle} — RepMatch`, "property");
    setMeta("og:site_name", SITE_NAME, "property");
    setMeta("og:locale", "pt_BR", "property");

    // Twitter
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:url", canonicalUrl);
    setMeta("twitter:image", ogImage);
    setMeta("twitter:image:alt", `${fullTitle} — RepMatch`);

    const existingSchema = document.getElementById("page-structured-data") as HTMLScriptElement | null;
    if (structuredData) {
      const script = existingSchema ?? document.createElement("script");
      script.id = "page-structured-data";
      script.type = "application/ld+json";
      script.dataset.canonical = canonicalUrl;
      script.textContent = JSON.stringify(structuredData);
      if (!existingSchema) document.head.appendChild(script);
    } else if (existingSchema?.dataset.canonical !== canonicalUrl) {
      existingSchema?.remove();
    }
  }, [fullTitle, description, keywords, canonicalUrl, ogImage, ogType, noIndex, structuredData]);

  return null;
}
