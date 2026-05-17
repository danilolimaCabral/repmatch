import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";

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
        setError(data.error ?? "Erro ao fazer login.");
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <img src={LOGO_URL} alt="RepMatch" className="h-12 mx-auto mb-2 object-contain" />
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Acesse sua conta</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <h1 className="text-xl font-bold mb-6">Entrar</h1>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/esqueci-senha" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entrando...</> : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Cadastre-se grátis
            </Link>
          </div>
        </div>

        {/* Type hint cards */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">🏢</div>
            <div className="font-medium text-foreground text-sm">Empresa</div>
            <div>Busque representantes</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">🤝</div>
            <div className="font-medium text-foreground text-sm">Representante</div>
            <div>Encontre vagas</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <div className="text-lg mb-1">📊</div>
            <div className="font-medium text-foreground text-sm">Gerente</div>
            <div>Monte sua equipe</div>
          </div>
        </div>
      </div>
    </div>
  );
}
