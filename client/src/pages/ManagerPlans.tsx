import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Coins, Zap, Package, Infinity, CheckCircle, ArrowLeft, Star,
  QrCode, CreditCard, Loader2, Copy, CheckCheck, X, Smartphone
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

type PaymentStep = "choose" | "pix_form" | "pix_qr" | "card_redirect";

interface ManagerPlan {
  key: string;
  icon: React.ElementType;
  name: string;
  credits: number;
  price: number;
  priceDisplay: string;
  priceNote: string;
  description: string;
  features: string[];
  highlight: boolean;
  color: string;
  badge: string | null;
}

const PLANS: ManagerPlan[] = [
  {
    key: "MANAGER_AVULSO",
    icon: Coins,
    name: "Avulso",
    credits: 1,
    price: 29.00,
    priceDisplay: "R$ 29,00",
    priceNote: "por contato",
    description: "Desbloqueie 1 contato de representante",
    features: [
      "1 contato desbloqueado",
      "Acesso a telefone e email",
      "Válido por tempo indeterminado",
    ],
    highlight: false,
    color: "border-gray-700",
    badge: null,
  },
  {
    key: "MANAGER_STARTER",
    icon: Package,
    name: "Pacote Starter",
    credits: 5,
    price: 99.90,
    priceDisplay: "R$ 99,90",
    priceNote: "5 créditos (R$ 19,98/cada)",
    description: "Ideal para montar uma equipe pequena",
    features: [
      "5 contatos desbloqueados",
      "Acesso a telefone e email",
      "Economia de 31% vs avulso",
      "Válido por tempo indeterminado",
    ],
    highlight: false,
    color: "border-blue-600",
    badge: "Econômico",
  },
  {
    key: "MANAGER_PRO",
    icon: Zap,
    name: "Pacote Pro",
    credits: 15,
    price: 249.90,
    priceDisplay: "R$ 249,90",
    priceNote: "15 créditos (R$ 16,66/cada)",
    description: "Para gerentes que precisam de mais opções",
    features: [
      "15 contatos desbloqueados",
      "Acesso a telefone e email",
      "Economia de 43% vs avulso",
      "Válido por tempo indeterminado",
      "Suporte prioritário",
    ],
    highlight: true,
    color: "border-green-500",
    badge: "Mais Popular",
  },
  {
    key: "MANAGER_ILIMITADO",
    icon: Infinity,
    name: "Ilimitado",
    credits: 9999,
    price: 499.90,
    priceDisplay: "R$ 499,90",
    priceNote: "por mês — desbloqueios ilimitados",
    description: "Para gerentes que montam equipes grandes",
    features: [
      "Desbloqueios ilimitados por 30 dias",
      "Acesso a telefone e email",
      "Melhor custo-benefício para equipes",
      "Suporte prioritário",
      "Renovação mensal",
    ],
    highlight: false,
    color: "border-yellow-500",
    badge: "Ilimitado",
  },
];

// ─── Modal de Pagamento ───────────────────────────────────────────────────────
function PaymentModal({
  plan,
  onClose,
}: {
  plan: ManagerPlan;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<PaymentStep>("choose");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ paymentId: number; qrCode: string; qrCodeBase64: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (step === "pix_qr" && pixData) {
      timerRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timerRef.current!); return 0; }
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
          planKey: plan.key,
          userId: user?.id ?? 0,
          userEmail: user?.email ?? "gerente@repmatch.com.br",
          userName: user?.name ?? "Gerente RepMatch",
          cpf: rawCpf,
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
          planKey: plan.key,
          userId: user?.id ?? 0,
          userEmail: user?.email ?? "gerente@repmatch.com.br",
          userName: user?.name ?? "Gerente RepMatch",
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
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="font-bold text-white text-lg">{plan.name}</h2>
            <p className="text-green-400 font-black text-2xl">{plan.priceDisplay}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Step: choose */}
          {step === "choose" && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400 mb-4">Escolha a forma de pagamento:</p>
              <button
                onClick={() => setStep("pix_form")}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Smartphone className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-white">PIX</div>
                  <div className="text-xs text-gray-400">Pagamento instantâneo — aprovação em segundos</div>
                </div>
              </button>
              <button
                onClick={handleCardCheckout}
                disabled={loading}
                className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-left disabled:opacity-50"
              >
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-white flex items-center gap-2">
                    Cartão de Crédito
                    {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  </div>
                  <div className="text-xs text-gray-400">Via Mercado Pago — seguro e rápido</div>
                </div>
              </button>
            </div>
          )}

          {/* Step: pix_form */}
          {step === "pix_form" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">Informe seu CPF para gerar o QR Code PIX:</p>
              <input
                type="text"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep("choose")} className="flex-1 text-gray-400">
                  Voltar
                </Button>
                <Button
                  onClick={handlePixGenerate}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Gerar PIX"}
                </Button>
              </div>
            </div>
          )}

          {/* Step: pix_qr */}
          {step === "pix_qr" && pixData && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <QrCode className="w-4 h-4" />
                Expira em <span className={`font-mono font-bold ${countdown < 60 ? "text-red-400" : "text-green-400"}`}>{formatTime(countdown)}</span>
              </div>
              {pixData.qrCodeBase64 && (
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 mx-auto rounded-xl border border-white/10"
                />
              )}
              <button
                onClick={handleCopyPix}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-sm text-white"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado!" : "Copiar código PIX"}
              </button>
              <p className="text-xs text-gray-500">
                Após o pagamento, seus créditos serão adicionados automaticamente em até 1 minuto.
              </p>
            </div>
          )}

          {/* Step: card_redirect */}
          {step === "card_redirect" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="font-bold text-white">Redirecionado para o Mercado Pago</h3>
              <p className="text-sm text-gray-400">
                Complete o pagamento na aba que foi aberta. Seus créditos serão adicionados automaticamente após a confirmação.
              </p>
              <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
                Fechar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────
export default function ManagerPlans() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const creditsQuery = trpc.manager.getCredits.useQuery(undefined, { enabled: isAuthenticated });
  const [selectedPlan, setSelectedPlan] = useState<ManagerPlan | null>(null);

  const credits = creditsQuery.data;

  const handleSelectPlan = (plan: ManagerPlan) => {
    if (!isAuthenticated || !user) {
      toast.error("Faça login para continuar");
      navigate("/login");
      return;
    }
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/manager")} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <img src={LOGO_URL} alt="RepMatch" className="h-8" />
        </div>
        {isAuthenticated && credits && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2">
            <Coins className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Saldo atual:</span>
            <span className="font-bold text-green-400">
              {credits.isUnlimited ? "Ilimitado" : `${credits.credits} crédito${credits.credits !== 1 ? "s" : ""}`}
            </span>
          </div>
        )}
      </header>

      {/* Hero */}
      <div className="text-center py-12 px-6">
        <h1 className="text-4xl font-black mb-3">
          Planos para <span className="text-green-400">Gerente Comercial</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Desbloqueie contatos de representantes verificados e monte sua equipe de vendas.
          Cada crédito libera o telefone e email completo de 1 representante.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <div
              key={plan.key}
              className={`relative rounded-2xl border-2 ${plan.color} bg-white/5 p-6 flex flex-col ${plan.highlight ? "ring-2 ring-green-500/50 shadow-lg shadow-green-500/10" : ""}`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                  plan.highlight ? "bg-green-500 text-black" :
                  plan.key === "MANAGER_ILIMITADO" ? "bg-yellow-500 text-black" :
                  "bg-blue-600 text-white"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${plan.highlight ? "bg-green-500/20" : "bg-white/10"}`}>
                  <Icon className={`w-5 h-5 ${plan.highlight ? "text-green-400" : "text-gray-300"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-gray-500">
                    {plan.credits >= 9999 ? "Ilimitado" : `${plan.credits} crédito${plan.credits !== 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-black text-white">{plan.priceDisplay}</div>
                <div className="text-xs text-gray-500 mt-1">{plan.priceNote}</div>
              </div>

              <p className="text-sm text-gray-400 mb-4">{plan.description}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full font-bold ${
                  plan.highlight
                    ? "bg-green-500 hover:bg-green-400 text-black"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {plan.key === "MANAGER_AVULSO" ? "Comprar 1 crédito" :
                 plan.key === "MANAGER_ILIMITADO" ? "Assinar Ilimitado" :
                 `Comprar ${plan.credits} créditos`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div className="border-t border-white/10 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Pagamento via PIX ou Cartão
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Créditos não expiram (exceto Ilimitado)
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Representantes verificados com CORE
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Suporte via WhatsApp
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  );
}
