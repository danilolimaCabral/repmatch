import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Coins, Zap, Package, Infinity, CheckCircle, ArrowLeft, Star } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const PLANS = [
  {
    key: "MANAGER_AVULSO",
    icon: Coins,
    name: "Avulso",
    credits: 1,
    price: "R$ 29,90",
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
    price: "R$ 99,90",
    priceNote: "5 créditos (R$ 19,98/cada)",
    description: "Ideal para montar uma equipe pequena",
    features: [
      "5 contatos desbloqueados",
      "Acesso a telefone e email",
      "Economia de 33% vs avulso",
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
    price: "R$ 249,90",
    priceNote: "15 créditos (R$ 16,66/cada)",
    description: "Para gerentes que precisam de mais opções",
    features: [
      "15 contatos desbloqueados",
      "Acesso a telefone e email",
      "Economia de 44% vs avulso",
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
    price: "R$ 499,90",
    priceNote: "por mês — desbloqueios ilimitados",
    description: "Para gerentes que montam equipes grandes",
    features: [
      "Desbloqueios ilimitados por 30 dias",
      "Acesso a telefone e email",
      "Melhor custo-benefício para equipes",
      "Suporte prioritário",
      "Renovação mensal automática",
    ],
    highlight: false,
    color: "border-yellow-500",
    badge: "Ilimitado",
  },
];

async function startCheckout(productKey: string, userId: number, userEmail: string, userName: string) {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productKey, userId, userEmail, userName }),
    });
    const data = await res.json();
    if (data.url) {
      toast.success("Redirecionando para o pagamento...");
      window.open(data.url, "_blank");
    } else {
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    }
  } catch {
    toast.error("Erro ao conectar com o servidor de pagamento.");
  }
}

export default function ManagerPlans() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const creditsQuery = trpc.manager.getCredits.useQuery(undefined, { enabled: isAuthenticated });

  const credits = creditsQuery.data;

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
                <div className="text-3xl font-black text-white">{plan.price}</div>
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
                onClick={() => {
                  if (!isAuthenticated || !user) {
                    toast.error("Faça login para continuar");
                    navigate("/login");
                    return;
                  }
                  startCheckout(plan.key, user.id, user.email ?? "", user.name ?? "");
                }}
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
            Pagamento seguro via Stripe
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
    </div>
  );
}
