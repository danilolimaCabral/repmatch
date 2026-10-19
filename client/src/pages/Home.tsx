import { useAuth } from "@/_core/hooks/useAuth";
import { LogOut, LayoutDashboard, ChevronDown as ChevronDownSmall } from "lucide-react";
import SEO from "@/components/SEO";
import { lazy, Suspense } from "react";
const ROICalculator = lazy(() => import("@/components/ROICalculator"));
const BrazilMapSection = lazy(() => import("@/components/BrazilMapSection"));
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle, Star, Users, Building2, Zap, TrendingUp,
  Shield, Award, ChevronDown, BarChart3, MessageSquare,
  Target, Sparkles, Clock, MapPin, Briefcase, DollarSign, Lock,
  Search, LockOpen, UserPlus, Eye, FileText, Crown, Gem,
  ThumbsUp, ThumbsDown, Frown, Smile, ChevronRight, Filter, UserCog
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

function maskCompanyName(name: string): string {
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase() + " " + "●".repeat(Math.min(words[0].length - 1, 5));
  return words[0] + " " + words.slice(1).map(() => "●●●").join(" ");
}

function VagasDestaque() {
  const [, navigate] = useLocation();
  const { data } = trpc.jobs.listPublic.useQuery({ page: 1, limit: 3 });
  const jobs = data?.jobs ?? [];
  if (!jobs.length) return null;
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Vagas abertas agora</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Empresas buscando<br />
            <span className="text-gradient-green">representantes hoje</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Crie sua conta gratuita para ver os detalhes e se candidatar. Sem taxa de cadastro.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {jobs.map((job) => (
            <div key={job.id} className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
              <div>
                <h3 className="font-bold text-base leading-snug mb-1">{job.title}</h3>
                {job.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{job.description}</p>
                )}
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {job.region && <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" />{job.region}</div>}
                {job.segment && <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" />{job.segment}</div>}
                {job.commissionPercentage && <div className="flex items-center gap-1.5 text-primary font-semibold"><DollarSign className="w-3.5 h-3.5" />{job.commissionPercentage}% comissão</div>}
              </div>
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-secondary/60 border border-border">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black flex-shrink-0">
                  {job.companyName?.charAt(0) ?? "E"}
                </div>
                <span className="text-xs font-semibold truncate flex-1">{maskCompanyName(job.companyName ?? "Empresa")}</span>
                <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </div>
              <button
                onClick={() => navigate("/register")}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                Candidatar-se <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate("/vagas")}
            className="inline-flex items-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-8 py-3 rounded-xl transition-colors hover:bg-secondary/50"
          >
            Ver todas as vagas abertas <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";
const HERO_BACKGROUND_URL = "/manus-storage/Banner-Moderno_6a9f2769.gif";

// ─── Live Counter Section ────────────────────────────────────────────────────
function LiveCounterSection() {
  const { data: baseStats } = trpc.cnpjBase.stats.useQuery();
  const { data: jobsData } = trpc.jobs.listPublic.useQuery({ page: 1, limit: 1 });
  const totalReps = baseStats?.total ?? 173987;
  const totalJobs = jobsData?.total ?? 0;
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { value: totalReps, suffix: "+", label: "Representantes na base", sublabel: "Base comercial nacional", icon: Users, pulsed: pulse },
    { value: totalJobs, suffix: "", label: "Vagas abertas agora", sublabel: "Atualizado em tempo real", icon: Briefcase, pulsed: !pulse },
    { value: 12, suffix: "", label: "Segmentos cobertos", sublabel: "Do agro ao tech", icon: BarChart3, pulsed: pulse },
    { value: 27, suffix: "", label: "Estados atendidos", sublabel: "Cobertura nacional", icon: MapPin, pulsed: !pulse },
  ];

  return (
    <section className="py-14 border-y border-border" style={{ background: "linear-gradient(180deg, oklch(0.62 0.18 152 / 0.04) 0%, transparent 100%)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest">
            <span className={`w-2 h-2 rounded-full bg-primary transition-opacity duration-1000 ${pulse ? "opacity-100" : "opacity-30"}`}
              style={{ boxShadow: "0 0 6px oklch(0.62 0.18 152 / 0.9)" }} />
            Dados em tempo real
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {stats.map((stat, i) => (
            <div key={i} className="group relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card/60 p-3 text-center sm:p-6">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.62 0.18 152 / 0.08) 0%, transparent 70%)" }} />
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <stat.icon className="w-6 h-6 text-primary" />
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary transition-opacity duration-1000 ${stat.pulsed ? "opacity-100" : "opacity-20"}`}
                    style={{ boxShadow: "0 0 5px oklch(0.62 0.18 152 / 0.9)" }} />
                </div>
              </div>
              <div className="text-3xl font-black text-foreground mb-1 sm:text-4xl" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm font-semibold text-foreground/80 mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Campanhas B2B ───────────────────────────────────────────────────────────
function B2BLeadCampaignSection() {
  const [, navigate] = useLocation();
  const { data: catalog } = trpc.leadPackages.catalog.useQuery();
  const price = catalog?.b2b.price;
  const priceLabel = typeof price === "number"
    ? price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "valor sob consulta";
  const unlimitedPrice = catalog?.unlimitedMonthly?.price ?? 499;

  return (
    <section id="leads-b2b" className="border-t border-border bg-secondary/35 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <Target className="h-3.5 w-3.5" /> Campanhas B2B sob medida
          </div>
          <h2 className="mt-5 text-balance text-3xl font-black leading-tight text-foreground sm:text-5xl" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Encontre empresas para a sua próxima campanha comercial.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Defina segmento, CNAE e região. Escolha um lote de 1.000 ou 2.000 empresas, ou assine pesquisas ilimitadas por 30 dias. Você só recebe acesso após a confirmação do PIX.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Filter, title: "Recorte certo", text: "Setor, região e perfil da empresa" },
              { icon: Building2, title: "Base empresarial", text: "Empresas ativas para trabalhar" },
              { icon: Shield, title: "Entrega assistida", text: "Análise antes da liberação" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button onClick={() => navigate("/pacotes-leads")} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"><p className="text-sm font-black text-foreground">Concessionárias e automotivo</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Empresas para veículos, peças, serviços e novas parcerias comerciais.</p></button>
            <button onClick={() => navigate("/pacotes-leads")} className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-left transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md"><p className="text-sm font-black text-foreground">Imobiliárias e construção</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Empresas para imóveis, construtoras, fornecedores e parcerias regionais.</p></button>
          </div>

          <button
            onClick={() => navigate("/pacotes-leads")}
            className="group mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl sm:w-auto"
          >
            Montar campanha B2B <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button onClick={() => navigate("/contatos-b2c")} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-6 py-3 text-sm font-bold text-indigo-800 transition hover:bg-indigo-100 sm:ml-3 sm:w-auto">
            Contatos B2C PF · 50, 100 ou ilimitado <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <aside className="overflow-hidden rounded-3xl border border-emerald-800 bg-emerald-950 p-5 text-white shadow-2xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Pacote de prospecção B2B</p>
          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-black sm:text-6xl">1k ou 2k</p>
              <p className="mt-1 text-sm text-emerald-100">empresas por campanha</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3"><Building2 className="h-7 w-7 text-emerald-300" /></div>
          </div>
          <div className="mt-7 space-y-3 border-y border-white/15 py-5 text-sm text-emerald-50">
            <div className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />CNPJ, razão social, setor e localização</div>
            <div className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Canais empresariais quando disponíveis na fonte</div>
            <div className="flex gap-2"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Briefing de segmento e região incluído no pedido</div>
          </div>
          <div className="mt-5 rounded-2xl bg-white/10 p-4">
            <p className="text-xs text-emerald-100">Investimento do pacote</p>
            <p className="mt-1 text-3xl font-black">{priceLabel}</p>
            <p className="mt-1 text-xs leading-relaxed text-emerald-100">Pagamento via PIX. Pedido analisado antes da entrega.</p>
          </div>
          <button onClick={() => navigate("/pacotes-leads")} className="mt-5 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-50">
            Configurar meu público B2B <ArrowRight className="h-4 w-4" />
          </button>
          <button onClick={() => navigate("/pacotes-leads")} className="mt-3 inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-emerald-400/20">
            Pesquisa ilimitada · {unlimitedPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </section>
  );
}

function MonthlyPlansOverview() {
  const [, navigate] = useLocation();
  const { data: b2bCatalog } = trpc.leadPackages.catalog.useQuery();
  const { data: b2cCatalog } = trpc.consumerLeadPackages.catalog.useQuery();
  const b2bPlans = b2bCatalog?.monthlyPlans ?? [
    { label: "Essencial", selectionLimit: 100, price: 99 },
    { label: "Profissional", selectionLimit: 250, price: 299 },
    { label: "Ilimitado", selectionLimit: 0, price: b2bCatalog?.unlimitedMonthly?.price ?? 499 },
  ];
  const b2cPlans = (b2cCatalog?.monthlyPlans ?? [
    { name: "Essencial", selectionLimit: 100, price: 99 },
    { name: "Profissional", selectionLimit: 250, price: 299 },
    { name: "Escala", selectionLimit: 500, price: 499 },
  ]).map((plan) => ({ label: plan.name, selectionLimit: plan.selectionLimit, price: plan.price }));
  const columns = [
    { title: "Empresas B2B", subtitle: "Para prospecção comercial", icon: Building2, color: "emerald" as const, plans: b2bPlans, description: (plan: { selectionLimit: number }) => plan.selectionLimit ? `Até ${plan.selectionLimit} empresas salvas` : "Pesquisa e exportação sem limite", cta: () => navigate("/pacotes-leads") },
    { title: "Contatos B2C", subtitle: "Para imobiliário, automotivo e digital", icon: Users, color: "indigo" as const, plans: b2cPlans, description: (plan: { selectionLimit: number }) => `Até ${plan.selectionLimit} contatos salvos`, cta: () => navigate("/contatos-b2c") },
    { title: "Representantes", subtitle: "Para montar seu time comercial", icon: Target, color: "violet" as const, plans: [{ label: "Essencial", selectionLimit: 20, price: 99 }, { label: "Profissional", selectionLimit: 50, price: 299 }, { label: "Escala", selectionLimit: 100, price: 499 }], description: (plan: { selectionLimit: number }) => `Até ${plan.selectionLimit} desbloqueios`, cta: () => navigate("/register?purchase=representatives&returnTo=/dashboard/company") },
  ];
  const palette = {
    emerald: { label: "text-emerald-700", card: "border-emerald-200 bg-emerald-50/45", button: "bg-emerald-600 hover:bg-emerald-700", price: "text-emerald-800" },
    indigo: { label: "text-indigo-700", card: "border-indigo-200 bg-indigo-50/45", button: "bg-indigo-600 hover:bg-indigo-700", price: "text-indigo-800" },
    violet: { label: "text-violet-700", card: "border-violet-200 bg-violet-50/45", button: "bg-violet-700 hover:bg-violet-800", price: "text-violet-800" },
  };
  return <section className="border-t border-border bg-card px-4 py-16 sm:px-6 sm:py-24"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-3xl text-center"><Badge className="border-primary/20 bg-primary/10 text-primary">Planos mensais</Badge><h2 className="mt-5 text-3xl font-black tracking-tight text-foreground sm:text-5xl" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>Escolha o plano certo para o ritmo do seu time.</h2><p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">Comece pequeno, aumente quando precisar. Cada card leva você ao checkout seguro por PIX ou cartão.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3">{columns.map((column) => { const Icon = column.icon; const theme = palette[column.color]; return <article key={column.title} className={`rounded-3xl border p-5 shadow-sm sm:p-6 ${theme.card}`}><div className="inline-flex rounded-xl bg-white p-2.5"><Icon className={`h-5 w-5 ${theme.label}`} /></div><h3 className="mt-4 text-2xl font-black text-foreground">{column.title}</h3><p className="mt-1 text-sm text-muted-foreground">{column.subtitle}</p><div className="mt-5 grid gap-3">{column.plans.map((plan) => <div key={plan.selectionLimit} className="rounded-2xl border border-white/80 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-foreground">{plan.label}</p><p className="mt-1 text-xs text-muted-foreground">{column.description(plan)}</p></div><p className={`text-xl font-black ${theme.price}`}>{plan.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<span className="text-xs font-semibold text-muted-foreground">/mês</span></p></div></div>)}</div><button onClick={column.cta} className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white transition ${theme.button}`}>Ver planos e ir para checkout <ArrowRight className="h-4 w-4" /></button></article>; })}</div></div></section>;
}

// ─── Match Simulator ─────────────────────────────────────────────────────────
function MatchSimulator() {
  const [region, setRegion] = useState("");
  const [segment, setSegment] = useState("");
  const [searched, setSearched] = useState(false);
  const [, navigate] = useLocation();
  const { data, isFetching } = trpc.representatives.preview.useQuery(
    { region, segment },
    { enabled: searched }
  );
  // Exact region names from the database
  const regions = [
    "Paraná", "Rio de Janeiro", "Distrito Federal", "Ceará",
    "São Paulo - Interior", "Pernambuco", "São Paulo - Capital",
    "Bahia", "Nacional (Todo Brasil)", "Goiás", "Rio Grande do Sul",
    "Santa Catarina", "Minas Gerais",
  ];
  const segments = [
    "Automotivo", "Tecnologia", "Eletroeletrônicos", "Agronegócio",
    "Construção Civil", "Farmacêutico", "Alimentos e Bebidas",
    "Móveis e Decoração", "Têxtil e Moda", "Saúde e Médico",
    "Cosméticos e Higiene", "Outros",
  ];
  return (
    <section className="py-24 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Simulador de Match</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Quantos representantes<br />
            <span className="text-gradient-green">existem para a sua vaga?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Selecione a região e o segmento e veja quantos representantes qualificados estão disponíveis agora.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-8">
          {/* Filters */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Região
              </label>
              <select
                value={region}
                onChange={e => { setRegion(e.target.value); setSearched(false); }}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todas as regiões</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
                <Briefcase className="w-3.5 h-3.5 inline mr-1.5 text-primary" />Segmento
              </label>
              <select
                value={segment}
                onChange={e => { setSegment(e.target.value); setSearched(false); }}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todos os segmentos</option>
                {segments.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => setSearched(true)}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl text-base transition-colors"
          >
            <Search className="w-5 h-5" />
            Ver representantes disponíveis agora
          </button>

          {/* Results */}
          {searched && (
            <div className="mt-8 border-t border-border pt-8">
              {isFetching ? (
                <div className="grid sm:grid-cols-3 gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-xl border border-border bg-secondary/30 p-4 animate-pulse">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-secondary" />
                        <div className="flex-1">
                          <div className="h-3 bg-secondary rounded w-3/4 mb-2" />
                          <div className="h-2 bg-secondary rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-2 bg-secondary rounded w-full mb-2" />
                      <div className="h-2 bg-secondary rounded w-2/3" />
                    </div>
                  ))}
                </div>
              ) : data ? (
                <div>
                  {/* Big number */}
                  <div className="text-center mb-8">
                    <div className="text-5xl font-black text-primary mb-2 sm:text-7xl" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                      {data.count.toLocaleString("pt-BR")}
                    </div>
                    <div className="text-muted-foreground text-base">
                      representantes{" "}
                      {region || segment
                        ? <><span className="text-foreground font-semibold">{[region, segment].filter(Boolean).join(" · ")}</span></>
                        : "na base do RepMatch"}
                    </div>
                    {data.count > 0 && (
                      <div className="inline-flex items-center gap-1.5 mt-3 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Zap className="w-3.5 h-3.5" />
                        Disponíveis para contato agora
                      </div>
                    )}
                  </div>

                  {/* Preview cards */}
                  {data.previews.length > 0 && (
                    <div className="grid sm:grid-cols-3 gap-3 mb-6">
                      {data.previews.slice(0, 3).map((rep, i) => (
                        <div key={i} className="rounded-xl border border-border bg-secondary/40 p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm flex-shrink-0">
                              {rep.maskedName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{rep.maskedName}</div>
                              <div className="text-xs text-muted-foreground truncate">{rep.region}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1.5 mb-3">
                            {rep.segment && (
                              <div className="flex items-center gap-1.5">
                                <Briefcase className="w-3 h-3 text-primary" />{rep.segment}
                              </div>
                            )}
                            {rep.experienceYears && (
                              <div className="flex items-center gap-1.5">
                                <Award className="w-3 h-3 text-primary" />{rep.experienceYears} anos de experiência
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 bg-secondary/60 rounded-lg px-2.5 py-1.5">
                            <Lock className="w-3 h-3" />
                            <span className="blur-sm select-none">+55 (41) 9●●●●●-●●●●</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => navigate("/register")}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-xl text-sm transition-colors"
                  >
                    Cadastrar e ver todos os {data.count.toLocaleString("pt-BR")} representantes
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Antes x Depois ──────────────────────────────────────────────────────────
function AntesDepois() {
  const [, navigate] = useLocation();

  const before_items = [
    { icon: "✕", text: "Semanas postando em grupos de WhatsApp sem retorno" },
    { icon: "✕", text: "Candidatos sem qualificação, sem histórico, sem compromisso" },
    { icon: "✕", text: "R$3.000–R$8.000 pagos a headhunter por contratação" },
    { icon: "✕", text: "Sem filtro por região ou segmento — tudo manual" },
    { icon: "✕", text: "Contato perdido após a primeira conversa" },
  ];

  const after_items = [
    { text: "Representantes qualificados em menos de 48 horas" },
    { text: "Score de compatibilidade por região, segmento e experiência" },
    { text: "Desbloqueio de contato por R$ 9,90 — sem mensalidade" },
    { text: "Filtros automáticos — você vê apenas quem faz sentido" },
    { text: "Chat integrado e histórico de candidaturas na plataforma" },
  ];

  return (
    <section className="py-24 px-6 border-y border-border bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Antes x Depois</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Como era antes.<br />
            <span className="text-gradient-green">Como é agora.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            O mercado de representação comercial não mudou em 20 anos. O RepMatch mudou.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {/* ANTES */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <Frown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-red-400">Antes do RepMatch</h3>
                <p className="text-xs text-muted-foreground">Processo manual, caro e lento</p>
              </div>
            </div>
            <ul className="space-y-4">
              {before_items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-red-400 text-xs font-black">{item.icon}</span>
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-red-500/15">
              <div className="text-xs text-red-400/70 font-semibold uppercase tracking-widest">Custo médio por contratação</div>
              <div className="text-2xl font-black text-red-400 mt-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>R$3.000–R$8.000</div>
            </div>
          </div>

          {/* DEPOIS */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-7 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Smile className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-base text-primary">Com o RepMatch</h3>
                <p className="text-xs text-muted-foreground">Rápido, filtrado e acessível</p>
              </div>
            </div>
            <ul className="space-y-4 relative">
              {after_items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-foreground/80 leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-primary/20 relative">
              <div className="text-xs text-primary/70 font-semibold uppercase tracking-widest">Custo médio por contratação</div>
              <div className="text-2xl font-black text-primary mt-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>R$ 9,90 por contato</div>
            </div>
          </div>
        </div>

        {/* VS divider callout */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <div className="flex-1 h-px bg-border" />
          <div className="text-center">
            <div className="text-4xl font-black text-foreground/20" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>VS</div>
          </div>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate("/register")}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-10 py-4 rounded-xl text-base transition-colors shadow-lg"
          >
            Quero o depois <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-muted-foreground mt-3">Sem contrato de fidelidade · Cancele quando quiser</p>
        </div>
      </div>
    </section>
  );
}

function AnimatedCounter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString("pt-BR")}{suffix}</span>;
}

function ThemeToggleButton() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  return (
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-border bg-background/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: repProfile } = trpc.representatives.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: companyProfile } = trpc.companies.myProfile.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = (type: "company" | "rep" | "manager") => {
    if (isAuthenticated) {
      if (companyProfile) navigate("/dashboard/company");
      else if (repProfile) navigate("/dashboard/rep");
      else navigate("/onboarding");
    } else {
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Representantes Comerciais e Campanhas de Leads B2B | RepMatch"
        description="Encontre representantes comerciais ou monte uma campanha B2B segmentada por setor, CNAE e região. Base nacional e pacote de 2.000 empresas para prospecção."
        canonical="/"
        keywords="contratar representante comercial, leads B2B, lista de empresas, campanha B2B, prospecção B2B, pacote de leads, representantes comerciais, vagas representante comercial, buscar representante, representação comercial"
      />

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${scrolled ? "border-emerald-950/20 bg-emerald-950/95 shadow-[0_12px_36px_rgba(3,22,15,0.25)] backdrop-blur-xl" : "border-white/10 bg-emerald-950/35 backdrop-blur-sm"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:h-[72px] sm:px-6">
          <img src={LOGO_URL} alt="RepMatch" className="h-8 shrink-0 object-contain drop-shadow-[0_2px_14px_rgba(255,255,255,0.18)] sm:h-9" />
          <nav className="hidden items-center gap-7 text-sm text-emerald-50/75 md:flex">
            <a href="#como-funciona" className="transition-colors hover:text-white">Como funciona</a>
            <a href="/vagas" className="font-medium transition-colors hover:text-white">Vagas</a>
            <a href="/buscar" className="font-medium transition-colors hover:text-white">Buscar Reps</a>
            <a href="/oportunidades-reps" className="font-medium transition-colors hover:text-white">Reps Disponíveis</a>
            <a href="/pacotes-leads" className="font-medium transition-colors hover:text-white">Leads B2B/B2C</a>
            <a href="/parcerias" className="font-semibold text-emerald-300 transition-colors hover:text-white">Parcerias</a>
            <a href="/blog" className="font-medium transition-colors hover:text-white">Blog</a>
            <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
          </nav>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden sm:block"><ThemeToggleButton /></div>
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {user?.role === "admin" && (
                  <a
                    href="/admin"
                    aria-label="Abrir Painel Admin"
                    title="Painel Admin"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white transition-colors hover:bg-red-700 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-4 sm:py-2"
                  >
                    <Lock className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Painel Admin</span>
                  </a>
                )}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    aria-label="Abrir menu da conta"
                    aria-expanded={userMenuOpen}
                    className="flex h-10 w-10 items-center justify-center gap-1 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:h-auto sm:w-auto sm:gap-2 sm:px-5 sm:py-2.5"
                  >
                    <UserCog className="h-4 w-4 sm:hidden" aria-hidden="true" />
                    <span className="hidden sm:inline">Olá, {user?.name?.split(" ")[0]}</span>
                    <ChevronDownSmall className="h-4 w-4" />
                  </button>
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          if (companyProfile) navigate("/dashboard/company");
                          else if (repProfile) navigate("/dashboard/rep");
                          else navigate("/onboarding");
                        }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Meu Painel
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); navigate("/"); }}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <a href="/login" className="hidden text-sm text-emerald-50/80 transition-colors hover:text-white sm:block">Entrar</a>
                <a href="/register" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_rgba(22,163,74,0.32)] transition-all hover:-translate-y-0.5 hover:bg-primary/90">
                  Cadastrar agora
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="impact-hero relative isolate min-h-[760px] overflow-hidden bg-emerald-950 px-4 pb-16 pt-32 text-white sm:px-6 lg:min-h-[780px] lg:pb-20 lg:pt-36">
        <img
          src={HERO_BACKGROUND_URL}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60 sm:opacity-80"
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,rgba(3,31,19,0.97)_0%,rgba(3,31,19,0.92)_42%,rgba(3,31,19,0.55)_72%,rgba(3,31,19,0.86)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <div className="impact-hero__orb impact-hero__orb--one" aria-hidden="true" />
        <div className="impact-hero__orb impact-hero__orb--two" aria-hidden="true" />
        <div className="impact-hero__beam" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_.72fr] lg:gap-20">
          <div className="max-w-3xl">
            <div className="impact-hero__reveal inline-flex items-center gap-2 border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100 sm:text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.95)]" />
              Vendas em movimento, sem perder o controle
            </div>

            <h1 className="impact-hero__reveal mt-9 max-w-3xl text-pretty font-black leading-[0.9] tracking-[-0.055em] text-white [font-family:'Bricolage_Grotesque',system-ui,sans-serif] text-5xl sm:text-6xl lg:text-[5.3rem]">
              A conversa certa pode mudar <span className="text-emerald-300">o ritmo das suas vendas.</span>
            </h1>

            <p className="impact-hero__reveal mt-7 max-w-2xl text-pretty text-base leading-relaxed text-emerald-50/75 sm:text-lg">
              Encontre representantes por região e segmento ou crie uma lista empresarial para prospectar. Tudo organizado para o seu time começar a agir.
            </p>

            <div className="impact-hero__reveal mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => handleCTA("company")}
                className="group inline-flex min-h-14 items-center justify-center gap-3 bg-primary px-6 py-4 text-sm font-extrabold text-primary-foreground shadow-[0_16px_36px_rgba(22,163,74,0.3)] transition-all hover:-translate-y-1 hover:bg-emerald-400 hover:shadow-[0_22px_46px_rgba(22,163,74,0.38)]"
              >
                <Building2 className="h-5 w-5" />
                Encontrar representantes
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate("/pacotes-leads")}
                className="group inline-flex min-h-14 items-center justify-center gap-3 border border-emerald-100/35 bg-white/8 px-6 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-200/70 hover:bg-white/14"
              >
                <Target className="h-5 w-5 text-emerald-300" />
                Montar lista B2B
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            <div className="impact-hero__reveal mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-emerald-50/70 sm:text-sm">
              {["Sem taxa de contratação", "R$ 9,90 por contato", "Dados organizados para o CRM"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <aside className="impact-hero__panel relative overflow-hidden border border-white/15 bg-white/[0.09] p-5 shadow-[0_28px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-7">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200/90 to-transparent" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Escolha seu próximo passo</p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-white [font-family:'Bricolage_Grotesque',system-ui,sans-serif]">Uma plataforma. Três caminhos de crescimento.</h2>
              </div>
              <div className="grid h-11 w-11 shrink-0 place-items-center border border-emerald-200/25 bg-emerald-300/10 text-emerald-200">
                <Zap className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-7 space-y-3">
              <button onClick={() => handleCTA("company")} className="group flex w-full items-center gap-4 border border-white/10 bg-black/10 p-4 text-left transition hover:border-emerald-200/45 hover:bg-white/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-emerald-300/15 text-emerald-200"><Building2 className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><p className="font-bold text-white">Contratar representantes</p><p className="mt-0.5 text-xs leading-relaxed text-emerald-50/65">Filtre por perfil, região e segmento.</p></div>
                <ArrowRight className="h-4 w-4 text-emerald-200 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => navigate("/pacotes-leads")} className="group flex w-full items-center gap-4 border border-white/10 bg-black/10 p-4 text-left transition hover:border-emerald-200/45 hover:bg-white/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-emerald-300/15 text-emerald-200"><Search className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><p className="font-bold text-white">Prospectar empresas</p><p className="mt-0.5 text-xs leading-relaxed text-emerald-50/65">Monte uma lista B2B para seu time.</p></div>
                <ArrowRight className="h-4 w-4 text-emerald-200 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={() => handleCTA("rep")} className="group flex w-full items-center gap-4 border border-white/10 bg-black/10 p-4 text-left transition hover:border-emerald-200/45 hover:bg-white/10">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-emerald-300/15 text-emerald-200"><Users className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1"><p className="font-bold text-white">Encontrar novas oportunidades</p><p className="mt-0.5 text-xs leading-relaxed text-emerald-50/65">Crie seu perfil e apareça para empresas.</p></div>
                <ArrowRight className="h-4 w-4 text-emerald-200 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </aside>
        </div>

        <a href="#leads-b2b" className="impact-hero__scroll absolute bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-100/55 transition hover:text-emerald-100">
          Conheça a plataforma <ChevronDown className="h-4 w-4" />
        </a>
      </section>

      {/* ─── Contador ao Vivo ─────────────────────────────────────────────────────── */}
      <LiveCounterSection />

      {/* ─── Campanhas B2B ────────────────────────────────────────────────────────── */}
      <B2BLeadCampaignSection />

      {/* ─── Planos mensais ───────────────────────────────────────────────────────── */}
      <MonthlyPlansOverview />

      {/* ─── Selos de Segurança e Certificações ─────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-2">Plataforma segura e confiável</p>
            <h2 className="text-2xl font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
              Plataforma segura, dados protegidos
            </h2>
          </div>
          {/* Grid de selos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {/* SSL */}
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-sm">SSL 256-bit</p>
                <p className="text-xs text-muted-foreground mt-0.5">Conexão criptografada</p>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">✔ Ativo</span>
            </div>
            {/* LGPD */}
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-sm">LGPD Compliant</p>
                <p className="text-xs text-muted-foreground mt-0.5">Lei 13.709/2018</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full">✔ Conformidade</span>
            </div>
            {/* KYC */}
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-sm">KYC Verificado</p>
                <p className="text-xs text-muted-foreground mt-0.5">Identidade confirmada</p>
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-full">✔ Face Match IA</span>
            </div>
            {/* Dados Seguros */}
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground text-sm">Dados Protegidos</p>
                <p className="text-xs text-muted-foreground mt-0.5">Armazenamento seguro</p>
              </div>
              <span className="text-xs font-semibold text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full">✔ Criptografado</span>
            </div>
          </div>
          {/* Barra de destaques de segurança */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Verificação de Identidade com IA</p>
                <p className="text-xs text-muted-foreground mt-0.5">A verificação de identidade usa análise de documentos e selfie como etapa adicional de segurança.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Validação de CNPJ e CORE</p>
                <p className="text-xs text-muted-foreground mt-0.5">Verificamos o CNPJ na Receita Federal via BrasilAPI e o registro CORE (Conselho Regional dos Representantes Comerciais).</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Direito ao Esquecimento (LGPD)</p>
                <p className="text-xs text-muted-foreground mt-0.5">Você pode solicitar a exclusão completa dos seus dados a qualquer momento, conforme a Lei Geral de Proteção de Dados.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────────────────── */}      <section className="py-20 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { value: 173987, suffix: "+", label: "Representantes na base", icon: Users },
              { value: 27, suffix: "", label: "Estados cobertos", icon: Building2 },
              { value: 12, suffix: "", label: "Segmentos de atuação", icon: Target },
              { value: 48, suffix: "h", label: "Tempo médio para conexão", icon: Clock },
            ].map(({ value, suffix, label, icon: Icon }) => (
              <div key={label} className="text-center group">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors mx-auto">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-foreground mb-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                  <AnimatedCounter end={value} suffix={suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Como funciona ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-28 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Como funciona</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
              Do cadastro ao match<br />
              <span className="text-gradient-green">em menos de 48 horas.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Dois caminhos, um destaque: o match certo entre empresa e representante.
            </p>
          </div>

          {/* Fluxo visual simplificado */}
          <div className="relative">
            {/* Duas colunas que convergem */}
            <div className="grid md:grid-cols-2 gap-6 mb-0">

              {/* Coluna Empresa */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground text-base">Empresa</span>
                </div>
                {[
                  { icon: UserPlus, label: "Cria conta e escolhe plano" },
                  { icon: FileText, label: "Publica vaga com região e comissão" },
                  { icon: Search, label: "Busca representantes por filtro" },
                  { icon: LockOpen, label: "Desbloqueia contato por R$ 9,90" },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{label}</span>
                    {i < 3 && (
                      <div className="ml-auto w-px h-6 bg-primary/20 hidden md:block" />
                    )}
                  </div>
                ))}
                {/* Seta para baixo apontando para o match */}
                <div className="flex justify-center pt-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-8 bg-gradient-to-b from-primary/40 to-primary" />
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
                  </div>
                </div>
              </div>

              {/* Coluna Representante */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-foreground" />
                  </div>
                  <span className="font-bold text-foreground text-base">Representante</span>
                </div>
                {[
                  { icon: UserPlus, label: "Cria conta e monta perfil completo" },
                  { icon: Eye, label: "Vê vagas abertas (empresa mascarada)" },
                  { icon: Zap, label: "Candidate-se com 1 clique" },
                  { icon: TrendingUp, label: "Sobe de plano para acessar mais vagas" },
                ].map(({ icon: Icon, label }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{label}</span>
                  </div>
                ))}
                {/* Seta para baixo apontando para o match */}
                <div className="flex justify-center pt-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-px h-8 bg-gradient-to-b from-border to-primary" />
                    <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-primary" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco de Match central */}
            <div className="relative mt-0 flex justify-center">
              <div className="w-full max-w-lg bg-primary/10 border-2 border-primary/40 rounded-2xl p-6 text-center relative overflow-hidden">
                {/* Brilho de fundo */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
                    <Target className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <div className="text-2xl font-black text-foreground mb-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                    🎯 MATCH!
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Score calculado: região + segmento + experiência + análise de perfil
                  </p>
                  <div className="flex flex-col items-center justify-center gap-3 text-xs sm:flex-row sm:gap-6">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Chat direto</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Award className="w-3.5 h-3.5 text-primary" />
                      <span>Score de compatibilidade</span>
                    </div>
                    <div className="w-px h-4 bg-border" />
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      <span>Contato seguro</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-background border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Por que o RepMatch</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
              Feito para quem<br />
              <span className="text-gradient-green">leva vendas a sério.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Target, title: "Match por perfil real", desc: "Cruzamos região, segmento, experiência e histórico. Você vê apenas candidatos que fazem sentido para a sua vaga.", highlight: true },
              { icon: Award, title: "Ranking de Empresas", desc: "Empresas classificadas em Bronze, Silver, Gold e Platinum com base em histórico, avaliações e comissão oferecida.", highlight: false },
              { icon: Shield, title: "Acesso por plano", desc: "Representantes Free acessam vagas Bronze e Silver. Premium acessa Gold. Elite acessa Platinum.", highlight: false },
              { icon: MessageSquare, title: "Chat dentro da plataforma", desc: "Negocie direto com o candidato sem sair do RepMatch. Contatos só revelados quando ambas as partes concordam.", highlight: false },
              { icon: BarChart3, title: "Painel de controle", desc: "Dashboard separado para empresas e representantes com histórico de candidaturas, vagas e performance.", highlight: false },
              { icon: TrendingUp, title: "Cobertura nacional", desc: "Base comercial organizada por região, segmento e experiência para tornar a prospecção mais objetiva.", highlight: false },
            ].map(({ icon: Icon, title, desc, highlight }) => (
              <div
                key={title}
                className={`relative rounded-2xl p-6 border transition-all duration-200 hover:-translate-y-1 cursor-default ${
                  highlight
                    ? "bg-primary/8 border-primary/30 hover:border-primary/50"
                    : "bg-card border-border hover:border-border/80 hover:bg-card/80"
                }`}
              >
                {highlight && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-full">Destaque</span>
                  </div>
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${highlight ? "bg-primary/15" : "bg-secondary"}`}>
                  <Icon className={`w-5 h-5 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <h3 className="font-bold text-foreground text-base mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Comparativo</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                Por que não usar o que<br />
                <span className="text-gradient-green">todo mundo já usa?</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-xl mx-auto">Porque o que todo mundo usa não foi feito para isso. O RepMatch foi.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border" aria-label="Tabela comparativa rolável horizontalmente">
              <p className="border-b border-border px-4 py-2 text-center text-xs text-muted-foreground sm:hidden">Deslize para o lado para comparar as opções</p>
              <table className="min-w-[600px] w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-5 text-muted-foreground font-semibold w-1/4">Critério</th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-primary font-bold text-base">RepMatch</span>
                        <span className="text-xs text-primary/60 font-normal">Especializado</span>
                      </div>
                    </th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-muted-foreground font-semibold">LinkedIn</span>
                        <span className="text-xs text-muted-foreground/60 font-normal">Rede social</span>
                      </div>
                    </th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-muted-foreground font-semibold">WhatsApp</span>
                        <span className="text-xs text-muted-foreground/60 font-normal">Grupos</span>
                      </div>
                    </th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-muted-foreground font-semibold">Headhunter</span>
                        <span className="text-xs text-muted-foreground/60 font-normal">Agência</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { criteria: "Foco em representantes comerciais", rm: true, li: false, wa: false, hh: true },
                    { criteria: "Filtro por região e segmento", rm: true, li: false, wa: false, hh: true },
                    { criteria: "Score de compatibilidade", rm: true, li: false, wa: false, hh: false },
                    { criteria: "Sem taxa de contratação", rm: true, li: true, wa: true, hh: false },
                    { criteria: "Histórico e avaliações", rm: true, li: false, wa: false, hh: false },
                    { criteria: "Chat integrado", rm: true, li: true, wa: true, hh: false },
                    { criteria: "Custo acessível", rm: true, li: false, wa: true, hh: false },
                  ].map(({ criteria, rm, li, wa, hh }) => {
                    const Check = () => <CheckCircle className="w-5 h-5 text-primary mx-auto" />;
                    const X = () => <span className="text-muted-foreground/30 font-bold text-lg mx-auto block text-center">—</span>;
                    return (
                      <tr key={criteria} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                        <td className="p-5 text-muted-foreground font-medium">{criteria}</td>
                        <td className="p-5 bg-primary/5"><div className="flex justify-center">{rm ? <Check /> : <X />}</div></td>
                        <td className="p-5"><div className="flex justify-center">{li ? <Check /> : <X />}</div></td>
                        <td className="p-5"><div className="flex justify-center">{wa ? <Check /> : <X />}</div></td>
                        <td className="p-5"><div className="flex justify-center">{hh ? <Check /> : <X />}</div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Simulador de Match ─────────────────────────────────────────────── */}
      <MatchSimulator />

      {/* ─── Antes x Depois ─────────────────────────────────────────────────── */}
      <AntesDepois />

      {/* ─── Calculadora de ROI ───────────────────────────────────────── */}
      <Suspense fallback={<div className="py-16 bg-background" />}><ROICalculator /></Suspense>

      {/* ─── Mapa do Brasil ───────────────────────────────────────────────────────────────────────────────────── */}
      <Suspense fallback={<div className="py-16 bg-background" />}><BrazilMapSection /></Suspense>

      {/* ─── Vagas em Destaque ─────────────────────────────────────────── */}
      <VagasDestaque />


      {/* ─── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-28 px-6 relative overflow-hidden bg-background">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px]" style={{ background: "oklch(0.62 0.18 152 / 0.06)" }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-2 text-center bg-primary/10 border border-primary/25 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            Comece hoje mesmo
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Pare de garimpar representante<br />
            <span className="text-gradient-green">em grupo de WhatsApp.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Pesquise representantes por região e segmento. Desbloqueie apenas os contatos que interessam à sua empresa, a partir de R$ 9,90.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => handleCTA("company")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-9 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Building2 className="w-5 h-5" />
              Sou Empresa
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTA("manager")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-card hover:bg-secondary border border-border hover:border-primary/30 text-foreground font-semibold text-base px-9 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 shadow-sm"
            >
              <UserCog className="w-5 h-5 text-muted-foreground" />
              Sou Gerente
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTA("rep")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 text-foreground font-semibold text-base px-9 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Users className="w-5 h-5" />
              Sou Representante
            </button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 border-t border-border bg-card">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">FAQ</Badge>
            <h2 className="text-4xl font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>Perguntas frequentes</h2>
          </div>

          <div className="space-y-2">
            {[
              { q: "Como funciona o match do RepMatch?", a: "Cruzamos critérios objetivos: região de atuação, segmento, anos de experiência e status ativo. O resultado é um score de compatibilidade que mostra, de forma clara, quais representantes têm o perfil mais alinhado com a sua vaga." },
              { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim. Não há fidelidade ou multa. Você cancela quando quiser diretamente pelo painel, e o acesso permanece até o fim do período pago." },
              { q: "O que é o ranking Bronze, Silver, Gold e Platinum?", a: "É a classificação das empresas dentro da plataforma, baseada em histórico de vagas publicadas, avaliações dos representantes, taxa de resposta e comissão oferecida. Empresas bem ranqueadas atraem representantes mais qualificados e experientes." },
              { q: "Representantes precisam pagar para usar a plataforma?", a: "Não! O cadastro e uso da plataforma é totalmente gratuito para representantes. Você cria seu perfil, aparece nas buscas das empresas e recebe propostas sem pagar nada." },
              { q: "Quanto custa para empresas?", a: "O cadastro é gratuito. Quando quiser ver o contato completo de um representante (telefone, e-mail, LinkedIn), você paga R$ 9,90 por representante — uma única vez, sem mensalidade ou recorrência." },
              { q: "Como funciona o desbloqueio de contato (R$ 9,90)?", a: "Os contatos dos representantes ficam ocultos para proteger a privacidade. A empresa adiciona os perfis ao carrinho, paga R$ 9,90 por representante via PIX e a liberação é feita pelo administrador após a confirmação do pagamento." },
              { q: "Posso importar minha base de clientes/representantes?", a: "Sim. O painel Admin permite importação em massa via planilha Excel. A plataforma valida CNPJs automaticamente via BrasilAPI e normaliza todos os telefones durante a importação." },
            ].map(({ q, a }, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/50 transition-colors"
                >
                  <span className="font-semibold text-foreground pr-4 text-sm md:text-base">{q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-12 px-6 bg-card">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
              <span className="text-muted-foreground/60 text-sm">Conectando empresas e representantes. Gerando resultados.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground/60">
              <a href="/termos" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="/privacidade" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="https://wa.me/5541999499815" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/40">
            <span>© 2026 RepMatch. Todos os direitos reservados.</span>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-green-500/60" />
              <span>Dados protegidos conforme a LGPD (Lei 13.709/2018)</span>
            </div>
          </div>
          <div className="pt-4 text-center text-xs text-muted-foreground/30">
            Criado por{" "}
            <a href="https://techdc.com.br" target="_blank" rel="noopener noreferrer" className="text-primary/50 hover:text-primary transition-colors font-semibold">
              TechDC.com.br
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
