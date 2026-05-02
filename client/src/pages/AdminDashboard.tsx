import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Building2, Briefcase, TrendingUp, Upload, Loader2, CheckCircle, XCircle, Clock, LogOut, ShieldCheck, BarChart2, UserX, UserCheck, CreditCard, CheckCheck, Search } from "lucide-react";
import { useState, useRef } from "react";
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
  const [activeTab, setActiveTab] = useState<"stats" | "import" | "users" | "jobs" | "pagamentos">("stats");
  const [pixSearch, setPixSearch] = useState("");
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: importLogs } = trpc.admin.importLogs.useQuery();
  const { data: allUsers, refetch: refetchUsers } = trpc.admin.listUsers.useQuery();
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
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
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
              { id: "pagamentos", label: "Pagamentos PIX", icon: CreditCard },
              { id: "jobs", label: "Vagas", icon: Briefcase },
              { id: "import", label: "Importar Dados", icon: Upload },
              { id: "users", label: "Usuários", icon: Users },
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
          <div className="p-4 border-t border-border">
            <Button size="sm" variant="ghost" className="w-full text-muted-foreground" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-2" />Sair
            </Button>
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
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-black">Gerenciar Usuários</h1>
                  <p className="text-muted-foreground text-sm mt-1">Todos os usuários cadastrados na plataforma</p>
                </div>
                <Badge className="bg-red-900/30 text-red-300 border border-red-700/40 px-3 py-1">Admin</Badge>
              </div>
              {!allUsers ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">Nenhum usuário encontrado</div>
              ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/30">
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
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
                              {u.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-primary/30 text-primary hover:bg-primary/10"
                                  onClick={() => promoteMutation.mutate({ userId: u.id })}
                                  disabled={promoteMutation.isPending}
                                >
                                  <ShieldCheck className="w-3 h-3 mr-1" />
                                  Admin
                                </Button>
                              )}
                              {u.id !== user?.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`text-xs ${
                                    (u as Record<string, unknown> & { isActive?: boolean }).isActive !== false
                                      ? "border-red-700/40 text-red-400 hover:bg-red-900/20"
                                      : "border-green-700/40 text-green-400 hover:bg-green-900/20"
                                  }`}
                                  onClick={() => toggleActiveMutation.mutate({ userId: u.id, isActive: (u as Record<string, unknown> & { isActive?: boolean }).isActive === false })}
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
        </main>
      </div>
    </div>
  );
}
