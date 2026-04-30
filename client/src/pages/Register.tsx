import { useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ArrowRight, Lock, Mail, User, Building2, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";

type UserType = "company" | "representative";

export default function Register() {
  const [, navigate] = useLocation();
  const [userType, setUserType] = useState<UserType>("company");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, password, userType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar conta.");
        return;
      }
      await utils.auth.me.invalidate();
      navigate("/onboarding");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
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
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground mb-1.5">Criar sua conta</h1>
            <p className="text-muted-foreground text-sm">Crie sua conta e comece a usar.</p>
          </div>

          {/* User type selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <button
              type="button"
              onClick={() => setUserType("company")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                userType === "company"
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs font-semibold">Sou Empresa</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType("representative")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                userType === "representative"
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "bg-secondary border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-semibold">Sou Representante</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">
                {userType === "company" ? "Nome da empresa" : "Seu nome completo"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={userType === "company" ? "Empresa Exemplo Ltda." : "João da Silva"}
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

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
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground/80 mb-1.5">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className="w-full bg-input border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-muted-foreground/70 leading-relaxed">
              Ao criar sua conta, você concorda com os{" "}
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</a>
              {" "}e a{" "}
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</a>
              {" "}do RepMatch.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-md"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : (
                <>
                  Criar conta
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

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <a href="/login" className="text-primary font-semibold hover:underline">
              Entrar
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
