import { useLocation } from "wouter";
import { useState } from "react";
import {
  ArrowRight, CheckCircle, Star, Shield, Zap, Users, TrendingUp,
  Building2, Handshake, Megaphone, Code2, Gift, Phone, MessageCircle,
  ChevronDown, Award, BarChart3, Globe
} from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";
const VIDEO_URL = "/hero-bg.mp4";
const WHATSAPP_NUMBER = "5541999499815";
const WHATSAPP_MSG = encodeURIComponent("Olá! Tenho interesse em fazer parceria com o RepMatch. Podemos conversar?");
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;

// ─── Tipos de parceria ────────────────────────────────────────────────────────
const PARTNERSHIP_TYPES = [
  {
    icon: Building2,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    title: "Associações & Conselhos",
    subtitle: "CORE, SEBRAE, CNI, FIESP e similares",
    description: "Integre sua base de representantes e empresas ao maior marketplace B2B do Brasil. Ofereça benefícios exclusivos aos seus associados.",
    benefits: [
      "Selo verificado para associados no perfil",
      "Destaque nos resultados de busca",
      "Co-marketing e divulgação conjunta",
      "Relatórios de engajamento dos associados",
    ],
    cta: "Quero ser parceiro institucional",
  },
  {
    icon: Code2,
    color: "#3b82f6",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.2)",
    title: "Tecnologia & Integrações",
    subtitle: "CRMs, ERPs, plataformas de vendas",
    description: "Conecte seu sistema ao RepMatch via API. Enriqueça seus dados com nossa base de 173 mil representantes verificados.",
    benefits: [
      "API REST documentada e estável",
      "Webhook para eventos em tempo real",
      "Sandbox de testes disponível",
      "Suporte técnico dedicado",
    ],
    cta: "Quero integrar via API",
  },
  {
    icon: Megaphone,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    title: "Co-marketing & Afiliados",
    subtitle: "Influenciadores, consultores, agências",
    description: "Indique o RepMatch para sua audiência e ganhe comissão recorrente por cada empresa que se cadastrar e desbloquear contatos.",
    benefits: [
      "Comissão de 20% por desbloqueio indicado",
      "Dashboard de acompanhamento em tempo real",
      "Material de divulgação pronto para uso",
      "Pagamento via PIX todo dia 10",
    ],
    cta: "Quero ser afiliado",
  },
  {
    icon: Handshake,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    title: "Distribuidoras & Indústrias",
    subtitle: "Empresas que precisam de escala",
    description: "Acesso especial para empresas que precisam contratar múltiplos representantes. Planos corporativos com desconto progressivo.",
    benefits: [
      "Pacotes de desbloqueio com desconto",
      "Gerente de conta dedicado",
      "Relatórios de performance dos representantes",
      "Integração com seu ERP/CRM",
    ],
    cta: "Quero plano corporativo",
  },
];

// ─── Parceiros ativos ─────────────────────────────────────────────────────────
const ACTIVE_PARTNERS = [
  { name: "CORE", initials: "CORE", color: "#2563eb", description: "Validação automática de registro CORE no perfil dos representantes." },
  { name: "Mercado Pago", initials: "MP", color: "#009ee3", description: "Pagamentos via PIX e cartão com segurança e rastreabilidade." },
  { name: "BrasilAPI", initials: "BR", color: "#16a34a", description: "Validação de CNPJ em tempo real diretamente da Receita Federal." },
  { name: "DeepFace AI", initials: "DF", color: "#7c3aed", description: "Verificação de identidade com reconhecimento facial de alta precisão." },
];

// ─── Números de impacto ───────────────────────────────────────────────────────
const STATS = [
  { icon: Users, value: "173k+", label: "Representantes na base" },
  { icon: Building2, value: "9.200+", label: "Empresas cadastradas" },
  { icon: Globe, value: "27", label: "Estados cobertos" },
  { icon: BarChart3, value: "R$29", label: "Custo por conexão" },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "Como funciona o programa de afiliados?",
    a: "Você recebe um link exclusivo de indicação. Cada empresa que se cadastrar pelo seu link e desbloquear um contato gera uma comissão de 20% para você, paga via PIX todo dia 10 do mês seguinte.",
  },
  {
    q: "Quanto tempo leva para fechar uma parceria institucional?",
    a: "Após o primeiro contato via WhatsApp, normalmente fechamos os termos em 5 a 10 dias úteis. O processo é simples: uma reunião de alinhamento, proposta de valor e assinatura do acordo.",
  },
  {
    q: "A API tem custo?",
    a: "O acesso à API é gratuito para parceiros tecnológicos. Cobramos apenas pelos desbloqueios de contato consumidos via API, com desconto de 30% em relação ao preço avulso.",
  },
  {
    q: "Posso ser parceiro sendo pessoa física?",
    a: "Sim! O programa de afiliados é aberto para pessoas físicas. Para parcerias institucionais ou de tecnologia, é necessário CNPJ.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(o => !o)}
      className="w-full text-left border border-white/[0.08] rounded-xl p-5 hover:border-emerald-500/30 transition-all duration-200"
      style={{ background: open ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)" }}
    >
      <div className="flex items-center justify-between gap-4">
        <span className="text-white font-semibold text-sm leading-snug">{q}</span>
        <ChevronDown className={`w-4 h-4 text-emerald-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </div>
      {open && (
        <p className="text-white/55 text-sm mt-3 leading-relaxed border-t border-white/[0.06] pt-3">
          {a}
        </p>
      )}
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Parcerias() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "#060d06" }}>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06]" style={{ background: "rgba(6,13,6,0.92)", backdropFilter: "blur(16px)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="RepMatch" className="h-8 w-auto" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="text-white/50 hover:text-white text-sm transition-colors">
              ← Voltar ao site
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition-all duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero com Vídeo de Fundo ─────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Vídeo de fundo */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {/* Overlay gradiente sobre o vídeo */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(6,13,6,0.55) 0%, rgba(6,13,6,0.3) 50%, rgba(6,13,6,0.85) 100%)",
          }}
        />

        {/* Grade sutil */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(34,197,94,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(34,197,94,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Conteúdo do Hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center py-24">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold px-4 py-2 rounded-full mb-8 tracking-widest uppercase backdrop-blur-sm">
            <Handshake className="w-3.5 h-3.5" />
            Programa de Parcerias RepMatch
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight" style={{ textShadow: "0 4px 32px rgba(0,0,0,0.8)" }}>
            Cresça junto com o{" "}
            <span style={{ color: "#22c55e", textShadow: "0 0 40px rgba(34,197,94,0.4)" }}>maior marketplace</span>
            <br />de representantes do Brasil
          </h1>

          <p className="text-white/70 text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
            173 mil representantes. 9.200 empresas. 27 estados.
            Seja você uma associação, empresa de tecnologia ou distribuidora —
            temos um modelo de parceria feito para você.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base px-8 py-4 rounded-xl transition-all duration-200 shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com o time de parcerias
              <ArrowRight className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-2 text-white/50 text-sm backdrop-blur-sm bg-black/20 px-4 py-2 rounded-lg border border-white/10">
              <Phone className="w-4 h-4 text-emerald-400" />
              (41) 99949-9815 · WhatsApp
            </div>
          </div>

          {/* Stats flutuantes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16">
            {STATS.map(stat => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 p-4 text-center backdrop-blur-md"
                style={{ background: "rgba(6,13,6,0.65)" }}
              >
                <stat.icon className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Seta de scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </div>
      </section>

      {/* ── Tipos de parceria ───────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">Modelos de Parceria</p>
            <h2 className="text-4xl font-black text-white mb-4">
              Qual modelo faz sentido<br />para o seu negócio?
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Cada parceria é construída de forma personalizada. Escolha o modelo mais próximo do seu perfil.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PARTNERSHIP_TYPES.map(type => (
              <div
                key={type.title}
                className="rounded-2xl p-7 border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                style={{ background: type.bg, borderColor: type.border }}
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: type.color + "20", border: `1px solid ${type.color}40` }}>
                    <type.icon className="w-6 h-6" style={{ color: type.color }} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg leading-tight">{type.title}</h3>
                    <p className="text-white/40 text-sm mt-0.5">{type.subtitle}</p>
                  </div>
                </div>

                <p className="text-white/60 text-sm leading-relaxed mb-5">{type.description}</p>

                <ul className="space-y-2 mb-6">
                  {type.benefits.map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: type.color }} />
                      {b}
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Olá! Tenho interesse em: ${type.cta}. Podemos conversar?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 font-bold text-sm px-5 py-2.5 rounded-lg transition-all duration-200"
                  style={{ background: type.color + "20", color: type.color, border: `1px solid ${type.color}40` }}
                >
                  {type.cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Parceiros ativos ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Ecossistema</p>
            <h2 className="text-3xl font-black text-white mb-3">Parceiros que já confiam no RepMatch</h2>
            <p className="text-white/40 text-base">Integrações ativas que tornam a plataforma mais segura e eficiente.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ACTIVE_PARTNERS.map(p => (
              <div key={p.name}
                className="rounded-xl border border-white/[0.07] p-5 text-center hover:border-white/15 transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 font-black text-sm"
                  style={{ background: p.color + "25", border: `1px solid ${p.color}40`, color: p.color }}>
                  {p.initials}
                </div>
                <p className="text-white font-bold text-sm mb-1">{p.name}</p>
                <p className="text-white/40 text-xs leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Por que fazer parceria ──────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Por que o RepMatch?</p>
            <h2 className="text-3xl font-black text-white">A plataforma que está crescendo mais rápido</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, color: "#22c55e", title: "Crescimento acelerado", desc: "Mais de 300 novos representantes cadastrados por semana. Sua marca ao lado de quem está crescendo." },
              { icon: Shield, color: "#3b82f6", title: "Dados verificados", desc: "KYC com reconhecimento facial, validação de CNPJ e CORE. A base mais confiável do mercado." },
              { icon: Star, color: "#f59e0b", title: "Nicho sem concorrência", desc: "Primeiro marketplace B2B especializado em representantes comerciais no Brasil. Seja pioneiro." },
              { icon: Zap, color: "#8b5cf6", title: "Integração rápida", desc: "API REST documentada. Do primeiro contato à integração em produção em menos de 2 semanas." },
              { icon: Gift, color: "#ec4899", title: "Co-marketing ativo", desc: "Divulgamos seus serviços para nossa base de 9.200+ empresas e 173k+ representantes." },
              { icon: Award, color: "#22c55e", title: "Suporte dedicado", desc: "Cada parceiro tem um ponto de contato direto. Sem ticket, sem fila, sem burocracia." },
            ].map(item => (
              <div key={item.title}
                className="rounded-xl border border-white/[0.07] p-5 hover:border-white/15 transition-all duration-200"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: item.color + "15" }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <p className="text-white font-bold text-sm mb-1.5">{item.title}</p>
                <p className="text-white/45 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-white/[0.06]" style={{ background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Dúvidas</p>
            <h2 className="text-3xl font-black text-white">Perguntas frequentes</h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map(item => <FAQItem key={item.q} {...item} />)}
          </div>
        </div>
      </section>

      {/* ── CTA Final com vídeo de fundo ────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Vídeo de fundo no CTA final */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.2 }}
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(6,13,6,0.9) 0%, rgba(6,30,6,0.85) 100%)" }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-emerald-400" />
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Pronto para fazer<br />
            <span style={{ color: "#22c55e" }}>parte do RepMatch?</span>
          </h2>

          <p className="text-white/50 text-lg mb-8 leading-relaxed">
            Fale diretamente com nosso time de parcerias pelo WhatsApp.
            Respondemos em até 2 horas em dias úteis.
          </p>

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg px-10 py-5 rounded-2xl transition-all duration-200 shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1 active:translate-y-0"
          >
            <MessageCircle className="w-6 h-6" />
            Falar agora no WhatsApp
            <ArrowRight className="w-5 h-5" />
          </a>

          <div className="flex items-center justify-center gap-2 mt-5 text-white/30 text-sm">
            <Phone className="w-4 h-4" />
            <span>(41) 99949-9815</span>
            <span className="mx-2">·</span>
            <span>Danilo Lima · Fundador</span>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 pt-8 border-t border-white/[0.06]">
            {["Resposta em 2h", "Sem burocracia", "Proposta personalizada"].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-white/35 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center">
        <p className="text-white/25 text-sm">
          © 2025 RepMatch · Todos os direitos reservados ·{" "}
          <button onClick={() => navigate("/")} className="hover:text-white/50 transition-colors">
            Voltar ao site
          </button>
        </p>
      </footer>
    </div>
  );
}
