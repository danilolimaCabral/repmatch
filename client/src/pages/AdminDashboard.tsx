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
import { Users, Building2, Briefcase, TrendingUp, Upload, Loader2, CheckCircle, XCircle, Clock, LogOut, ShieldCheck, BarChart2, UserX, UserCheck, CreditCard, CheckCheck, Search, FileText, ThumbsUp, ThumbsDown, Eye, RefreshCw, Mail, AlertCircle, Menu, X, ArrowUpRight, ShoppingCart, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList, Cell, Legend, LineChart, Line
} from "recharts";
import { useLocation } from "wouter";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const ADMIN_NAV_ITEMS = [
  { id: "stats", label: "Dashboard", icon: TrendingUp },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "comercial", label: "Campanhas B2B/B2C", icon: SlidersHorizontal },
  { id: "pagamentos", label: "Pagamentos PIX", icon: CreditCard },
  { id: "desbloqueios", label: "Desbloqueios", icon: ShieldCheck },
  { id: "documentos", label: "Documentos", icon: FileText },
  { id: "jobs", label: "Vagas", icon: Briefcase },
  { id: "import", label: "Importar Dados", icon: Upload },
  { id: "users", label: "Usuários", icon: Users },
  { id: "representantes", label: "Representantes", icon: UserCheck },
] as const;

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
  const [activeTab, setActiveTab] = useState<"stats" | "analytics" | "comercial" | "import" | "users" | "jobs" | "pagamentos" | "documentos" | "desbloqueios" | "representantes">("stats");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [repSearch, setRepSearch] = useState("");
  const [repEstado, setRepEstado] = useState("");
  const [repOffset, setRepOffset] = useState(0);
  const [expandedRepId, setExpandedRepId] = useState<number | null>(null);
  const [unlockSearch, setUnlockSearch] = useState("");
  const [unlockStatusFilter, setUnlockStatusFilter] = useState<"all" | "pending_payment" | "pending_approval" | "approved" | "rejected" | "abandoned">("all");
  const [contactUnlockPriceInput, setContactUnlockPriceInput] = useState("");
  const commercialPriceInitialized = useRef(false);
  const [leadB2BPriceInput, setLeadB2BPriceInput] = useState("");
  const [leadB2CPriceInput, setLeadB2CPriceInput] = useState("");
  const [leadPreviewAudience, setLeadPreviewAudience] = useState<"b2b" | "b2c">("b2b");
  const leadPricesInitialized = useRef(false);
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
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [profileModal, setProfileModal] = useState<{ userId: number; userName: string } | null>(null);
  const [customEmailSubject, setCustomEmailSubject] = useState("");
  const [customEmailMessage, setCustomEmailMessage] = useState("");
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);

  const profileDetailsQuery = trpc.admin.getUserProfileDetails.useQuery(
    { userId: profileModal?.userId ?? 0 },
    { enabled: !!profileModal }
  );

  const sendCustomEmailMutation = trpc.admin.sendCustomEmail.useMutation({
    onSuccess: (data) => {
      toast.success(`E-mail enviado para ${data.email}!`);
      setSendingCustomEmail(false);
      setCustomEmailSubject("");
      setCustomEmailMessage("");
    },
    onError: (e) => {
      toast.error(`Erro ao enviar: ${e.message}`);
      setSendingCustomEmail(false);
    },
  });

  const sendCadastroEmailMutation = trpc.admin.sendCadastroEmail.useMutation({
    onSuccess: (data) => { toast.success(`Email enviado para ${data.email}!`); setSendingEmailId(null); },
    onError: (e) => { toast.error(`Erro ao enviar email: ${e.message}`); setSendingEmailId(null); },
  });
  // Unlock requests queries
  const { data: unlockRequestsRaw, refetch: refetchUnlockRequests, isLoading: unlockLoading } = trpc.unlockRequests.adminList.useQuery(undefined, {
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const unlockRequests = (unlockRequestsRaw ?? []).filter(r => {
    const isAbandoned = r.status === "pending_payment" && (Date.now() - new Date(r.createdAt).getTime()) >= 30 * 60 * 1000;
    const matchStatus = unlockStatusFilter === "all" || (unlockStatusFilter === "abandoned" ? isAbandoned : r.status === unlockStatusFilter);
    const q = unlockSearch.toLowerCase();
    const matchSearch = !q || (r.companyName ?? "").toLowerCase().includes(q) || (r.companyEmail ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });
  const unlockRequestGroups = unlockStatusFilter === "all"
    ? [
        { id: "ready", label: "Prontos para liberar", description: "PIX confirmado — libere os contatos abaixo.", accent: "border-emerald-200 bg-emerald-50", requests: unlockRequests.filter(r => r.status === "pending_approval") },
        { id: "awaiting", label: "Aguardando confirmação PIX", description: "Confirme somente após verificar o recebimento no Mercado Pago ou extrato.", accent: "border-blue-200 bg-blue-50", requests: unlockRequests.filter(r => r.status === "pending_payment" && Date.now() - new Date(r.createdAt).getTime() < 30 * 60 * 1000) },
        { id: "abandoned", label: "Carrinhos abandonados", description: "Pedidos sem confirmação de pagamento há mais de 30 minutos.", accent: "border-amber-200 bg-amber-50", requests: unlockRequests.filter(r => r.status === "pending_payment" && Date.now() - new Date(r.createdAt).getTime() >= 30 * 60 * 1000) },
        { id: "history", label: "Histórico", description: "Pedidos já aprovados, recusados ou cancelados.", accent: "border-slate-200 bg-slate-50", requests: unlockRequests.filter(r => !["pending_approval", "pending_payment"].includes(r.status)) },
      ].filter(group => group.requests.length > 0)
    : [{ id: "filtered", label: "Solicitações encontradas", description: "", accent: "border-transparent bg-transparent", requests: unlockRequests }];
  const approveUnlockMutation = trpc.unlockRequests.approve.useMutation({
    onSuccess: () => { toast.success("Desbloqueio aprovado! Contatos liberados."); refetchUnlockRequests(); },
    onError: (e) => toast.error(e.message),
  });
  const confirmUnlockPixMutation = trpc.unlockRequests.confirmPix.useMutation({
    onSuccess: () => { toast.success("PIX confirmado. Agora você pode liberar os contatos."); refetchUnlockRequests(); },
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
  const { data: purchaseInterest, isLoading: purchaseInterestLoading } = trpc.admin.purchaseInterest.useQuery(
    { days: analyticsDays },
    { enabled: activeTab === "analytics" }
  );
  const { data: commercialSettings, refetch: refetchCommercialSettings } = trpc.admin.commercialSettings.useQuery(undefined, {
    enabled: activeTab === "comercial",
  });
  const updateContactUnlockPriceMutation = trpc.admin.updateContactUnlockPrice.useMutation({
    onSuccess: (result) => {
      setContactUnlockPriceInput(result.price.toFixed(2).replace(".", ","));
      toast.success(`Valor atualizado para ${result.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}. Novos carrinhos já usarão este preço.`);
      refetchCommercialSettings();
    },
    onError: (error) => toast.error(error.message),
  });
  const { data: leadCatalog, refetch: refetchLeadCatalog } = trpc.leadPackages.catalog.useQuery();
  const { data: leadPreview, refetch: refetchLeadPreview } = trpc.leadPackages.adminPreview.useQuery(
    { audience: leadPreviewAudience },
    { enabled: activeTab === "comercial" },
  );
  const { data: leadOrders, refetch: refetchLeadOrders } = trpc.leadPackages.adminList.useQuery(undefined, { enabled: activeTab === "comercial" || activeTab === "desbloqueios", refetchInterval: 15_000 });
  const { data: unlimitedAccesses, refetch: refetchUnlimitedAccesses } = trpc.leadPackages.adminUnlimitedAccesses.useQuery(undefined, { enabled: activeTab === "comercial" || activeTab === "desbloqueios", refetchInterval: 15_000 });
  const updateLeadPackagePriceMutation = trpc.admin.updateLeadPackagePrice.useMutation({
    onSuccess: (result) => {
      toast.success(`Pacote ${result.audience.toUpperCase()} atualizado para ${result.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`);
      refetchLeadCatalog();
    },
    onError: (error) => toast.error(error.message),
  });
  const reviewLeadOrderMutation = trpc.leadPackages.review.useMutation({
    onSuccess: () => { toast.success("Status do pedido atualizado."); refetchLeadOrders(); },
    onError: (error) => toast.error(error.message),
  });
  const confirmLeadPixMutation = trpc.leadPackages.confirmLeadPix.useMutation({
    onSuccess: () => { toast.success("PIX confirmado. O pedido está pronto para aprovação."); refetchLeadOrders(); },
    onError: (error) => toast.error(error.message),
  });
  const reviewUnlimitedAccessMutation = trpc.leadPackages.reviewUnlimitedAccess.useMutation({
    onSuccess: () => { toast.success("Acesso mensal atualizado."); refetchUnlimitedAccesses(); },
    onError: (error) => toast.error(error.message),
  });
  const confirmUnlimitedPixMutation = trpc.leadPackages.confirmUnlimitedPix.useMutation({
    onSuccess: () => { toast.success("PIX confirmado. O plano está pronto para ativação."); refetchUnlimitedAccesses(); },
    onError: (error) => toast.error(error.message),
  });

  useEffect(() => {
    if (commercialSettings && !commercialPriceInitialized.current) {
      setContactUnlockPriceInput(commercialSettings.contactUnlockPrice.toFixed(2).replace(".", ","));
      commercialPriceInitialized.current = true;
    }
  }, [commercialSettings]);

  useEffect(() => {
    if (leadCatalog && !leadPricesInitialized.current) {
      setLeadB2BPriceInput(leadCatalog.b2b.price.toFixed(2).replace(".", ","));
      setLeadB2CPriceInput(leadCatalog.b2c.price.toFixed(2).replace(".", ","));
      leadPricesInitialized.current = true;
    }
  }, [leadCatalog]);

  function openIndicator(tab: typeof activeTab, userTypeFilterValue?: string) {
    if (tab === "users") {
      setUserTypeFilter(userTypeFilterValue ?? "");
      setUserPage(0);
    }
    if (tab === "representantes") {
      setRepOffset(0);
      setRepSearch("");
      setRepEstado("");
    }
    setActiveTab(tab);
  }

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
    <div className="min-h-screen overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex h-dvh min-h-screen overflow-hidden lg:h-screen">
        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Fechar menu"
            className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          aria-label="Menu administrativo"
          className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2.5rem))] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:translate-x-0 lg:shadow-none ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-6 border-b border-border">
            <div className="flex items-start justify-between gap-3">
              <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
              <button
                type="button"
                className="-mt-1 inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4">
            <div className="font-semibold text-sm">{user?.name}</div>
            <Badge className="mt-1 bg-red-900 text-red-300 text-xs">Admin</Badge>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {ADMIN_NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
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

        <main className="min-w-0 flex-1 overflow-auto">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu administrativo"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">Admin RepMatch</p>
              <p className="truncate text-xs text-muted-foreground">{ADMIN_NAV_ITEMS.find((item) => item.id === activeTab)?.label}</p>
            </div>
          </header>
          <div className="min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (activeTab === "stats") {
                  navigate("/");
                } else {
                  setActiveTab("stats");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              className="border-border"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {activeTab === "stats" ? "Voltar ao site" : "Voltar ao painel"}
            </Button>
          </div>
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
              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Analytics da Plataforma</h1>
                  <p className="text-muted-foreground text-sm mt-1">Crescimento semanal de cadastros e funil de conversão</p>
                </div>
                <Badge className="w-fit bg-red-900/30 text-red-300 border border-red-700/40 px-3 py-1">Admin</Badge>
              </div>

              {/* Visitas ao Site (Umami) */}
              <div className="mb-6 min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Visitas ao Site</h2>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">Pageviews e visitantes únicos</p>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
                    {[7, 30, 90].map(d => (
                      <button key={d} onClick={() => setAnalyticsDays(d)}
                        className={`w-full whitespace-nowrap rounded-full border px-2 py-2 text-xs transition-colors sm:w-auto sm:px-3 sm:py-1 ${
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
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                      {[
                        { label: "Pageviews", value: (siteAnalytics?.pageviews ?? 0).toLocaleString("pt-BR"), color: "text-blue-400", bg: "bg-blue-400/10" },
                        { label: "Visitantes Únicos", value: (siteAnalytics?.visitors ?? 0).toLocaleString("pt-BR"), color: "text-emerald-400", bg: "bg-emerald-400/10" },
                        { label: "Novos Cadastros", value: (siteAnalytics?.newUsers ?? 0).toLocaleString("pt-BR"), color: "text-amber-400", bg: "bg-amber-400/10" },
                        { label: "Conversão", value: siteAnalytics && siteAnalytics.visitors > 0 ? `${Math.round((siteAnalytics.newUsers / siteAnalytics.visitors) * 100)}%` : "0%", color: "text-purple-400", bg: "bg-purple-400/10" },
                      ].map(kpi => (
                        <div key={kpi.label} className={`min-w-0 rounded-lg border border-border p-3 sm:p-4 ${kpi.bg}`}>
                          <div className={`text-xl font-black sm:text-2xl ${kpi.color}`}>{kpi.value}</div>
                          <div className="mt-1 text-xs leading-snug text-muted-foreground [text-wrap:balance]">{kpi.label}</div>
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
                          <Line type="monotone" dataKey="visitors" name="Visitantes Únicos" stroke="#10b981" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="newUsers" name="Novos Cadastros" stroke="#a855f7" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma visita registrada neste período. Os dados aparecerão conforme usuários acessarem o site.</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Interesse de compra de contatos */}
              <div className="mb-6 min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                    <ShoppingCart className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-sm uppercase tracking-wide text-muted-foreground">Interesse em comprar contatos</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground/60">Cliques em “Adicionar ao carrinho” nos cards de representantes no período selecionado</p>
                  </div>
                </div>
                {purchaseInterestLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1">
                      {[
                        { label: "Cliques", value: purchaseInterest?.clicks ?? 0, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                        { label: "Empresas interessadas", value: purchaseInterest?.interestedCompanies ?? 0, color: "text-blue-400", bg: "bg-blue-400/10" },
                        { label: "Cards com interesse", value: purchaseInterest?.representatives ?? 0, color: "text-purple-400", bg: "bg-purple-400/10" },
                      ].map((metric) => (
                        <div key={metric.label} className={`min-w-0 rounded-lg border border-border p-3 ${metric.bg}`}>
                          <div className={`text-xl font-black sm:text-2xl ${metric.color}`}>{metric.value.toLocaleString("pt-BR")}</div>
                          <div className="mt-1 text-[11px] leading-tight text-muted-foreground">{metric.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-border/80 bg-background/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">Cards mais procurados</p>
                        <span className="text-[11px] text-muted-foreground">por cliques no carrinho</span>
                      </div>
                      {(purchaseInterest?.topCards ?? []).length === 0 ? (
                        <div className="flex min-h-28 items-center justify-center text-center text-xs text-muted-foreground">Os dados aparecerão quando empresas adicionarem representantes ao carrinho.</div>
                      ) : (
                        <div className="space-y-2">
                          {(purchaseInterest?.topCards ?? []).map((card, index) => (
                            <div key={card.representativeId} className="flex items-center gap-3 rounded-lg bg-secondary/45 px-3 py-2.5">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-foreground">{card.fullName ?? `Representante #${card.representativeId}`}</p>
                                <p className="truncate text-[11px] text-muted-foreground">{[card.region, card.segment].filter(Boolean).join(" · ") || "Sem região ou segmento"}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-sm font-black text-emerald-400">{card.clicks}</p>
                                <p className="text-[10px] text-muted-foreground">{card.interestedCompanies} empresa{card.interestedCompanies !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
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
                <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                  <h2 className="font-bold mb-1 text-sm uppercase tracking-wide text-muted-foreground">Indicadores Gerais</h2>
                  <p className="text-xs text-muted-foreground/60 mb-5">Totais acumulados da plataforma</p>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { label: "Total de Usuários", value: (conversionFunnel?.[0]?.value ?? 0).toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", tab: "users" as const, destination: "lista de usuários" },
                      { label: "Representantes", value: (conversionFunnel?.[1]?.value ?? 0).toLocaleString(), icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10", tab: "representantes" as const, destination: "representantes" },
                      { label: "Empresas", value: (conversionFunnel?.[2]?.value ?? 0).toLocaleString(), icon: Building2, color: "text-amber-400", bg: "bg-amber-400/10", tab: "users" as const, userType: "company", destination: "empresas cadastradas" },
                      { label: "Planos Pagos", value: (conversionFunnel?.[3]?.value ?? 0).toLocaleString(), icon: CreditCard, color: "text-purple-400", bg: "bg-purple-400/10", tab: "pagamentos" as const, destination: "pagamentos" },
                    ].map((kpi) => (
                      <button
                        key={kpi.label}
                        type="button"
                        onClick={() => openIndicator(kpi.tab, kpi.userType)}
                        aria-label={`Acessar ${kpi.destination}`}
                        className="group min-h-36 min-w-0 rounded-xl border border-border p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 sm:p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${kpi.bg}`}>
                          <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                        </div>
                        <div className="text-2xl font-black text-foreground">{kpi.value}</div>
                        <div className="mt-0.5 text-xs leading-snug text-muted-foreground [text-wrap:balance]">{kpi.label}</div>
                        <div className="mt-3 text-xs font-semibold text-primary">Acessar</div>
                      </button>
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

          {activeTab === "comercial" && (
            <div className="mx-auto max-w-5xl">
              <div className="mb-6">
                <h1 className="text-2xl font-black text-foreground sm:text-3xl">Campanhas B2B/B2C</h1>
                <p className="mt-1 text-sm text-muted-foreground">Aprove PIX de pacotes e planos, libere pesquisas e acompanhe a entrega das campanhas comerciais.</p>
              </div>

              <section className="mb-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">Prévia da entrega</p>
                    <h2 className="mt-1 text-xl font-black text-foreground">Dados que serão gerados no pacote</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Confira a composição real da base antes de aprovar ou entregar uma campanha.</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => refetchLeadPreview()} className="w-fit border-emerald-300 text-emerald-800 hover:bg-emerald-100"><RefreshCw className="mr-2 h-4 w-4" />Atualizar prévia</Button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {(["b2b", "b2c"] as const).map((audience) => <Button key={audience} size="sm" variant={leadPreviewAudience === audience ? "default" : "outline"} onClick={() => setLeadPreviewAudience(audience)} className={leadPreviewAudience === audience ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border-emerald-200 text-emerald-800"}>{audience === "b2b" ? "Empresas B2B" : "Empresas B2C"}</Button>)}
                </div>
                {!leadPreview ? <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando dados disponíveis…</div> : <>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-white p-3 ring-1 ring-emerald-100"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Empresas</p><p className="mt-1 text-xl font-black text-slate-900">{leadPreview.total.toLocaleString("pt-BR")}</p></div>
                    <div className="rounded-xl bg-white p-3 ring-1 ring-emerald-100"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Telefone</p><p className="mt-1 text-xl font-black text-slate-900">{leadPreview.withPhone.toLocaleString("pt-BR")}</p></div>
                    <div className="rounded-xl bg-white p-3 ring-1 ring-emerald-100"><p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">E-mail</p><p className="mt-1 text-xl font-black text-slate-900">{leadPreview.withEmail.toLocaleString("pt-BR")}</p></div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {leadPreview.samples.map((company) => <article key={company.id} className="rounded-xl border border-emerald-100 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-bold text-foreground">{company.nomeFantasia || company.razaoSocial}</p><p className="mt-1 truncate text-xs text-muted-foreground">{company.cnaeDescricao || company.segmento || "Atividade comercial"}</p></div><Badge className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">{company.porte || "Empresa"}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{company.cidade || "Cidade não informada"}{company.estado ? ` · ${company.estado}` : ""}</p><div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold"><span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">CNPJ</span>{company.telefone && <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">Telefone</span>}{company.email && <span className="rounded-full bg-violet-50 px-2 py-1 text-violet-800">E-mail</span>}{company.site && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">Site</span>}{company.instagram && <span className="rounded-full bg-pink-50 px-2 py-1 text-pink-800">Instagram</span>}</div></article>)}
                  </div>
                </>}
              </section>

              <div className="grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl border border-primary/25 bg-card p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><CreditCard className="h-5 w-5" /></div>
                    <div>
                      <h2 className="font-bold text-foreground">Valor por contato</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Aplicado somente nos novos carrinhos PIX. Pedidos já criados mantêm o valor original.</p>
                    </div>
                  </div>
                  {!commercialSettings ? (
                    <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando valor atual…</div>
                  ) : (
                    <div className="mt-6">
                      <label htmlFor="contact-unlock-price" className="text-sm font-semibold text-foreground">Preço por representante</label>
                      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R$</span>
                          <input id="contact-unlock-price" inputMode="decimal" value={contactUnlockPriceInput} onChange={(event) => setContactUnlockPriceInput(event.target.value.replace(/[^0-9,\.]/g, ""))} className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-base font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/30" aria-label="Valor por contato em reais" />
                        </div>
                        <Button disabled={updateContactUnlockPriceMutation.isPending} onClick={() => {
                          const price = Number(contactUnlockPriceInput.replace(",", "."));
                          if (!Number.isFinite(price) || price < 0.5) { toast.error("Informe um valor de pelo menos R$ 0,50."); return; }
                          updateContactUnlockPriceMutation.mutate({ price });
                        }} className="bg-primary text-primary-foreground hover:bg-primary/90">
                          {updateContactUnlockPriceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}Salvar valor
                        </Button>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Valor ativo: <strong className="text-foreground">{commercialSettings.contactUnlockPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>{commercialSettings.updatedAt ? ` · atualizado em ${new Date(commercialSettings.updatedAt).toLocaleDateString("pt-BR")}` : ""}</p>
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><ShoppingCart className="h-5 w-5" /></div>
                    <div>
                      <h2 className="font-bold text-foreground">Carrinhos abandonados</h2>
                      <p className="mt-1 text-sm text-muted-foreground">Pedidos PIX sem pagamento há mais de 30 minutos.</p>
                    </div>
                  </div>
                  {(() => {
                    const abandoned = (unlockRequestsRaw ?? []).filter((request) => request.status === "pending_payment" && Date.now() - new Date(request.createdAt).getTime() >= 30 * 60 * 1000);
                    const total = abandoned.reduce((sum, request) => sum + Number(request.totalAmount), 0);
                    return <>
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-800">Carrinhos</p><p className="mt-1 text-2xl font-black text-foreground">{abandoned.length}</p></div>
                        <div className="rounded-xl bg-secondary/70 p-3"><p className="text-xs font-semibold text-muted-foreground">Potencial</p><p className="mt-1 text-2xl font-black text-foreground">{total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></div>
                      </div>
                      <Button variant="outline" onClick={() => { setUnlockStatusFilter("abandoned"); setUnlockSearch(""); setActiveTab("desbloqueios"); }} className="mt-4 w-full border-amber-300 text-amber-800 hover:bg-amber-50"><Eye className="mr-2 h-4 w-4" />Ver carrinhos abandonados</Button>
                    </>;
                  })()}
                </section>
              </div>

              <section className="mt-5 rounded-2xl border border-violet-200 bg-card p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-foreground">Pacotes de leads B2B e B2C</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Pacotes de 2.000 leads com segmentação, PIX e entrega manual após aprovação.</p>
                  </div>
                  <Button variant="outline" onClick={() => window.open("/pacotes-leads", "_blank")} className="w-fit"><ArrowUpRight className="mr-2 h-4 w-4" />Ver página de vendas</Button>
                </div>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {([
                    { audience: "b2b" as const, label: "Pacote B2B", description: "Empresas ativas e contatos corporativos quando disponíveis", value: leadB2BPriceInput, setValue: setLeadB2BPriceInput, current: leadCatalog?.b2b.price },
                    { audience: "b2c" as const, label: "Pacote B2C", description: "Empresas com atuação B2C ou mista", value: leadB2CPriceInput, setValue: setLeadB2CPriceInput, current: leadCatalog?.b2c.price },
                  ]).map((leadPackage) => (
                    <div key={leadPackage.audience} className="rounded-xl border border-border bg-background p-4">
                      <p className="font-bold text-foreground">{leadPackage.label} · 1.000 ou 2.000 empresas</p>
                      <p className="mt-1 text-xs text-muted-foreground">{leadPackage.description}</p>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">R$</span><input inputMode="decimal" value={leadPackage.value} onChange={(event) => leadPackage.setValue(event.target.value.replace(/[^0-9,.]/g, ""))} className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-3 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30" aria-label={`Preço do ${leadPackage.label}`} /></div>
                        <Button size="sm" disabled={updateLeadPackagePriceMutation.isPending} onClick={() => {
                          const price = Number(leadPackage.value.replace(",", "."));
                          if (!Number.isFinite(price) || price < 50) { toast.error("Informe um valor de pelo menos R$ 50,00."); return; }
                          updateLeadPackagePriceMutation.mutate({ audience: leadPackage.audience, price });
                        }}>{updateLeadPackagePriceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</Button>
                      </div>
                      {leadPackage.current !== undefined && <p className="mt-2 text-xs text-muted-foreground">Ativo para 2.000 empresas: <strong className="text-foreground">{leadPackage.current.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong></p>}
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-foreground">Pedidos de pacotes de leads</h2><p className="mt-1 text-sm text-muted-foreground">Confirme o PIX, aprove o briefing e marque a entrega quando o lote for disponibilizado.</p></div><Button size="sm" variant="outline" onClick={() => refetchLeadOrders()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
                <div className="mt-5 space-y-3">
                  {!leadOrders?.length ? <p className="rounded-xl bg-secondary/40 p-6 text-center text-sm text-muted-foreground">Nenhum pedido de pacote de leads até o momento.</p> : leadOrders.map((order) => (
                    <article key={order.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="font-bold text-foreground">#{order.id} · {order.quantity.toLocaleString("pt-BR")} leads {order.audience.toUpperCase()}</p><p className="mt-1 break-all text-xs text-muted-foreground">{order.buyerName || "Cliente"} · {order.buyerEmail || "E-mail não informado"}</p><p className="mt-2 text-xs text-muted-foreground">{order.segment || "Todos os segmentos"} · {order.region || "Nacional"}{order.notes ? ` · ${order.notes}` : ""}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">{Number(order.totalAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${order.status === "pending_approval" ? "bg-amber-100 text-amber-800" : order.status === "delivered" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{order.status === "pending_payment" ? "Aguardando PIX" : order.status === "pending_approval" ? "PIX confirmado" : order.status === "approved" ? "Em preparação" : order.status === "delivered" ? "Entregue" : order.status}</span></div></div>
                      {order.mpPaymentId && <p className="mt-3 text-xs font-medium text-blue-700">QR Code PIX emitido pelo Mercado Pago · Pagamento #{order.mpPaymentId}</p>}
                      {order.status === "pending_payment" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={confirmLeadPixMutation.isPending} onClick={() => confirmLeadPixMutation.mutate({ orderId: order.id })}>{confirmLeadPixMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="mr-1 h-3.5 w-3.5" />}Confirmar PIX recebido</Button></div>}
                      {order.status === "pending_approval" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={reviewLeadOrderMutation.isPending} onClick={() => reviewLeadOrderMutation.mutate({ orderId: order.id, status: "approved" })}><CheckCheck className="mr-1 h-3.5 w-3.5" />Aprovar briefing</Button><Button size="sm" variant="outline" className="border-red-300 text-red-700" disabled={reviewLeadOrderMutation.isPending} onClick={() => reviewLeadOrderMutation.mutate({ orderId: order.id, status: "rejected" })}>Rejeitar</Button></div>}
                      {order.status === "approved" && <div className="mt-4"><Button size="sm" disabled={reviewLeadOrderMutation.isPending} onClick={() => reviewLeadOrderMutation.mutate({ orderId: order.id, status: "delivered" })}><CheckCircle className="mr-1 h-3.5 w-3.5" />Marcar como entregue</Button></div>}
                    </article>
                  ))}
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-foreground">Plano Pesquisa Ilimitada — R$ 499/mês</h2><p className="mt-1 text-sm text-muted-foreground">Após confirmar o PIX, ative 30 dias de pesquisa sem limite no catálogo empresarial.</p></div><Button size="sm" variant="outline" onClick={() => refetchUnlimitedAccesses()}><RefreshCw className="mr-2 h-4 w-4" />Atualizar</Button></div>
                <div className="mt-5 space-y-3">{!unlimitedAccesses?.length ? <p className="rounded-xl bg-secondary/40 p-6 text-center text-sm text-muted-foreground">Nenhuma assinatura ilimitada até o momento.</p> : unlimitedAccesses.map((access) => <article key={access.id} className="rounded-xl border border-border bg-background p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-bold text-foreground">#{access.id} · Pesquisa Ilimitada</p><p className="mt-1 break-all text-xs text-muted-foreground">{access.buyerName || "Cliente"} · {access.buyerEmail || "E-mail não informado"}</p><p className="mt-2 text-xs text-muted-foreground">{access.expiresAt ? `Ativo até ${new Date(access.expiresAt).toLocaleDateString("pt-BR")}` : "Vigência: 30 dias após a ativação"}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">{Number(access.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${access.status === "pending_approval" ? "bg-amber-100 text-amber-800" : access.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{access.status === "pending_payment" ? "Aguardando PIX" : access.status === "pending_approval" ? "PIX confirmado" : access.status === "active" ? "Ativo" : access.status}</span></div></div>{access.status === "pending_payment" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={confirmUnlimitedPixMutation.isPending} onClick={() => confirmUnlimitedPixMutation.mutate({ accessId: access.id })}>{confirmUnlimitedPixMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="mr-1 h-3.5 w-3.5" />}Confirmar PIX recebido</Button></div>}{access.status === "pending_approval" && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" disabled={reviewUnlimitedAccessMutation.isPending} onClick={() => reviewUnlimitedAccessMutation.mutate({ accessId: access.id, status: "active" })}><CheckCheck className="mr-1 h-3.5 w-3.5" />Ativar por 30 dias</Button><Button size="sm" variant="outline" className="border-red-300 text-red-700" disabled={reviewUnlimitedAccessMutation.isPending} onClick={() => reviewUnlimitedAccessMutation.mutate({ accessId: access.id, status: "rejected" })}>Rejeitar</Button></div>}</article>)}</div>
              </section>

              <section className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-foreground">Acessos rápidos</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Consulte os cadastros recentes e a fila de liberação de contatos.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button variant="outline" onClick={() => openIndicator("users")}><Users className="mr-2 h-4 w-4" />Ver cadastros</Button>
                    <Button variant="outline" onClick={() => { setUnlockStatusFilter("pending_approval"); setUnlockSearch(""); setActiveTab("desbloqueios"); }}><CheckCheck className="mr-2 h-4 w-4" />PIX para liberar</Button>
                  </div>
                </div>
              </section>
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
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Vagas Publicadas</h1>
                  <p className="text-muted-foreground text-sm mt-1">Todas as vagas cadastradas na plataforma</p>
                </div>
                <Badge className="w-fit bg-purple-900/30 text-purple-300 border border-purple-700/40 px-3 py-1">
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
                  <div className="divide-y divide-border sm:hidden">
                    {((stats as Record<string, unknown> & { recentJobs?: Array<{ id: number; title: string; status: string; segment: string | null; region: string | null; createdAt: Date }> })?.recentJobs ?? []).map((job) => (
                      <article key={job.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Vaga #{job.id}</p>
                            <h2 className="mt-1 text-base font-bold leading-snug text-foreground">{job.title}</h2>
                          </div>
                          <Badge className={`${job.status === "open" ? "bg-green-900/30 text-green-300" : job.status === "paused" ? "bg-yellow-900/30 text-yellow-300" : "bg-zinc-700 text-zinc-300"} shrink-0`} variant="outline">
                            {job.status === "open" ? "Aberta" : job.status === "paused" ? "Pausada" : "Fechada"}
                          </Badge>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                          <div><dt className="text-muted-foreground">Segmento</dt><dd className="mt-0.5 font-medium text-foreground">{job.segment ?? "—"}</dd></div>
                          <div><dt className="text-muted-foreground">Região</dt><dd className="mt-0.5 font-medium text-foreground">{job.region ?? "—"}</dd></div>
                        </dl>
                        <p className="mt-3 text-xs text-muted-foreground">Publicada em {new Date(job.createdAt).toLocaleDateString("pt-BR")}</p>
                      </article>
                    ))}
                  </div>
                  <table className="hidden w-full text-sm sm:table">
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
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Gerenciar Usuários</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {userTotal > 0 ? <><span className="font-semibold text-foreground">{userTotal}</span> usuários cadastrados</> : "Todos os usuários cadastrados na plataforma"}
                  </p>
                </div>
                <Badge className="w-fit bg-red-900/30 text-red-300 border border-red-700/40 px-3 py-1">Admin</Badge>
              </div>

              {/* Filtros */}
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Buscar por nome ou email..."
                    value={userSearch}
                    onChange={e => { setUserSearch(e.target.value); setUserPage(0); }}
                  />
                </div>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"
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
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-auto"
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
                  <div className="divide-y divide-border sm:hidden">
                    {allUsers.map((u) => {
                      const uTyped = u as Record<string, unknown> & { profileStatus?: string; userType?: string; isActive?: boolean };
                      const profileStatus = uTyped.profileStatus ?? "incomplete";
                      const typeLabels: Record<string, string> = { representative: "Representante", company: "Empresa", manager: "Gerente", pending: "Pendente" };
                      const profileLabels: Record<string, string> = { complete: "Completo", partial: "Parcial", incomplete: "Incompleto" };
                      const isActive = uTyped.isActive !== false;
                      return (
                        <article key={u.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-muted-foreground">Usuário #{u.id}</p>
                              <h2 className="mt-1 truncate text-base font-bold text-foreground">{u.name ?? "Sem nome"}</h2>
                              <p className="mt-1 truncate text-sm text-muted-foreground">{u.email ?? "Sem e-mail"}</p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${isActive ? "border-green-300 bg-green-100 text-gray-900" : "border-gray-300 bg-gray-100 text-gray-700"}`}>
                              {isActive ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-md border border-border bg-secondary px-2 py-1 text-[11px] font-semibold text-foreground">{typeLabels[uTyped.userType ?? "pending"] ?? "Pendente"}</span>
                            <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${profileStatus === "complete" ? "border-green-300 bg-green-100 text-gray-900" : profileStatus === "partial" ? "border-amber-300 bg-amber-100 text-gray-900" : "border-red-300 bg-red-100 text-gray-900"}`}>{profileLabels[profileStatus] ?? "Incompleto"}</span>
                            {u.role === "admin" && <span className="rounded-md border border-red-300 bg-red-100 px-2 py-1 text-[11px] font-semibold text-gray-900">Admin</span>}
                          </div>
                          <p className="mt-3 text-xs text-muted-foreground">Cadastro em {new Date(u.createdAt).toLocaleDateString("pt-BR")}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {profileStatus !== "complete" ? (
                              <Button size="sm" variant="outline" className="text-xs" onClick={() => setProfileModal({ userId: u.id, userName: u.name ?? `#${u.id}` })}>
                                <Eye className="mr-1 h-3 w-3" />Ver perfil
                              </Button>
                            ) : <div />}
                            {u.email && (
                              <Button size="sm" variant="outline" className="text-xs border-blue-700/40 text-blue-500" onClick={() => { setSendingEmailId(u.id); sendCadastroEmailMutation.mutate({ userId: u.id }); }} disabled={sendingEmailId === u.id && sendCadastroEmailMutation.isPending}>
                                {sendingEmailId === u.id && sendCadastroEmailMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Mail className="mr-1 h-3 w-3" />E-mail</>}
                              </Button>
                            )}
                            {u.id !== user?.id && (
                              <Button size="sm" variant="outline" className={`col-span-2 text-xs ${isActive ? "border-red-700/40 text-red-500" : "border-green-700/40 text-green-600"}`} onClick={() => setConfirmAction({ type: "toggle", userId: u.id, userName: u.name ?? `#${u.id}`, isActive: !isActive })} disabled={toggleActiveMutation.isPending}>
                                {isActive ? <><UserX className="mr-1 h-3 w-3" />Desativar usuário</> : <><UserCheck className="mr-1 h-3 w-3" />Reativar usuário</>}
                              </Button>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <table className="hidden w-full text-sm sm:table">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40">
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">ID</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Nome</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Email</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Tipo</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Papel</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Perfil</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Cadastro</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-foreground uppercase tracking-wide">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">#{u.id}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{u.name ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{u.email ?? "—"}</td>
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
                          <td className="px-4 py-3">
                            {(() => {
                              const uTyped = u as Record<string, unknown> & { profileStatus?: string; userType?: string };
                              const ps = uTyped.profileStatus ?? "incomplete";
                              if (ps === "complete") return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-gray-900 border border-green-300">Completo</span>;
                              if (ps === "partial") return (
                                <button onClick={() => setProfileModal({ userId: u.id, userName: u.name ?? `#${u.id}` })} className="flex items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-gray-900 border border-amber-300 hover:bg-amber-200 cursor-pointer">Parcial</span>
                                  <Eye className="w-3 h-3 text-amber-600" />
                                </button>
                              );
                              return (
                                <button onClick={() => setProfileModal({ userId: u.id, userName: u.name ?? `#${u.id}` })} className="flex items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-gray-900 border border-red-300 hover:bg-red-200 cursor-pointer">Incompleto</span>
                                  <Eye className="w-3 h-3 text-red-500" />
                                </button>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString("pt-BR")}</td>
                          <td className="px-4 py-3">
                            {(u as Record<string, unknown> & { isActive?: boolean }).isActive !== false ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-gray-900 border border-green-300">Ativo</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">Inativo</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {/* Botão Enviar Email de Cadastro */}
                              {u.email && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-blue-700/40 text-blue-400 hover:bg-blue-900/20"
                                  onClick={() => { setSendingEmailId(u.id); sendCadastroEmailMutation.mutate({ userId: u.id }); }}
                                  disabled={sendingEmailId === u.id && sendCadastroEmailMutation.isPending}
                                  title="Enviar email para finalizar cadastro"
                                >
                                  {sendingEmailId === u.id && sendCadastroEmailMutation.isPending ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <><Mail className="w-3 h-3 mr-1" />Email</>
                                  )}
                                </Button>
                              )}
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
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Representantes Importados</h1>
                  <p className="text-muted-foreground text-sm mt-1">9.680 representantes enriquecidos via CNPJÁ — CNPJ, e-mail, telefone, sócios e mais</p>
                </div>
                <Badge className="w-fit bg-blue-900/30 text-blue-300 border border-blue-700/40 px-3 py-1">
                  <UserCheck className="w-3 h-3 mr-1" />9.680 reps
                </Badge>
              </div>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Buscar por nome, CNPJ ou e-mail..."
                    value={repSearch}
                    onChange={e => { setRepSearch(e.target.value); setRepOffset(0); }}
                  />
                </div>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none sm:w-auto"
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
                  <div className="divide-y divide-border sm:hidden">
                    {(enrichedReps?.reps ?? []).map((r) => (
                      <article key={r.id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">Representante #{r.id}</p>
                            <h2 className="mt-1 text-base font-bold leading-snug text-foreground">{r.fullName}</h2>
                            {r.nomeFantasia && <p className="mt-0.5 text-xs text-muted-foreground">{r.nomeFantasia}</p>}
                          </div>
                          {r.situacaoCadastral ? (
                            <Badge className={`${r.situacaoCadastral.toLowerCase().includes("ativa") ? "bg-green-100 text-gray-900 border-green-300" : "bg-gray-100 text-gray-700 border-gray-300"} shrink-0 text-[11px]`}>
                              {r.situacaoCadastral}
                            </Badge>
                          ) : null}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
                          <div className="min-w-0"><dt className="text-muted-foreground">CNPJ / CPF</dt><dd className="mt-0.5 break-all font-mono font-medium text-foreground">{r.cnpj ?? r.cpf ?? "—"}</dd></div>
                          <div className="min-w-0"><dt className="text-muted-foreground">Cidade / UF</dt><dd className="mt-0.5 font-medium text-foreground">{r.cidade && r.estado ? `${r.cidade}/${r.estado}` : r.estado ?? "—"}</dd></div>
                          <div className="min-w-0"><dt className="text-muted-foreground">E-mail</dt><dd className="mt-0.5 break-all font-medium text-foreground">{r.email ?? "—"}</dd></div>
                          <div className="min-w-0"><dt className="text-muted-foreground">Telefone</dt><dd className="mt-0.5 font-medium text-foreground">{r.phone ?? "—"}</dd></div>
                        </dl>
                        <Button size="sm" variant="outline" className="mt-4 w-full text-xs" onClick={() => setExpandedRepId(expandedRepId === r.id ? null : r.id)}>
                          <Eye className="mr-1 h-3 w-3" />{expandedRepId === r.id ? "Ocultar dados fiscais" : "Ver dados fiscais"}
                        </Button>
                        {expandedRepId === r.id && (
                          <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3 text-xs">
                            <div><span className="text-muted-foreground">Porte:</span> <span className="font-medium text-foreground">{r.porte ?? "—"}</span></div>
                            <div><span className="text-muted-foreground">Abertura:</span> <span className="font-medium text-foreground">{r.dataAbertura ?? "—"}</span></div>
                            <div><span className="text-muted-foreground">CNAE:</span> <span className="font-medium text-foreground">{r.cnaeDescricao ?? "—"}</span></div>
                            <div><span className="text-muted-foreground">MEI:</span> <span className="font-medium text-foreground">{r.mei ? "Sim" : "Não"}</span></div>
                            {r.socios && <div className="col-span-2"><span className="text-muted-foreground">Sócios:</span> <span className="font-medium text-foreground">{r.socios}</span></div>}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                  <table className="hidden w-full text-sm sm:table">
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
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Pagamentos PIX Pendentes</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Representantes com pagamento pendente — ative o plano após confirmar o comprovante no WhatsApp
                  </p>
                </div>
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <Badge className="bg-amber-900/30 text-amber-300 border border-amber-700/40 px-3 py-1">
                    {pendingPayments?.length ?? 0} pendentes
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => refetchPending()} className="border-border">
                    Atualizar
                  </Button>
                </div>
              </div>

              {(() => {
                const pendingUnlocks = (unlockRequestsRaw ?? []).filter((request) => request.status === "pending_payment");
                const readyUnlocks = (unlockRequestsRaw ?? []).filter((request) => request.status === "pending_approval");
                const pendingTotal = pendingUnlocks.reduce((sum, request) => sum + Number(request.totalAmount), 0);
                return (
                  <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><ShoppingCart className="h-5 w-5" /></div>
                        <div>
                          <h2 className="font-bold text-amber-950">Desbloqueios de contatos por PIX</h2>
                          <p className="mt-1 text-sm text-amber-800">
                            {readyUnlocks.length > 0
                              ? `${readyUnlocks.length} pedido(s) com PIX confirmado aguardando sua liberação.`
                              : pendingUnlocks.length > 0
                                ? `${pendingUnlocks.length} pedido(s) aguardando confirmação do Mercado Pago — ${pendingTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`
                                : "Não há pedidos de contatos aguardando pagamento ou liberação."}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" className="shrink-0" onClick={() => { setActiveTab("desbloqueios"); setUnlockStatusFilter(readyUnlocks.length > 0 ? "pending_approval" : "pending_payment"); }}>
                        Ver solicitações <ArrowUpRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </section>
                );
              })()}

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
                  <div className="divide-y divide-border sm:hidden">
                    {(pendingPayments ?? [])
                      .filter((r) => {
                        if (!pixSearch) return true;
                        const q = pixSearch.toLowerCase();
                        return (r.fullName ?? "").toLowerCase().includes(q) || (r.phone ?? "").includes(q) || (r.region ?? "").toLowerCase().includes(q);
                      })
                      .map((rep) => (
                        <article key={rep.repId} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-muted-foreground">Representante #{rep.repId}</p>
                              <h2 className="mt-1 text-base font-bold text-foreground">{rep.fullName ?? "—"}</h2>
                              {rep.userEmail && <p className="mt-1 break-all text-xs text-muted-foreground">{rep.userEmail}</p>}
                            </div>
                            <Badge className="shrink-0 border-amber-300 bg-amber-100 text-gray-900">Pendente</Badge>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                            <div><dt className="text-muted-foreground">Telefone</dt><dd className="mt-0.5 font-medium text-foreground">{rep.phone ?? "—"}</dd></div>
                            <div><dt className="text-muted-foreground">Região</dt><dd className="mt-0.5 font-medium text-foreground">{rep.region ?? "—"}</dd></div>
                            <div><dt className="text-muted-foreground">Segmento</dt><dd className="mt-0.5 font-medium text-foreground">{rep.segment ?? "—"}</dd></div>
                            <div><dt className="text-muted-foreground">Cadastro</dt><dd className="mt-0.5 font-medium text-foreground">{rep.createdAt ? new Date(rep.createdAt).toLocaleDateString("pt-BR") : "—"}</dd></div>
                          </dl>
                          <p className="mt-4 text-xs font-semibold text-muted-foreground">Ativar plano</p>
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {(["bronze", "prata", "ouro"] as const).map((tier) => (
                              <Button key={tier} size="sm" variant="outline" disabled={activatePlanMutation.isPending && activatingId === rep.repId} onClick={() => { setActivatingId(rep.repId); activatePlanMutation.mutate({ repId: rep.repId, tier }); }} className={`text-xs capitalize ${tier === "bronze" ? "border-orange-700/40 text-orange-500" : tier === "prata" ? "border-primary/40 text-primary" : "border-amber-600/40 text-amber-500"}`}>
                                {activatePlanMutation.isPending && activatingId === rep.repId ? <Loader2 className="h-3 w-3 animate-spin" /> : tier}
                              </Button>
                            ))}
                          </div>
                        </article>
                      ))}
                  </div>
                  <table className="hidden w-full text-sm sm:table">
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
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Solicitações de Desbloqueio</h1>
                  <p className="text-muted-foreground text-sm mt-1">PIX confirmado pelo Mercado Pago aparece aqui para você liberar os contatos manualmente</p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button size="sm" variant="outline" onClick={() => setActiveTab("comercial")} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <SlidersHorizontal className="mr-1 h-4 w-4" />Campanhas B2B/B2C ({(leadOrders ?? []).filter(order => ["pending_payment", "pending_approval"].includes(order.status)).length})
                  </Button>
                  <Badge className="bg-amber-900/30 text-amber-300 border border-amber-700/40 px-3 py-1">
                    {(unlockRequestsRaw ?? []).filter(r => r.status === "pending_approval").length} pendentes
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => refetchUnlockRequests()} className="border-border">
                    <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
                  </Button>
                </div>
              </div>

              {(() => {
                const pendingCampaigns = (leadOrders ?? []).filter((order) => ["pending_payment", "pending_approval", "approved"].includes(order.status));
                if (!pendingCampaigns.length) return null;
                return (
                  <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 font-bold text-emerald-950"><SlidersHorizontal className="h-5 w-5" />Pacotes de leads B2B/B2C</h2>
                        <p className="mt-1 text-sm text-emerald-900/80">QR Code emitido e pagamento pendente também aparece aqui. Confirme o PIX e depois libere a preparação ou entrega.</p>
                      </div>
                      <Button size="sm" variant="outline" className="self-start border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100" onClick={() => { refetchLeadOrders(); refetchUnlimitedAccesses(); }}><RefreshCw className="mr-1.5 h-4 w-4" />Atualizar</Button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {pendingCampaigns.map((order) => (
                        <article key={order.id} className="rounded-xl border border-emerald-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-950">Pedido #{order.id} · {order.quantity.toLocaleString("pt-BR")} empresas {order.audience.toUpperCase()}</p>
                              <p className="mt-1 break-all text-xs text-slate-600">{order.buyerName || "Cliente"} · {order.buyerEmail || "E-mail não informado"}</p>
                              <p className="mt-1 text-xs text-slate-600">{order.segment || "Todos os segmentos"} · {order.region || "Nacional"} · {Number(order.totalAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                              {order.mpPaymentId && <p className="mt-2 text-xs font-medium text-blue-700">QR Code PIX emitido · Pagamento #{order.mpPaymentId}</p>}
                            </div>
                            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${order.status === "pending_payment" ? "bg-blue-100 text-blue-800" : order.status === "pending_approval" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>{order.status === "pending_payment" ? "Verificando PIX" : order.status === "pending_approval" ? "PIX confirmado" : "Em preparação"}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {order.status === "pending_payment" && <Button size="sm" className="bg-blue-600 hover:bg-blue-700" disabled={confirmLeadPixMutation.isPending} onClick={() => confirmLeadPixMutation.mutate({ orderId: order.id })}>{confirmLeadPixMutation.isPending ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="mr-1 h-3.5 w-3.5" />}Confirmar PIX recebido</Button>}
                            {order.status === "pending_approval" && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={reviewLeadOrderMutation.isPending} onClick={() => reviewLeadOrderMutation.mutate({ orderId: order.id, status: "approved" })}><CheckCheck className="mr-1 h-3.5 w-3.5" />Liberar pacote ao comprador</Button>}
                            {order.status === "approved" && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" disabled={reviewLeadOrderMutation.isPending} onClick={() => reviewLeadOrderMutation.mutate({ orderId: order.id, status: "delivered" })}><CheckCircle className="mr-1 h-3.5 w-3.5" />Marcar como entregue</Button>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })()}

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
                  <option value="abandoned">Carrinhos abandonados</option>
                  <option value="pending_payment">Aguardando pagamento PIX</option>
                  <option value="pending_approval">PIX confirmado — liberar</option>
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
                <div className="space-y-6 overflow-x-hidden">
                  {unlockRequestGroups.map((group) => (
                    <section key={group.id} className="space-y-3">
                      <div className={`rounded-xl border p-3 ${group.accent}`}>
                        <h2 className="text-sm font-bold text-foreground">{group.label} <span className="text-muted-foreground">({group.requests.length})</span></h2>
                        {group.description && <p className="mt-1 text-xs text-muted-foreground">{group.description}</p>}
                      </div>
                      <div className="space-y-3">
                        {group.requests.map(req => (
                    <div key={req.id} className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="font-bold text-foreground">{req.companyName ?? "Empresa"}</div>
                          <div className="break-all text-xs text-muted-foreground">{req.companyEmail ?? ""}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge className={`text-xs ${
                              req.status === "pending_approval" ? "bg-amber-900/30 text-amber-300 border-amber-700/40" :
                              req.status === "approved" ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/40" :
                              req.status === "rejected" ? "bg-red-900/30 text-red-300 border-red-700/40" :
                              "bg-secondary text-muted-foreground border-border"
                            } border`}>
                              {req.status === "pending_payment" && "Aguardando pagamento PIX"}
                              {req.status === "cancelled" && "Cancelado"}
                              {req.status === "pending_approval" && "PIX confirmado — liberar"}
                              {req.status === "approved" && "Aprovado"}
                              {req.status === "rejected" && "Rejeitado"}
                            </Badge>
                            {req.status === "pending_payment" && Date.now() - new Date(req.createdAt).getTime() >= 30 * 60 * 1000 && (
                              <Badge className="border-amber-300 bg-amber-100 text-amber-900">Carrinho abandonado</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {req.paymentMethod === "pix" ? "Pix" : "Cartão"} • {Number(req.totalAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                            {req.paymentId && (
                              <span className="text-xs font-medium text-emerald-500">Pagamento Mercado Pago confirmado</span>
                            )}
                          </div>
                        </div>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
                          {req.pixProofUrl && (
                            <Button size="sm" variant="outline" className="border-border text-xs" onClick={() => setViewProofUrl(req.pixProofUrl!)}>
                              <Eye className="w-3 h-3 mr-1" /> Ver comprovante
                            </Button>
                          )}
                          {req.status === "pending_payment" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs sm:flex-none"
                              disabled={confirmUnlockPixMutation.isPending}
                              onClick={() => confirmUnlockPixMutation.mutate({ requestId: req.id })}
                            >
                              {confirmUnlockPixMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3 mr-1" />}
                              Confirmar PIX recebido
                            </Button>
                          )}
                          {req.status === "pending_approval" && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700 sm:flex-none"
                                disabled={approveUnlockMutation.isPending}
                                onClick={() => approveUnlockMutation.mutate({ requestId: req.id })}
                              >
                                {approveUnlockMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3 mr-1" />}
                                Liberar contatos
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 border-red-700/40 text-xs text-red-400 hover:bg-red-900/20 sm:flex-none"
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
                    </section>
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
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-black">Validação de Documentos</h1>
                  <p className="text-muted-foreground text-sm mt-1">Revise identidade (KYC), registro CORE e CNPJ dos representantes</p>
                </div>
                <Button className="w-fit" variant="outline" size="sm" onClick={() => { refetchDocs(); refetchDocStats(); }}>
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
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative w-full sm:max-w-xs sm:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="Buscar por nome, CORE ou CNPJ..."
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                  />
                </div>
                <select
                  className="w-full px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none sm:w-auto"
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
                  <div className="divide-y divide-border sm:hidden">
                    {(allDocs?.items ?? []).length === 0 ? (
                      <p className="p-8 text-center text-sm text-muted-foreground">Nenhum representante encontrado</p>
                    ) : (allDocs?.items ?? []).map((rep) => {
                      const kycStatus = rep.kycStatus as string;
                      const coreStatus = rep.coreStatus as string;
                      const kycLabels: Record<string, string> = { not_started: "Não enviado", pending_review: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
                      const coreLabels: Record<string, string> = { not_checked: "Não verificado", active: "Ativo", inactive: "Inativo", not_found: "Não encontrado" };
                      return (
                        <article key={rep.id as number} className="p-4">
                          <p className="text-xs font-medium text-muted-foreground">Representante #{rep.id as number}</p>
                          <h2 className="mt-1 text-base font-bold text-foreground">{rep.fullName as string || "—"}</h2>
                          <p className="mt-1 text-xs text-muted-foreground">{rep.segment as string || "Sem segmento"} · {rep.region as string || "Sem região"}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-secondary/50 p-2"><p className="text-muted-foreground">KYC</p><p className="mt-0.5 font-semibold text-foreground">{kycLabels[kycStatus] ?? kycStatus}</p></div>
                            <div className="rounded-lg bg-secondary/50 p-2"><p className="text-muted-foreground">CORE</p><p className="mt-0.5 font-semibold text-foreground">{coreLabels[coreStatus] ?? coreStatus}</p></div>
                            <div className="col-span-2 rounded-lg bg-secondary/50 p-2"><p className="text-muted-foreground">CNPJ</p><p className="mt-0.5 break-all font-mono font-medium text-foreground">{rep.cnpj as string || "Não informado"}</p></div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {rep.kycDocumentUrl && <a href={rep.kycDocumentUrl as string} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="text-xs"><Eye className="mr-1 h-3 w-3" />Doc</Button></a>}
                            {rep.kycSelfieUrl && <a href={rep.kycSelfieUrl as string} target="_blank" rel="noreferrer"><Button size="sm" variant="outline" className="text-xs"><Eye className="mr-1 h-3 w-3" />Selfie</Button></a>}
                            {kycStatus === "pending_review" && <Button size="sm" className="text-xs bg-primary/10 text-primary hover:bg-primary/20" onClick={() => { setReviewModal({ rep: rep as Record<string, unknown>, mode: "kyc" }); setReviewDecision("approved"); setReviewNotes(""); }}><ShieldCheck className="mr-1 h-3 w-3" />Revisar KYC</Button>}
                            {rep.coreNumber && <Button size="sm" variant="outline" className="text-xs" onClick={() => { setReviewModal({ rep: rep as Record<string, unknown>, mode: "core" }); setReviewDecision("active"); setReviewNotes(""); }}><RefreshCw className="mr-1 h-3 w-3" />CORE</Button>}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <table className="hidden w-full text-sm sm:table">
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
          </div>
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
      {/* Modal: Perfil Incompleto + Comunicação */}
      {profileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)"}}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 rounded-t-2xl">
              <div>
                <h2 className="font-bold text-base text-white">{profileModal.userName}</h2>
                <p className="text-xs text-slate-300 mt-0.5">Detalhes do perfil e comunicação</p>
              </div>
              <button onClick={() => setProfileModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-lg leading-none">×</button>
            </div>

            {profileDetailsQuery.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-7 h-7 animate-spin text-slate-400" />
              </div>
            ) : profileDetailsQuery.data ? (
              <div className="p-6 space-y-5">
                {/* Barra de progresso */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Completude do perfil</span>
                    <span className={`text-sm font-bold ${
                      profileDetailsQuery.data.completionPct >= 80 ? "text-green-600" :
                      profileDetailsQuery.data.completionPct >= 40 ? "text-amber-600" : "text-red-600"
                    }`}>{profileDetailsQuery.data.completionPct}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        profileDetailsQuery.data.completionPct >= 80 ? "bg-green-500" :
                        profileDetailsQuery.data.completionPct >= 40 ? "bg-amber-400" : "bg-red-500"
                      }`}
                      style={{ width: `${profileDetailsQuery.data.completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Campos faltando */}
                {profileDetailsQuery.data.missingFields.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Campos faltando ({profileDetailsQuery.data.missingFields.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {profileDetailsQuery.data.missingFields.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-red-600">
                          <XCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />{f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Campos preenchidos */}
                {profileDetailsQuery.data.filledFields.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Campos preenchidos ({profileDetailsQuery.data.filledFields.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {profileDetailsQuery.data.filledFields.map(f => (
                        <div key={f} className="flex items-center gap-2 text-sm text-green-700">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-green-500" />{f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comunicação direta */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Enviar mensagem direta
                  </h3>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Assunto</label>
                    <input
                      type="text"
                      value={customEmailSubject}
                      onChange={e => setCustomEmailSubject(e.target.value)}
                      placeholder="Ex: Complete seu cadastro no RepMatch"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Mensagem</label>
                    <textarea
                      value={customEmailMessage}
                      onChange={e => setCustomEmailMessage(e.target.value)}
                      placeholder="Escreva sua mensagem aqui..."
                      rows={4}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors"
                      disabled={!customEmailSubject.trim() || !customEmailMessage.trim() || sendingCustomEmail}
                      onClick={() => {
                        setSendingCustomEmail(true);
                        sendCustomEmailMutation.mutate({
                          userId: profileModal.userId,
                          subject: customEmailSubject,
                          message: customEmailMessage,
                          includeCompleteProfileCTA: profileDetailsQuery.data!.missingFields.length > 0,
                        });
                      }}
                    >
                      {sendingCustomEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      {sendingCustomEmail ? "Enviando..." : "Enviar e-mail"}
                    </button>
                    <button
                      className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 disabled:opacity-50 text-gray-700 text-sm font-medium py-2.5 px-4 rounded-lg border border-gray-300 transition-colors"
                      disabled={sendingEmailId === profileModal.userId && sendCadastroEmailMutation.isPending}
                      onClick={() => {
                        setSendingEmailId(profileModal.userId);
                        sendCadastroEmailMutation.mutate({ userId: profileModal.userId });
                      }}
                    >
                      {sendingEmailId === profileModal.userId && sendCadastroEmailMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      E-mail padrão
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500 text-sm">Não foi possível carregar os detalhes do perfil.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
