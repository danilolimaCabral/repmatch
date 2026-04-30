import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Cookie, X, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "repmatch_cookie_consent";
const COOKIE_EXPIRY_DAYS = 365;

type ConsentState = "accepted" | "rejected" | "pending";

function getStoredConsent(): ConsentState {
  try {
    const val = localStorage.getItem(COOKIE_KEY);
    if (val === "accepted" || val === "rejected") return val;
  } catch {}
  return "pending";
}

function storeConsent(state: "accepted" | "rejected") {
  try {
    localStorage.setItem(COOKIE_KEY, state);
    // Also set a cookie for server-side reading if needed
    const expires = new Date();
    expires.setDate(expires.getDate() + COOKIE_EXPIRY_DAYS);
    document.cookie = `${COOKIE_KEY}=${state}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch {}
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(getStoredConsent);
  return {
    hasAnalytics: consent === "accepted",
    consent,
    accept: () => { storeConsent("accepted"); setConsent("accepted"); },
    reject: () => { storeConsent("rejected"); setConsent("rejected"); },
  };
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { consent, accept, reject } = useCookieConsent();

  useEffect(() => {
    // Show banner only if no decision has been made yet
    if (consent === "pending") {
      // Small delay so it doesn't flash on first render
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [consent]);

  const handleAccept = () => {
    accept();
    setVisible(false);
  };

  const handleReject = () => {
    reject();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      role="dialog"
      aria-label="Consentimento de cookies"
      aria-modal="false"
    >
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Main banner */}
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-green-500/10 rounded-lg shrink-0 mt-0.5">
              <Cookie className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-2">
                <h3 className="font-semibold text-foreground">Sua privacidade importa</h3>
                <button
                  onClick={handleReject}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Recusar e fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Usamos <strong className="text-foreground">cookies essenciais</strong> para o funcionamento da plataforma
                e, com seu consentimento, <strong className="text-foreground">cookies analíticos</strong> para melhorar
                sua experiência. Conforme a{" "}
                <Link href="/privacidade" className="text-green-400 hover:underline">
                  LGPD (Lei 13.709/2018)
                </Link>
                , você pode aceitar, recusar ou personalizar suas preferências.
              </p>

              {/* Details toggle */}
              {showDetails && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Cookies Essenciais</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Sessão de login, preferências de interface. Necessários para o funcionamento.</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Sempre ativos
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Cookies Analíticos</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Entender como você usa a plataforma para melhorar a experiência.</p>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 ml-4">Requer consentimento</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Button
                  onClick={handleAccept}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                  Aceitar todos
                </Button>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  size="sm"
                >
                  Recusar opcionais
                </Button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {showDetails ? "Ocultar detalhes" : "Ver detalhes"}
                </button>
                <Link
                  href="/privacidade"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Política de Privacidade
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
