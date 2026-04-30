import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import RepDashboard from "./pages/RepDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BuscarRepresentantes from "./pages/BuscarRepresentantes";
import Vagas from "./pages/Vagas";
import Planos from "./pages/Planos";
import Privacidade from "./pages/Privacidade";
import Termos from "./pages/Termos";
import VerificacaoKYC from "./pages/VerificacaoKYC";
import CookieConsent from "./components/CookieConsent";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/buscar" component={BuscarRepresentantes} />
      <Route path="/vagas" component={Vagas} />
      <Route path="/planos" component={Planos} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard/rep" component={RepDashboard} />
      <Route path="/dashboard/company" component={CompanyDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/privacidade" component={Privacidade} />
      <Route path="/termos" component={Termos} />
      <Route path="/verificacao" component={VerificacaoKYC} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
