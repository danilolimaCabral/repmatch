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
          <img src={LOGO_URL} alt="RepMatch" className="h-9 object-contain" />
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
            Marketplace B2B · O match certo. No tempo certo.
          </div>

          {/* Logo grande */}
          <div className="flex justify-center mb-10">
            <img src={LOGO_URL} alt="RepMatch" className="w-72 md:w-96 lg:w-[480px] object-contain drop-shadow-[0_0_80px_rgba(34,197,94,0.4)]" />
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.92] tracking-tight mb-8">
            <span className="text-white">Sua empresa</span>
            <br />
            <span className="text-[#22c55e]">merece os melhores</span>
            <br />
            <span className="text-white">representantes.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12">
            Chega de garimpar representante em grupo de WhatsApp ou pagar headhunter caro.
            O RepMatch conecta sua empresa com os representantes certos — por região, segmento e histórico real.
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
            {["Sem taxa de contratação", "Cancele quando quiser", "Conexão em menos de 48h"].map((item) => (
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
              Do cadastro ao contato<br />
              <span className="text-[#22c55e]">em menos de 48 horas.</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Sem processos longos, sem intermediários. Você publica a vaga, a plataforma encontra os melhores candidatos. Simples assim.
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
                  { step: "02", title: "Receba os top 10 candidatos", desc: "A plataforma analisa mais de 10 mil representantes e entrega os mais compatíveis com a sua vaga." },
                  { step: "03", title: "Negocie dentro da plataforma", desc: "Chat direto com os candidatos. Contatos só revelados quando ambas as partes concordam." },
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
                  { step: "04", title: "Suba de plano e acesse mais", desc: "Planos Premium e Elite desbloqueiam empresas Gold e Platinum com as melhores comissões do mercado." },
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
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Por que o RepMatch</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Feito para quem<br />
              <span className="text-[#22c55e]">leva vendas a sério.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "Match por perfil real", desc: "Cruzamos região, segmento, experiência e histórico. Você vê apenas candidatos que fazem sentido para a sua vaga.", highlight: true },
              { icon: Award, title: "Ranking de Empresas", desc: "Empresas classificadas em Bronze, Silver, Gold e Platinum com base em histórico, avaliações e comissão oferecida.", highlight: false },
              { icon: Shield, title: "Acesso por plano", desc: "Representantes Free acessam vagas Bronze e Silver. Premium acessa Gold. Elite acessa Platinum — as melhores comissões.", highlight: false },
              { icon: MessageSquare, title: "Chat dentro da plataforma", desc: "Negocie direto com o candidato sem sair do RepMatch. Contatos só revelados quando ambas as partes concordam.", highlight: false },
              { icon: BarChart3, title: "Painel de controle", desc: "Dashboard separado para empresas e representantes com histórico de candidaturas, vagas e performance.", highlight: false },
              { icon: TrendingUp, title: "Base de 400 mil", desc: "A maior base de fornecedores e representantes do Brasil, com dados validados e segmentados por região.", highlight: false },
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
                    <span className="text-xs font-bold bg-[#22c55e] text-black px-2.5 py-1 rounded-full">Destaque</span>
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

          {/* ─── Comparison Table ─────────────────────────────────────────────── */}
          <div className="mt-20">
            <div className="text-center mb-10">
              <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Comparativo</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Por que não usar o que<br />
                <span className="text-[#22c55e]">todo mundo já usa?</span>
              </h2>
              <p className="text-zinc-500 text-base max-w-xl mx-auto">Porque o que todo mundo usa não foi feito para isso. O RepMatch foi.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/8">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="text-left p-5 text-zinc-500 font-semibold w-1/4">Critério</th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[#22c55e] font-black text-base">RepMatch</span>
                        <span className="text-xs text-[#22c55e]/60 font-normal">Especializado</span>
                      </div>
                    </th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-zinc-400 font-bold">LinkedIn</span>
                        <span className="text-xs text-zinc-600 font-normal">Rede social</span>
                      </div>
                    </th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-zinc-400 font-bold">WhatsApp</span>
                        <span className="text-xs text-zinc-600 font-normal">Grupos</span>
                      </div>
                    </th>
                    <th className="p-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-zinc-400 font-bold">Indicação</span>
                        <span className="text-xs text-zinc-600 font-normal">Boca a boca</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { criteria: "Match por região e segmento", rm: true, li: false, wpp: false, ind: false },
                    { criteria: "Perfil verificado do representante", rm: true, li: false, wpp: false, ind: false },
                    { criteria: "Score de compatibilidade", rm: true, li: false, wpp: false, ind: false },
                    { criteria: "Ranking de empresas", rm: true, li: false, wpp: false, ind: false },
                    { criteria: "Chat interno seguro", rm: true, li: true, wpp: true, ind: false },
                    { criteria: "Histórico de contratações", rm: true, li: false, wpp: false, ind: false },
                    { criteria: "Sem taxa de intermediação", rm: true, li: false, wpp: true, ind: true },
                    { criteria: "Acesso a base de 400 mil", rm: true, li: false, wpp: false, ind: false },
                  ].map(({ criteria, rm, li, wpp, ind }, i) => (
                    <tr key={i} className={`border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                      <td className="p-5 text-zinc-400 font-medium">{criteria}</td>
                      <td className="p-5 text-center bg-[#22c55e]/5">
                        {rm ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#22c55e]/20 text-[#22c55e] font-black text-xs">✓</span>
                             : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-400 text-xs">✗</span>}
                      </td>
                      <td className="p-5 text-center">
                        {li ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-zinc-400 font-black text-xs">✓</span>
                            : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-400 text-xs">✗</span>}
                      </td>
                      <td className="p-5 text-center">
                        {wpp ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-zinc-400 font-black text-xs">✓</span>
                             : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-400 text-xs">✗</span>}
                      </td>
                      <td className="p-5 text-center">
                        {ind ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-zinc-400 font-black text-xs">✓</span>
                              : <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 text-red-400 text-xs">✗</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof ───────────────────────────────────────────────────── */}
      <section className="py-28 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-14">
            <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Depoimentos Reais</Badge>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Quem usa, <span className="text-[#22c55e]">recomenda.</span>
            </h2>
            <p className="text-zinc-500 text-lg">Resultados reais de empresas e representantes que já usam o RepMatch.</p>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {[
              { value: "4.9", label: "Avaliação média", sub: "App Store & Google Play" },
              { value: "97%", label: "Taxa de satisfação", sub: "Pesquisa interna 2025" },
              { value: "+2.400", label: "Matches realizados", sub: "Nos últimos 90 dias" },
              { value: "48h", label: "Tempo médio de match", sub: "Do cadastro ao contato" },
            ].map(({ value, label, sub }) => (
              <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/8 p-5 text-center">
                <div className="text-3xl font-black text-[#22c55e] mb-1">{value}</div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs text-zinc-600 mt-1">{sub}</div>
              </div>
            ))}
          </div>

          {/* Wall of Love — 3 columns */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Carlos Mendonça",
                initials: "CM",
                color: "from-green-500 to-emerald-700",
                role: "Diretor Comercial",
                company: "Alimentos Vitória S.A.",
                city: "São Paulo, SP",
                tier: "Pro",
                stars: 5,
                text: "Em 3 dias encontramos 2 representantes qualificados para São Paulo. O match por IA economizou semanas de triagem manual. Antes gastávamos R$8k com headhunters — agora pagamos R$299/mês.",
                metric: "Economizou R$8.000 em contratação",
              },
              {
                name: "Fernanda Lima",
                initials: "FL",
                color: "from-blue-500 to-cyan-700",
                role: "Representante Comercial",
                company: "Autônoma · Cosméticos",
                city: "Belo Horizonte, MG",
                tier: "Elite",
                stars: 5,
                text: "Antes ficava meses sem fechar nada. Com o RepMatch Elite, acesso vagas de empresas Gold que pagam comissão acima do mercado. Fechei 3 contratos em 6 semanas.",
                metric: "3 contratos fechados em 6 semanas",
              },
              {
                name: "Ricardo Souza",
                initials: "RS",
                color: "from-purple-500 to-violet-700",
                role: "CEO",
                company: "TechDistrib Ltda.",
                city: "Curitiba, PR",
                tier: "Enterprise",
                stars: 5,
                text: "A plataforma é séria. Os representantes têm histórico, avaliação e score. Não é mais um site de anúncio — é um sistema de match real. Nossa equipe de vendas cresceu 40% em 4 meses.",
                metric: "Equipe de vendas +40% em 4 meses",
              },
              {
                name: "Juliana Rocha",
                initials: "JR",
                color: "from-orange-500 to-amber-700",
                role: "Gerente de Expansão",
                company: "Grupo Saúde Total",
                city: "Rio de Janeiro, RJ",
                tier: "Pro",
                stars: 5,
                text: "Precisávamos cobrir 5 estados com representantes de saúde. Em 2 semanas o RepMatch entregou 12 candidatos com score acima de 85%. Contratamos 6. Resultado imediato.",
                metric: "12 candidatos qualificados em 2 semanas",
              },
              {
                name: "Marcos Oliveira",
                initials: "MO",
                color: "from-rose-500 to-pink-700",
                role: "Representante Comercial",
                company: "Autônomo · Agronegócio",
                city: "Ribeirão Preto, SP",
                tier: "Premium",
                stars: 5,
                text: "Trabalho com agronegócio há 12 anos e nunca tinha uma plataforma que entendesse meu perfil. O RepMatch me conectou com 3 empresas do meu segmento exato. Valeu cada centavo.",
                metric: "3 conexões no segmento exato",
              },
              {
                name: "Ana Paula Ferreira",
                initials: "AF",
                color: "from-teal-500 to-green-700",
                role: "Diretora de Vendas",
                company: "Cosméticos Natureza Viva",
                city: "Florianópolis, SC",
                tier: "Pro",
                stars: 5,
                text: "O ranking das empresas foi o que me convenceu. Saber que somos Gold dá credibilidade para atrair os melhores reps. Nossa taxa de resposta subiu 3x depois que subimos de nível.",
                metric: "Taxa de resposta 3x maior",
              },
              {
                name: "Paulo Henrique Costa",
                initials: "PH",
                color: "from-indigo-500 to-blue-700",
                role: "Representante Comercial",
                company: "Autônomo · Tecnologia",
                city: "Porto Alegre, RS",
                tier: "Elite",
                stars: 5,
                text: "Migrei do LinkedIn para o RepMatch e a diferença é absurda. Aqui as empresas são verificadas, as vagas têm comissão clara e o chat interno evita aquela dança de WhatsApp.",
                metric: "2x mais propostas que no LinkedIn",
              },
              {
                name: "Beatriz Santos",
                initials: "BS",
                color: "from-yellow-500 to-orange-600",
                role: "Sócia-Fundadora",
                company: "BS Distribuidora",
                city: "Salvador, BA",
                tier: "Starter",
                stars: 5,
                text: "Somos uma empresa pequena e o plano Starter já nos deu acesso a representantes que nunca encontraríamos sozinhos. O custo-benefício é incomparável.",
                metric: "ROI positivo no 1º mês",
              },
              {
                name: "Thiago Almeida",
                initials: "TA",
                color: "from-cyan-500 to-sky-700",
                role: "Representante Comercial",
                company: "Autônomo · Indústria",
                city: "Campinas, SP",
                tier: "Premium",
                stars: 5,
                text: "O score de match é preciso. Quando aparece uma vaga com 90%+ de compatibilidade, é porque realmente bate com minha experiência. Já fechei 2 contratos assim.",
                metric: "2 contratos via match 90%+",
              },
            ].map(({ name, initials, color, role, company, city, tier, stars, text, metric }) => (
              <div key={name} className="rounded-2xl bg-white/[0.03] border border-white/8 p-6 hover:border-[#22c55e]/30 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1 flex flex-col gap-4">
                {/* Stars */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#22c55e] text-[#22c55e]" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-zinc-300 text-sm leading-relaxed flex-1">"{text}"</p>
                {/* Metric badge */}
                <div className="flex items-center gap-2 bg-[#22c55e]/8 border border-[#22c55e]/15 rounded-xl px-3 py-2">
                  <TrendingUp className="w-3.5 h-3.5 text-[#22c55e] shrink-0" />
                  <span className="text-xs font-semibold text-[#22c55e]">{metric}</span>
                </div>
                {/* Author */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                      {initials}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{name}</div>
                      <div className="text-xs text-zinc-500">{role} · {company}</div>
                      <div className="text-xs text-zinc-600">{city}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 px-2.5 py-1 rounded-full shrink-0">{tier}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom trust bar */}
          <div className="mt-14 flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#22c55e]" />
              <span>Depoimentos verificados por usuários reais</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#22c55e]" />
              <span>Plataforma com CNPJ validado e dados seguros</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#22c55e]" />
              <span>+2.400 matches realizados em 2025</span>
            </div>
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
                { name: "Elite", price: "R$49", period: "/mês", border: "border-yellow-500/40", bg: "bg-yellow-900/5", features: ["Tudo do Premium", "Acesso a vagas Platinum", "Análise avançada do perfil", "Suporte prioritário", "Badge Elite no perfil"], cta: "Assinar Elite", highlight: false },
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
            Mais de 10 mil representantes qualificados esperando pela sua vaga. Pare de garimpar — comece a conectar.
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
              { q: "Como funciona o match do RepMatch?", a: "Cruzamos critérios objetivos: região de atuação, segmento, anos de experiência e status ativo. O resultado é um score de compatibilidade que mostra, de forma clara, quais representantes têm o perfil mais alinhado com a sua vaga." },
              { q: "Posso cancelar minha assinatura a qualquer momento?", a: "Sim. Não há fidelidade ou multa. Você cancela quando quiser diretamente pelo painel, e o acesso permanece até o fim do período pago." },
              { q: "O que é o ranking Bronze, Silver, Gold e Platinum?", a: "É a classificação das empresas dentro da plataforma, baseada em histórico de vagas publicadas, avaliações dos representantes, taxa de resposta e comissão oferecida. Empresas bem ranqueadas atraem representantes mais qualificados e experientes." },
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
              <img src={LOGO_URL} alt="RepMatch" className="h-8 object-contain" />
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
