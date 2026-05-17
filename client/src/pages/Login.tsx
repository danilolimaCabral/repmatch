import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowLeft, Building2, Handshake, BarChart3 } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const TYPE_CONFIG = {
  empresa: {
    label: "Empresa",
    subtitle: "Busque e contrate representantes",
    description: "Acesse o maior marketplace de representantes do Brasil",
    image: "/manus-storage/login-empresa_76e16f51.jpg",
    icon: Building2,
    color: "from-blue-900/80 to-blue-700/60",
    badge: "Para empresas",
    badgeColor: "bg-blue-500",
    registerType: "empresa",
  },
  rep: {
    label: "Representante",
    subtitle: "Encontre vagas e empresas",
    description: "Cadastro 100% gratuito — acesse todas as vagas",
    image: "/manus-storage/login-representante_f48c0272.jpg",
    icon: Handshake,
    color: "from-emerald-900/80 to-emerald-700/60",
    badge: "Grátis!",
    badgeColor: "bg-emerald-500",
    registerType: "rep",
  },
  gerente: {
    label: "Gerente Comercial",
    subtitle: "Monte e gerencie sua equipe",
    description: "Encontre representantes e forme seu time de vendas",
    image: "/manus-storage/login-gerente_7f6ab663.jpg",
    icon: BarChart3,
    color: "from-purple-900/80 to-purple-700/60",
    badge: "Para gestores",
    badgeColor: "bg-purple-500",
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <Link href="/">
          <img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain mb-10 opacity-90 hover:opacity-100 transition-opacity" />
        </Link>

        <h1 className="text-white text-2xl font-bold mb-2 text-center">Bem-vindo ao RepMatch</h1>
        <p className="text-slate-400 text-sm mb-8 text-center">Selecione seu perfil para entrar</p>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
          {(Object.entries(TYPE_CONFIG) as [UserTypeKey, typeof TYPE_CONFIG[UserTypeKey]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setSelectedType(key)}
                className="group relative h-64 rounded-2xl overflow-hidden shadow-2xl hover:scale-[1.03] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {/* Background image */}
                <img
                  src={cfg.image}
                  alt={cfg.label}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cfg.color}`} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-between p-5">
                  <div className="flex items-start justify-between">
                    <span className={`${cfg.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full`}>
                      {cfg.badge}
                    </span>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-white text-xl font-bold leading-tight">{cfg.label}</h3>
                    <p className="text-white/80 text-sm mt-1">{cfg.subtitle}</p>
                    <p className="text-white/60 text-xs mt-2">{cfg.description}</p>
                    <div className="mt-3 flex items-center gap-1 text-white/90 text-xs font-semibold">
                      Entrar <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Register link */}
        <p className="mt-8 text-slate-400 text-sm text-center">
          Ainda não tem conta?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    );
  }

  // ── Step 2: Login form for selected type ─────────────────────────────────
  const cfg = TYPE_CONFIG[selectedType];
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <Link href="/">
        <img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain mb-8 opacity-90 hover:opacity-100 transition-opacity" />
      </Link>

      <div className="w-full max-w-sm">
        {/* Back button */}
        <button
          onClick={() => { setSelectedType(null); setError(null); }}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Trocar perfil
        </button>

        {/* Selected type indicator */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
            <img src={cfg.image} alt={cfg.label} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold text-sm">{cfg.label}</span>
              <span className={`${cfg.badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{cfg.badge}</span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>

        {/* Login form */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-white text-lg font-bold mb-5">Entrar como {cfg.label}</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 text-sm">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-emerald-400"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 text-sm">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-emerald-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/esqueci-senha" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              disabled={loading}
            >
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</> : "Entrar"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-400">
            Não tem conta?{" "}
            <Link href={`/register?type=${cfg.registerType}`} className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Cadastre-se grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
