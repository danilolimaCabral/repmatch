import { useState } from "react";
import { ArrowRight, Mail, ArrowLeft } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-clean_68a7f78f.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao solicitar recuperação.");
        return;
      }
      setSuccess(true);
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
                <Mail className="w-7 h-7 text-[#22c55e]" />
              </div>
              <h1 className="text-xl font-black text-white mb-2">Instruções enviadas</h1>
              <p className="text-zinc-500 text-sm mb-6">
                Se o e-mail <strong className="text-zinc-300">{email}</strong> estiver cadastrado, você receberá as instruções de recuperação em breve.
              </p>
              <a href="/login" className="inline-flex items-center gap-2 text-[#22c55e] text-sm font-semibold hover:underline">
                <ArrowLeft className="w-4 h-4" /> Voltar para o login
              </a>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-black text-white mb-2">Recuperar senha</h1>
                <p className="text-zinc-500 text-sm">Informe seu e-mail e enviaremos as instruções para redefinir sua senha.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
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
                      Enviando...
                    </span>
                  ) : (
                    <><ArrowRight className="w-4 h-4" /> Enviar instruções</>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <a href="/login" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
