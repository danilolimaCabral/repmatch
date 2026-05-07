import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";

// Carregamento imediato apenas para a página inicial (LCP crítico)
import Home from "./pages/Home";

// Lazy loading para todas as demais rotas (reduz bundle inicial)
const NotFound = lazy(() => import("@/pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const RepDashboard = lazy(() => import("./pages/RepDashboard"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));
const ManagerPlans = lazy(() => import("./pages/ManagerPlans"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const BuscarRepresentantes = lazy(() => import("./pages/BuscarRepresentantes"));
const Vagas = lazy(() => import("./pages/Vagas"));
const Planos = lazy(() => import("./pages/Planos"));
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

// Skeleton simples para Suspense fallback
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageSkeleton />}>
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/buscar" component={BuscarRepresentantes} />
      <Route path="/vagas" component={Vagas} />
      <Route path="/oportunidades-reps" component={OportunidadesReps} />
      <Route path="/planos" component={Planos} />
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
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
