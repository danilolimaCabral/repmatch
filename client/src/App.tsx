import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, useEffect, useRef } from "react";
import { Redirect, useLocation } from "wouter";

// Home carregada de forma síncrona (rota principal — crítica para LCP)
import Home from "./pages/Home";

// Skeleton de carregamento para lazy routes
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

// Lazy imports — cada rota vira um chunk separado (code splitting)
const NotFound = lazy(() => import("@/pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const RepDashboard = lazy(() => import("./pages/RepDashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const ManagerPlans = lazy(() => import("./pages/ManagerPlans"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BuscarRepresentantes = lazy(() => import("./pages/BuscarRepresentantes"));
const Vagas = lazy(() => import("./pages/Vagas"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const VerificacaoKYC = lazy(() => import("./pages/VerificacaoKYC"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Perfil = lazy(() => import("./pages/Perfil"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const VerificarEmail = lazy(() => import("./pages/VerificarEmail"));
const OportunidadesReps = lazy(() => import("./pages/OportunidadesReps"));
const Parcerias = lazy(() => import("./pages/Parcerias"));

// Gera ou recupera um sessionId anônimo para rastreamento de visitas
function getSessionId(): string {
  const key = "_rm_sid";
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

// Componente que dispara um page view a cada mudança de rota
function PageViewTracker() {
  const [location] = useLocation();
  const lastPath = useRef("");
  useEffect(() => {
    if (location === lastPath.current) return;
    lastPath.current = location;
    try {
      fetch("/api/track-pv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getSessionId(),
          path: location,
          referrer: document.referrer || null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }, [location]);
  return null;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/buscar" component={BuscarRepresentantes} />
      <Route path="/buscar-reps" component={BuscarRepresentantes} />
      <Route path="/vagas" component={Vagas} />
      <Route path="/oportunidades-reps" component={OportunidadesReps} />
      <Route path="/reps-disponiveis" component={OportunidadesReps} />
      <Route path="/faq">{() => { window.location.replace('/#faq'); return null; }}</Route>
      <Route path="/planos">{() => { window.location.replace('/'); return null; }}</Route>
      <Route path="/parcerias" component={Parcerias} />
      <Route path="/privacidade" component={Privacidade} />
      <Route path="/termos" component={Termos} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/esqueci-senha" component={EsqueciSenha} />
      <Route path="/redefinir-senha" component={RedefinirSenha} />
      <Route path="/verificar-email" component={VerificarEmail} />

      {/* Protected routes — require authentication */}
      <Route path="/onboarding">
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/rep">
        <ProtectedRoute><RepDashboard /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/company">
        <ProtectedRoute><CompanyDashboard /></ProtectedRoute>
      </Route>
      <Route path="/dashboard/manager">
        <ProtectedRoute><ManagerDashboard /></ProtectedRoute>
      </Route>
      <Route path="/planos-gerente" component={ManagerPlans} />
      <Route path="/verificacao">
        <ProtectedRoute><VerificacaoKYC /></ProtectedRoute>
      </Route>
      <Route path="/perfil">
        <ProtectedRoute><Perfil /></ProtectedRoute>
      </Route>

      {/* Admin-only route */}
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <PageViewTracker />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
