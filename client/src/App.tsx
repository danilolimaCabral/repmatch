import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

// Imports estáticos — evita chunks separados e erros de inicialização circular em produção
import Home from "./pages/Home";
import NotFound from "@/pages/NotFound";
import Onboarding from "./pages/Onboarding";
import RepDashboard from "./pages/RepDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerPlans from "./pages/ManagerPlans";
import AdminDashboard from "./pages/AdminDashboard";
import BuscarRepresentantes from "./pages/BuscarRepresentantes";
import Vagas from "./pages/Vagas";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import VerificacaoKYC from "./pages/VerificacaoKYC";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Perfil from "./pages/Perfil";
import EsqueciSenha from "./pages/EsqueciSenha";
import RedefinirSenha from "./pages/RedefinirSenha";
import VerificarEmail from "./pages/VerificarEmail";
import OportunidadesReps from "./pages/OportunidadesReps";
import Parcerias from "./pages/Parcerias";
import { Redirect, useLocation } from "wouter";
import { useEffect, useRef } from "react";

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
