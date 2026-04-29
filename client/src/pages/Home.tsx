import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import {
  Building2, Users, Zap, Shield, TrendingUp, Star, CheckCircle,
  ArrowRight, ChevronRight, Award, BarChart3, MessageSquare
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

const PLANS_REP = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    color: "border-border",
    badge: null,
    features: [
      "Acesso a vagas Bronze e Silver",
      "Perfil básico",
      "Candidatura ilimitada",
    ],
    cta: "Começar grátis",
    ctaVariant: "outline" as const,
  },
  {
    name: "Premium",
    price: "R$ 19",
    period: "/mês",
    color: "border-primary",
    badge: "Mais popular",
    features: [
      "Acesso a vagas até Gold",
      "Perfil em destaque",
      "Análise de match por IA",
      "Notificações de vagas",
    ],
    cta: "Assinar Premium",
    ctaVariant: "default" as const,
  },
  {
    name: "Elite",
    price: "R$ 49",
    period: "/mês",
    color: "border-yellow-500",
    badge: "Máximo alcance",
    features: [
      "Acesso a TODAS as vagas",
      "Vagas Platinum exclusivas",
      "Score de match avançado",
      "Prioridade nas candidaturas",
      "Suporte prioritário",
    ],
    cta: "Assinar Elite",
    ctaVariant: "default" as const,
  },
];

const PLANS_COMPANY = [
  {
    name: "Starter",
    price: "R$ 99",
    period: "/mês",
    color: "border-border",
    badge: null,
    features: ["3 vagas ativas", "Acesso a reps Free", "Ranking Bronze"],
    cta: "Começar",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    price: "R$ 299",
    period: "/mês",
    color: "border-primary",
    badge: "Recomendado",
    features: [
      "10 vagas ativas",
      "Acesso a reps Premium",
      "Ranking Gold",
      "Match por IA",
      "Notificações de candidatos",
    ],
    cta: "Assinar Pro",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    price: "R$ 999",
    period: "/mês",
    color: "border-yellow-500",
    badge: "Sem limites",
    features: [
      "Vagas ilimitadas",
      "Acesso a reps Elite",
      "Ranking Platinum",
      "Sugestões automáticas de IA",
      "Gerente de conta dedicado",
    ],
    cta: "Falar com vendas",
    ctaVariant: "default" as const,
  },
];

const STATS = [
  { value: "10.000+", label: "Representantes cadastrados" },
  { value: "400.000+", label: "Empresas na base" },
  { value: "98%", label: "Taxa de match relevante" },
  { value: "< 48h", label: "Tempo médio de resposta" },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Match Inteligente com IA",
    desc: "Algoritmo que cruza região, segmento, experiência e análise semântica para encontrar o par perfeito.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Award,
    title: "Ranking Dinâmico",
    desc: "Empresas Bronze, Silver, Gold e Platinum. Quanto melhor o histórico, mais visibilidade e candidatos premium.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Shield,
    title: "Acesso por Tier",
    desc: "Representantes Free, Premium e Elite acessam vagas de acordo com seu plano. Incentivo para crescer.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: BarChart3,
    title: "Score de Compatibilidade",
    desc: "Cada candidatura recebe um score 0-100 combinando critérios fixos e análise semântica por LLM.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: MessageSquare,
    title: "Notificações em Tempo Real",
    desc: "Representantes recebem alertas de vagas compatíveis. Empresas são notificadas de candidatos com alto score.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: TrendingUp,
    title: "Base de 400k Empresas",
    desc: "Maior base de fornecedores e empresas do Brasil, com validação de CNPJ e enriquecimento automático.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();
  const { data: repProfile } = trpc.representatives.myProfile.useQuery(undefined, { enabled: isAuthenticated });
  const { data: companyProfile } = trpc.companies.myProfile.useQuery(undefined, { enabled: isAuthenticated });

  const handleCTA = (type: "company" | "representative") => {
    if (isAuthenticated) {
      if (companyProfile) navigate("/dashboard/company");
      else if (repProfile) navigate("/dashboard/rep");
      else navigate("/onboarding");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ─── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={LOGO_URL} alt="RepMatch" className="h-8 object-contain" />
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:block">Olá, {user?.name?.split(" ")[0]}</span>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground font-bold"
                  onClick={() => {
      if (companyProfile) navigate("/dashboard/company");
      else if (repProfile) navigate("/dashboard/rep");
      else navigate("/onboarding");
                  }}
                >
                  Meu painel <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = getLoginUrl()}>
                  Entrar
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground font-bold" onClick={() => window.location.href = getLoginUrl()}>
                  Cadastrar grátis
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-6 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 text-sm font-semibold">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Marketplace B2B de Representantes Comerciais
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Conectamos{" "}
            <span className="text-primary">Empresas</span>
            <br />e{" "}
            <span className="text-primary">Representantes.</span>
            <br />
            <span className="text-muted-foreground text-4xl sm:text-5xl">Gerando Resultados.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Match inteligente por IA entre representantes comerciais e empresas. Encontre o parceiro ideal em menos de 48 horas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground font-black text-lg px-10 py-7 rounded-xl hover:bg-primary/90 transition-all hover:scale-105"
              onClick={() => handleCTA("company")}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Sou Empresa
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-border text-foreground font-black text-lg px-10 py-7 rounded-xl hover:border-primary hover:text-primary transition-all hover:scale-105 bg-transparent"
              onClick={() => handleCTA("representative")}
            >
              <Users className="w-5 h-5 mr-2" />
              Sou Representante
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-border bg-card/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Por que o RepMatch?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A plataforma mais completa para conectar representantes e empresas com inteligência artificial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-colors">
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Como funciona</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For companies */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-black">Para Empresas</h3>
              </div>
              <div className="space-y-6">
                {[
                  { n: "01", title: "Crie sua conta", desc: "Cadastre a empresa com CNPJ e segmento. Validação automática." },
                  { n: "02", title: "Publique uma vaga", desc: "Defina título, comissão, região e segmento. Em minutos está no ar." },
                  { n: "03", title: "Receba candidatos rankeados", desc: "A IA analisa e pontua cada candidato por compatibilidade." },
                  { n: "04", title: "Contrate o melhor", desc: "Aceite, recuse ou entre em contato diretamente pela plataforma." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="text-primary font-black text-2xl w-10 flex-shrink-0">{step.n}</div>
                    <div>
                      <div className="font-bold">{step.title}</div>
                      <div className="text-muted-foreground text-sm mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For reps */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-black">Para Representantes</h3>
              </div>
              <div className="space-y-6">
                {[
                  { n: "01", title: "Crie seu perfil", desc: "Informe região, segmento e experiência. É gratuito." },
                  { n: "02", title: "Explore vagas compatíveis", desc: "Veja vagas filtradas por match com seu perfil." },
                  { n: "03", title: "Candidate-se com 1 clique", desc: "A IA calcula seu score e envia para a empresa." },
                  { n: "04", title: "Seja contratado", desc: "Acompanhe o status das candidaturas em tempo real." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="text-blue-400 font-black text-2xl w-10 flex-shrink-0">{step.n}</div>
                    <div>
                      <div className="font-bold">{step.title}</div>
                      <div className="text-muted-foreground text-sm mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Reps ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <Badge className="bg-blue-400/10 text-blue-400 border border-blue-400/20 px-4 py-1.5">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Para Representantes
            </Badge>
          </div>
          <h2 className="text-4xl font-black text-center mb-12">Planos de Representante</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS_REP.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border-2 ${plan.color} bg-card p-8 relative`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-bold px-4">{plan.badge}</Badge>
                  </div>
                )}
                <div className="font-black text-xl mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-bold ${plan.ctaVariant === "default" ? "bg-primary text-primary-foreground" : "border-border bg-transparent text-foreground"}`}
                  variant={plan.ctaVariant}
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Companies ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <Badge className="bg-primary/10 text-primary border border-primary/20 px-4 py-1.5">
              <Building2 className="w-3.5 h-3.5 mr-1.5" />
              Para Empresas
            </Badge>
          </div>
          <h2 className="text-4xl font-black text-center mb-12">Planos de Empresa</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {PLANS_COMPANY.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border-2 ${plan.color} bg-card p-8 relative`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-bold px-4">{plan.badge}</Badge>
                  </div>
                )}
                <div className="font-black text-xl mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full font-bold ${plan.ctaVariant === "default" ? "bg-primary text-primary-foreground" : "border-border bg-transparent text-foreground"}`}
                  variant={plan.ctaVariant}
                  onClick={() => window.location.href = getLoginUrl()}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Cobranças avulsas: <strong className="text-foreground">Contato desbloqueado R$ 29</strong> · <strong className="text-foreground">Vaga em destaque R$ 49</strong>
          </div>
        </div>
      </section>

      {/* ─── CTA Final ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6">
            Pronto para <span className="text-primary">crescer?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Junte-se a milhares de representantes e empresas que já usam o RepMatch para fechar negócios.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground font-black text-lg px-10 py-7 rounded-xl hover:bg-primary/90 hover:scale-105 transition-all"
              onClick={() => handleCTA("company")}
            >
              <Building2 className="w-5 h-5 mr-2" />
              Começar como Empresa
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-border font-black text-lg px-10 py-7 rounded-xl hover:border-primary hover:text-primary transition-all bg-transparent"
              onClick={() => handleCTA("representative")}
            >
              <Users className="w-5 h-5 mr-2" />
              Começar como Representante
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
          <p className="text-sm text-muted-foreground">
            © 2026 RepMatch · Conectando empresas e representantes. Gerando resultados.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Star className="w-3 h-3 text-primary" />
            <span>Powered by IA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
