import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft, Building2, Handshake, BarChart3, ArrowRight, Sparkles } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const TYPE_CONFIG = {
  empresa: {
    label: "Empresa",
    subtitle: "Busque e contrate representantes",
    description: "Acesse o maior marketplace de representantes do Brasil",
    image: "/manus-storage/login-empresa_76e16f51.jpg",
    icon: Building2,
    gradient: "from-blue-600 to-blue-800",
    accentColor: "text-blue-600",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    accentRing: "focus:ring-blue-500/20 focus:border-blue-400",
    badge: "Para empresas",
    badgeBg: "bg-blue-100 text-blue-700",
    btnClass: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30",
    registerType: "empresa",
  },
  rep: {
    label: "Representante",
    subtitle: "Encontre vagas e empresas",
    description: "Cadastro 100% gratuito — acesse todas as vagas",
    image: "/manus-storage/login-representante_f48c0272.jpg",
    icon: Handshake,
    gradient: "from-emerald-600 to-emerald-800",
    accentColor: "text-emerald-600",
    accentBg: "bg-emerald-50",
    accentBorder: "border-emerald-200",
    accentRing: "focus:ring-emerald-500/20 focus:border-emerald-400",
    badge: "Grátis!",
    badgeBg: "bg-emerald-100 text-emerald-700",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30",
    registerType: "rep",
  },
  gerente: {
    label: "Gerente Comercial",
    subtitle: "Monte e gerencie sua equipe",
    description: "Encontre representantes e forme seu time de vendas",
    image: "/manus-storage/login-gerente_7f6ab663.jpg",
    icon: BarChart3,
    gradient: "from-purple-600 to-purple-800",
    accentColor: "text-purple-600",
    accentBg: "bg-purple-50",
    accentBorder: "border-purple-200",
    accentRing: "focus:ring-purple-500/20 focus:border-purple-400",
    badge: "Para gestores",
    badgeBg: "bg-purple-100 text-purple-700",
    btnClass: "bg-purple-600 hover:bg-purple-700 shadow-purple-600/30",
    registerType: "gerente",
  },
} as const;

type UserTypeKey = keyof typeof TYPE_CONFIG;

function getRedirectByUserType(userType: string, role: string): string {
  if (role === "admin") return "/admin";
  switch (userType) {
    case "representative": return "/dashboard/rep";
    case "company": return "/dashboard/company";
    case "manager": return "/dashboard/manager";
    case "pending": return "/onboarding";
    default: return "/onboarding";
  }
}

export default function Login() {
  const [selectedType, setSelectedType] = useState<UserTypeKey | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { success?: boolean; error?: string; user?: { userType: string; role: string } };
      if (!res.ok || !data.success) {
        setError(data.error ?? "E-mail ou senha incorretos.");
        return;
      }
      const redirect = getRedirectByUserType(data.user?.userType ?? "pending", data.user?.role ?? "user");
      window.location.href = redirect;
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Type selection ────────────────────────────────────────────────
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center px-4 py-8">
        {/* Subtle background decoration */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30" style={{ background: "oklch(0.62 0.18 152 / 0.12)" }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20" style={{ background: "oklch(0.62 0.18 210 / 0.10)" }} />
        </div>

        <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
          {/* Logo */}
          <Link href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain mb-10 hover:opacity-80 transition-opacity" />
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-4 py-2 rounded-full mb-5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              Marketplace B2B · RepMatch
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-2" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", letterSpacing: "-0.03em" }}>
              Bem-vindo ao RepMatch
            </h1>
            <p className="text-slate-500 text-sm">Selecione seu perfil para entrar na plataforma</p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full mb-8">
            {(Object.entries(TYPE_CONFIG) as [UserTypeKey, typeof TYPE_CONFIG[UserTypeKey]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedType(key)}
                  className="group relative h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 hover:-translate-y-1"
                >
                  {/* Background image */}
                  <img
                    src={cfg.image}
                    alt={cfg.label}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Gradient overlay — lighter at top, darker at bottom */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${cfg.gradient} opacity-75 group-hover:opacity-80 transition-opacity`} />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col justify-between p-5">
                    <div className="flex items-start justify-between">
                      <span className={`${cfg.badgeBg} text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm`}>
                        {cfg.badge}
                      </span>
                      <div className="bg-white/25 backdrop-blur-sm rounded-xl p-2.5 border border-white/20">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="text-left">
                      <h3 className="text-white text-xl font-bold leading-tight drop-shadow-sm">{cfg.label}</h3>
                      <p className="text-white/85 text-sm mt-1 drop-shadow-sm">{cfg.subtitle}</p>
                      <p className="text-white/65 text-xs mt-2">{cfg.description}</p>
                      <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                        <span className="text-white text-xs font-semibold flex-1">Entrar como {cfg.label}</span>
                        <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Register link */}
          <p className="text-slate-500 text-sm text-center">
            Ainda não tem conta?{" "}
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
              Cadastre-se grátis →
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: Login form for selected type ─────────────────────────────────
  const cfg = TYPE_CONFIG[selectedType];
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col items-center justify-center px-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-25" style={{ background: "oklch(0.62 0.18 152 / 0.12)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-9 object-contain hover:opacity-80 transition-opacity" />
          </Link>
        </div>

        {/* Back button */}
        <button
          onClick={() => { setSelectedType(null); setError(null); }}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Trocar perfil
        </button>

        {/* Selected type indicator */}
        <div className={`flex items-center gap-3 mb-6 p-3.5 rounded-2xl ${cfg.accentBg} border ${cfg.accentBorder}`}>
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm">
            <img src={cfg.image} alt={cfg.label} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon className={`w-4 h-4 ${cfg.accentColor}`} />
              <span className="text-slate-800 font-bold text-sm">{cfg.label}</span>
              <span className={`${cfg.badgeBg} text-xs font-bold px-2 py-0.5 rounded-full`}>{cfg.badge}</span>
            </div>
            <p className="text-slate-500 text-xs mt-0.5 truncate">{cfg.subtitle}</p>
          </div>
        </div>

        {/* Login form card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl shadow-slate-200/60">
          <h2 className="text-slate-900 text-lg font-bold mb-5" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif" }}>
            Entrar como {cfg.label}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0">!</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 text-sm font-semibold">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/esqueci-senha" className={`text-xs ${cfg.accentColor} hover:opacity-80 font-semibold transition-opacity`}>
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 ${cfg.btnClass} text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
              ) : (
                <>Entrar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center text-sm text-slate-500">
            Não tem conta?{" "}
            <Link href={`/register?type=${cfg.registerType}`} className={`${cfg.accentColor} hover:opacity-80 font-semibold transition-opacity`}>
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
