import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle, Star, Users, Building2, Zap, TrendingUp,
  Shield, Award, ChevronDown, BarChart3, MessageSquare,
  Target, Sparkles, Clock
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

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
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#080808]/95 backdrop-blur-md border-b border-white/5 shadow-2xl" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain" />
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  if (companyProfile) navigate("/dashboard/company");
                  else if (repProfile) navigate("/dashboard/rep");
                  else navigate("/onboarding");
                }}
                className="flex items-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold px-5 py-2.5 rounded-full text-sm transition-colors"
              >
                Olá, {user?.name?.split(" ")[0]} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <a href={getLoginUrl()} className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:block">Entrar</a>
                <a href={getLoginUrl()} className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold px-5 py-2.5 rounded-full text-sm transition-colors">
                  Começar grátis
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-[#22c55e]/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-[#22c55e]/5 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-[#22c55e]/4 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Marketplace B2B · Match por Inteligência Artificial
          </div>

          {/* Logo grande */}
          <div className="flex justify-center mb-10">
            <img src={LOGO_URL} alt="RepMatch" className="h-28 md:h-36 lg:h-44 object-contain drop-shadow-[0_0_60px_rgba(34,197,94,0.3)]" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tight mb-8">
            <span className="text-white">Sua empresa</span>
            <br />
            <span className="text-[#22c55e]">merece os melhores</span>
            <br />
            <span className="text-white">representantes.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12">
            O RepMatch conecta empresas que querem crescer com representantes comerciais que entregam resultado.
            Match inteligente por IA, ranking dinâmico e comunicação em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              onClick={() => handleCTA("company")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-lg px-10 py-5 rounded-2xl transition-all duration-200 shadow-[0_0_40px_rgba(34,197,94,0.35)] hover:shadow-[0_0_70px_rgba(34,197,94,0.55)] hover:scale-105"
            >
              <Building2 className="w-5 h-5" />
              Sou Empresa
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTA("rep")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#22c55e]/50 text-white font-bold text-lg px-10 py-5 rounded-2xl transition-all duration-200 hover:scale-105"
            >
              <Users className="w-5 h-5" />
              Sou Representante
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
            {["Sem taxa de contratação", "Cancele quando quiser", "Match em menos de 48h"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#22c55e]" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-zinc-600">
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-20 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { value: 10000, suffix: "+", label: "Representantes ativos", icon: Users },
              { value: 400000, suffix: "+", label: "Fornecedores cadastrados", icon: Building2 },
              { value: 98, suffix: "%", label: "Taxa de match qualificado", icon: Target },
              { value: 48, suffix: "h", label: "Tempo médio para conexão", icon: Clock },
            ].map(({ value, suffix, label, icon: Icon }) => (
              <div key={label} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#22c55e]/10 border border-[#22c55e]/20 mb-4 group-hover:bg-[#22c55e]/20 transition-colors mx-auto">
                  <Icon className="w-5 h-5 text-[#22c55e]" />
                </div>
                <div className="text-4xl md:text-5xl font-black text-white mb-1">
                  <AnimatedCounter end={value} suffix={suffix} />
                </div>
                <div className="text-sm text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Como funciona ──────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Como funciona</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Do cadastro ao match<br />
              <span className="text-[#22c55e]">em menos de 48 horas.</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Sem processos longos, sem intermediários. A IA cuida do match. Você cuida dos resultados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#22c55e] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-black" />
                </div>
                <h3 className="text-xl font-black text-white">Para Empresas</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Publique sua vaga", desc: "Informe região, segmento, comissão e o perfil ideal do representante." },
                  { step: "02", title: "Receba os top 10 matches", desc: "Nossa IA analisa mais de 10 mil representantes e entrega os mais compatíveis." },
                  { step: "03", title: "Negocie dentro da plataforma", desc: "Chat em tempo real com candidatos. Sem expor contatos antes de fechar." },
                  { step: "04", title: "Contrate com segurança", desc: "Histórico de performance, ranking e avaliações de cada representante." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center text-[#22c55e] font-black text-sm group-hover:bg-[#22c55e]/20 transition-colors">
                      {step}
                    </div>
                    <div>
                      <div className="font-bold text-white mb-1">{title}</div>
                      <div className="text-sm text-zinc-500 leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-black text-white">Para Representantes</h3>
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "Monte seu perfil profissional", desc: "Região, segmento, experiência e portfólio. Quanto mais completo, maior o score." },
                  { step: "02", title: "Acesse vagas compatíveis", desc: "Veja apenas vagas que fazem sentido para o seu perfil. Sem ruído, sem perda de tempo." },
                  { step: "03", title: "Candidate-se com 1 clique", desc: "Sua candidatura vai com score de compatibilidade para a empresa ver." },
                  { step: "04", title: "Suba de tier e acesse mais", desc: "Planos Premium e Elite desbloqueiam empresas Gold e Platinum com comissões maiores." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 font-black text-sm group-hover:bg-white/10 transition-colors">
                      {step}
                    </div>
                    <div>
                      <div className="font-bold text-white mb-1">{title}</div>
                      <div className="text-sm text-zinc-500 leading-relaxed">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Diferenciais</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Tecnologia que gera<br />
              <span className="text-[#22c55e]">resultado real.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "Match por IA", desc: "Algoritmo que combina critérios fixos com análise semântica do perfil. Score de 0 a 100 para cada candidato.", highlight: true },
              { icon: Award, title: "Ranking Dinâmico", desc: "Empresas classificadas em Bronze, Silver, Gold e Platinum com base em histórico, avaliações e comissão.", highlight: false },
              { icon: Shield, title: "Acesso por Tier", desc: "Representantes Free acessam Bronze e Silver. Premium acessa Gold. Elite acessa Platinum — as melhores comissões.", highlight: false },
              { icon: MessageSquare, title: "Chat em Tempo Real", desc: "Negociação dentro da plataforma. Contatos só revelados quando ambas as partes concordam.", highlight: false },
              { icon: BarChart3, title: "Dashboard Completo", desc: "Painel separado para empresas e representantes com métricas, histórico e performance em tempo real.", highlight: false },
              { icon: TrendingUp, title: "Base de 400 mil", desc: "A maior base de fornecedores e representantes do Brasil, com dados enriquecidos via CNPJ.", highlight: false },
            ].map(({ icon: Icon, title, desc, highlight }) => (
              <div
                key={title}
                className={`relative rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1.5 group cursor-default ${
                  highlight
                    ? "bg-[#22c55e]/8 border-[#22c55e]/30 hover:border-[#22c55e]/60 shadow-[0_0_40px_rgba(34,197,94,0.08)]"
                    : "bg-white/[0.03] border-white/8 hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {highlight && (
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-bold bg-[#22c55e] text-black px-2.5 py-1 rounded-full">Exclusivo</span>
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${highlight ? "bg-[#22c55e]/20" : "bg-white/5"}`}>
                  <Icon className={`w-5 h-5 ${highlight ? "text-[#22c55e]" : "text-zinc-400 group-hover:text-zinc-300"}`} />
                </div>
                <h3 className="font-black text-white text-lg mb-2.5">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Depoimentos</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Quem usa, <span className="text-[#22c55e]">recomenda.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Carlos Mendonça", role: "Diretor Comercial · Indústria Alimentícia", text: "Em 3 dias encontramos 2 representantes qualificados para São Paulo. O match por IA economizou semanas de triagem manual.", tier: "Pro" },
              { name: "Fernanda Lima", role: "Representante Comercial · Cosméticos", text: "Antes ficava meses sem fechar nada. Com o RepMatch Elite, acesso vagas de empresas Gold que pagam comissão acima do mercado.", tier: "Elite" },
              { name: "Ricardo Souza", role: "CEO · Distribuidora de Tecnologia", text: "A plataforma é séria. Os representantes têm histórico, avaliação e score. Não é mais um site de anúncio — é um sistema de match real.", tier: "Enterprise" },
            ].map(({ name, role, text, tier }) => (
              <div key={name} className="rounded-2xl bg-white/[0.03] border border-white/8 p-7 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-1 mb-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#22c55e] text-[#22c55e]" />
                  ))}
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed mb-7">"{text}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-sm">{name}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{role}</div>
                  </div>
                  <span className="text-xs font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-3 py-1 rounded-full">{tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Planos ─────────────────────────────────────────────────────────── */}
      <section id="planos" className="py-28 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Planos</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Invista no crescimento<br />
              <span className="text-[#22c55e]">que você merece.</span>
            </h2>
            <p className="text-zinc-500">Sem contrato de fidelidade. Cancele quando quiser.</p>
          </div>

          {/* Representantes */}
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-5 h-5 text-[#22c55e]" />
              <h3 className="text-xl font-black text-white">Para Representantes</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Free", price: "R$0", period: "para sempre", border: "border-white/10", bg: "bg-white/[0.02]", features: ["Acesso a vagas Bronze e Silver", "Candidaturas ilimitadas", "Chat com empresas", "Perfil básico"], cta: "Começar grátis", highlight: false },
                { name: "Premium", price: "R$19", period: "/mês", border: "border-[#22c55e]/40", bg: "bg-[#22c55e]/5", features: ["Tudo do Free", "Acesso a vagas Gold", "Score de compatibilidade", "Destaque nas candidaturas", "Notificações em tempo real"], cta: "Assinar Premium", highlight: true },
                { name: "Elite", price: "R$49", period: "/mês", border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Tudo do Premium", "Acesso a vagas Platinum", "Análise de IA do perfil", "Suporte prioritário", "Badge Elite no perfil"], cta: "Assinar Elite", highlight: false },
              ].map(({ name, price, period, border, bg, features, cta, highlight }) => (
                <div key={name} className={`relative rounded-2xl border ${border} ${bg} p-7 ${highlight ? "shadow-[0_0_60px_rgba(34,197,94,0.12)]" : ""}`}>
                  {highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-[#22c55e] text-black text-xs font-black px-4 py-1.5 rounded-full">MAIS POPULAR</span>
                    </div>
                  )}
                  <div className="mb-7">
                    <div className="text-zinc-400 text-sm font-semibold mb-2">{name}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-white">{price}</span>
                      <span className="text-zinc-500 text-sm">{period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => window.location.href = getLoginUrl()}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                      highlight
                        ? "bg-[#22c55e] text-black hover:bg-[#16a34a] shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.4)]"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {cta}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Empresas */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <Building2 className="w-5 h-5 text-[#22c55e]" />
              <h3 className="text-xl font-black text-white">Para Empresas</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: "Starter", price: "R$99", period: "/mês", border: "border-white/10", bg: "bg-white/[0.02]", features: ["Até 3 vagas simultâneas", "Top 10 matches por vaga", "Chat com candidatos", "Ranking Bronze/Silver"], cta: "Começar agora", highlight: false },
                { name: "Pro", price: "R$299", period: "/mês", border: "border-[#22c55e]/40", bg: "bg-[#22c55e]/5", features: ["Vagas ilimitadas", "Acesso a reps Premium", "Ranking Gold", "Relatórios de performance", "Notificações de candidatos"], cta: "Assinar Pro", highlight: true },
                { name: "Enterprise", price: "R$999", period: "/mês", border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Tudo do Pro", "Acesso a reps Elite", "Ranking Platinum", "Gerente de conta dedicado", "API de integração", "SLA garantido"], cta: "Falar com vendas", highlight: false },
              ].map(({ name, price, period, border, bg, features, cta, highlight }) => (
                <div key={name} className={`relative rounded-2xl border ${border} ${bg} p-7 ${highlight ? "shadow-[0_0_60px_rgba(34,197,94,0.12)]" : ""}`}>
                  {highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-[#22c55e] text-black text-xs font-black px-4 py-1.5 rounded-full">MAIS POPULAR</span>
                    </div>
                  )}
                  <div className="mb-7">
                    <div className="text-zinc-400 text-sm font-semibold mb-2">{name}</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-white">{price}</span>
                      <span className="text-zinc-500 text-sm">{period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                        <CheckCircle className="w-4 h-4 text-[#22c55e] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => window.location.href = getLoginUrl()}
                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                      highlight
                        ? "bg-[#22c55e] text-black hover:bg-[#16a34a] shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.4)]"
                        : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#22c55e]/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-semibold px-4 py-2 rounded-full mb-10 tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5" />
            Comece hoje mesmo
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Pare de perder tempo<br />
            <span className="text-[#22c55e]">com o representante errado.</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto">
            Mais de 10 mil representantes qualificados esperando pela sua vaga. O match certo está a um clique de distância.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleCTA("company")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-black text-lg px-12 py-5 rounded-2xl transition-all duration-200 shadow-[0_0_50px_rgba(34,197,94,0.35)] hover:shadow-[0_0_80px_rgba(34,197,94,0.55)] hover:scale-105"
            >
              <Building2 className="w-5 h-5" />
              Sou Empresa
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => handleCTA("rep")}
              className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-[#22c55e]/50 text-white font-bold text-lg px-12 py-5 rounded-2xl transition-all duration-200 hover:scale-105"
            >
              <Users className="w-5 h-5" />
              Sou Representante
            </button>
          </div>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">FAQ</Badge>
            <h2 className="text-4xl font-black text-white">Perguntas frequentes</h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "Como funciona o algoritmo de match?", a: "Combinamos critérios fixos (região, segmento, anos de experiência, status ativo) com análise semântica por IA da descrição da vaga versus o perfil do representante. O resultado é um score de 0 a 100 que indica a compatibilidade real entre empresa e representante." },
              { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim. Não há fidelidade ou multa. Você cancela quando quiser diretamente pelo painel, e o acesso permanece até o fim do período pago." },
              { q: "O que é o ranking Bronze, Silver, Gold e Platinum?", a: "É o ranking dinâmico das empresas, calculado com base em volume de vagas publicadas, avaliações dos representantes, taxa de resposta e comissão oferecida. Empresas com rank mais alto atraem representantes de maior qualidade." },
              { q: "Representantes Free conseguem boas vagas?", a: "Sim! O plano Free dá acesso a todas as vagas de empresas Bronze e Silver. Para acessar empresas Gold e Platinum — que geralmente oferecem comissões acima da média — é necessário o plano Premium ou Elite." },
              { q: "Como funciona o desbloqueio de contato (R$29)?", a: "Por padrão, os contatos dos representantes ficam ocultos para proteger a privacidade. Quando a empresa deseja negociar fora da plataforma, pode desbloquear o contato de um representante específico por R$29 — uma cobrança única, sem recorrência." },
              { q: "Posso importar minha base de clientes/representantes?", a: "Sim. O painel Admin permite importação em massa via planilha Excel. A plataforma valida CNPJs automaticamente via BrasilAPI e normaliza todos os telefones durante a importação." },
            ].map(({ q, a }, i) => (
              <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.03] transition-colors"
                >
                  <span className="font-bold text-white pr-4 text-sm md:text-base">{q}</span>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-4">
                    {a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="RepMatch" className="h-9 object-contain" />
              <span className="text-zinc-600 text-sm">Conectando empresas e representantes. Gerando resultados.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-600">
              <a href="#" className="hover:text-zinc-400 transition-colors">Termos de uso</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Privacidade</a>
              <a href="#" className="hover:text-zinc-400 transition-colors">Contato</a>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 text-center text-xs text-zinc-700">
            © 2026 RepMatch. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
