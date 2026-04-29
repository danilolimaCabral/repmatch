import { useState } from "react";
import { Eye, EyeOff, Lock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("A senha deve ter pelo menos 6 caracteres."); return; }
    if (!token) { setError("Token inválido. Solicite uma nova recuperação."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao redefinir senha."); return; }
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#22c55e]/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex justify-center mb-10">
          <a href="/"><img src={LOGO_URL} alt="RepMatch" className="h-10 object-contain" /></a>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-[#22c55e]" />
              </div>
              <h1 className="text-xl font-black text-white mb-2">Senha redefinida!</h1>
              <p className="text-zinc-500 text-sm">Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white mb-2">Nova senha</h1>
                <p className="text-zinc-500 text-sm">Defina sua nova senha para acessar o RepMatch.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-2">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#22c55e]/50 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-400 mb-2">Confirmar nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repita a nova senha"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-[#22c55e]/50 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 text-black font-black py-3.5 rounded-xl text-sm transition-all duration-200"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Redefinir senha</>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
