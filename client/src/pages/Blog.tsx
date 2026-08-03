import { useLocation } from "wouter";
import { useState } from "react";
import { Clock, ArrowRight, Tag, BookOpen, TrendingUp, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const CATEGORY_ACTIVE: Record<string, string> = {
  "Guias": "bg-blue-500 text-white border-blue-500",
  "Carreira": "bg-emerald-500 text-white border-emerald-500",
  "Jurídico": "bg-purple-500 text-white border-purple-500",
  "Mercado": "bg-amber-500 text-white border-amber-500",
  "Regulamentação": "bg-red-500 text-white border-red-500",
  "Estratégia": "bg-cyan-500 text-white border-cyan-500",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// Estatísticas do blog
const STATS = [
  { label: "Artigos publicados", value: String(BLOG_POSTS.length) },
  { label: "Categorias", value: String(new Set(BLOG_POSTS.map(p => p.category)).size) },
  { label: "Tempo médio de leitura", value: `${Math.round(BLOG_POSTS.reduce((a, p) => a + p.readTime, 0) / BLOG_POSTS.length)} min` },
];

export default function Blog() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const featured = BLOG_POSTS.find(p => p.featured) ?? BLOG_POSTS[0];
  const categories = Array.from(new Set(BLOG_POSTS.map(p => p.category)));

  const filtered = BLOG_POSTS.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const showFeatured = !search && !activeCategory;
  const gridPosts = showFeatured ? filtered.filter(p => p.slug !== featured.slug) : filtered;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Blog RepMatch | Representação Comercial no Brasil"
        description="Artigos, guias e dicas sobre representação comercial no Brasil. Aprenda como contratar representantes, contratos, CORE, segmentos lucrativos e muito mais."
        keywords="blog representação comercial, artigos representante comercial, guia representante, dicas representação, contratar representante"
        canonical="/blog"
        ogType="website"
      />

      {/* Header */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="RepMatch" width={28} height={28} className="h-7 object-contain" />
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
      <section className="bg-gradient-to-b from-primary/8 via-primary/3 to-background border-b border-border py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mb-5 border border-primary/20">
            <BookOpen className="w-3.5 h-3.5" />
            Blog RepMatch
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Tudo sobre <span className="text-primary">Representação Comercial</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Guias práticos, dicas de carreira, modelos de contrato e estratégias para empresas e representantes comerciais.
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="border-b border-border bg-card/50 py-4 px-6 sticky top-[57px] z-30 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          {/* Busca */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>

          {/* Categorias */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => setActiveCategory(null)}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                !activeCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                  activeCategory === cat
                    ? (CATEGORY_ACTIVE[cat] ?? "bg-primary text-primary-foreground border-primary")
                    : (CATEGORY_COLORS[cat] ?? "bg-secondary text-muted-foreground border-border") + " hover:opacity-80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="max-w-6xl mx-auto px-6 py-12">

        {/* Artigo em destaque */}
        {showFeatured && (
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
        )}

        {/* Grid de artigos */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black">
              {activeCategory ? `Artigos: ${activeCategory}` : search ? `Resultados para "${search}"` : "Todos os Artigos"}
            </h2>
            <span className="text-sm text-muted-foreground">{gridPosts.length} artigo{gridPosts.length !== 1 ? "s" : ""}</span>
          </div>

          {gridPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">Nenhum artigo encontrado</p>
              <p className="text-sm mt-1">Tente outros termos ou categorias</p>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => { setSearch(""); setActiveCategory(null); }}>
                Limpar filtros
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridPosts.map((post) => (
                <article
                  key={post.slug}
                  className="rounded-xl border border-border bg-card p-6 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group flex flex-col"
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
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-xs bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded-full border border-border/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">{formatDate(post.date)}</span>
                    <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Ler <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-4 border border-primary/20">
            <Tag className="w-3 h-3" /> Plataforma
          </div>
          <h3 className="text-2xl font-black mb-2">Pronto para encontrar seu representante ideal?</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
            O RepMatch conecta empresas com mais de 9.000 representantes verificados em todo o Brasil. Desbloqueie contatos a partir de R$29.
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
        <img src={LOGO_URL} alt="RepMatch" width={24} height={24} className="h-6 object-contain mx-auto mb-3" />
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
