import { useLocation } from "wouter";
import { Clock, ArrowRight, Tag, BookOpen, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { BLOG_POSTS } from "@/data/blogPosts";

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

export default function Blog() {
  const [, navigate] = useLocation();
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO
        title="Blog | Representação Comercial"
        description="Artigos, guias e dicas sobre representação comercial no Brasil. Aprenda como contratar representantes, contratos, CORE, segmentos lucrativos e muito mais."
        keywords="blog representação comercial, artigos representante comercial, guia representante, dicas representação"
        canonical="/blog"
        ogType="website"
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

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background border-b border-border py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mb-5 border border-primary/20">
            <BookOpen className="w-3.5 h-3.5" />
            Blog RepMatch
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Tudo sobre <span className="text-primary">Representação Comercial</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Guias práticos, dicas de carreira, modelos de contrato e estratégias para empresas e representantes comerciais.
          </p>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="max-w-6xl mx-auto px-6 py-12">

        {/* Artigo em destaque */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary uppercase tracking-wide">Em Destaque</span>
          </div>
          <div
            className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-8 cursor-pointer hover:border-primary/40 transition-all group"
            onClick={() => navigate(`/blog/${featured.slug}`)}
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs ${CATEGORY_COLORS[featured.category] ?? "bg-secondary text-muted-foreground"}`}>
                    {featured.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {featured.readTime} min de leitura
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black mb-3 group-hover:text-primary transition-colors leading-tight">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground mb-5 text-base leading-relaxed">
                  {featured.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {featured.author} · {formatDate(featured.date)}
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground font-semibold">
                    Ler artigo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de artigos */}
        <div>
          <h2 className="text-xl font-black mb-6">Todos os Artigos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <article
                key={post.slug}
                className="rounded-xl border border-border bg-card p-6 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group flex flex-col"
                onClick={() => navigate(`/blog/${post.slug}`)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={`text-xs ${CATEGORY_COLORS[post.category] ?? "bg-secondary text-muted-foreground"}`}>
                    {post.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {post.readTime} min
                  </span>
                </div>
                <h3 className="font-black text-base mb-2 group-hover:text-primary transition-colors leading-snug flex-1">
                  {post.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                  <span className="text-xs text-muted-foreground">{formatDate(post.date)}</span>
                  <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ler <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <h3 className="text-2xl font-black mb-2">Pronto para encontrar seu representante ideal?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
            O RepMatch conecta empresas com mais de 9.000 representantes verificados em todo o Brasil.
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
      <footer className="border-t border-border bg-card mt-8 py-6 px-4 text-center text-sm text-muted-foreground">
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
