import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { Clock, ArrowLeft, ArrowRight, Tag, Share2, BookOpen, Link2, Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { getBlogPost, getRecentPosts, BLOG_POSTS } from "@/data/blogPosts";
import ReactMarkdown from "react-markdown";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const CATEGORY_COLORS: Record<string, string> = {
  "Guias": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Carreira": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Jurídico": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Mercado": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Regulamentação": "bg-red-500/10 text-red-400 border-red-500/20",
  "Estratégia": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

// ─── Componente de Compartilhamento ─────────────────────────────────────────
function ShareButtons({ title, excerpt, large }: { title: string; excerpt: string; large?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(`${title}\n\n${excerpt}\n\n${url}`);

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedText}`, "_blank", "noopener,noreferrer");
  };

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const size = large ? "h-9 px-3 text-xs" : "h-8 px-2.5 text-xs";
  const iconSize = large ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-2">
      {/* WhatsApp */}
      <button
        onClick={shareWhatsApp}
        title="Compartilhar no WhatsApp"
        className={`inline-flex items-center gap-1.5 ${size} rounded-lg font-semibold border transition-all
          bg-[#25D366]/10 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/20 hover:border-[#25D366]/50`}
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        {large && <span>WhatsApp</span>}
      </button>

      {/* LinkedIn */}
      <button
        onClick={shareLinkedIn}
        title="Compartilhar no LinkedIn"
        className={`inline-flex items-center gap-1.5 ${size} rounded-lg font-semibold border transition-all
          bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/30 hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/50`}
      >
        <svg className={iconSize} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        {large && <span>LinkedIn</span>}
      </button>

      {/* Copiar link */}
      <button
        onClick={copyLink}
        title="Copiar link"
        className={`inline-flex items-center gap-1.5 ${size} rounded-lg font-semibold border transition-all
          ${copied
            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
            : "bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
          }`}
      >
        {copied
          ? <><Check className={iconSize} />{large && <span>Copiado!</span>}</>
          : <><Link2 className={iconSize} />{large && <span>Copiar link</span>}</>
        }
      </button>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function BlogPost() {
  const [, navigate] = useLocation();
  const params = useParams<{ slug: string }>();
  const post = getBlogPost(params.slug);
  const recent = getRecentPosts(params.slug, 3);

  useEffect(() => {
    if (!post) return;
    // Inject Article Schema.org
    const existing = document.getElementById("blog-schema");
    if (existing) existing.remove();
    const script = document.createElement("script");
    script.id = "blog-schema";
    script.type = "application/ld+json";
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": post.excerpt,
      "author": {
        "@type": "Organization",
        "name": post.author,
        "url": "https://repmatch.com.br"
      },
      "publisher": {
        "@type": "Organization",
        "name": "RepMatch",
        "logo": {
          "@type": "ImageObject",
          "url": "https://repmatch.com.br/manus-storage/repmatch-logo-nobg_ec328e76.png"
        }
      },
      "datePublished": post.date,
      "dateModified": post.date,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://repmatch.com.br/blog/${post.slug}`
      },
      "keywords": post.keywords,
      "articleSection": post.category,
      "inLanguage": "pt-BR"
    });
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [post]);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-2">Artigo não encontrado</h1>
          <p className="text-muted-foreground mb-6">O artigo que você procura não existe.</p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Blog
          </Button>
        </div>
      </div>
    );
  }

  const currentIndex = BLOG_POSTS.findIndex(p => p.slug === post.slug);
  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={post.keywords}
        canonical={`/blog/${post.slug}`}
        ogType="article"
      />

      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
          </button>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/buscar" className="hover:text-foreground transition-colors">Buscar Reps</a>
            <a href="/vagas" className="hover:text-foreground transition-colors">Vagas</a>
            <a href="/blog" className="text-foreground font-semibold">Blog</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>Entrar</Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => navigate("/register")}>
              Cadastrar grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-6 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Início</button>
          <span>/</span>
          <button onClick={() => navigate("/blog")} className="hover:text-foreground transition-colors">Blog</button>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{post.title}</span>
        </nav>
      </div>

      {/* Artigo */}
      <article className="max-w-4xl mx-auto px-6 py-8">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Badge className={`text-xs ${CATEGORY_COLORS[post.category] ?? "bg-secondary text-muted-foreground"}`}>
            {post.category}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.readTime} min de leitura
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDate(post.date)}
          </span>
        </div>

        {/* Título */}
        <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{post.title}</h1>
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed border-l-4 border-primary/40 pl-4">
          {post.excerpt}
        </p>

        {/* Autor */}
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-border">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm">
            RM
          </div>
          <div>
            <div className="font-semibold text-sm">{post.author}</div>
            <div className="text-xs text-muted-foreground">{post.authorRole}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ShareButtons title={post.title} excerpt={post.excerpt} />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="prose prose-invert prose-emerald max-w-none
          prose-headings:font-black prose-headings:text-foreground
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
          prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
          prose-li:text-muted-foreground prose-li:leading-relaxed
          prose-strong:text-foreground prose-strong:font-bold
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
          prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded
          prose-pre:bg-card prose-pre:border prose-pre:border-border
          prose-table:border-collapse
          prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-card prose-th:text-foreground prose-th:font-bold
          prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-muted-foreground
        ">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Tags + Compartilhamento */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {post.tags.map(tag => (
                <span key={tag} className="text-xs bg-secondary text-muted-foreground px-3 py-1 rounded-full border border-border">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Compartilhar:</span>
              <ShareButtons title={post.title} excerpt={post.excerpt} large />
            </div>
          </div>
        </div>

        {/* Navegação prev/next */}
        <div className="mt-10 grid grid-cols-2 gap-4">
          {prevPost ? (
            <button
              onClick={() => navigate(`/blog/${prevPost.slug}`)}
              className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all group"
            >
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Anterior
              </div>
              <div className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">
                {prevPost.title}
              </div>
            </button>
          ) : <div />}
          {nextPost ? (
            <button
              onClick={() => navigate(`/blog/${nextPost.slug}`)}
              className="text-right p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all group"
            >
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1 justify-end">
                Próximo <ArrowRight className="w-3 h-3" />
              </div>
              <div className="text-sm font-bold group-hover:text-primary transition-colors line-clamp-2">
                {nextPost.title}
              </div>
            </button>
          ) : <div />}
        </div>
      </article>

      {/* Artigos relacionados */}
      {recent.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-10 border-t border-border">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Artigos Relacionados
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recent.map(p => (
              <article
                key={p.slug}
                className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:border-primary/40 transition-all group"
                onClick={() => navigate(`/blog/${p.slug}`)}
              >
                <Badge className={`text-xs mb-2 ${CATEGORY_COLORS[p.category] ?? "bg-secondary text-muted-foreground"}`}>
                  {p.category}
                </Badge>
                <h3 className="font-black text-sm mb-2 group-hover:text-primary transition-colors leading-snug line-clamp-3">
                  {p.title}
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {p.readTime} min
                </span>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h3 className="text-2xl font-black mb-2">Encontre representantes verificados agora</h3>
          <p className="text-muted-foreground mb-6 text-sm max-w-lg mx-auto">
            Mais de 9.000 representantes comerciais em todo o Brasil. Filtre por região, segmento e experiência.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="bg-primary text-primary-foreground font-bold px-8" onClick={() => navigate("/register")}>
              Cadastrar empresa grátis <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/buscar")}>
              Ver representantes
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 px-4 text-center text-sm text-muted-foreground">
        <img src={LOGO_URL} alt="RepMatch" className="h-6 object-contain mx-auto mb-3" />
        <p>© 2025 RepMatch · Marketplace de Representantes Comerciais</p>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <a href="/" className="hover:text-foreground transition-colors">Início</a>
          <a href="/buscar" className="hover:text-foreground transition-colors">Buscar Reps</a>
          <a href="/vagas" className="hover:text-foreground transition-colors">Vagas</a>
          <a href="/blog" className="hover:text-foreground transition-colors">Blog</a>
        </div>
      </footer>
    </div>
  );
}
