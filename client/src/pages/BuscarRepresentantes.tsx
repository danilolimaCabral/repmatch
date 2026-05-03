import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useLocation } from "wouter";
import { Search, MapPin, Briefcase, Star, Lock, Users, Filter, ArrowRight, Loader2, TrendingUp, Clock, Award, Crown, Medal, Shield } from "lucide-react";
import { getLoginUrl } from "@/const";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const TIER_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode; highlight: boolean }> = {
  free: { label: "Pendente", color: "bg-zinc-700/60 text-zinc-300", icon: null, highlight: false },
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

  const regionFilter = region === "all" ? undefined : region || undefined;
  const segmentFilter = segment === "all" ? undefined : segment || undefined;

  const { data, isLoading } = trpc.representatives.preview.useQuery(
    { region: regionFilter, segment: segmentFilter, kycApproved: kycApproved || undefined, coreActive: coreActive || undefined, availability }
  );

  const count = data?.count ?? 0;
  const previews = data?.previews ?? [];
  const regions = data?.regions ?? [];
  const segments = data?.segments ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
          </button>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => window.location.href = '/login'}>
              Entrar
            </Button>
            <Button size="sm" className="bg-primary text-primary-foreground font-semibold" onClick={() => window.location.href = '/login'}>
              Cadastrar
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-card to-background border-b border-border py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-semibold">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Base com mais de 9.000 representantes ativos
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Encontre o representante certo<br />
            <span className="text-primary">para sua empresa</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Filtre por região e segmento e veja quantos representantes qualificados estão disponíveis para trabalhar com você.
          </p>

          {/* ─── Filters ─────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="pl-9 bg-secondary border-border h-11">
                  <SelectValue placeholder="Filtrar por região..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="pl-9 bg-secondary border-border h-11">
                  <SelectValue placeholder="Filtrar por segmento..." />
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

          {/* ─── Verification Filters ────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
            <button
              onClick={() => setKycApproved(!kycApproved)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                kycApproved
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : "bg-secondary text-muted-foreground border-border hover:border-emerald-500/50 hover:text-emerald-400"
              }`}
            >
              <Shield className="w-4 h-4" />
              Identidade Verificada
              {kycApproved && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">✓ Ativo</span>}
            </button>
            <button
              onClick={() => setCoreActive(!coreActive)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                coreActive
                  ? "bg-amber-600 text-white border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                  : "bg-secondary text-muted-foreground border-border hover:border-amber-500/50 hover:text-amber-400"
              }`}
            >
              <Award className="w-4 h-4" />
              CORE Ativo
              {coreActive && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">✓ Ativo</span>}
            </button>
            {/* Availability filter */}
            {(["imediata", "30dias", "60dias", "negociavel"] as const).map((av) => (
              <button
                key={av}
                onClick={() => setAvailability(availability === av ? undefined : av)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                  availability === av
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                }`}
              >
                {av === "imediata" ? "🟢" : av === "30dias" ? "🟡" : av === "60dias" ? "🟠" : "⚪"}
                {av === "imediata" ? "Imediata" : av === "30dias" ? "30 dias" : av === "60dias" ? "60 dias" : "Negociável"}
                {availability === av && <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">✓</span>}
              </button>
            ))}
            {(kycApproved || coreActive || availability) && (
              <button
                onClick={() => { setKycApproved(false); setCoreActive(false); setAvailability(undefined); }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Results ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Count banner */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black">
                  <span className="text-primary">{count.toLocaleString("pt-BR")}</span> representantes disponíveis
                  {region && <span className="text-muted-foreground font-normal text-lg"> em {region}</span>}
                  {segment && <span className="text-muted-foreground font-normal text-lg"> · {segment}</span>}
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Cadastre-se para ver o perfil completo e entrar em contato
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-secondary rounded-lg px-4 py-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Atualizado em tempo real
              </div>
            </div>

            {/* Empty state */}
            {!isLoading && count === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">Nenhum representante encontrado</h3>
                <p className="text-muted-foreground text-sm mb-6">Tente outros filtros de região ou segmento</p>
                <Button variant="outline" onClick={() => { setRegion(""); setSegment(""); }}>Limpar filtros</Button>
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
                    className={`rounded-xl border bg-card p-5 relative overflow-hidden group transition-all ${
                      isPaid
                        ? "border-primary/50 shadow-[0_0_20px_rgba(var(--primary-rgb),0.12)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)]"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    {/* Top badge for paid tiers */}
                    {isPaid && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isPaid ? "bg-primary/30 text-primary" : "bg-secondary text-muted-foreground"
                      }`}>
                        {rep.maskedName.charAt(0)}
                      </div>
                      <Badge className={`text-xs flex items-center gap-1 ${tierCfg.color}`}>
                        {tierCfg.icon}{tierCfg.label}
                      </Badge>
                    </div>

                    <div className="font-bold text-base mb-2">{rep.maskedName}</div>

                    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                        <span>{rep.region}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                        <span>{rep.segment}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
                        <span>{rep.experienceYears} anos de experiência</span>
                      </div>
                    </div>

                    {/* Rating stars */}
                    {(rep as any).averageRating && Number((rep as any).averageRating) > 0 && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${
                              s <= Math.round(Number((rep as any).averageRating))
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{Number((rep as any).averageRating).toFixed(1)}</span>
                      </div>
                    )}

                    {/* Availability + KYC/CORE badges — visible for ALL tiers */}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {isPaid && (
                        <span className="inline-flex items-center gap-1 text-xs bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-2.5 py-0.5">
                          <Clock className="w-3 h-3" />
                          {AVAILABILITY_LABEL[(rep as any).availability ?? "negociavel"] ?? "Negociável"}
                        </span>
                      )}
                      {(rep as any).kycStatus === "approved" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                          <Shield className="w-3 h-3" /> Identidade Verificada
                        </span>
                      )}
                      {(rep as any).coreStatus === "active" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full px-2.5 py-0.5 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                          <Award className="w-3 h-3" /> CORE Ativo
                        </span>
                      )}
                    </div>

                    {/* Blur overlay for contact */}
                    <div className="border-t border-border pt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="blur-sm select-none">+55 (11) 9●●●●-●●●●</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="blur-sm select-none">●●●●●@email.com</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Locked "more" card */}
              {count > previews.length && (
                <div
                  className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/60 hover:bg-primary/10 transition-all"
                  onClick={() => navigate("/register")}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div className="font-bold text-sm mb-1">
                    +{(count - previews.length).toLocaleString("pt-BR")} representantes
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Cadastre-se para ver todos
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground text-xs font-semibold">
                    Desbloquear <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
            )}

            {/* CTA Section - public page */}
            <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
              <h3 className="text-2xl font-black mb-2">
                Pronto para contratar o representante ideal?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                Cadastre sua empresa e tenha acesso completo ao perfil, contato e histórico de todos os {count.toLocaleString("pt-BR")} representantes disponíveis.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground font-bold px-8"
                  onClick={() => navigate("/register")}
                >
                  Cadastrar empresa
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
    </div>
  );
}
