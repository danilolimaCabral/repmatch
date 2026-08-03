import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, Briefcase, Star, Lock, Users, Filter, ArrowRight, Loader2, TrendingUp, Clock, Award, Crown, Medal, Shield, CheckCircle2, ChevronDown } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const TIER_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode; highlight: boolean }> = {
  free: { label: "Free", color: "bg-zinc-700/60 text-zinc-300", icon: null, highlight: false },
  bronze: { label: "Bronze", color: "bg-amber-900/60 text-amber-300", icon: <Medal className="w-3 h-3" />, highlight: true },
  prata: { label: "Prata", color: "bg-slate-500/60 text-slate-200", icon: <Award className="w-3 h-3" />, highlight: true },
  ouro: { label: "Ouro ⭐", color: "bg-yellow-600/70 text-yellow-100", icon: <Crown className="w-3 h-3" />, highlight: true },
};

const AVAILABILITY_LABEL: Record<string, string> = {
  imediata: "Disponível agora",
  "30dias": "Em 30 dias",
  "60dias": "Em 60 dias",
  negociavel: "Negociável",
};

export default function BuscarRepresentantes() {
  const [, navigate] = useLocation();
  const [region, setRegion] = useState("");
  const [segment, setSegment] = useState("");
  const [kycApproved, setKycApproved] = useState(false);
  const [coreActive, setCoreActive] = useState(false);
  const [availability, setAvailability] = useState<string | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const regionFilter = region === "all" ? undefined : region || undefined;
  const segmentFilter = segment === "all" ? undefined : segment || undefined;

  const { data, isLoading } = trpc.representatives.preview.useQuery(
    { region: regionFilter, segment: segmentFilter, kycApproved: kycApproved || undefined, coreActive: coreActive || undefined, availability }
  );

  const count = data?.count ?? 0;
  const previews = data?.previews ?? [];
  const regions = data?.regions ?? [];
  const segments = data?.segments ?? [];
  const hasFilters = !!(regionFilter || segmentFilter || kycApproved || coreActive || availability);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <SEO
        title="Buscar Representantes Comerciais | RepMatch"
        description="Encontre representantes comerciais qualificados em todo o Brasil. Filtre por região, segmento e disponibilidade. Base com mais de 9.000 perfis verificados."
        keywords="buscar representante comercial, encontrar representante, representante por região, representante por segmento, representante verificado, contratar representante"
        canonical="/buscar"
      />

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-sm" onClick={() => window.location.href = '/login'}>
              Entrar
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold text-sm" onClick={() => window.location.href = '/login'}>
              Cadastrar grátis
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero com contador em destaque ───────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary/5 via-card to-background border-b border-border pt-12 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Contador principal */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full mb-5 border border-primary/20">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              Base atualizada em tempo real
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 leading-tight">
              Encontre o representante certo
              <br /><span className="text-primary">para sua empresa</span>
            </h1>
            <p className="text-muted-foreground text-base mb-6 max-w-xl mx-auto">
              Filtre por região e segmento. Veja perfis verificados com histórico real.
            </p>

            {/* Estatísticas */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-3">
                <Users className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <div className="text-xl font-black text-primary">
                    {isLoading ? "..." : count.toLocaleString("pt-BR")}
                  </div>
                  <div className="text-xs text-muted-foreground">representantes{hasFilters ? " encontrados" : " disponíveis"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div className="text-left">
                  <div className="text-xl font-black">100%</div>
                  <div className="text-xs text-muted-foreground">perfis verificados</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <div className="text-left">
                  <div className="text-xl font-black">&lt;48h</div>
                  <div className="text-xs text-muted-foreground">tempo médio de match</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Filtros principais ──────────────────────────────────────────── */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Região
                </label>
                <Select value={region} onValueChange={setRegion}>
                  <SelectTrigger className="bg-background border-border h-10">
                    <SelectValue placeholder="Todas as regiões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as regiões</SelectItem>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Segmento
                </label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger className="bg-background border-border h-10">
                    <SelectValue placeholder="Todos os segmentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os segmentos</SelectItem>
                    {segments.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros avançados (colapsáveis) */}
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Filter className="w-3 h-3" />
              Filtros avançados
              <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            </button>

            {showAdvanced && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => setKycApproved(!kycApproved)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    kycApproved
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-background text-muted-foreground border-border hover:border-emerald-500/50 hover:text-emerald-400"
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  Identidade Verificada
                  {kycApproved && <span className="ml-0.5">✓</span>}
                </button>
                <button
                  onClick={() => setCoreActive(!coreActive)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    coreActive
                      ? "bg-amber-600 text-white border-amber-500"
                      : "bg-background text-muted-foreground border-border hover:border-amber-500/50 hover:text-amber-400"
                  }`}
                >
                  <Award className="w-3 h-3" />
                  CORE Ativo
                  {coreActive && <span className="ml-0.5">✓</span>}
                </button>
                {(["imediata", "30dias", "60dias"] as const).map((av) => (
                  <button
                    key={av}
                    onClick={() => setAvailability(availability === av ? undefined : av)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      availability === av
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                    }`}
                  >
                    {av === "imediata" ? "🟢 Disponível agora" : av === "30dias" ? "🟡 Em 30 dias" : "🟠 Em 60 dias"}
                  </button>
                ))}
                {hasFilters && (
                  <button
                    onClick={() => { setRegion(""); setSegment(""); setKycApproved(false); setCoreActive(false); setAvailability(undefined); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline px-2"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Results ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        {isLoading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Buscando representantes...</p>
          </div>
        ) : (
          <>
            {/* Cabeçalho dos resultados */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black">
                  <span className="text-primary">{count.toLocaleString("pt-BR")}</span> representantes
                  {regionFilter && <span className="text-muted-foreground font-normal"> em {regionFilter}</span>}
                  {segmentFilter && <span className="text-muted-foreground font-normal"> · {segmentFilter}</span>}
                </h2>
                <p className="text-muted-foreground text-sm mt-0.5">
                  Cadastre-se para ver o perfil completo, contato e histórico
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                Atualizado em tempo real
              </div>
            </div>

            {/* Empty state */}
            {count === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">Nenhum representante encontrado</h3>
                <p className="text-muted-foreground text-sm mb-6">Tente outros filtros de região ou segmento</p>
                <Button variant="outline" onClick={() => { setRegion(""); setSegment(""); setKycApproved(false); setCoreActive(false); setAvailability(undefined); }}>
                  Limpar filtros
                </Button>
              </div>
            )}

            {/* Preview cards */}
            {count > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                {previews.map((rep) => {
                  const tierCfg = TIER_BADGE[rep.subscriptionTier ?? "free"] ?? TIER_BADGE["free"];
                  const isPaid = tierCfg.highlight;
                  return (
                    <div
                      key={rep.id}
                      className={`rounded-xl border bg-card p-5 relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                        isPaid
                          ? "border-primary/40 shadow-sm"
                          : "border-border"
                      }`}
                    >
                      {isPaid && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                      )}

                      {/* Avatar + tier */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base shrink-0 ${
                          isPaid ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                        }`}>
                          {rep.maskedName.charAt(0)}
                        </div>
                        <Badge className={`text-xs flex items-center gap-1 ${tierCfg.color}`}>
                          {tierCfg.icon}{tierCfg.label}
                        </Badge>
                      </div>

                      {/* Nome mascarado */}
                      <div className="font-bold text-base mb-3">{rep.maskedName}</div>

                      {/* Info */}
                      <div className="flex flex-col gap-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                          <span className="truncate">{rep.region}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                          <span className="truncate">{rep.segment}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                          <span>{rep.experienceYears} anos de experiência</span>
                        </div>
                      </div>

                      {/* Rating */}
                      {(rep as any).averageRating && Number((rep as any).averageRating) > 0 && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={`w-3 h-3 ${
                                s <= Math.round(Number((rep as any).averageRating))
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-muted-foreground/30'
                              }`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">{Number((rep as any).averageRating).toFixed(1)}</span>
                        </div>
                      )}

                      {/* Contato bloqueado */}
                      <div className="border-t border-border pt-3 mt-auto">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Lock className="w-3 h-3 text-primary/50" />
                          <span className="blur-sm select-none">+55 (11) 9●●●●-●●●●</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Lock className="w-3 h-3 text-primary/50" />
                          <span className="blur-sm select-none">●●●●●@email.com</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Cards fantasmas bloqueados */}
                {count > previews.length && (
                  <>
                    {/* Fantasma 1 */}
                    <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden opacity-50 select-none">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card z-10 flex flex-col items-center justify-end pb-5">
                        <Lock className="w-5 h-5 text-primary mb-1" />
                        <div className="text-xs font-semibold text-primary">Cadastre-se para ver</div>
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">R</div>
                        <div className="h-5 w-14 bg-secondary rounded-full" />
                      </div>
                      <div className="h-4 w-28 bg-secondary rounded mb-3" />
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="h-3 w-24 bg-secondary rounded" />
                        <div className="h-3 w-32 bg-secondary rounded" />
                        <div className="h-3 w-20 bg-secondary rounded" />
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="h-3 w-36 bg-secondary rounded mb-1.5" />
                        <div className="h-3 w-32 bg-secondary rounded" />
                      </div>
                    </div>

                    {/* Fantasma 2 — só desktop */}
                    <div className="rounded-xl border border-border bg-card p-5 relative overflow-hidden opacity-30 select-none hidden lg:block">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card z-10 flex flex-col items-center justify-end pb-5">
                        <Lock className="w-5 h-5 text-primary mb-1" />
                        <div className="text-xs font-semibold text-primary">Cadastre-se para ver</div>
                      </div>
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">M</div>
                        <div className="h-5 w-14 bg-secondary rounded-full" />
                      </div>
                      <div className="h-4 w-24 bg-secondary rounded mb-3" />
                      <div className="flex flex-col gap-2 mb-4">
                        <div className="h-3 w-20 bg-secondary rounded" />
                        <div className="h-3 w-28 bg-secondary rounded" />
                        <div className="h-3 w-24 bg-secondary rounded" />
                      </div>
                      <div className="border-t border-border pt-3">
                        <div className="h-3 w-36 bg-secondary rounded mb-1.5" />
                        <div className="h-3 w-28 bg-secondary rounded" />
                      </div>
                    </div>

                    {/* Card CTA */}
                    <div
                      className="rounded-xl border-2 border-primary/40 bg-primary/5 p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-all"
                      onClick={() => navigate("/register")}
                    >
                      <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
                        <Lock className="w-7 h-7 text-primary" />
                      </div>
                      <div className="font-black text-3xl text-primary mb-1">
                        +{(count - previews.length).toLocaleString("pt-BR")}
                      </div>
                      <div className="font-semibold text-sm mb-1">representantes bloqueados</div>
                      <div className="text-xs text-muted-foreground mb-5 max-w-[180px]">
                        Crie sua conta gratuita para ver todos os perfis com contato e histórico
                      </div>
                      <Button className="bg-primary text-primary-foreground text-sm font-bold w-full">
                        Desbloquear acesso <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* CTA final */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-2xl font-black mb-2">
                Pronto para contratar o representante ideal?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto text-sm">
                Cadastre sua empresa e tenha acesso completo ao perfil, contato e histórico de todos os{" "}
                <strong className="text-foreground">{count.toLocaleString("pt-BR")} representantes</strong> disponíveis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground font-bold px-8"
                  onClick={() => navigate("/register")}
                >
                  Cadastrar empresa grátis
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-border"
                  onClick={() => window.location.href = '/login'}
                >
                  Já tenho conta
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Plano Starter a partir de R$49/mês · Cancele quando quiser
              </p>
            </div>
          </>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8 py-6 px-4 text-center text-sm text-muted-foreground">
        <img src={LOGO_URL} alt="RepMatch" className="h-6 object-contain mx-auto mb-3" />
        <p>© 2025 RepMatch · Marketplace de Representantes Comerciais</p>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <a href="/" className="hover:text-foreground transition-colors">Início</a>
          <a href="/vagas" className="hover:text-foreground transition-colors">Vagas</a>
          <a href="/login" className="hover:text-foreground transition-colors">Entrar</a>
        </div>
      </footer>
    </div>
  );
}
