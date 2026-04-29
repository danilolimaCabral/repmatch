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
      // Refresh auth state
      await utils.auth.me.invalidate();
      // Redirect based on userType
      const userType = data.user?.userType;
      if (userType === "company") navigate("/dashboard/company");
      else if (userType === "representative") navigate("/dashboard/rep");
      else navigate("/onboarding");
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
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
            <h1 className="text-2xl font-black text-white mb-2">Entrar na sua conta</h1>
            <p className="text-zinc-500 text-sm">Bem-vindo de volta ao RepMatch.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="Sua senha"
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

            {/* Forgot password */}
            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-zinc-500 hover:text-[#22c55e] transition-colors">
                Esqueceu a senha?
              </a>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 disabled:cursor-not-allowed text-black font-black py-3.5 rounded-xl text-sm transition-all duration-200 shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:shadow-[0_0_50px_rgba(34,197,94,0.35)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
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
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-zinc-600">ou</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-zinc-500">
            Não tem conta?{" "}
            <a href="/register" className="text-[#22c55e] font-semibold hover:underline">
              Criar conta grátis
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
