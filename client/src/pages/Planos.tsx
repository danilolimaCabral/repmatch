import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, ArrowRight, Users, Building2, Copy, MessageCircle,
  QrCode, Smartphone, Shield, Zap, CreditCard, Loader2, CheckCheck, X
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";
const WHATSAPP_NUMBER = "5541999499815";

type PlanType = "rep" | "company";
type BillingCycle = "monthly" | "annual";
type PaymentStep = "choose" | "pix_form" | "pix_qr" | "card_redirect" | "success";

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
    name: "Free",
    monthly: 0,
    description: "Para começar sem custo",
    features: ["Perfil visível na base", "Candidaturas ilimitadas", "Chat com empresas", "Aparece no fim da lista"],
    productKey: "REP_FREE",
  },
  {
    name: "Bronze",
    monthly: 9.99,
    description: "Para representantes que querem começar a se destacar",
    features: ["Tudo do Free", "Badge Bronze no perfil", "Aparece antes dos Free", "Acesso a vagas exclusivas Bronze"],
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
    features: ["Até 3 vagas ativas", "5 desbloqueios de contato/mês", "Acesso a reps Bronze+", "Ranking Bronze", "Chat com candidatos"],
    productKey: "COMPANY_STARTER",
  },
  {
    name: "Pro",
    monthly: 149,
    description: "Para empresas em expansão comercial",
    features: ["Até 10 vagas ativas", "15 desbloqueios de contato/mês", "Acesso a todos os reps", "Match por IA", "Ranking Gold", "Notificações de candidatos"],
    highlight: true,
    productKey: "COMPANY_PRO",
  },
  {
    name: "Enterprise",
    monthly: 399,
    description: "Para empresas com alta demanda de representantes",
    features: ["Vagas ilimitadas", "Desbloqueios ilimitados", "Reps Ouro em destaque", "Ranking Platinum", "Gerente de conta dedicado", "API de integração"],
    productKey: "COMPANY_ENTERPRISE",
  },
];

// ─── Modal de Pagamento ───────────────────────────────────────────────────────
function PaymentModal({
  plan,
  billing,
  onClose,
}: {
  plan: Plan;
  billing: BillingCycle;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const amount = billing === "annual" ? parseFloat((plan.monthly * 0.8 * 12).toFixed(2)) : plan.monthly;
  const period = billing === "annual" ? "ano" : "mês";
  const displayAmount = amount.toFixed(2).replace(".", ",");

  const [step, setStep] = useState<PaymentStep>("choose");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ paymentId: number; qrCode: string; qrCodeBase64: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === "pix_qr" && pixData) {
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [step, pixData]);

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
            .replace(/(\d{3})(\d{3})/, "$1.$2")
            .replace(/(\d{3})/, "$1");
  };

  const handlePixGenerate = async () => {
    const rawCpf = cpf.replace(/\D/g, "");
    if (rawCpf.length !== 11) {
      toast.error("Informe um CPF válido com 11 dígitos");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mp/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: plan.productKey,
          userId: user?.id ?? 0,
          userEmail: user?.email ?? "cliente@repmatch.com.br",
          userName: user?.name ?? "Cliente RepMatch",
          cpf: rawCpf,
          annual: billing === "annual",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar PIX");
      setPixData({ paymentId: data.paymentId, qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
      setStep("pix_qr");
      setCountdown(300);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const handleCardCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mp/preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: plan.productKey,
          userId: user?.id ?? 0,
          userEmail: user?.email ?? "cliente@repmatch.com.br",
          userName: user?.name ?? "Cliente RepMatch",
          annual: billing === "annual",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar preferência");
      toast.info("Redirecionando para o Mercado Pago...");
      window.open(data.initPoint, "_blank");
      setStep("card_redirect");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-foreground mb-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            {step === "choose" ? "Escolha como pagar" : step === "pix_form" ? "Pagar via PIX" : step === "pix_qr" ? "QR Code PIX" : step === "card_redirect" ? "Pagamento iniciado" : "Pagamento confirmado!"}
          </h3>
          <p className="text-muted-foreground text-sm">
            Plano <strong className="text-foreground">{plan.name}</strong> — <strong className="text-primary">R${displayAmount}/{period}</strong>
          </p>
        </div>

        {/* Step: Choose payment method */}
        {step === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("pix_form")}
              className="w-full flex items-center gap-4 bg-secondary/50 hover:bg-secondary border border-border rounded-xl p-4 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <QrCode className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="font-bold text-foreground">Pagar via PIX</div>
                <div className="text-xs text-muted-foreground">QR Code gerado na hora. Aprovação instantânea.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <button
              onClick={handleCardCheckout}
              disabled={loading}
              className="w-full flex items-center gap-4 bg-secondary/50 hover:bg-secondary border border-border rounded-xl p-4 transition-colors text-left disabled:opacity-60"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                {loading ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" /> : <CreditCard className="w-6 h-6 text-blue-500" />}
              </div>
              <div>
                <div className="font-bold text-foreground">Cartão de Crédito</div>
                <div className="text-xs text-muted-foreground">Parcelamento disponível. Via Mercado Pago.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>

            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground justify-center">
              <Shield className="w-3.5 h-3.5" />
              Pagamento seguro via Mercado Pago
            </div>
          </div>
        )}

        {/* Step: PIX form (CPF) */}
        {step === "pix_form" && (
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
              Para gerar o QR Code PIX, precisamos do seu CPF (exigência do Banco Central para pagamentos instantâneos).
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">CPF do pagador</label>
              <input
                type="text"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={14}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("choose")}>Voltar</Button>
              <Button className="flex-1" onClick={handlePixGenerate} disabled={loading || cpf.replace(/\D/g, "").length !== 11}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                Gerar QR Code
              </Button>
            </div>
          </div>
        )}

        {/* Step: PIX QR Code */}
        {step === "pix_qr" && pixData && (
          <div className="space-y-4">
            {/* Countdown */}
            <div className="text-center">
              <div className={`text-2xl font-black font-mono ${countdown < 60 ? "text-red-400" : "text-primary"}`}>
                {formatTime(countdown)}
              </div>
              <div className="text-xs text-muted-foreground">tempo restante para pagar</div>
            </div>

            {/* QR Code Image */}
            {pixData.qrCodeBase64 && (
              <div className="flex justify-center">
                <div className="bg-card p-3 rounded-xl border border-border">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Copy code */}
            <div className="bg-secondary/60 border border-border rounded-xl p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">PIX Copia e Cola</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-xs text-foreground truncate">{pixData.qrCode?.slice(0, 40)}...</div>
                <button
                  onClick={handleCopyPix}
                  className="flex items-center gap-1.5 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="text-xs text-center text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
              ⚡ Após o pagamento, seu plano será ativado automaticamente em segundos.
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>Fechar — já paguei</Button>
          </div>
        )}

        {/* Step: Card redirect */}
        {step === "card_redirect" && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/15 flex items-center justify-center mx-auto">
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-muted-foreground text-sm">
              Uma nova aba foi aberta com o checkout do Mercado Pago. Complete o pagamento lá e seu plano será ativado automaticamente.
            </p>
            <Button variant="outline" className="w-full" onClick={onClose}>Fechar</Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Planos() {
  const [planType, setPlanType] = useState<PlanType>("company");
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const plans = planType === "rep" ? REP_PLANS : COMPANY_PLANS;

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
            <a href="/login" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm transition-colors">
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
            Sem contrato de fidelidade. Cancele quando quiser. PIX ou cartão via Mercado Pago.
          </p>
        </div>

        {/* Payment Method Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">PIX Instantâneo</div>
              <div className="text-xs text-muted-foreground">QR Code gerado na hora</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Cartão de Crédito</div>
              <div className="text-xs text-muted-foreground">Via Mercado Pago seguro</div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-6 py-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Ativação automática</div>
              <div className="text-xs text-muted-foreground">Após confirmação do pagamento</div>
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
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none ${billing === "annual" ? "bg-primary" : "bg-secondary border border-border"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform duration-300 ${billing === "annual" ? "translate-x-7" : ""}`} />
          </button>
          <span className={`text-sm font-semibold transition-colors ${billing === "annual" ? "text-foreground" : "text-muted-foreground"}`}>
            Anual <span className="text-primary text-xs font-bold">-20%</span>
          </span>
        </div>

        {/* Plans Grid */}
        {(() => {
          // Color config per plan name
          const planColors: Record<string, { border: string; accent: string; badgeBg: string; checkColor: string; btnClass: string; priceCls: string }> = {
            Free:       { border: "border-border",           accent: "bg-secondary/50",         badgeBg: "",                                     checkColor: "text-muted-foreground", btnClass: "bg-secondary border border-border text-foreground hover:bg-secondary/80",                                     priceCls: "text-foreground" },
            Bronze:     { border: "border-orange-400/50",    accent: "bg-orange-400/8",         badgeBg: "bg-orange-400/15 text-orange-400",       checkColor: "text-orange-400",       btnClass: "bg-card border border-orange-400/40 text-orange-500 hover:bg-orange-50",                              priceCls: "text-foreground" },
            Prata:      { border: "border-primary",          accent: "bg-primary/6",            badgeBg: "bg-primary text-primary-foreground",     checkColor: "text-primary",          btnClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",                  priceCls: "text-primary" },
            Ouro:       { border: "border-yellow-400/50",    accent: "bg-yellow-400/8",         badgeBg: "bg-yellow-400/15 text-yellow-600",       checkColor: "text-yellow-500",       btnClass: "bg-card border border-yellow-400/40 text-yellow-600 hover:bg-yellow-50",                              priceCls: "text-foreground" },
            Starter:    { border: "border-border",           accent: "bg-secondary/50",         badgeBg: "",                                     checkColor: "text-muted-foreground", btnClass: "bg-secondary border border-border text-foreground hover:bg-secondary/80",                                     priceCls: "text-foreground" },
            Pro:        { border: "border-primary",          accent: "bg-primary/6",            badgeBg: "bg-primary text-primary-foreground",     checkColor: "text-primary",          btnClass: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",                  priceCls: "text-primary" },
            Enterprise: { border: "border-purple-400/50",   accent: "bg-purple-400/8",         badgeBg: "bg-purple-400/15 text-purple-500",       checkColor: "text-purple-500",       btnClass: "bg-card border border-purple-400/40 text-purple-600 hover:bg-purple-50",                            priceCls: "text-foreground" },
          };
          const cols = plans.length === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3";
          return (
            <div className={`grid ${cols} gap-5 mb-16 items-stretch`}>
              {plans.map((plan) => {
                const price = billing === "annual" && plan.monthly > 0 ? (plan.monthly * 0.8).toFixed(2) : plan.monthly.toFixed(2);
                const annualTotal = (plan.monthly * 0.8 * 12).toFixed(2);
                const savings = (plan.monthly * 12 * 0.2).toFixed(0);
                const cfg = planColors[plan.name] ?? planColors["Free"];
                const isFree = plan.monthly === 0;

                return (
                  <div
                    key={plan.productKey}
                    className={`relative rounded-2xl border-2 ${cfg.border} bg-card flex flex-col transition-all duration-200 overflow-hidden ${
                      plan.highlight ? "shadow-xl" : "hover:shadow-md"
                    }`}
                  >
                    {/* Popular badge */}
                    {plan.highlight && (
                      <div className="absolute -top-px left-1/2 -translate-x-1/2">
                        <span className={`${cfg.badgeBg} text-[10px] font-black px-4 py-1 rounded-b-lg tracking-widest uppercase block`}>
                          MAIS POPULAR
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex flex-col flex-1">
                      {/* Plan name */}
                      <div className="mb-4 mt-1">
                        <h3 className="text-base font-black text-foreground" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                          {plan.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{plan.description}</p>
                      </div>

                      {/* Price */}
                      <div className="mb-5">
                        <div className="flex items-end gap-0.5">
                          <span className={`text-4xl font-black leading-none ${cfg.priceCls}`} style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
                            {isFree ? "R$0" : `R$${price.replace(".", ",")}`}
                          </span>
                          <span className="text-muted-foreground text-sm mb-1 ml-1">{isFree ? "para sempre" : "/mês"}</span>
                        </div>
                        {billing === "annual" && !isFree && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="text-[10px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full">-20%</span>
                            <span className="text-[10px] text-muted-foreground">R${annualTotal}/ano · Economize R${savings}</span>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-border mb-4" />

                      {/* Features */}
                      <ul className="space-y-2 mb-6 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <CheckCircle className={`w-4 h-4 ${cfg.checkColor} flex-shrink-0 mt-0.5`} />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      {isFree ? (
                        <a
                          href="/cadastro"
                          className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all bg-secondary border border-border text-foreground hover:bg-secondary/80"
                        >
                          Cadastrar agora
                        </a>
                      ) : (
                        <button
                          onClick={() => setSelectedPlan(plan)}
                          className={`w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all ${cfg.btnClass}`}
                        >
                          Assinar {plan.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}


        {/* One-time charges */}
        <div className="border border-border rounded-2xl p-8 mb-12 bg-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-lg text-foreground">Cobranças avulsas</h3>
              <p className="text-xs text-muted-foreground">Sem assinatura · Pague apenas o que usar</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { name: "Desbloquear Contato", price: 29, desc: "Acesse o contato direto de um representante específico. Cobrança única, sem recorrência.", icon: Zap, productKey: "UNLOCK_CONTACT", color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
              { name: "Vaga em Destaque", price: 49, desc: "Destaque sua vaga no topo dos resultados por 30 dias. Mais visibilidade, mais candidatos.", icon: ArrowRight, productKey: "FEATURED_JOB", color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
            ].map(({ name, price, desc, icon: Icon, productKey, color, bg, border }) => (
              <div key={name} className={`rounded-xl border ${border} ${bg} p-6 flex flex-col gap-4`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-sm">{name}</div>
                    <div className={`text-2xl font-black ${color}`} style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>R${price}</div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                <button
                  onClick={() => setSelectedPlan({ name, monthly: price, description: desc, features: [], productKey })}
                  className={`w-full flex items-center justify-center gap-2 ${bg} hover:opacity-80 border ${border} ${color} text-sm font-bold px-4 py-3 rounded-xl transition-all`}
                >
                  <Smartphone className="w-4 h-4" />
                  Pagar agora
                </button>
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
            className="inline-flex items-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#25D366] font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com o suporte via WhatsApp
          </a>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          billing={billing}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
