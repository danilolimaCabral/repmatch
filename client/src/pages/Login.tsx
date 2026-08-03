import { useState } from "react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30" style={{ background: "oklch(0.52 0.17 152 / 0.10)" }} />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20" style={{ background: "oklch(0.52 0.17 210 / 0.08)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <Link href="/">
          <img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain mb-8 hover:opacity-80 transition-opacity" />
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-4 tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            Marketplace B2B · RepMatch
          </div>
          <h1 className="text-2xl font-black text-foreground mb-1" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", letterSpacing: "-0.03em" }}>
            Bem-vindo de volta
          </h1>
          <p className="text-muted-foreground text-sm">Entre com seu e-mail e senha para acessar</p>
        </div>

        {/* Login form card */}
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-xl shadow-black/8">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2">
              <span className="text-red-500 font-bold shrink-0">!</span>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground text-sm font-semibold">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
                className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-card transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-foreground text-sm font-semibold">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:bg-card transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/esqueci-senha" className="text-xs text-primary hover:opacity-80 font-semibold transition-opacity">
                Esqueceu a senha?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Entrando...</>
              ) : (
                <>Entrar <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/register" className="text-primary hover:opacity-80 font-semibold transition-opacity">
              Cadastre-se grátis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
