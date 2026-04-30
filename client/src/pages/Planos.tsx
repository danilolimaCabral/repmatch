import { useState } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle, ArrowRight, Users, Building2, Copy, MessageCircle,
  QrCode, CreditCard, Smartphone, Shield, Clock, Zap
} from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";
const PIX_KEY = "41999499815";
const WHATSAPP_NUMBER = "5541999499815";

type PlanType = "rep" | "company";
type BillingCycle = "monthly" | "annual";

interface Plan {
  name: string;
  monthly: number;
  description: string;
  features: string[];
  highlight?: boolean;
  productKey: string;
}

const REP_PLANS: Plan[] = [
  {
    name: "Bronze",
    monthly: 9.99,
    description: "Para representantes que querem começar a se destacar",
    features: ["Perfil visível na base", "Badge Bronze no perfil", "Aparece antes dos Free", "Acesso a vagas exclusivas Bronze"],
    productKey: "REP_BRONZE",
  },
  {
    name: "Prata",
    monthly: 19.90,
    description: "Para representantes que querem mais visibilidade",
    features: ["Tudo do Bronze", "Badge Prata em destaque", "Aparece antes dos Bronze", "Vagas Prata + score de match"],
    highlight: true,
    productKey: "REP_PRATA",
  },
  {
    name: "Ouro",
    monthly: 29.90,
    description: "Máximo destaque na plataforma",
    features: ["Tudo do Prata", "Badge Ouro — máximo destaque", "Aparece PRIMEIRO na busca", "Card destacado em verde", "Todas as vagas desbloqueadas"],
    productKey: "REP_OURO",
  },
];

const COMPANY_PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 49,
    description: "Para empresas que estão começando a buscar representantes",
    features: ["Até 3 vagas ativas", "5 desbloqueos de contato/mês", "Acesso a reps Bronze+", "Ranking Bronze", "Chat com candidatos"],
    productKey: "COMPANY_STARTER",
  },
  {
    name: "Pro",
    monthly: 149,
    description: "Para empresas em expansão comercial",
    features: ["Até 10 vagas ativas", "15 desbloqueos de contato/mês", "Acesso a todos os reps", "Match por IA", "Ranking Gold", "Notificações de candidatos"],
    highlight: true,
    productKey: "COMPANY_PRO",
  },
  {
    name: "Enterprise",
    monthly: 399,
    description: "Para empresas com alta demanda de representantes",
    features: ["Vagas ilimitadas", "Desbloqueos ilimitados", "Reps Ouro em destaque", "Ranking Platinum", "Gerente de conta dedicado", "API de integração"],
    productKey: "COMPANY_ENTERPRISE",
  },
];

function PixModal({ plan, billing, onClose }: { plan: Plan; billing: BillingCycle; onClose: () => void }) {
  const price = billing === "annual" ? Math.round(plan.monthly * 0.8 * 12) : plan.monthly;
  const period = billing === "annual" ? "ano" : "mês";
  const [copied, setCopied] = useState(false);

  const pixMessage = `Olá! Quero assinar o plano ${plan.name} do RepMatch — R$${price}/${period}. Segue o comprovante do PIX.`;
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(pixMessage)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl font-bold">×</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-4">
            <QrCode className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Pagar via PIX
          </h3>
          <p className="text-muted-foreground text-sm">
            Plano <strong className="text-foreground">{plan.name}</strong> — <strong className="text-primary">R${price}/{period}</strong>
          </p>
        </div>

        {/* PIX Key */}
        <div className="bg-secondary/60 border border-border rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Chave PIX (Telefone)</div>
          <div className="flex items-center gap-3">
            <div className="flex-1 font-mono text-foreground font-bold text-lg">{PIX_KEY}</div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 mb-6">
          {[
            { step: "1", text: `Abra o app do seu banco e acesse a área de PIX` },
            { step: "2", text: `Cole a chave PIX acima e informe o valor R$${price}` },
            { step: "3", text: `Após o pagamento, envie o comprovante pelo WhatsApp` },
            { step: "4", text: `Seu acesso será liberado em até 2 horas úteis` },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-black flex-shrink-0 mt-0.5">
                {step}
              </div>
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>

        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-4 rounded-xl text-base transition-colors mb-3"
        >
          <MessageCircle className="w-5 h-5" />
          Enviar comprovante pelo WhatsApp
        </a>

        <p className="text-center text-xs text-muted-foreground/60">
          Após confirmar o pagamento, seu plano será ativado manualmente pela equipe RepMatch.
        </p>
      </div>
    </div>
  );
}

export default function Planos() {
  const [, navigate] = useLocation();
  const [planType, setPlanType] = useState<PlanType>("company");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | null>(null);

  const plans = planType === "rep" ? REP_PLANS : COMPANY_PLANS;

  const handleSelectPlan = (plan: Plan, method: "pix" | "card") => {
    if (method === "pix") {
      setSelectedPlan(plan);
      setPaymentMethod("pix");
    } else {
      // Redirect to Manus OAuth then onboarding will handle plan selection
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-8 object-contain" />
          </a>
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Início</a>
            <a href={getLoginUrl()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">
              Entrar / Cadastrar
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-14">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-5 text-xs font-semibold tracking-widest uppercase px-4 py-1.5">Planos e Preços</Badge>
          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Invista no crescimento<br />
            <span className="text-gradient-green">que você merece.</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Sem contrato de fidelidade. Cancele quando quiser. Pague via PIX ou cartão.
          </p>
        </div>

        {/* Payment Methods Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-3">
            <Smartphone className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold text-sm text-foreground">PIX</div>
              <div className="text-xs text-muted-foreground">Liberação em até 2h</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-3">
            <CreditCard className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold text-sm text-foreground">Cartão de Crédito</div>
              <div className="text-xs text-muted-foreground">Liberação imediata via Stripe</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-5 py-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <div className="font-semibold text-sm text-foreground">Pagamento seguro</div>
              <div className="text-xs text-muted-foreground">Dados protegidos</div>
            </div>
          </div>
        </div>

        {/* Plan Type Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setPlanType("company")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${planType === "company" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            <Building2 className="w-4 h-4" />
            Para Empresas
          </button>
          <button
            onClick={() => setPlanType("rep")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${planType === "rep" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="w-4 h-4" />
            Para Representantes
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-semibold transition-colors ${billing === "monthly" ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "annual" : "monthly")}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 ${billing === "annual" ? "bg-primary" : "bg-secondary"}`}
          >
            <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-300 ${billing === "annual" ? "translate-x-7" : "translate-x-0"}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors ${billing === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
            Anual
            <span className="ml-2 bg-primary/15 text-primary text-xs font-bold px-2 py-0.5 rounded-full">-20%</span>
          </span>
        </div>

        {/* Plans Grid */}
        <div className={`grid gap-5 mb-16 ${planType === "rep" ? "md:grid-cols-3" : "md:grid-cols-3"}`}>
          {plans.map((plan) => {
            const annualMonthly = Math.round(plan.monthly * 0.8);
            const displayPrice = billing === "annual" ? annualMonthly : plan.monthly;
            const savings = billing === "annual" ? (plan.monthly - annualMonthly) * 12 : 0;
            return (
              <div key={plan.name} className={`relative rounded-2xl border p-7 ${plan.highlight ? "border-primary/40 bg-primary/5 shadow-lg" : "border-border bg-card"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full">MAIS POPULAR</span>
                  </div>
                )}
                <div className="mb-2">
                  <div className="text-muted-foreground text-sm font-semibold">{plan.name}</div>
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <span className="text-4xl font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                    R${displayPrice}
                  </span>
                  <span className="text-muted-foreground text-sm">/mês{billing === "annual" ? " (anual)" : ""}</span>
                </div>
                {billing === "annual" && savings > 0 && (
                  <div className="text-xs text-primary font-semibold mb-3">Economize R${savings}/ano</div>
                )}
                <p className="text-xs text-muted-foreground mb-5">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Payment options */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleSelectPlan(plan, "pix")}
                    className="w-full flex items-center justify-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-semibold text-sm py-3 rounded-xl transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    Pagar com PIX
                  </button>
                  <button
                    onClick={() => handleSelectPlan(plan, "card")}
                    className={`w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-colors ${
                      plan.highlight
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pagar com Cartão
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* One-time charges */}
        <div className="border border-border rounded-2xl p-8 mb-12">
          <h3 className="font-bold text-lg text-foreground mb-6">Cobranças avulsas (sem assinatura)</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { name: "Desbloquear Contato", price: 29, desc: "Acesse o contato direto de um representante específico. Cobrança única, sem recorrência.", icon: Zap },
              { name: "Vaga em Destaque", price: 49, desc: "Destaque sua vaga no topo dos resultados por 30 dias. Mais visibilidade, mais candidatos.", icon: ArrowRight },
            ].map(({ name, price, desc, icon: Icon }) => (
              <div key={name} className="flex items-start gap-4 bg-secondary/40 rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground mb-1">{name}</div>
                  <div className="text-2xl font-black text-primary mb-2" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>R${price}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Dúvidas sobre os planos?</p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Tenho dúvidas sobre os planos do RepMatch.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-6 py-3 rounded-xl transition-colors hover:bg-secondary/50"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            Falar no WhatsApp
          </a>
        </div>
      </div>

      {/* PIX Modal */}
      {selectedPlan && paymentMethod === "pix" && (
        <PixModal
          plan={selectedPlan}
          billing={billing}
          onClose={() => { setSelectedPlan(null); setPaymentMethod(null); }}
        />
      )}
    </div>
  );
}
