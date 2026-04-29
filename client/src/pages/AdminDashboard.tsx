import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Users, Building2, Briefcase, TrendingUp, Upload, Loader2, CheckCircle, XCircle, Clock, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return null;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"stats" | "import">("stats");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: stats, isLoading: statsLoading } = trpc.admin.stats.useQuery();
  const { data: importLogs } = trpc.admin.importLogs.useQuery();
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

  if (user?.role !== "admin") {
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
              { id: "import", label: "Importar Dados", icon: Upload },
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
              <h1 className="text-2xl font-black mb-8">Dashboard Administrativo</h1>
              {statsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { label: "Representantes", value: stats?.totalReps ?? 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
                    { label: "Empresas", value: stats?.totalCompanies ?? 0, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
                    { label: "Vagas Publicadas", value: stats?.totalJobs ?? 0, icon: Briefcase, color: "text-purple-400", bg: "bg-purple-400/10" },
                    { label: "Candidaturas", value: stats?.totalApplications ?? 0, icon: TrendingUp, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                    { label: "Reps Premium/Elite", value: stats?.premiumReps ?? 0, icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-card p-6">
                      <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                      <div className="text-3xl font-black text-foreground">{stat.value.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
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
        </main>
      </div>
    </div>
  );
}
