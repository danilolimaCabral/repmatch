import { useLocation, useParams } from "wouter";
import { useEffect } from "react";
import { Clock, ArrowLeft, ArrowRight, Tag, Share2, BookOpen } from "lucide-react";
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
          <Button
            variant="outline"
            size="sm"
            className="ml-auto text-xs"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: post.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className="w-3 h-3 mr-1" /> Compartilhar
          </Button>
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

        {/* Tags */}
        <div className="mt-10 pt-6 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <Tag className="w-3.5 h-3.5 text-muted-foreground" />
            {post.tags.map(tag => (
              <span key={tag} className="text-xs bg-secondary text-muted-foreground px-3 py-1 rounded-full border border-border">
                {tag}
              </span>
            ))}
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
