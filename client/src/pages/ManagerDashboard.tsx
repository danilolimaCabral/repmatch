import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Search, LogOut, UserCog, MapPin, Star, Briefcase,
  Phone, Mail, Eye, ChevronRight, TrendingUp, Target, Award, Clock,
  Coins, ShoppingCart, Unlock, CheckCircle, Infinity
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const REGIONS = [
  "Todos", "São Paulo - Capital", "São Paulo - Interior", "Rio de Janeiro", "Minas Gerais",
  "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco",
  "Ceará", "Goiás", "Espírito Santo", "Nacional (Todo Brasil)",
];

const SEGMENTS = [
  "Todos", "Alimentos e Bebidas", "Farmacêutico", "Cosméticos e Higiene", "Tecnologia",
  "Construção Civil", "Têxtil e Moda", "Automotivo", "Agronegócio",
  "Saúde e Médico", "Eletroeletrônicos", "Móveis e Decoração", "Outros",
];

const AVAILABILITY_LABELS: Record<string, string> = {
  imediata: "Disponível agora",
  "30dias": "Em 30 dias",
  "60dias": "Em 60 dias",
  negociavel: "Negociável",
};

const PLAN_COLORS: Record<string, string> = {
  ouro: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  prata: "text-gray-300 bg-gray-400/10 border-gray-400/30",
  bronze: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  free: "text-muted-foreground bg-muted/20 border-border",
};

export default function ManagerDashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "search" | "team">("overview");
  const [unlockingRepId, setUnlockingRepId] = useState<number | null>(null);

  // Search filters
  const [searchRegion, setSearchRegion] = useState("Todos");
  const [searchSegment, setSearchSegment] = useState("Todos");
  const [searchAvailability, setSearchAvailability] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const repsQuery = trpc.representatives.listForCompany.useQuery({
    region: searchRegion === "Todos" ? undefined : searchRegion,
    segment: searchSegment === "Todos" ? undefined : searchSegment,
    availability: searchAvailability === "all" ? undefined : searchAvailability,
    limit: 30,
    page: 1,
  });

  const creditsQuery = trpc.manager.getCredits.useQuery(undefined, { enabled: isAuthenticated });
  const unlockedRepsQuery = trpc.manager.listUnlockedReps.useQuery(undefined, { enabled: isAuthenticated });

  const unlockMutation = trpc.manager.unlockRepContact.useMutation({
    onSuccess: (data) => {
      if (data.alreadyUnlocked) {
        toast.info("Este representante já está desbloqueado na sua equipe.");
      } else {
        toast.success("Contato desbloqueado! Acesse a aba Minha Equipe para ver os dados.");
      }
      creditsQuery.refetch();
      unlockedRepsQuery.refetch();
      setUnlockingRepId(null);
    },
    onError: (err) => {
      setUnlockingRepId(null);
      if (err.data?.code === "PAYMENT_REQUIRED") {
        toast.error("Créditos insuficientes. Adquira um pacote para continuar.", {
          action: { label: "Ver Planos", onClick: () => navigate("/planos-gerente") },
        });
      } else {
        toast.error(err.message || "Erro ao desbloquear contato.");
      }
    },
  });

  const handleUnlock = (repId: number) => {
    setUnlockingRepId(repId);
    unlockMutation.mutate({ repId });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const credits = creditsQuery.data;
  const unlockedRepIds = new Set((unlockedRepsQuery.data ?? []).map((r) => r.id));

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: TrendingUp },
    { id: "search", label: "Buscar Representantes", icon: Search },
    { id: "team", label: "Minha Equipe", icon: Users },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
        </div>

        {/* User info */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-400/20 flex items-center justify-center shrink-0">
              <UserCog className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{user?.name ?? "Gerente"}</div>
              <div className="text-xs text-blue-400">Gerente Comercial</div>
            </div>
          </div>
        </div>

        {/* Credits balance */}
        <div className="p-4 border-b border-border">
          <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Coins className="w-3 h-3" /> Créditos
              </span>
              {credits?.isUnlimited && (
                <Infinity className="w-3 h-3 text-yellow-400" />
              )}
            </div>
            <div className="text-xl font-black text-blue-400">
              {creditsQuery.isLoading ? "..." : credits?.isUnlimited ? "∞" : (credits?.credits ?? 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {credits?.isUnlimited ? "Ilimitado ativo" : "disponíveis"}
            </div>
            <button
              onClick={() => navigate("/planos-gerente")}
              className="mt-2 w-full text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              <ShoppingCart className="w-3 h-3" />
              Comprar créditos
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-400/15 text-blue-400"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
                {tab.id === "team" && (unlockedRepsQuery.data?.length ?? 0) > 0 && (
                  <span className="ml-auto text-xs bg-blue-400/20 text-blue-400 rounded-full px-1.5 py-0.5">
                    {unlockedRepsQuery.data?.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <button
            onClick={() => navigate("/planos-gerente")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-400 hover:bg-blue-400/10 transition-colors font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            Planos & Créditos
          </button>
          <button
            onClick={() => navigate("/perfil")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <UserCog className="w-4 h-4" />
            Meu Perfil
          </button>
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <span>🔑</span>
              Painel Admin
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Welcome Banner */}
        <div className="px-8 pt-6 pb-0">
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
              {(user?.name ?? "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Bem-vindo de volta</p>
              <h2 className="text-lg font-bold text-slate-900">Olá, {user?.name?.split(" ")[0] ?? "Gerente"}! 👋</h2>
            </div>
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-xs text-slate-400">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
              <p className="text-xs font-semibold text-purple-600 mt-0.5">Painel do Gerente</p>
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Visão Geral</h1>
              <p className="text-muted-foreground mt-1">Gerencie sua equipe de representantes comerciais</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Reps na Plataforma", value: "9.677+", icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
                { label: "Disponíveis Agora", value: "1.240+", icon: Clock, color: "text-green-400", bg: "bg-green-400/10" },
                { label: "Segmentos", value: "11", icon: Target, color: "text-purple-400", bg: "bg-purple-400/10" },
                { label: "Estados Cobertos", value: "27", icon: MapPin, color: "text-orange-400", bg: "bg-orange-400/10" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Credits CTA if no credits */}
            {!creditsQuery.isLoading && !credits?.isUnlimited && (credits?.credits ?? 0) === 0 && (
              <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-6 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-400 mb-1">Você não tem créditos</h3>
                  <p className="text-sm text-muted-foreground">Adquira créditos para desbloquear contatos de representantes</p>
                </div>
                <Button
                  onClick={() => navigate("/planos-gerente")}
                  className="bg-blue-500 hover:bg-blue-600 text-white shrink-0"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ver Planos
                </Button>
              </div>
            )}

            {/* Quick actions */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <h2 className="font-semibold mb-4">Ações Rápidas</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab("search")}
                  className="flex items-center gap-3 p-4 bg-blue-400/10 border border-blue-400/20 rounded-lg hover:bg-blue-400/20 transition-colors text-left"
                >
                  <Search className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Buscar Representantes</div>
                    <div className="text-xs text-muted-foreground">Encontre reps por região e segmento</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className="flex items-center gap-3 p-4 bg-green-400/10 border border-green-400/20 rounded-lg hover:bg-green-400/20 transition-colors text-left"
                >
                  <Users className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <div className="font-medium text-sm">Minha Equipe</div>
                    <div className="text-xs text-muted-foreground">
                      {(unlockedRepsQuery.data?.length ?? 0) > 0
                        ? `${unlockedRepsQuery.data?.length} representante(s) desbloqueado(s)`
                        : "Gerencie seus representantes"}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </button>
              </div>
            </div>

            {/* How it works for manager */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-4">Como funciona para Gerentes</h2>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Busque representantes", desc: "Filtre por região, segmento e disponibilidade para encontrar os melhores perfis", icon: Search },
                  { step: "2", title: "Analise os perfis", desc: "Veja experiência, regiões de atuação, score e histórico de cada representante", icon: Award },
                  { step: "3", title: "Faça o match", desc: "Desbloqueie o contato com 1 crédito e conecte-se diretamente com o representante ideal", icon: Target },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center shrink-0 text-blue-400 font-bold text-sm">
                        {item.step}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === "search" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Buscar Representantes</h1>
                <p className="text-muted-foreground mt-1">Encontre representantes comerciais para sua equipe</p>
              </div>
              {/* Credits badge */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-2">
                <Coins className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-muted-foreground">Créditos:</span>
                <span className="font-bold text-blue-400">
                  {creditsQuery.isLoading ? "..." : credits?.isUnlimited ? "∞ Ilimitado" : (credits?.credits ?? 0)}
                </span>
                <button
                  onClick={() => navigate("/planos-gerente")}
                  className="ml-2 text-xs text-blue-400 hover:underline"
                >
                  + Comprar
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <Select value={searchRegion} onValueChange={setSearchRegion}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={searchSegment} onValueChange={setSearchSegment}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={searchAvailability} onValueChange={setSearchAvailability}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Disponibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas disponibilidades</SelectItem>
                    <SelectItem value="imediata">🟢 Disponível agora</SelectItem>
                    <SelectItem value="30dias">Em 30 dias</SelectItem>
                    <SelectItem value="60dias">Em 60 dias</SelectItem>
                    <SelectItem value="negociavel">Negociável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results */}
            {repsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Buscando representantes...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    {repsQuery.data?.total?.toLocaleString("pt-BR") ?? 0} representantes encontrados
                  </p>
                </div>
                {(repsQuery.data?.reps ?? []).map((rep) => {
                  const isUnlocked = unlockedRepIds.has(rep.id);
                  const isUnlocking = unlockingRepId === rep.id;
                  return (
                    <div key={rep.id} className={`bg-card border rounded-xl p-5 transition-colors ${isUnlocked ? "border-green-500/40" : "border-border hover:border-blue-400/40"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-blue-400/20 flex items-center justify-center shrink-0 text-blue-400 font-bold text-lg">
                            {rep.fullName?.[0] ?? "R"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{rep.fullName}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_COLORS[rep.subscriptionTier ?? "free"]}`}>
                                {(rep.subscriptionTier ?? "free").charAt(0).toUpperCase() + (rep.subscriptionTier ?? "free").slice(1)}
                              </span>
                              {rep.availability === "imediata" && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-medium">
                                  🟢 Disponível agora
                                </span>
                              )}
                              {isUnlocked && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Desbloqueado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rep.region}</span>
                              <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{rep.segment}</span>
                              {rep.experienceYears != null && rep.experienceYears > 0 && (
                                <span className="flex items-center gap-1"><Star className="w-3 h-3" />{rep.experienceYears} anos</span>
                              )}
                              {rep.availability && (
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{AVAILABILITY_LABELS[rep.availability] ?? rep.availability}</span>
                              )}
                            </div>
                            {isUnlocked && rep.phone && (
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1 text-green-400"><Phone className="w-3 h-3" />{rep.phone}</span>
                                {rep.email && <span className="flex items-center gap-1 text-green-400"><Mail className="w-3 h-3" />{rep.email}</span>}
                              </div>
                            )}
                            {rep.bio && !isUnlocked && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{rep.bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {isUnlocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-green-500/40 text-green-400"
                              onClick={() => toast.info("Contato já desbloqueado na sua equipe")}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Ver na Equipe
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="text-xs bg-blue-500 hover:bg-blue-600 text-white"
                              disabled={isUnlocking}
                              onClick={() => handleUnlock(rep.id)}
                            >
                              {isUnlocking ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Unlock className="w-3 h-3 mr-1" />
                              )}
                              {isUnlocking ? "Desbloqueando..." : "Desbloquear (1 crédito)"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(repsQuery.data?.reps ?? []).length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum representante encontrado com esses filtros</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Minha Equipe</h1>
              <p className="text-muted-foreground mt-1">Representantes desbloqueados e prontos para contato</p>
            </div>
            {unlockedRepsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (unlockedRepsQuery.data?.length ?? 0) === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                <h3 className="font-semibold mb-2">Sua equipe está vazia</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Busque representantes e desbloqueie contatos para montar sua equipe
                </p>
                <Button
                  onClick={() => setActiveTab("search")}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Representantes
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {(unlockedRepsQuery.data ?? []).map((rep) => (
                  <div key={rep.id} className="bg-card border border-green-500/30 rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-full bg-green-400/20 flex items-center justify-center shrink-0 text-green-400 font-bold text-lg">
                        {rep.fullName?.[0] ?? "R"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold">{rep.fullName}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_COLORS[rep.subscriptionTier ?? "free"]}`}>
                            {(rep.subscriptionTier ?? "free").charAt(0).toUpperCase() + (rep.subscriptionTier ?? "free").slice(1)}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Desbloqueado
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap mb-2">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rep.region}</span>
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{rep.segment}</span>
                          {rep.experienceYears != null && rep.experienceYears > 0 && (
                            <span className="flex items-center gap-1"><Star className="w-3 h-3" />{rep.experienceYears} anos</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {rep.phone && (
                            <a href={`tel:${rep.phone}`} className="flex items-center gap-1 text-green-400 hover:text-green-300 transition-colors">
                              <Phone className="w-3 h-3" />{rep.phone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
