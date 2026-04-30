import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Briefcase, DollarSign, Star, Lock, ArrowRight, TrendingUp,
  ChevronLeft, ChevronRight, Loader2, Building2, Sparkles, Users
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

const REGIONS = [
  "São Paulo - Capital", "São Paulo - Interior", "Rio de Janeiro", "Minas Gerais",
  "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco",
  "Ceará", "Goiás", "Distrito Federal", "Nacional (Todo Brasil)",
];

const SEGMENTS = [
  "Alimentos e Bebidas", "Farmacêutico", "Cosméticos e Higiene", "Tecnologia",
  "Construção Civil", "Têxtil e Moda", "Automotivo", "Agronegócio",
  "Saúde e Médico", "Eletroeletrônicos", "Móveis e Decoração", "Outros",
];

const RANK_LABELS: Record<string, { label: string; color: string }> = {
  bronze: { label: "Bronze", color: "text-amber-600" },
  silver: { label: "Silver", color: "text-slate-400" },
  gold: { label: "Gold", color: "text-yellow-400" },
  platinum: { label: "Platinum", color: "text-cyan-400" },
};

const TIER_LABELS: Record<string, string> = {
  free: "Acesso Free",
  bronze: "Acesso Bronze",
  prata: "Acesso Prata",
  ouro: "Acesso Ouro",
};

function maskCompanyName(name: string): string {
  const words = name.trim().split(" ");
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() + " " + "●".repeat(Math.min(words[0].length - 1, 6));
  }
  return words[0] + " " + words.slice(1).map(() => "●●●").join(" ");
}

function timeAgo(date: Date | string): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `${days} dias atrás`;
  if (days < 30) return `${Math.floor(days / 7)} sem. atrás`;
  return `${Math.floor(days / 30)} meses atrás`;
}

export default function Vagas() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [region, setRegion] = useState<string | undefined>(undefined);
  const [segment, setSegment] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.jobs.listPublic.useQuery(
    { region, segment, page, limit: 12 }
  );

  const totalPages = data ? Math.ceil(data.total / 12) : 1;

  const handleFilter = () => setPage(1);

  const registerUrl = useMemo(() => {
    if (user) return "/dashboard/rep";
    return "/register";
  }, [user]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain cursor-pointer" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={() => navigate(user.userType === "company" ? "/dashboard/company" : "/dashboard/rep")}
              >
                Meu Dashboard
              </Button>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => navigate("/register")}>
                  Criar conta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-card border-b border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                {data?.total ?? "..."} vagas abertas agora
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                Vagas para<br />
                <span className="text-gradient-green">Representantes Comerciais</span>
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Empresas verificadas buscando representantes por região e segmento. Crie sua conta gratuita para ver os detalhes e se candidatar.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:items-end">
              <div className="text-center bg-background border border-border rounded-xl px-5 py-3">
                <div className="text-2xl font-black text-primary">{data?.total ?? "—"}</div>
                <div className="text-xs text-muted-foreground">vagas abertas</div>
              </div>
              <div className="text-center bg-background border border-border rounded-xl px-5 py-3">
                <div className="text-2xl font-black">9.677</div>
                <div className="text-xs text-muted-foreground">representantes</div>
              </div>
              <div className="text-center bg-background border border-border rounded-xl px-5 py-3">
                <div className="text-2xl font-black text-primary">&lt;48h</div>
                <div className="text-xs text-muted-foreground">tempo médio de match</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filters ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-background py-4 px-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-3 items-center">
          <Select
            value={region ?? "all"}
            onValueChange={(v) => { setRegion(v === "all" ? undefined : v); handleFilter(); }}
          >
            <SelectTrigger className="w-52 bg-card border-border">
              <MapPin className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Todas as regiões" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as regiões</SelectItem>
              {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select
            value={segment ?? "all"}
            onValueChange={(v) => { setSegment(v === "all" ? undefined : v); handleFilter(); }}
          >
            <SelectTrigger className="w-52 bg-card border-border">
              <Briefcase className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Todos os segmentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os segmentos</SelectItem>
              {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          {(region || segment) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => { setRegion(undefined); setSegment(undefined); setPage(1); }}
            >
              Limpar filtros
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {isLoading ? "Carregando..." : `${data?.total ?? 0} vagas encontradas`}
          </div>
        </div>
      </section>

      {/* ─── Job Grid ────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6 animate-pulse">
                <div className="h-4 bg-secondary rounded w-1/3 mb-3" />
                <div className="h-6 bg-secondary rounded w-3/4 mb-2" />
                <div className="h-4 bg-secondary rounded w-1/2 mb-4" />
                <div className="h-10 bg-secondary rounded" />
              </div>
            ))}
          </div>
        ) : !data?.jobs.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold mb-2">Nenhuma vaga encontrada</p>
            <p className="text-sm">Tente remover os filtros para ver mais vagas.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.jobs.map((job) => {
                const rank = RANK_LABELS[job.companyRank ?? "bronze"];
                const isNew = Date.now() - new Date(job.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div
                    key={job.id}
                    className={`rounded-xl border bg-card p-5 flex flex-col gap-4 relative overflow-hidden transition-shadow hover:shadow-lg ${
                      job.isFeatured ? "border-primary/40 shadow-[0_0_0_1px_hsl(var(--primary)/0.2)]" : "border-border"
                    }`}
                  >
                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {job.isFeatured && (
                        <Badge className="bg-amber-500/15 text-amber-400 text-xs">
                          <Star className="w-3 h-3 mr-1 fill-amber-400" />Destaque
                        </Badge>
                      )}
                      {isNew && (
                        <Badge className="bg-primary/15 text-primary text-xs">Nova</Badge>
                      )}
                      <Badge className="bg-secondary text-muted-foreground text-xs ml-auto">
                        {timeAgo(job.createdAt)}
                      </Badge>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-base leading-snug mb-1">{job.title}</h3>
                      {job.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {job.region && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          {job.region}
                        </div>
                      )}
                      {job.segment && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {job.segment}
                        </div>
                      )}
                      {job.commissionPercentage && (
                        <div className="flex items-center gap-1.5 text-primary font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {job.commissionPercentage}% de comissão
                        </div>
                      )}
                    </div>

                    {/* Company (masked) */}
                    <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-secondary/60 border border-border">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black flex-shrink-0">
                        {job.companyName?.charAt(0) ?? "E"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">{maskCompanyName(job.companyName ?? "Empresa")}</div>
                        {rank && (
                          <div className={`text-xs font-bold ${rank.color}`}>{rank.label}</div>
                        )}
                      </div>
                      <Lock className="w-3.5 h-3.5 text-muted-foreground ml-auto flex-shrink-0" />
                    </div>

                    {/* CTA */}
                    <Button
                      className="w-full bg-primary text-primary-foreground font-semibold"
                      onClick={() => navigate(registerUrl)}
                    >
                      {user ? "Ver detalhes" : "Cadastrar e se candidatar"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-border"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-border"
                >
                  Próxima
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* ─── Bottom CTA ──────────────────────────────────────────────────── */}
        {!user && (
          <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-black mb-2">Pronto para se candidatar?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crie sua conta, monte seu perfil e candidate-se às vagas que combinam com você. Plano Free disponível.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                className="bg-primary text-primary-foreground font-semibold px-8"
                onClick={() => navigate("/register")}
              >
                Criar conta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="border-border"
                onClick={() => navigate("/login")}
              >
                Já tenho conta
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Plano Free disponível · Upgrade para Prata a partir de R$19,90/mês
            </p>
          </div>
        )}
      </main>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card mt-16 py-8 px-4 text-center text-sm text-muted-foreground">
        <img src={LOGO_URL} alt="RepMatch" className="h-6 object-contain mx-auto mb-3" />
        <p>© 2025 RepMatch · Marketplace de Representantes Comerciais</p>
        <div className="flex justify-center gap-4 mt-2">
          <Link href="/" className="hover:text-foreground transition-colors">Início</Link>
          <Link href="/register" className="hover:text-foreground transition-colors">Cadastrar</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
