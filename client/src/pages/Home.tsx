import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle, Star, Users, Building2, Zap, TrendingUp,
  Shield, Award, ChevronDown, BarChart3, MessageSquare,
  Target, Sparkles, Clock
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";

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
      navigate("/login");
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
                  Começar grátis
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

      {/* ─── Logos Parceiros ──────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-border overflow-hidden bg-card/30">
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/50">Empresas que já confiam no RepMatch</p>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .marquee-track {
            display: flex;
            width: max-content;
            animation: marquee 30s linear infinite;
          }
          .marquee-track:hover {
            animation-play-state: paused;
          }
        `}</style>
        <div className="overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />
          <div className="marquee-track">
            {[
              { name: "Ambev", abbr: "AB" }, { name: "Nestlé", abbr: "NE" }, { name: "Unilever", abbr: "UN" },
              { name: "Boticario", abbr: "BO" }, { name: "Natura", abbr: "NA" }, { name: "Seara", abbr: "SE" },
              { name: "Sadia", abbr: "SA" }, { name: "Havaianas", abbr: "HV" }, { name: "Tramontina", abbr: "TR" },
              { name: "Votorantim", abbr: "VO" },
              { name: "Ambev", abbr: "AB" }, { name: "Nestlé", abbr: "NE" }, { name: "Unilever", abbr: "UN" },
              { name: "Boticario", abbr: "BO" }, { name: "Natura", abbr: "NA" }, { name: "Seara", abbr: "SE" },
              { name: "Sadia", abbr: "SA" }, { name: "Havaianas", abbr: "HV" }, { name: "Tramontina", abbr: "TR" },
              { name: "Votorantim", abbr: "VO" },
            ].map(({ name, abbr }, i) => (
              <div key={`${name}-${i}`} className="flex items-center gap-3 mx-10 select-none">
                <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs font-black text-muted-foreground flex-shrink-0">
                  {abbr}
                </div>
                <span className="text-muted-foreground font-semibold text-base whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
              Do cadastro ao contato<br />
              <span className="text-gradient-green">em menos de 48 horas.</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Sem processos longos, sem intermediários. Você publica a vaga, a plataforma encontra os melhores candidatos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* Para Empresas */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Para Empresas</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Publique sua vaga", desc: "Informe região, segmento, comissão e o perfil ideal do representante." },
                  { step: "02", title: "Receba os top 10 candidatos", desc: "A plataforma analisa mais de 10 mil representantes e entrega os mais compatíveis." },
                  { step: "03", title: "Negocie dentro da plataforma", desc: "Chat direto com os candidatos. Contatos só revelados quando ambas as partes concordam." },
                  { step: "04", title: "Contrate com segurança", desc: "Histórico de performance, ranking e avaliações de cada representante." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary/20 transition-colors">
                      {step}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground mb-1">{title}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Para Representantes */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Users className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Para Representantes</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Monte seu perfil profissional", desc: "Região, segmento, experiência e portfólio. Quanto mais completo, maior o score." },
                  { step: "02", title: "Acesse vagas compatíveis", desc: "Veja apenas vagas que fazem sentido para o seu perfil. Sem ruído, sem perda de tempo." },
                  { step: "03", title: "Candidate-se com 1 clique", desc: "Sua candidatura vai com score de compatibilidade para a empresa ver." },
                  { step: "04", title: "Suba de plano e acesse mais", desc: "Planos Premium e Elite desbloqueiam empresas Gold e Platinum com as melhores comissões." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground font-black text-sm group-hover:bg-secondary/80 transition-colors">
                      {step}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground mb-1">{title}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
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

      {/* ─── Social Proof ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Depoimentos</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
              Quem já usa<br />
              <span className="text-gradient-green">não volta atrás.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { name: "Carlos Mendes", initials: "CM", color: "from-emerald-600 to-teal-700", role: "Diretor Comercial", company: "Distribuidora Mendes", city: "São Paulo, SP", tier: "Pro", stars: 5, text: "Contratamos 3 representantes em 6 semanas. Antes levávamos meses buscando no LinkedIn e em grupos de WhatsApp. A qualidade dos candidatos é muito superior.", metric: "3 contratos fechados em 6 semanas" },
              { name: "Ricardo Souza", initials: "RS", color: "from-violet-600 to-purple-700", role: "CEO", company: "TechDistrib Ltda.", city: "Curitiba, PR", tier: "Enterprise", stars: 5, text: "Os representantes têm histórico, avaliação e score. Não é mais um site de anúncio — é um sistema de match real. Nossa equipe de vendas cresceu 40% em 4 meses.", metric: "Equipe de vendas +40% em 4 meses" },
              { name: "Juliana Rocha", initials: "JR", color: "from-orange-600 to-amber-700", role: "Gerente de Expansão", company: "Grupo Saúde Total", city: "Rio de Janeiro, RJ", tier: "Pro", stars: 5, text: "Precisávamos cobrir 5 estados com representantes de saúde. Em 2 semanas o RepMatch entregou 12 candidatos com score acima de 85%. Contratamos 6.", metric: "12 candidatos qualificados em 2 semanas" },
              { name: "Marcos Oliveira", initials: "MO", color: "from-rose-600 to-pink-700", role: "Representante Comercial", company: "Autônomo · Agronegócio", city: "Ribeirão Preto, SP", tier: "Premium", stars: 5, text: "Trabalho com agronegócio há 12 anos e nunca tinha uma plataforma que entendesse meu perfil. O RepMatch me conectou com 3 empresas do meu segmento exato.", metric: "3 conexões no segmento exato" },
              { name: "Ana Paula Ferreira", initials: "AF", color: "from-teal-600 to-green-700", role: "Diretora de Vendas", company: "Cosméticos Natureza Viva", city: "Florianópolis, SC", tier: "Pro", stars: 5, text: "O ranking das empresas foi o que me convenceu. Saber que somos Gold dá credibilidade para atrair os melhores reps. Nossa taxa de resposta subiu 3x.", metric: "Taxa de resposta 3x maior" },
              { name: "Paulo Henrique Costa", initials: "PH", color: "from-blue-600 to-indigo-700", role: "Representante Comercial", company: "Autônomo · Tecnologia", city: "Porto Alegre, RS", tier: "Elite", stars: 5, text: "Migrei do LinkedIn para o RepMatch e a diferença é absurda. Aqui as empresas são verificadas, as vagas têm comissão clara e o chat interno evita aquela dança de WhatsApp.", metric: "2x mais propostas que no LinkedIn" },
            ].map(({ name, initials, color, role, company, city, tier, stars, text, metric }) => (
              <div key={name} className="rounded-2xl bg-card border border-border p-6 hover:border-primary/25 transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed flex-1">"{text}"</p>
                <div className="flex items-center gap-2 bg-primary/8 border border-primary/15 rounded-xl px-3 py-2">
                  <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-primary">{metric}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{name}</div>
                      <div className="text-xs text-muted-foreground">{role} · {company}</div>
                      <div className="text-xs text-muted-foreground/60">{city}</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full shrink-0">{tier}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-muted-foreground">
            {[
              { icon: CheckCircle, text: "Depoimentos verificados por usuários reais" },
              { icon: Shield, text: "Plataforma com CNPJ validado e dados seguros" },
              { icon: Award, text: "+2.400 matches realizados em 2025" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

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
            <div className="grid md:grid-cols-3 gap-5">
              {([
                { name: "Free", monthly: 0, free: true, border: "border-border", bg: "bg-card", features: ["Acesso a vagas Bronze e Silver", "Candidaturas ilimitadas", "Chat com empresas", "Perfil básico"], cta: "Começar grátis", highlight: false },
                { name: "Premium", monthly: 19, free: false, border: "border-primary/40", bg: "bg-primary/5", features: ["Tudo do Free", "Acesso a vagas Gold", "Score de compatibilidade", "Destaque nas candidaturas", "Notificações em tempo real"], cta: "Assinar Premium", highlight: true },
                { name: "Elite", monthly: 49, free: false, border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Tudo do Premium", "Acesso a vagas Platinum", "Análise avançada do perfil", "Suporte prioritário", "Badge Elite no perfil"], cta: "Assinar Elite", highlight: false },
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
                { name: "Starter", monthly: 99, border: "border-border", bg: "bg-card", features: ["Até 3 vagas simultâneas", "Top 10 matches por vaga", "Chat com candidatos", "Ranking Bronze/Silver"], cta: "Começar agora", highlight: false },
                { name: "Pro", monthly: 299, border: "border-primary/40", bg: "bg-primary/5", features: ["Vagas ilimitadas", "Acesso a reps Premium", "Ranking Gold", "Relatórios de performance", "Notificações de candidatos"], cta: "Assinar Pro", highlight: true },
                { name: "Enterprise", monthly: 999, border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Tudo do Pro", "Acesso a reps Elite", "Ranking Platinum", "Gerente de conta dedicado", "API de integração", "SLA garantido"], cta: "Falar com vendas", highlight: false },
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
              { q: "Representantes Free conseguem boas vagas?", a: "Sim! O plano Free dá acesso a todas as vagas de empresas Bronze e Silver. Para acessar empresas Gold e Platinum — que geralmente oferecem comissões acima da média — é necessário o plano Premium ou Elite." },
              { q: "Como funciona o desbloqueio de contato (R$29)?", a: "Por padrão, os contatos dos representantes ficam ocultos para proteger a privacidade. Quando a empresa deseja negociar fora da plataforma, pode desbloquear o contato de um representante específico por R$29 — uma cobrança única, sem recorrência." },
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
              <a href="#" className="hover:text-muted-foreground transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-muted-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-muted-foreground transition-colors">Contato</a>
            </div>
          </div>
          <div className="pt-6 border-t border-border text-center text-xs text-muted-foreground/40">
            © 2026 RepMatch. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
