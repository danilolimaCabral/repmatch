import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Users, Building2, Briefcase, TrendingUp, Upload, Loader2, CheckCircle, XCircle, Clock, LogOut, ShieldCheck, BarChart2, UserX, UserCheck, CreditCard, CheckCheck, Search, FileText, ThumbsUp, ThumbsDown, Eye, RefreshCw } from "lucide-react";
import { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell, Legend, LineChart, Line
} from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return null;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"stats" | "analytics" | "import" | "users" | "jobs" | "pagamentos" | "documentos" | "desbloqueios" | "representantes">("stats");
  const [repSearch, setRepSearch] = useState("");
  const [repEstado, setRepEstado] = useState("");
  const [repOffset, setRepOffset] = useState(0);
  const [expandedRepId, setExpandedRepId] = useState<number | null>(null);
  const [unlockSearch, setUnlockSearch] = useState("");
  const [unlockStatusFilter, setUnlockStatusFilter] = useState<"all" | "pending_payment" | "pending_approval" | "approved" | "rejected">("all");
  const [viewProofUrl, setViewProofUrl] = useState<string | null>(null);
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [docSearch, setDocSearch] = useState("");
  const [reviewModal, setReviewModal] = useState<{ rep: Record<string, unknown>; mode: "kyc" | "core" } | null>(null);
  const [reviewDecision, setReviewDecision] = useState<string>("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [pixSearch, setPixSearch] = useState("");
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Confirmation modal state
  type ConfirmAction =
    | { type: "promote"; userId: number; userName: string }
    | { type: "toggle"; userId: number; userName: string; isActive: boolean };
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === "promote") {
      promoteMutation.mutate({ userId: confirmAction.userId });
    } else {
      toggleActiveMutation.mutate({ userId: confirmAction.userId, isActive: confirmAction.isActive });
    }
    setConfirmAction(null);
  }

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: weeklyGrowth, isLoading: growthLoading } = trpc.admin.weeklyGrowth.useQuery();
  const { data: conversionFunnel, isLoading: funnelLoading } = trpc.admin.conversionFunnel.useQuery();
  const { data: weeklyRevenue, isLoading: revenueLoading } = trpc.admin.weeklyRevenue.useQuery();
  const { data: importLogs } = trpc.admin.importLogs.useQuery();
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("");
  const [userPage, setUserPage] = useState(0);
  const USER_PAGE_SIZE = 50;
  const { data: usersData, refetch: refetchUsers } = trpc.admin.listUsers.useQuery({
    limit: USER_PAGE_SIZE,
    offset: userPage * USER_PAGE_SIZE,
    search: userSearch,
    roleFilter: userRoleFilter,
    userTypeFilter: userTypeFilter,
  });
  const allUsers = usersData?.users;
  const userTotal = usersData?.total ?? 0;
  const { data: enrichedReps, isLoading: repsLoading } = trpc.admin.listEnrichedReps.useQuery(
    { limit: 100, offset: repOffset, search: repSearch || undefined, estado: repEstado || undefined },
    { enabled: activeTab === "representantes" }
  );
  const { data: pendingPayments, refetch: refetchPending, isLoading: pendingLoading } = trpc.admin.listPendingPayments.useQuery();
  const activatePlanMutation = trpc.admin.activatePlan.useMutation({
    onSuccess: () => { toast.success("Plano ativado com sucesso!"); setActivatingId(null); refetchPending(); },
    onError: (e) => { toast.error(e.message); setActivatingId(null); },
  });
  const promoteMutation = trpc.admin.promoteUser.useMutation({
    onSuccess: () => { toast.success("Usuário promovido a admin!"); refetchUsers(); },
    onError: () => toast.error("Erro ao promover usuário"),
  });
  const toggleActiveMutation = trpc.admin.toggleUserActive.useMutation({
    onSuccess: (_, vars) => { toast.success(vars.isActive ? "Usuário reativado!" : "Usuário desativado!"); refetchUsers(); },
    onError: () => toast.error("Erro ao alterar status do usuário"),
  });
  // Unlock requests queries
  const { data: unlockRequestsRaw, refetch: refetchUnlockRequests, isLoading: unlockLoading } = trpc.unlockRequests.adminList.useQuery();
  const unlockRequests = (unlockRequestsRaw ?? []).filter(r => {
    const matchStatus = unlockStatusFilter === "all" || r.status === unlockStatusFilter;
    const q = unlockSearch.toLowerCase();
    const matchSearch = !q || (r.companyName ?? "").toLowerCase().includes(q) || (r.companyEmail ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const approveUnlockMutation = trpc.unlockRequests.approve.useMutation({
    onSuccess: () => { toast.success("Desbloqueio aprovado! Contatos liberados."); refetchUnlockRequests(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectUnlockMutation = trpc.unlockRequests.reject.useMutation({
    onSuccess: () => { toast.success("Solicitação rejeitada."); refetchUnlockRequests(); },
    onError: (e) => toast.error(e.message),
  });

  const [analyticsDays, setAnalyticsDays] = useState(30);
  const { data: siteAnalytics, isLoading: analyticsLoading } = trpc.admin.siteAnalytics.useQuery(
    { days: analyticsDays },
    { enabled: activeTab === "analytics" }
  );

  // KYC/Documents queries
  const { data: docStats, refetch: refetchDocStats } = trpc.kyc.documentStats.useQuery();
  const { data: allDocs, isLoading: docsLoading, refetch: refetchDocs } = trpc.kyc.listAllDocuments.useQuery({
    status: docStatusFilter as "all" | "not_started" | "pending_review" | "approved" | "rejected",
    search: docSearch || undefined,
    page: 1,
    limit: 50,
  });
  const reviewKycMutation = trpc.kyc.reviewKyc.useMutation({
    onSuccess: () => {
      toast.success("Decisão KYC registrada!");
      setReviewModal(null);
      setReviewNotes("");
      refetchDocs();
      refetchDocStats();
    },
    onError: (e) => toast.error(e.message),
  });
  const reviewCoreMutation = trpc.kyc.reviewCore.useMutation({
    onSuccess: () => {
      toast.success("Status CORE atualizado!");
      setReviewModal(null);
      setReviewNotes("");
      refetchDocs();
      refetchDocStats();
    },
    onError: (e) => toast.error(e.message),
  });

  const importMutation = trpc.admin.importData.useMutation({
    onSuccess: (result) => {
      setImportResult(result);
      setImporting(false);
      toast.success(`Importação concluída: ${result.imported} registros importados`);
    },
    onError: (e) => {
      setImporting(false);
      toast.error(e.message);
    },
  });

  // Wait for auth to load before checking role
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user || user.role !== "admin") {
    navigate("/");
    return null;
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const records = rows.map((row) => {
        // Detect if it's a company or representative based on CNPJ field
        const cnpj = String(row["CNPJ"] ?? row["cnpj"] ?? "").trim();
        const isCompany = cnpj.length > 0;

        const rawPhone = String(row["Telefone"] ?? row["telefone"] ?? row["Phone"] ?? row["phone"] ?? "").trim();
        const phone = normalizePhone(rawPhone);

        if (isCompany) {
          return {
            type: "company" as const,
            companyName: String(row["Razão Social"] ?? row["Nome"] ?? row["nome"] ?? row["name"] ?? "").trim(),
            cnpj: cnpj,
            phone: phone ?? undefined,
            email: String(row["Email"] ?? row["email"] ?? "").trim() || undefined,
            region: String(row["Estado"] ?? row["UF"] ?? row["Região"] ?? row["regiao"] ?? "").trim() || undefined,
            segment: String(row["Segmento"] ?? row["segmento"] ?? row["Ramo"] ?? "").trim() || undefined,
          };
        } else {
          return {
            type: "representative" as const,
            fullName: String(row["Nome"] ?? row["nome"] ?? row["name"] ?? "").trim(),
            phone: phone ?? undefined,
            email: String(row["Email"] ?? row["email"] ?? "").trim() || undefined,
            region: String(row["Estado"] ?? row["UF"] ?? row["Região"] ?? row["regiao"] ?? "").trim() || undefined,
            segment: String(row["Segmento"] ?? row["segmento"] ?? "").trim() || undefined,
            experienceYears: Number(row["Experiência"] ?? row["experiencia"] ?? row["Anos"] ?? 0) || 0,
          };
        }
      }).filter((r: { type: string; fullName?: string; companyName?: string }) => (r.type === "representative" && r.fullName) || (r.type === "company" && r.companyName));

      if (records.length === 0) {
        toast.error("Nenhum registro válido encontrado no arquivo.");
        setImporting(false);
        return;
      }

      await importMutation.mutateAsync({ records, filename: file.name });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar o arquivo Excel.");
      setImporting(false);
    }
  };

  const STATUS_LOG = {
    pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
    processing: { label: "Processando", color: "bg-blue-500/20 text-blue-400", icon: Loader2 },
    completed: { label: "Concluído", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
    failed: { label: "Falhou", color: "bg-red-500/20 text-red-400", icon: XCircle },
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex h-screen">
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain mb-4" />
            <div className="font-semibold text-sm">{user?.name}</div>
            <Badge className="mt-1 bg-red-900 text-red-300 text-xs">Admin</Badge>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "stats", label: "Dashboard", icon: TrendingUp },
              { id: "analytics", label: "Analytics", icon: BarChart2 },
              { id: "pagamentos", label: "Pagamentos PIX", icon: CreditCard },
              { id: "desbloqueios", label: "Desbloqueios", icon: ShieldCheck },
              { id: "documentos", label: "Documentos", icon: FileText },
              { id: "jobs", label: "Vagas", icon: Briefcase },
              { id: "import", label: "Importar Dados", icon: Upload },
              { id: "users", label: "Usuários", icon: Users },
              { id: "representantes", label: "Representantes", icon: UserCheck },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pb-1">Visualizar como</p>
            <button
              onClick={() => navigate("/dashboard/rep")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-green-900/30 hover:text-green-400 transition-colors"
            >
              <span>🤝</span> Representante
            </button>
            <button
              onClick={() => navigate("/dashboard/company")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-blue-900/30 hover:text-blue-400 transition-colors"
            >
              <span>🏢</span> Empresa
            </button>
            <button
              onClick={() => navigate("/dashboard/manager")}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-purple-900/30 hover:text-purple-400 transition-colors"
            >
              <span>📊</span> Gerente
            </button>
            <div className="pt-2">
              <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={() => { logout(); navigate("/"); }}>
                <LogOut className="w-4 h-4 mr-2" />Sair
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-8">
          {activeTab === "stats" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black">Dashboard Administrativo</h1>
                  <p className="text-muted-foreground text-sm mt-1">Visão geral da plataforma RepMatch em tempo real</p>
                </div>
                <Badge className="bg-red-900/30 text-red-300 border border-red-700/40 px-3 py-1">Admin</Badge>
              </div>
              {statsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "Representantes", value: stats?.totalReps ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", sub: `${stats?.premiumReps ?? 0} premium/elite` },
                      { label: "Empresas", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-primary", bg: "bg-primary/10", sub: "cadastradas" },
                      { label: "Vagas Ativas", value: stats?.totalJobs ?? 0, icon: Briefcase, color: "text-purple-400", bg: "bg-purple-400/10", sub: "publicadas" },
                      { label: "Candidaturas", value: stats?.totalApplications ?? 0, icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-400/10", sub: "total" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border bg-card p-5">
                        <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                          <stat.icon className={`w-4 h-4 ${stat.color}`} />
                        </div>
                        <div className="text-3xl font-black text-foreground">{stat.value.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                        <div className="text-xs text-muted-foreground/60 mt-0.5">{stat.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Rank Distribution + Rep Tiers */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-bold mb-5 text-sm uppercase tracking-wide text-muted-foreground">Ranking das Empresas</h2>
                      <div className="space-y-4">
                        {[
                          { label: "Platinum", value: (stats as Record<string, unknown> & { rankDistribution?: Record<string, number> })?.rankDistribution?.platinum ?? 0, color: "bg-zinc-300" },
                          { label: "Gold", value: (stats as Record<string, unknown> & { rankDistribution?: Record<string, number> })?.rankDistribution?.gold ?? 0, color: "bg-yellow-400" },
                          { label: "Silver", value: (stats as Record<string, unknown> & { rankDistribution?: Record<string, number> })?.rankDistribution?.silver ?? 0, color: "bg-zinc-400" },
                          { label: "Bronze", value: (stats as Record<string, unknown> & { rankDistribution?: Record<string, number> })?.rankDistribution?.bronze ?? 0, color: "bg-amber-600" },
                        ].map((item) => {
                          const total = stats?.totalCompanies ?? 1;
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          return (
                            <div key={item.label}>
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-muted-foreground">{item.value} ({pct}%)</span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6">
                      <h2 className="font-bold mb-5 text-sm uppercase tracking-wide text-muted-foreground">Planos dos Representantes</h2>
                      <div className="space-y-4">
                        {[
                          { label: "Elite", value: (stats as Record<string, unknown> & { tierDistribution?: Record<string, number> })?.tierDistribution?.elite ?? 0, color: "bg-yellow-400" },
                          { label: "Premium", value: (stats as Record<string, unknown> & { tierDistribution?: Record<string, number> })?.tierDistribution?.premium ?? 0, color: "bg-primary" },
                          { label: "Free", value: (stats as Record<string, unknown> & { tierDistribution?: Record<string, number> })?.tierDistribution?.free ?? 0, color: "bg-zinc-500" },
                        ].map((item) => {
                          const total = stats?.totalReps ?? 1;
                          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                          return (
                            <div key={item.label}>
                              <div className="flex items-center justify-between text-sm mb-1.5">
                                <span className="font-medium">{item.label}</span>
                                <span className="text-muted-foreground">{item.value} ({pct}%)</span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent Import Logs */}
                  {importLogs && importLogs.length > 0 && (
                    <div className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Últimas Importações</h2>
                        <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => setActiveTab("import")}>Ver todas</Button>
                      </div>
                      <div className="space-y-2">
                        {importLogs.slice(0, 5).map((log) => {
                          const statusCfg = STATUS_LOG[log.status as keyof typeof STATUS_LOG] ?? STATUS_LOG.pending;
                          const StatusIcon = statusCfg.icon;
                          return (
                            <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                              <div>
                                <div className="text-sm font-medium">{log.filename}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {log.importedRecords}/{log.totalRecords} registros · {new Date(log.createdAt).toLocaleString("pt-BR")}
                                </div>
                              </div>
                              <Badge className={statusCfg.color}><StatusIcon className="w-3 h-3 mr-1" />{statusCfg.label}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black">Analytics da Plataforma</h1>
                  <p className="text-muted-foreground text-sm mt-1">Crescimento semanal de cadastros e funil de conversão</p>
                </div>
                <Badge className="bg-red-900/30 text-red-300 border border-red-700/40 px-3 py-1">Admin</Badge>
              </div>

              {/* Visitas ao Site (Umami) */}
              <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Visitas ao Site</h2>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Pageviews e visitantes únicos</p>
                  </div>
                  <div className="flex gap-2">
                    {[7, 30, 90].map(d => (
                      <button key={d} onClick={() => setAnalyticsDays(d)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                          analyticsDays === d
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}>
                        {d === 7 ? "7 dias" : d === 30 ? "30 dias" : "90 dias"}
                      </button>
                    ))}
                  </div>
                </div>
                {analyticsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                      {[
                        { label: "Pageviews", value: (siteAnalytics?.pageviews ?? 0).toLocaleString("pt-BR"), color: "text-blue-400", bg: "bg-blue-400/10" },
                        { label: "Visitantes", value: (siteAnalytics?.visitors ?? 0).toLocaleString("pt-BR"), color: "text-emerald-400", bg: "bg-emerald-400/10" },
                        { label: "Sessões", value: (siteAnalytics?.visits ?? 0).toLocaleString("pt-BR"), color: "text-amber-400", bg: "bg-amber-400/10" },
                        { label: "Taxa de Rejeição", value: `${siteAnalytics?.bounceRate ?? 0}%`, color: "text-red-400", bg: "bg-red-400/10" },
                      ].map(kpi => (
                        <div key={kpi.label} className={`rounded-lg border border-border p-4 ${kpi.bg}`}>
                          <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                        </div>
                      ))}
                    </div>
                    {siteAnalytics?.dailyViews && siteAnalytics.dailyViews.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={siteAnalytics.dailyViews} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            tickFormatter={(v: string) => { const d = new Date(v); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`; }}
                          />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                            labelFormatter={(v: string) => new Date(v).toLocaleDateString('pt-BR')}
                          />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="pageviews" name="Pageviews" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="visitors" name="Visitantes" stroke="#10b981" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Dados de visitas aparecerão após o site estar em produção</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Crescimento Semanal */}
              <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <h2 className="font-bold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Crescimento Semanal de Cadastros</h2>
                <p className="text-xs text-muted-foreground/60 mb-5">Novos usuários por semana nas últimas 8 semanas</p>
                {growthLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : !weeklyGrowth || weeklyGrowth.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Dados insuficientes para exibir o gráfico</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={weeklyGrowth} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(v: string) => `Semana de ${new Date(v).toLocaleDateString('pt-BR')}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="reps" name="Representantes" fill="#3b82f6" radius={[4,4,0,0]} />
                      <Bar dataKey="companies" name="Empresas" fill="#10b981" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Funil de Conversão */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-bold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Funil de Conversão</h2>
                  <p className="text-xs text-muted-foreground/60 mb-5">Cadastros → Perfis ativos → Plano pago</p>
                  {funnelLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                  ) : (
                    <div className="space-y-4">
                      {(conversionFunnel ?? []).map((stage: { stage: string; value: number; pct: number }, i: number) => {
                        const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500"];
                        return (
                          <div key={stage.stage}>
                            <div className="flex items-center justify-between text-sm mb-1.5">
                              <span className="font-medium">{stage.stage}</span>
                              <span className="text-muted-foreground">{stage.value.toLocaleString()} <span className="text-xs">({stage.pct}%)</span></span>
                            </div>
                            <div className="h-3 rounded-full bg-secondary overflow-hidden">
                              <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`} style={{ width: `${stage.pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* KPIs rápidos */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="font-bold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Indicadores Gerais</h2>
                  <p className="text-xs text-muted-foreground/60 mb-5">Totais acumulados da plataforma</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Total de Usuários", value: (conversionFunnel?.[0]?.value ?? 0).toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
                      { label: "Representantes", value: (conversionFunnel?.[1]?.value ?? 0).toLocaleString(), icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                      { label: "Empresas", value: (conversionFunnel?.[2]?.value ?? 0).toLocaleString(), icon: Building2, color: "text-amber-400", bg: "bg-amber-400/10" },
                      { label: "Planos Pagos", value: (conversionFunnel?.[3]?.value ?? 0).toLocaleString(), icon: CreditCard, color: "text-purple-400", bg: "bg-purple-400/10" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="rounded-lg border border-border p-4">
                        <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                          <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                        </div>
                        <div className="text-2xl font-black text-foreground">{kpi.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Receita Semanal */}
              <div className="rounded-xl border border-border bg-card p-6 mt-6">
                <h2 className="font-bold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Receita Semanal (Mercado Pago)</h2>
                <p className="text-xs text-muted-foreground/60 mb-5">Pagamentos aprovados por semana nas últimas 8 semanas — em R$</p>
                {revenueLoading ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : !weeklyRevenue || weeklyRevenue.every(w => w.revenue === 0) ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma receita registrada no período</p>
                    <p className="text-xs mt-1 opacity-60">Os dados aparecerão após os primeiros pagamentos via Mercado Pago</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={weeklyRevenue} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(v: string) => {
                          const d = new Date(v);
                          return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false}
                        tickFormatter={(v: number) => `R$${v.toLocaleString('pt-BR')}`}
                      />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                        labelFormatter={(v: string) => `Semana de ${new Date(v).toLocaleDateString('pt-BR')}`}
                        formatter={(v: number) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']}
                      />
                      <Line type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {activeTab === "import" && (
            <div className="max-w-2xl">
              <h1 className="text-2xl font-black mb-2">Importar Dados</h1>
              <p className="text-muted-foreground mb-8">
                Importe representantes e empresas a partir de um arquivo Excel (.xlsx). O sistema detecta automaticamente o tipo de registro pelo campo CNPJ e normaliza os telefones.
              </p>

              <div
                className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {importing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="font-semibold">Processando arquivo...</p>
                    <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-muted-foreground" />
                    <p className="font-semibold">Clique para selecionar o arquivo Excel</p>
                    <p className="text-sm text-muted-foreground">Suporta .xlsx e .xls</p>
                  </div>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={importing}
                />
              </div>

              {importResult && (
                <div className="mt-6 rounded-xl border border-green-700/40 bg-green-900/10 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold text-green-400">Importação concluída</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Importados</div>
                      <div className="text-2xl font-black text-green-400">{importResult.imported}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Falhas</div>
                      <div className="text-2xl font-black text-red-400">{importResult.failed}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Logs */}
              {importLogs && importLogs.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-bold mb-4 text-muted-foreground text-sm uppercase tracking-wide">Histórico de Importações</h2>
                  <div className="space-y-3">
                    {importLogs.map((log) => {
                      const statusCfg = STATUS_LOG[log.status as keyof typeof STATUS_LOG] ?? STATUS_LOG.pending;
                      const StatusIcon = statusCfg.icon;
                      return (
                        <div key={log.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{log.filename}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {log.importedRecords}/{log.totalRecords} registros · {new Date(log.createdAt).toLocaleString("pt-BR")}
                            </div>
                          </div>
                          <Badge className={statusCfg.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusCfg.label}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 rounded-xl border border-border bg-card p-6">
                <h3 className="font-bold mb-3">Formato esperado do Excel</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">Para Representantes:</strong> Nome, Telefone, Email, Estado/UF, Segmento, Experiência</p>
                  <p><strong className="text-foreground">Para Empresas:</strong> Razão Social, CNPJ, Telefone, Email, Estado/UF, Segmento</p>
                  <p className="text-xs mt-3 text-muted-foreground/70">O sistema detecta automaticamente o tipo pelo campo CNPJ. Telefones são normalizados para o formato (XX) XXXXX-XXXX.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "jobs" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black">Vagas Publicadas</h1>
                  <p className="text-muted-foreground text-sm mt-1">Todas as vagas cadastradas na plataforma</p>
                </div>
                <Badge className="bg-purple-900/30 text-purple-300 border border-purple-700/40 px-3 py-1">
                  <BarChart2 className="w-3 h-3 mr-1" />{stats?.totalJobs ?? 0} vagas
                </Badge>
              </div>
              {!stats?.recentJobs ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (stats as Record<string, unknown> & { recentJobs?: Array<{ id: number; title: string; status: string; segment: string | null; region: string | null; createdAt: Date }> })?.recentJobs?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">Nenhuma vaga publicada ainda</div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Título</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Segmento</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Região</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Criada em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((stats as Record<string, unknown> & { recentJobs?: Array<{ id: number; title: string; status: string; segment: string | null; region: string | null; createdAt: Date }> })?.recentJobs ?? []).map((job) => (
                        <tr key={job.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">#{job.id}</td>
                          <td className="px-4 py-3 font-medium">{job.title}</td>
                          <td className="px-4 py-3 text-muted-foreground">{job.segment ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{job.region ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge className={job.status === "open" ? "bg-green-900/30 text-green-300" : job.status === "paused" ? "bg-yellow-900/30 text-yellow-300" : "bg-zinc-700 text-zinc-300"} variant="outline">
                              {job.status === "open" ? "Aberta" : job.status === "paused" ? "Pausada" : "Fechada"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(job.createdAt).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
                    Exibindo as 10 vagas mais recentes. Total: {stats?.totalJobs ?? 0} vagas.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Gerenciar Usuários</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {userTotal > 0 ? <><span className="font-semibold text-foreground">{userTotal}</span> usuários cadastrados</> : "Todos os usuários cadastrados na plataforma"}
                  </p>
                </div>
                <Badge className="bg-red-900/30 text-red-300 border border-red-700/40 px-3 py-1">Admin</Badge>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Buscar por nome ou email..."
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                  />
                </div>
                <select
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={userTypeFilter}
                  onChange={e => { setUserTypeFilter(e.target.value); setUserPage(0); }}
                >
                  <option value="">Todos os tipos</option>
                  <option value="representative">Representante</option>
                  <option value="company">Empresa</option>
                  <option value="manager">Gerente</option>
                  <option value="pending">Pendente</option>
                </select>
                <select
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={userRoleFilter}
                  onChange={e => { setUserRoleFilter(e.target.value); setUserPage(0); }}
                >
                  <option value="">Todos os papéis</option>
                  <option value="admin">Admin</option>
                  <option value="user">Usuário</option>
                </select>
                {(userSearch || userTypeFilter || userRoleFilter) && (
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setUserSearch(""); setUserTypeFilter(""); setUserRoleFilter(""); setUserPage(0); }}>
                    Limpar filtros
                  </Button>
                )}
              </div>

              {!allUsers ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">Nenhum usuário encontrado</div>
              ) : (
                <div>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Papel</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cadastro</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground">#{u.id}</td>
                          <td className="px-4 py-3 font-medium">{u.name ?? "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs capitalize">{(u as Record<string, unknown> & { userType?: string }).userType ?? "pending"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {u.role === "admin" ? (
                              <Badge className="bg-red-900/30 text-red-300 border border-red-700/40 text-xs">Admin</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">User</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                          <td className="px-4 py-3">
                            {(u as Record<string, unknown> & { isActive?: boolean }).isActive !== false ? (
                              <Badge className="bg-green-900/30 text-green-300 border border-green-700/40 text-xs">Ativo</Badge>
                            ) : (
                              <Badge className="bg-zinc-700 text-zinc-300 text-xs">Inativo</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {/* Promoção a admin desabilitada — apenas via banco de dados */}
                              {u.id !== user?.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`text-xs ${
                                    (u as Record<string, unknown> & { isActive?: boolean }).isActive !== false
                                      ? "border-red-700/40 text-red-400 hover:bg-red-900/20"
                                      : "border-green-700/40 text-green-400 hover:bg-green-900/20"
                                  }`}
                                  onClick={() => setConfirmAction({
                                    type: "toggle",
                                    userId: u.id,
                                    userName: u.name ?? `#${u.id}`,
                                    isActive: (u as Record<string, unknown> & { isActive?: boolean }).isActive === false,
                                  })}
                                  disabled={toggleActiveMutation.isPending}
                                >
                                  {(u as Record<string, unknown> & { isActive?: boolean }).isActive !== false ? (
                                    <><UserX className="w-3 h-3 mr-1" />Desativar</>
                                  ) : (
                                    <><UserCheck className="w-3 h-3 mr-1" />Reativar</>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Paginação */}
                {userTotal > USER_PAGE_SIZE && (
                  <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {userPage * USER_PAGE_SIZE + 1}–{Math.min((userPage + 1) * USER_PAGE_SIZE, userTotal)} de {userTotal}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={userPage === 0} onClick={() => setUserPage(p => p - 1)}>Anterior</Button>
                      <Button size="sm" variant="outline" disabled={(userPage + 1) * USER_PAGE_SIZE >= userTotal} onClick={() => setUserPage(p => p + 1)}>Próxima</Button>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          )}
          {activeTab === "representantes" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Representantes Importados</h1>
                  <p className="text-muted-foreground text-sm mt-1">9.680 representantes enriquecidos via CNPJÁ — CNPJ, e-mail, telefone, sócios e mais</p>
                </div>
                <Badge className="bg-blue-900/30 text-blue-300 border border-blue-700/40 px-3 py-1">
                  <UserCheck className="w-3 h-3 mr-1" />9.680 reps
                </Badge>
              </div>
              <div className="flex gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Buscar por nome, CNPJ ou e-mail..."
                    value={repSearch}
                    onChange={e => { setRepSearch(e.target.value); setRepOffset(0); }}
                  />
                </div>
                <select
                  className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none"
                  value={repEstado}
                  onChange={e => { setRepEstado(e.target.value); setRepOffset(0); }}
                >
                  <option value="">Todos os estados</option>
                  {["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"].map(uf => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>
              {repsLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome / Razão Social</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">CNPJ / CPF</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">E-mail</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Telefone</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cidade/UF</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Situação</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(enrichedReps?.reps ?? []).map((r) => (
                        <>
                          <tr key={r.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-sm">{r.fullName}</div>
                              {r.nomeFantasia && <div className="text-xs text-muted-foreground">{r.nomeFantasia}</div>}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {r.cnpj ? r.cnpj : r.cpf ? <span className="text-blue-400">CPF: {r.cpf}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{r.email ?? "—"}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{r.phone ?? "—"}</td>
                            <td className="px-4 py-3 text-xs">{r.cidade && r.estado ? `${r.cidade}/${r.estado}` : r.estado ?? "—"}</td>
                            <td className="px-4 py-3">
                              {r.situacaoCadastral ? (
                                <Badge className={r.situacaoCadastral.toLowerCase().includes("ativa") ? "bg-green-900/30 text-green-300 text-xs" : "bg-zinc-700 text-zinc-300 text-xs"}>
                                  {r.situacaoCadastral}
                                </Badge>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => setExpandedRepId(expandedRepId === r.id ? null : r.id)}>
                                <Eye className="w-3 h-3 mr-1" />{expandedRepId === r.id ? "Fechar" : "Ver"}
                              </Button>
                            </td>
                          </tr>
                          {expandedRepId === r.id && (
                            <tr key={`${r.id}-detail`} className="bg-secondary/10">
                              <td colSpan={7} className="px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div><span className="text-muted-foreground">Porte:</span> <span className="font-medium">{r.porte ?? "—"}</span></div>
                                  <div><span className="text-muted-foreground">Capital Social:</span> <span className="font-medium">{r.capitalSocial ? `R$ ${r.capitalSocial}` : "—"}</span></div>
                                  <div><span className="text-muted-foreground">Abertura:</span> <span className="font-medium">{r.dataAbertura ?? "—"}</span></div>
                                  <div><span className="text-muted-foreground">Natureza Jurídica:</span> <span className="font-medium">{r.naturezaJuridica ?? "—"}</span></div>
                                  <div><span className="text-muted-foreground">CNAE:</span> <span className="font-medium">{r.cnaeDescricao ?? "—"}</span></div>
                                  <div><span className="text-muted-foreground">CEP:</span> <span className="font-medium">{r.cep ?? "—"}</span></div>
                                  <div><span className="text-muted-foreground">Simples Nacional:</span> <span className="font-medium">{r.simplesNacional ? "Sim" : "Não"}</span></div>
                                  <div><span className="text-muted-foreground">MEI:</span> <span className="font-medium">{r.mei ? "Sim" : "Não"}</span></div>
                                </div>
                                {r.socios && (
                                  <div className="mt-3">
                                    <span className="text-muted-foreground text-xs">Sócios: </span>
                                    <span className="text-xs font-medium">{r.socios}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total: {enrichedReps?.total ?? 0} representantes · Página {Math.floor(repOffset / 100) + 1}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" disabled={repOffset === 0} onClick={() => setRepOffset(Math.max(0, repOffset - 100))}>← Anterior</Button>
                      <Button size="sm" variant="outline" disabled={(repOffset + 100) >= (enrichedReps?.total ?? 0)} onClick={() => setRepOffset(repOffset + 100)}>Próximo →</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === "pagamentos" && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black">Pagamentos PIX Pendentes</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Representantes com pagamento pendente — ative o plano após confirmar o comprovante no WhatsApp
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-900/30 text-amber-300 border border-amber-700/40 px-3 py-1">
                    {pendingPayments?.length ?? 0} pendentes
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => refetchPending()} className="border-border">
                    Atualizar
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou região..."
                  value={pixSearch}
                  onChange={(e) => setPixSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {pendingLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !pendingPayments || pendingPayments.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCheck className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                  <p className="text-muted-foreground">Nenhum pagamento pendente. Todos os planos estão ativos!</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rep #</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Telefone</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Região</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Segmento</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cadastro</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Ativar Plano</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(pendingPayments ?? [])
                        .filter((r) => {
                          if (!pixSearch) return true;
                          const q = pixSearch.toLowerCase();
                          return (
                            (r.fullName ?? "").toLowerCase().includes(q) ||
                            (r.phone ?? "").includes(q) ||
                            (r.region ?? "").toLowerCase().includes(q)
                          );
                        })
                        .map((rep) => (
                          <tr key={rep.repId} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3 text-muted-foreground">#{rep.repId}</td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{rep.fullName ?? "—"}</div>
                              {rep.userEmail && <div className="text-xs text-muted-foreground">{rep.userEmail}</div>}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{rep.phone ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{rep.region ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{rep.segment ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {rep.createdAt ? new Date(rep.createdAt).toLocaleDateString("pt-BR") : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {(["bronze", "prata", "ouro"] as const).map((tier) => (
                                  <Button
                                    key={tier}
                                    size="sm"
                                    variant="outline"
                                    disabled={activatePlanMutation.isPending && activatingId === rep.repId}
                                    onClick={() => {
                                      setActivatingId(rep.repId);
                                      activatePlanMutation.mutate({ repId: rep.repId, tier });
                                    }}
                                    className={`text-xs capitalize ${
                                      tier === "bronze" ? "border-orange-700/40 text-orange-400 hover:bg-orange-900/20" :
                                      tier === "prata" ? "border-primary/40 text-primary hover:bg-primary/10" :
                                      "border-amber-600/40 text-amber-400 hover:bg-amber-900/20"
                                    }`}
                                  >
                                    {activatePlanMutation.isPending && activatingId === rep.repId ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCheck className="w-3 h-3 mr-1" />
                                    )}
                                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                  </Button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* ─── ABA DESBLOQUEIOS ─────────────────────────────────────────────── */}
          {activeTab === "desbloqueios" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Solicitações de Desbloqueio</h1>
                  <p className="text-muted-foreground text-sm mt-1">Aprove ou rejeite solicitações de desbloqueio de contato via Pix</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-900/30 text-amber-300 border border-amber-700/40 px-3 py-1">
                    {(unlockRequestsRaw ?? []).filter(r => r.status === "pending_approval").length} pendentes
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => refetchUnlockRequests()} className="border-border">
                    <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por empresa ou e-mail..."
                    value={unlockSearch}
                    onChange={(e) => setUnlockSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={unlockStatusFilter}
                  onChange={e => setUnlockStatusFilter(e.target.value as typeof unlockStatusFilter)}
                  className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none"
                >
                  <option value="all">Todos os status</option>
                  <option value="pending_payment">Aguardando comprovante</option>
                  <option value="pending_approval">Aguardando aprovação</option>
                  <option value="approved">Aprovados</option>
                  <option value="rejected">Rejeitados</option>
                </select>
              </div>

              {unlockLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : unlockRequests.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCheck className="w-12 h-12 text-primary mx-auto mb-3 opacity-60" />
                  <p className="text-muted-foreground">Nenhuma solicitação encontrada.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unlockRequests.map(req => (
                    <div key={req.id} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="font-bold text-foreground">{req.companyName ?? "Empresa"}</div>
                          <div className="text-xs text-muted-foreground">{req.companyEmail ?? ""}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-xs ${
                              req.status === "pending_approval" ? "bg-amber-900/30 text-amber-300 border-amber-700/40" :
                              req.status === "approved" ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/40" :
                              req.status === "rejected" ? "bg-red-900/30 text-red-300 border-red-700/40" :
                              "bg-secondary text-muted-foreground border-border"
                            } border`}>
                              {req.status === "pending_payment" && "Aguardando comprovante"}
                              {req.status === "cancelled" && "Cancelado"}
                              {req.status === "pending_approval" && "Aguardando aprovação"}
                              {req.status === "approved" && "Aprovado"}
                              {req.status === "rejected" && "Rejeitado"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {req.paymentMethod === "pix" ? "Pix" : "Cartão"} • R${req.totalAmount}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {req.pixProofUrl && (
                            <Button size="sm" variant="outline" className="border-border text-xs" onClick={() => setViewProofUrl(req.pixProofUrl!)}>
                              <Eye className="w-3 h-3 mr-1" /> Ver comprovante
                            </Button>
                          )}
                          {req.status === "pending_approval" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                disabled={approveUnlockMutation.isPending}
                                onClick={() => approveUnlockMutation.mutate({ requestId: req.id })}
                              >
                                {approveUnlockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-700/40 text-red-400 hover:bg-red-900/20 text-xs"
                                disabled={rejectUnlockMutation.isPending}
                                onClick={() => rejectUnlockMutation.mutate({ requestId: req.id })}
                              >
                                {rejectUnlockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsDown className="w-3 h-3 mr-1" />}
                                Rejeitar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {/* Items */}
                          {req.items && req.items.length > 0 && (
                        <div className="border-t border-border pt-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Representantes a desbloquear ({req.items.length}):</p>
                          <div className="flex flex-wrap gap-2">
                            {req.items.map((item) => (
                              <span key={item.id} className="text-xs bg-secondary text-muted-foreground rounded-lg px-2 py-1">
                                {item.repName ?? `Rep #${item.representativeId}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Proof image viewer modal */}
          {viewProofUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setViewProofUrl(null)}>
              <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                  <span className="font-semibold text-sm">Comprovante de Pagamento</span>
                  <button onClick={() => setViewProofUrl(null)} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">
                  {viewProofUrl.endsWith(".pdf") ? (
                    <iframe src={viewProofUrl} className="w-full h-96 rounded-lg" />
                  ) : (
                    <img src={viewProofUrl} alt="Comprovante" className="w-full rounded-lg object-contain max-h-96" />
                  )}
                  <a href={viewProofUrl} target="_blank" rel="noopener noreferrer" className="block mt-3 text-center text-xs text-primary hover:underline">Abrir em nova aba</a>
                </div>
              </div>
            </div>
          )}

          {/* ─── ABA DOCUMENTOS ─────────────────────────────────────────────────── */}
          {activeTab === "documentos" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Validação de Documentos</h1>
                  <p className="text-muted-foreground text-sm mt-1">Revise identidade (KYC), registro CORE e CNPJ dos representantes</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { refetchDocs(); refetchDocStats(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />Atualizar
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Pendentes KYC", value: docStats?.kyc.pending_review ?? 0, color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock },
                  { label: "KYC Aprovados", value: docStats?.kyc.approved ?? 0, color: "text-green-400", bg: "bg-green-400/10", icon: CheckCircle },
                  { label: "KYC Rejeitados", value: docStats?.kyc.rejected ?? 0, color: "text-red-400", bg: "bg-red-400/10", icon: XCircle },
                  { label: "CORE Ativos", value: docStats?.core.active ?? 0, color: "text-blue-400", bg: "bg-blue-400/10", icon: ShieldCheck },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                      <s.icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <div className="text-2xl font-black">{s.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Buscar por nome, CORE ou CNPJ..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none"
                  value={docStatusFilter}
                  onChange={(e) => setDocStatusFilter(e.target.value)}
                >
                  <option value="all">Todos os status</option>
                  <option value="pending_review">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="not_started">Não enviado</option>
                </select>
              </div>

              {/* Table */}
              {docsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Representante</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">KYC</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CORE</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">CNPJ</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(allDocs?.items ?? []).length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nenhum representante encontrado</td></tr>
                      ) : (allDocs?.items ?? []).map((rep) => {
                        const kycStatus = rep.kycStatus as string;
                        const coreStatus = rep.coreStatus as string;
                        const kycColors: Record<string, string> = {
                          not_started: "bg-zinc-700/30 text-zinc-400",
                          pending_review: "bg-yellow-500/20 text-yellow-400",
                          approved: "bg-green-500/20 text-green-400",
                          rejected: "bg-red-500/20 text-red-400",
                        };
                        const kycLabels: Record<string, string> = {
                          not_started: "Não enviado",
                          pending_review: "Pendente",
                          approved: "Aprovado",
                          rejected: "Rejeitado",
                        };
                        const coreColors: Record<string, string> = {
                          not_checked: "bg-zinc-700/30 text-zinc-400",
                          active: "bg-green-500/20 text-green-400",
                          inactive: "bg-orange-500/20 text-orange-400",
                          not_found: "bg-red-500/20 text-red-400",
                        };
                        const coreLabels: Record<string, string> = {
                          not_checked: "Não verificado",
                          active: "Ativo",
                          inactive: "Inativo",
                          not_found: "Não encontrado",
                        };
                        return (
                          <tr key={rep.id as number} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-medium text-foreground">{rep.fullName as string || "—"}</div>
                              <div className="text-xs text-muted-foreground">{rep.segment as string} • {rep.region as string}</div>
                              {rep.phone && <div className="text-xs text-muted-foreground">{rep.phone as string}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${kycColors[kycStatus] || "bg-zinc-700/30 text-zinc-400"}`}>
                                {kycLabels[kycStatus] || kycStatus}
                              </span>
                              {rep.kycDocumentType && <div className="text-xs text-muted-foreground mt-0.5">{rep.kycDocumentType as string}</div>}
                              {rep.kycExtractedName && <div className="text-xs text-muted-foreground">{rep.kycExtractedName as string}</div>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${coreColors[coreStatus] || "bg-zinc-700/30 text-zinc-400"}`}>
                                {coreLabels[coreStatus] || coreStatus}
                              </span>
                              {rep.coreNumber && <div className="text-xs text-muted-foreground mt-0.5">CORE {rep.coreNumber as string}/{rep.coreState as string}</div>}
                              {rep.coreValidUntil && <div className="text-xs text-muted-foreground">Válido até {rep.coreValidUntil as string}</div>}
                            </td>
                            <td className="px-4 py-3">
                              {rep.cnpj ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                                  {rep.cnpj as string}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Não informado</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {rep.kycDocumentUrl && (
                                  <a href={rep.kycDocumentUrl as string} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                      <Eye className="w-3 h-3 mr-1" />Doc
                                    </Button>
                                  </a>
                                )}
                                {rep.kycSelfieUrl && (
                                  <a href={rep.kycSelfieUrl as string} target="_blank" rel="noreferrer">
                                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                                      <Eye className="w-3 h-3 mr-1" />Selfie
                                    </Button>
                                  </a>
                                )}
                                {kycStatus === "pending_review" && (
                                  <Button
                                    size="sm"
                                    className="h-7 px-2 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                                    onClick={() => {
                                      setReviewModal({ rep: rep as Record<string, unknown>, mode: "kyc" });
                                      setReviewDecision("approved");
                                      setReviewNotes("");
                                    }}
                                  >
                                    <ShieldCheck className="w-3 h-3 mr-1" />Revisar KYC
                                  </Button>
                                )}
                                {rep.coreNumber && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => {
                                      setReviewModal({ rep: rep as Record<string, unknown>, mode: "core" });
                                      setReviewDecision(coreStatus === "active" ? "active" : "active");
                                      setReviewNotes("");
                                    }}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" />CORE
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Review Modal */}
              {reviewModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                  <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                    <h2 className="text-lg font-bold mb-1">
                      {reviewModal.mode === "kyc" ? "Revisar Identidade (KYC)" : "Atualizar Status CORE"}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reviewModal.rep.fullName as string}
                    </p>

                    {reviewModal.mode === "kyc" ? (
                      <div className="space-y-3 mb-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Decisão</div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setReviewDecision("approved")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              reviewDecision === "approved"
                                ? "bg-green-500/20 border-green-500/40 text-green-400"
                                : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />Aprovar
                          </button>
                          <button
                            onClick={() => setReviewDecision("rejected")}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                              reviewDecision === "rejected"
                                ? "bg-red-500/20 border-red-500/40 text-red-400"
                                : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />Rejeitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 mb-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Status CORE</div>
                        {["active", "inactive", "not_found"].map((s) => (
                          <button
                            key={s}
                            onClick={() => setReviewDecision(s)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                              reviewDecision === s
                                ? s === "active" ? "bg-green-500/20 border-green-500/40 text-green-400"
                                  : s === "inactive" ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                                  : "bg-red-500/20 border-red-500/40 text-red-400"
                                : "border-border text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {s === "active" ? "Ativo" : s === "inactive" ? "Inativo" : "Não encontrado"}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="mb-4">
                      <label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold block mb-1">Observação (opcional)</label>
                      <textarea
                        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        rows={3}
                        placeholder="Motivo da decisão, notas para o representante..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => setReviewModal(null)}>Cancelar</Button>
                      <Button
                        className="flex-1"
                        disabled={reviewKycMutation.isPending || reviewCoreMutation.isPending}
                        onClick={() => {
                          if (reviewModal.mode === "kyc") {
                            reviewKycMutation.mutate({
                              representativeId: reviewModal.rep.id as number,
                              decision: reviewDecision as "approved" | "rejected",
                              notes: reviewNotes || undefined,
                            });
                          } else {
                            reviewCoreMutation.mutate({
                              representativeId: reviewModal.rep.id as number,
                              coreStatus: reviewDecision as "active" | "inactive" | "not_found",
                              notes: reviewNotes || undefined,
                            });
                          }
                        }}
                      >
                        {(reviewKycMutation.isPending || reviewCoreMutation.isPending) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : "Confirmar"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "promote" ? "Promover a Admin" : confirmAction?.isActive ? "Reativar Usuário" : "Desativar Usuário"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "promote" ? (
                <>
                  Tem certeza que deseja promover <strong>{confirmAction.userName}</strong> a administrador?
                  <br /><br />
                  <span className="text-yellow-500 font-medium">⚠️ Atenção:</span> Administradores têm acesso total ao painel e a todos os dados da plataforma. Esta ação não pode ser desfeita facilmente.
                </>
              ) : confirmAction?.isActive ? (
                <>Tem certeza que deseja <strong>reativar</strong> o usuário <strong>{confirmAction?.userName}</strong>? O usuário poderá acessar a plataforma novamente.</>
              ) : (
                <>Tem certeza que deseja <strong>desativar</strong> o usuário <strong>{confirmAction?.userName}</strong>? O usuário não conseguirá mais acessar a plataforma.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
            <Button
              variant={confirmAction?.type === "promote" ? "default" : confirmAction?.isActive ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={promoteMutation.isPending || toggleActiveMutation.isPending}
            >
              {(promoteMutation.isPending || toggleActiveMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {confirmAction?.type === "promote" ? "Sim, promover" : confirmAction?.isActive ? "Sim, reativar" : "Sim, desativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
