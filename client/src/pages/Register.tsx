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
      // Refresh auth state
      await utils.auth.me.invalidate();
      // Redirect to onboarding to complete profile
      navigate("/onboarding");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4 py-12" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22c55e]/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <a href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain" />
          </a>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-white mb-2">Criar sua conta</h1>
            <p className="text-zinc-500 text-sm">Comece grátis. Sem cartão de crédito.</p>
          </div>

          {/* User type selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <button
              type="button"
              onClick={() => setUserType("company")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                userType === "company"
                  ? "bg-[#22c55e]/10 border-[#22c55e]/50 text-[#22c55e]"
                  : "bg-white/[0.02] border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-xs font-bold">Sou Empresa</span>
            </button>
            <button
              type="button"
              onClick={() => setUserType("representative")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                userType === "representative"
                  ? "bg-[#22c55e]/10 border-[#22c55e]/50 text-[#22c55e]"
                  : "bg-white/[0.02] border-white/10 text-zinc-500 hover:border-white/20 hover:text-zinc-300"
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold">Sou Representante</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">
                {userType === "company" ? "Nome da empresa" : "Seu nome completo"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={userType === "company" ? "Empresa Exemplo Ltda." : "João da Silva"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#22c55e]/50 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#22c55e]/50 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#22c55e]/50 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-zinc-400 mb-2">Confirmar senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repita a senha"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#22c55e]/50 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Terms */}
            <p className="text-xs text-zinc-600 leading-relaxed">
              Ao criar sua conta, você concorda com os{" "}
              <a href="#" className="text-zinc-400 hover:text-[#22c55e] transition-colors">Termos de Uso</a>
              {" "}e a{" "}
              <a href="#" className="text-zinc-400 hover:text-[#22c55e] transition-colors">Política de Privacidade</a>
              {" "}do RepMatch.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-3.5 rounded-xl text-sm transition-all duration-200 shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:shadow-[0_0_50px_rgba(34,197,94,0.35)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Criando conta...
                </span>
              ) : (
                <>
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-zinc-600">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Login link */}
          <p className="text-center text-sm text-zinc-500">
            Já tem conta?{" "}
            <a href="/login" className="text-[#22c55e] font-semibold hover:underline">
              Entrar
            </a>
          </p>
        </div>

        {/* Back to home */}
        <p className="text-center mt-6 text-xs text-zinc-700">
          <a href="/" className="hover:text-zinc-500 transition-colors">← Voltar ao início</a>
        </p>
      </div>
    </div>
  );
}
