import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle, Star, Users, Building2, Zap, TrendingUp,
  Shield, Award, ChevronDown, BarChart3, MessageSquare,
  Target, Sparkles, Clock, MapPin, Briefcase, DollarSign, Lock,
  Search, LockOpen, UserPlus, Eye, FileText, Crown, Gem,
  ThumbsUp, ThumbsDown, Frown, Smile, ChevronRight, Filter
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

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

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";

// ─── Live Counter Section ────────────────────────────────────────────────────
function LiveCounterSection() {
  const { data } = trpc.representatives.preview.useQuery({ region: "", segment: "" });
  const { data: jobsData } = trpc.jobs.listPublic.useQuery({ page: 1, limit: 1 });
  const totalReps = data?.count ?? 9677;
  const totalJobs = jobsData?.total ?? 0;
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2000);
    return () => clearInterval(t);
  }, []);

  const stats = [
    { value: totalReps, suffix: "+", label: "Representantes cadastrados", sublabel: "Base verificada e ativa", icon: Users, pulsed: pulse },
    { value: totalJobs, suffix: "", label: "Vagas abertas agora", sublabel: "Atualizado em tempo real", icon: Briefcase, pulsed: !pulse },
    { value: 12, suffix: "", label: "Segmentos cobertos", sublabel: "Do agro ao tech", icon: BarChart3, pulsed: pulse },
    { value: 13, suffix: "", label: "Estados atendidos", sublabel: "Cobertura nacional", icon: MapPin, pulsed: !pulse },
  ];

  return (
    <section className="py-14 border-y border-border" style={{ background: "linear-gradient(180deg, oklch(0.14 0.01 152 / 0.5) 0%, transparent 100%)" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-widest">
            <span className={`w-2 h-2 rounded-full bg-primary transition-opacity duration-1000 ${pulse ? "opacity-100" : "opacity-30"}`}
              style={{ boxShadow: "0 0 6px oklch(0.62 0.18 152 / 0.9)" }} />
            Dados em tempo real
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div key={i} className="relative rounded-2xl border border-border bg-card/60 p-6 text-center overflow-hidden group">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(ellipse at 50% 0%, oklch(0.62 0.18 152 / 0.08) 0%, transparent 70%)" }} />
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <stat.icon className="w-6 h-6 text-primary" />
                  <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary transition-opacity duration-1000 ${stat.pulsed ? "opacity-100" : "opacity-20"}`}
                    style={{ boxShadow: "0 0 5px oklch(0.62 0.18 152 / 0.9)" }} />
                </div>
              </div>
              <div className="text-4xl font-black text-foreground mb-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
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

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
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
                    <div className="text-7xl font-black text-primary mb-2" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
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
    { text: "A partir de R$49/mês para acesso ilimitado à base" },
    { text: "Filtros automáticos — você vê apenas quem faz sentido" },
    { text: "Chat integrado e histórico de candidaturas na plataforma" },
  ];

  return (
    <section className="py-24 px-6 border-y border-border" style={{ background: "linear-gradient(135deg, oklch(0.12 0.01 0) 0%, oklch(0.11 0.02 152 / 0.3) 100%)" }}>
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
              <div className="text-2xl font-black text-primary mt-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>A partir de R$49/mês</div>
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

export default function Home() {
  const { isAuthenticated, user } = useAuth();
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

  const handleCTA = (type: "company" | "rep") => {
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

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between" style={{ height: "72px" }}>
          <img src={LOGO_URL} alt="RepMatch" className="h-8 object-contain" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como funciona</a>
            <a href="/vagas" className="hover:text-foreground transition-colors font-medium text-foreground/80">Vagas</a>
            <a href="/buscar" className="hover:text-foreground transition-colors font-medium text-foreground/80">Buscar Reps</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  if (companyProfile) navigate("/dashboard/company");
                  else if (repProfile) navigate("/dashboard/rep");
                  else navigate("/onboarding");
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm transition-colors"
              >
                Olá, {user?.name?.split(" ")[0]} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <a href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Entrar</a>
                <a href="/register" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">
                  Cadastrar agora
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px]" style={{ background: "oklch(0.62 0.18 152 / 0.07)" }} />
          <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full blur-[100px]" style={{ background: "oklch(0.62 0.18 152 / 0.04)" }} />
        </div>
        {/* Subtle grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.018]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Marketplace B2B · O match certo. No tempo certo.
          </div>

          {/* Logo grande */}
          <div className="flex justify-center mb-10">
            <img src={LOGO_URL} alt="RepMatch" className="w-64 md:w-80 lg:w-[420px] object-contain" style={{ filter: "drop-shadow(0 0 60px oklch(0.62 0.18 152 / 0.3))" }} />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[0.92] tracking-tight mb-8" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            <span className="text-foreground">Sua empresa</span>
            <br />
            <span className="text-gradient-green">merece os melhores</span>
            <br />
            <span className="text-foreground">representantes.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            Chega de garimpar representante em grupo de WhatsApp ou pagar headhunter caro.
            O RepMatch conecta sua empresa com os representantes certos — por região, segmento e histórico real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={() => handleCTA("company")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-9 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Building2 className="w-5 h-5" />
              Sou Empresa
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTA("rep")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 text-foreground font-semibold text-base px-9 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Users className="w-5 h-5" />
              Sou Representante
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["Sem taxa de contratação", "Cancele quando quiser", "Conexão em menos de 48h"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground/40">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ─── Contador ao Vivo ─────────────────────────────────────────────────────── */}
      <LiveCounterSection />

      {/* ─── Stats ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { value: 10000, suffix: "+", label: "Representantes ativos", icon: Users },
              { value: 400000, suffix: "+", label: "Fornecedores cadastrados", icon: Building2 },
              { value: 98, suffix: "%", label: "Taxa de match qualificado", icon: Target },
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
      <section id="como-funciona" className="py-28 px-6">
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
                  { icon: LockOpen, label: "Desbloqueia contato por R$29" },
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
                  <div className="flex items-center justify-center gap-6 text-xs">
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
      <section className="py-24 px-6 bg-card/30 border-y border-border">
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
              { icon: TrendingUp, title: "Base de 400 mil", desc: "A maior base de fornecedores e representantes do Brasil, com dados validados e segmentados por região.", highlight: false },
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

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
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

      {/* ─── Vagas em Destaque ─────────────────────────────────────────── */}
      <VagasDestaque />

      {/* ─── Planos ─────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-28 px-6 bg-card/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Planos</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
              Invista no crescimento<br />
              <span className="text-gradient-green">que você merece.</span>
            </h2>
            <p className="text-muted-foreground">Sem contrato de fidelidade. Cancele quando quiser.</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-14">
            <span className={`text-sm font-semibold transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
            <button
              onClick={() => setIsAnnual(a => !a)}
              aria-label="Alternar entre mensal e anual"
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${isAnnual ? "bg-primary" : "bg-secondary"}`}
            >
              <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${isAnnual ? "translate-x-7" : "translate-x-0"}`} />
            </button>
            <span className={`text-sm font-semibold transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Anual
              <span className="ml-2 bg-primary/15 text-primary text-xs font-bold px-2 py-0.5 rounded-full">-20%</span>
            </span>
          </div>

          {/* Representantes */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Para Representantes</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {([
                { name: "Free", monthly: 0, free: true, border: "border-border", bg: "bg-card", features: ["Perfil visível na base", "Candidaturas ilimitadas", "Chat com empresas", "Aparece no fim da lista"], cta: "Cadastrar agora", highlight: false },
                { name: "Bronze", monthly: 9.99, free: false, border: "border-orange-500/40", bg: "bg-orange-500/5", features: ["Tudo do Free", "Badge Bronze no perfil", "Aparece antes dos Free", "Acesso a vagas exclusivas Bronze"], cta: "Assinar Bronze", highlight: false },
                { name: "Prata", monthly: 19.90, free: false, border: "border-primary/40", bg: "bg-primary/5", features: ["Tudo do Bronze", "Badge Prata em destaque", "Aparece antes dos Bronze", "Vagas Prata + score de match"], cta: "Assinar Prata", highlight: true },
                { name: "Ouro", monthly: 29.90, free: false, border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Tudo do Prata", "Badge Ouro — máximo destaque", "Aparece PRIMEIRO na busca", "Card destacado em verde", "Todas as vagas desbloqueadas"], cta: "Assinar Ouro", highlight: false },
              ] as const).map(({ name, monthly, free, border, bg, features, cta, highlight }) => {
                const annualMonthly = Math.round(monthly * 0.8);
                const price = free ? "R$0" : isAnnual ? `R$${annualMonthly}` : `R$${monthly}`;
                const period = free ? "para sempre" : isAnnual ? "/mês (anual)" : "/mês";
                const savings = free ? 0 : (monthly - annualMonthly) * 12;
                return (
                  <div key={name} className={`relative rounded-2xl border ${border} ${bg} p-7 ${highlight ? "shadow-lg" : ""}`}>
                    {highlight && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">MAIS POPULAR</span>
                      </div>
                    )}
                    <div className="mb-7">
                      <div className="text-muted-foreground text-sm font-semibold mb-2">{name}</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>{price}</span>
                        <span className="text-muted-foreground text-sm">{period}</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => navigate("/register")}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        highlight
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      {cta}
                    </button>
                    {isAnnual && !free && savings > 0 && (
                      <p className="text-center text-xs text-primary mt-3 font-semibold">Economize R${savings}/ano</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Empresas */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Para Empresas</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {([
                { name: "Starter", monthly: 49, border: "border-border", bg: "bg-card", features: ["Até 3 vagas ativas", "5 desbloqueos de contato/mês", "Acesso a reps Bronze+", "Ranking Bronze", "Chat com candidatos"], cta: "Começar agora", highlight: false },
                { name: "Pro", monthly: 149, border: "border-primary/40", bg: "bg-primary/5", features: ["Até 10 vagas ativas", "15 desbloqueos de contato/mês", "Acesso a todos os reps", "Match por IA", "Ranking Gold", "Notificações de candidatos"], cta: "Assinar Pro", highlight: true },
                { name: "Enterprise", monthly: 399, border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Vagas ilimitadas", "Desbloqueos ilimitados", "Reps Ouro em destaque", "Ranking Platinum", "Gerente de conta dedicado", "API de integração"], cta: "Falar com vendas", highlight: false },
              ] as const).map(({ name, monthly, border, bg, features, cta, highlight }) => {
                const annualMonthly = Math.round(monthly * 0.8);
                const price = isAnnual ? `R$${annualMonthly}` : `R$${monthly}`;
                const period = isAnnual ? "/mês (anual)" : "/mês";
                const savings = (monthly - annualMonthly) * 12;
                return (
                  <div key={name} className={`relative rounded-2xl border ${border} ${bg} p-7 ${highlight ? "shadow-lg" : ""}`}>
                    {highlight && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">MAIS POPULAR</span>
                      </div>
                    )}
                    <div className="mb-7">
                      <div className="text-muted-foreground text-sm font-semibold mb-2">{name}</div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>{price}</span>
                        <span className="text-muted-foreground text-sm">{period}</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => navigate("/register")}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        highlight
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                          : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                      }`}
                    >
                      {cta}
                    </button>
                    {isAnnual && savings > 0 && (
                      <p className="text-center text-xs text-primary mt-3 font-semibold">Economize R${savings}/ano</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[140px]" style={{ background: "oklch(0.62 0.18 152 / 0.06)" }} />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            Comece hoje mesmo
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-foreground mb-6 leading-tight" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Pare de perder tempo<br />
            <span className="text-gradient-green">com o representante errado.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
            Mais de 10 mil representantes qualificados esperando pela sua vaga. Pare de garimpar — comece a conectar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleCTA("company")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base px-10 py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <Building2 className="w-5 h-5" />
              Sou Empresa
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTA("rep")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 text-foreground font-semibold text-base px-10 py-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              <Users className="w-5 h-5" />
              Sou Representante
            </button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 border-t border-border">
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
              { q: "Representantes Free conseguem boas vagas?", a: "Sim! O plano Free dá acesso a vagas abertas para todos. Para aparecer em destaque na busca das empresas e acessar vagas exclusivas, os planos Bronze (R$9,99), Prata (R$19,90) e Ouro (R$29,90) oferecem visibilidade crescente." },
              { q: "Quanto custa para empresas?", a: "Temos três planos: Starter (R$49/mês) com até 3 vagas e 5 desbloqueos, Pro (R$149/mês) com 10 vagas, 15 desbloqueos e match por IA, e Enterprise (R$399/mês) com vagas e desbloqueos ilimitados. Todos com 20% de desconto no plano anual." },
              { q: "Como funciona o desbloqueio de contato (R$29)?", a: "Por padrão, os contatos dos representantes ficam ocultos para proteger a privacidade. Quando a empresa deseja negociar fora da plataforma, pode desbloquear o contato de um representante específico por R$29 — uma cobrança única, sem recorrência. Planos Pro e Enterprise incluem desbloqueos mensais no pacote." },
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
      <footer className="border-t border-border py-12 px-6">
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
        </div>
      </footer>
    </div>
  );
}
