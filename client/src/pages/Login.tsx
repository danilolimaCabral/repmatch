import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login.");
        return;
      }
      await utils.auth.me.invalidate();
      const { userType, role } = data.user || {};
      if (role === "admin") navigate("/admin");
      else if (userType === "company") navigate("/dashboard/company");
      else if (userType === "representative") navigate("/dashboard/rep");
      else navigate("/onboarding");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Subtle background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]" style={{ background: "oklch(0.62 0.18 152 / 0.05)" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <a href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-9 object-contain" />
          </a>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1.5">Entrar na sua conta</h1>
            <p className="text-muted-foreground text-sm">Bem-vindo de volta ao RepMatch.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Sua senha"
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-12 py-3 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <a href="/register" className="text-primary font-semibold hover:underline">
              Criar conta grátis
            </a>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-xs text-muted-foreground/50">
          <a href="/" className="hover:text-muted-foreground transition-colors">← Voltar ao início</a>
        </p>
      </div>
    </div>
  );
}
