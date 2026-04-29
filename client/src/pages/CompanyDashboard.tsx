import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Briefcase, Building2, Users, LogOut, Plus, MapPin, DollarSign,
  Loader2, Star, CheckCircle, Clock, XCircle, Award, TrendingUp,
  ChevronRight, Eye
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

const REGIONS = [
  "São Paulo - Capital", "São Paulo - Interior", "Rio de Janeiro", "Minas Gerais",
  "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco",
  "Ceará", "Goiás", "Distrito Federal", "Nacional (Todo Brasil)",
];

const SEGMENTS = [
  "Alimentos e Bebidas", "Farmacêutico", "Cosméticos e Higiene", "Tecnologia",
  "Construção Civil", "Têxtil e Moda", "Automotivo", "Agronegócio",
  "Saúde e Médico", "Eletroeletrônicos", "Móveis e Decoração", "Outros",
];

const RANK_CONFIG = {
  bronze: { label: "Bronze", color: "text-amber-600", bg: "bg-amber-900/20", border: "border-amber-700/40" },
  silver: { label: "Silver", color: "text-zinc-300", bg: "bg-zinc-700/20", border: "border-zinc-500/40" },
  gold: { label: "Gold", color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-600/40" },
  platinum: { label: "Platinum", color: "text-zinc-200", bg: "bg-zinc-600/20", border: "border-zinc-400/40" },
};

const TIER_CONFIG = {
  starter: { label: "Starter", color: "bg-zinc-700 text-zinc-300" },
  pro: { label: "Pro", color: "bg-green-900 text-green-300" },
  enterprise: { label: "Enterprise", color: "bg-yellow-900 text-yellow-300" },
};

const STATUS_CONFIG = {
  pending: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  viewed: { label: "Visualizado", color: "bg-blue-500/20 text-blue-400", icon: Eye },
  accepted: { label: "Aceito", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  rejected: { label: "Recusado", color: "bg-red-500/20 text-red-400", icon: XCircle },
  hired: { label: "Contratado", color: "bg-primary/20 text-primary", icon: Star },
};

async function startCheckout(productKey: string, userId: number, userEmail: string, userName: string, metadata?: Record<string, string>) {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productKey, userId, userEmail, userName, metadata }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) { toast.info("Redirecionando para o pagamento..."); window.open(data.url, "_blank"); }
    else toast.error(data.error ?? "Erro ao iniciar pagamento");
  } catch {
    toast.error("Erro ao conectar com o servidor de pagamento");
  }
}

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "profile">("jobs");
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    commissionPercentage: "",
    region: "",
    segment: "",
    minTierRequired: "free" as "free" | "premium" | "elite",
  });

  const { data: profile, isLoading: profileLoading } = trpc.companies.myProfile.useQuery();
  const { data: myJobs, isLoading: jobsLoading } = trpc.jobs.myJobs.useQuery();
  const { data: jobApplications, isLoading: appsLoading } = trpc.candidaturas.byJob.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );
  const { data: topMatches } = trpc.jobs.topMatches.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );

  const utils = trpc.useUtils();

  const createJobMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Vaga publicada com sucesso!");
      setCreateJobOpen(false);
      setJobForm({ title: "", description: "", commissionPercentage: "", region: "", segment: "", minTierRequired: "free" });
      utils.jobs.myJobs.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatusMutation = trpc.candidaturas.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.candidaturas.byJob.invalidate();
    },
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    navigate("/onboarding");
    return null;
  }

  const rank = profile.dynamicRank as keyof typeof RANK_CONFIG;
  const rankConfig = RANK_CONFIG[rank] ?? RANK_CONFIG.bronze;
  const tier = profile.subscriptionTier as keyof typeof TIER_CONFIG;
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.starter;

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title) { toast.error("Título é obrigatório"); return; }
    createJobMutation.mutate({
      ...jobForm,
      commissionPercentage: jobForm.commissionPercentage ? Number(jobForm.commissionPercentage) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain mb-4" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {profile.companyName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{profile.companyName}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge className={`text-xs ${tierConfig.color}`}>{tierConfig.label}</Badge>
                  <span className={`text-xs font-bold ${rankConfig.color}`}>{rankConfig.label}</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "jobs", label: "Minhas Vagas", icon: Briefcase },
              { id: "applications", label: "Candidaturas", icon: Users },
              { id: "profile", label: "Perfil da Empresa", icon: Building2 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => { logout(); navigate("/"); }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto">
          {/* ─── Jobs Tab ─────────────────────────────────────────────────── */}
          {activeTab === "jobs" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Minhas Vagas</h1>
                  <p className="text-muted-foreground text-sm mt-1">Gerencie suas vagas e visualize candidatos</p>
                </div>
                <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-primary-foreground font-bold">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Vaga
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Publicar nova vaga</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateJob} className="space-y-4 mt-2">
                      <div>
                        <Label>Título da vaga *</Label>
                        <Input
                          value={jobForm.title}
                          onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                          placeholder="Ex: Representante Comercial SP - Alimentos"
                          className="mt-1 bg-secondary border-border"
                          required
                        />
                      </div>
                      <div>
                        <Label>Descrição</Label>
                        <Textarea
                          value={jobForm.description}
                          onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                          placeholder="Descreva a vaga, produtos, metas, benefícios..."
                          className="mt-1 bg-secondary border-border"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Comissão (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={jobForm.commissionPercentage}
                            onChange={(e) => setJobForm({ ...jobForm, commissionPercentage: e.target.value })}
                            placeholder="Ex: 5"
                            className="mt-1 bg-secondary border-border"
                          />
                        </div>
                        <div>
                          <Label>Acesso mínimo</Label>
                          <Select
                            value={jobForm.minTierRequired}
                            onValueChange={(v) => setJobForm({ ...jobForm, minTierRequired: v as "free" | "premium" | "elite" })}
                          >
                            <SelectTrigger className="mt-1 bg-secondary border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Free (todos)</SelectItem>
                              <SelectItem value="premium">Premium+</SelectItem>
                              <SelectItem value="elite">Elite apenas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Região</Label>
                          <Select onValueChange={(v) => setJobForm({ ...jobForm, region: v })}>
                            <SelectTrigger className="mt-1 bg-secondary border-border">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Segmento</Label>
                          <Select onValueChange={(v) => setJobForm({ ...jobForm, segment: v })}>
                            <SelectTrigger className="mt-1 bg-secondary border-border">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground font-bold"
                        disabled={createJobMutation.isPending}
                      >
                        {createJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        Publicar Vaga
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {jobsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : myJobs?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="mb-4">Você ainda não publicou nenhuma vaga.</p>
                  <Button className="bg-primary text-primary-foreground" onClick={() => setCreateJobOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Publicar primeira vaga
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myJobs?.map((job) => (
                    <div key={job.id} className="rounded-xl border border-border bg-card p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={job.status === "open" ? "bg-green-500/20 text-green-400" : "bg-zinc-700 text-zinc-300"}>
                              {job.status === "open" ? "Aberta" : job.status === "paused" ? "Pausada" : "Fechada"}
                            </Badge>
                            {job.isFeatured && (
                              <Badge className="bg-yellow-500/20 text-yellow-400">
                                <Star className="w-3 h-3 mr-1" />Destaque
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-lg">{job.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {job.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.region}</span>}
                            {job.commissionPercentage && <span className="text-primary font-semibold">{job.commissionPercentage}% comissão</span>}
                            {job.segment && <span>{job.segment}</span>}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-border"
                          onClick={() => { setSelectedJobId(job.id); setActiveTab("applications"); }}
                        >
                          <Users className="w-3.5 h-3.5 mr-1" />
                          Ver candidatos
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ─── Applications Tab ─────────────────────────────────────────── */}
          {activeTab === "applications" && (
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-black">Candidaturas</h1>
                {myJobs && myJobs.length > 0 && (
                  <Select
                    value={selectedJobId?.toString() ?? ""}
                    onValueChange={(v) => setSelectedJobId(Number(v))}
                  >
                    <SelectTrigger className="w-64 bg-secondary border-border">
                      <SelectValue placeholder="Selecione uma vaga" />
                    </SelectTrigger>
                    <SelectContent>
                      {myJobs.map((j) => (
                        <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {!selectedJobId ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Selecione uma vaga para ver as candidaturas.</p>
                </div>
              ) : appsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Applications List */}
                  <div>
                    <h2 className="font-bold mb-4 text-muted-foreground text-sm uppercase tracking-wide">Candidatos ({jobApplications?.length ?? 0})</h2>
                    <div className="space-y-3">
                      {jobApplications?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma candidatura ainda.</div>
                      ) : jobApplications?.map(({ application, rep }) => {
                        const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                        const StatusIcon = status.icon;
                        return (
                          <div key={application.id} className="rounded-xl border border-border bg-card p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-semibold">{rep.fullName}</div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  {rep.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rep.region}</span>}
                                  {rep.segment && <span>{rep.segment}</span>}
                                  {rep.experienceYears && <span>{rep.experienceYears}a exp.</span>}
                                </div>
                                {application.llmAnalysis && (
                                  <p className="text-xs text-muted-foreground mt-1.5 italic">"{application.llmAnalysis}"</p>
                                )}
                              </div>
                              <div className="text-right ml-3">
                                <div className="text-primary font-black text-xl">{application.totalScore}</div>
                                <div className="text-xs text-muted-foreground">score</div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                              <Badge className={status.color}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-700 text-green-400 hover:bg-green-900/20 text-xs"
                                  onClick={() => updateStatusMutation.mutate({ id: application.id, status: "accepted" })}
                                >
                                  Aceitar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-700 text-red-400 hover:bg-red-900/20 text-xs"
                                  onClick={() => updateStatusMutation.mutate({ id: application.id, status: "rejected" })}
                                >
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Matches */}
                  <div>
                    <h2 className="font-bold mb-4 text-muted-foreground text-sm uppercase tracking-wide">
                      Top Matches por IA
                    </h2>
                    <div className="space-y-3">
                      {topMatches?.map(({ rep, score }, i) => (
                        <div key={rep.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">{rep.fullName}</div>
                            <div className="text-xs text-muted-foreground">{rep.region} · {rep.segment}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <div className="text-primary font-black">{score}/100</div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-7 px-2"
                              onClick={() => user && startCheckout("UNLOCK_CONTACT", user.id, user.email ?? "", user.name ?? "", { repId: String(rep.id) })}
                            >
                              Desbloquear R$29
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Profile Tab ──────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="p-8 max-w-2xl">
              <h1 className="text-2xl font-black mb-6">Perfil da Empresa</h1>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-2xl">
                    {profile.companyName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.companyName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={tierConfig.color}>{tierConfig.label}</Badge>
                      <div className={`flex items-center gap-1 text-sm font-bold ${rankConfig.color}`}>
                        <Award className="w-4 h-4" />
                        {rankConfig.label}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "CNPJ", value: profile.cnpj },
                    { label: "Segmento", value: profile.segment },
                    { label: "Região", value: profile.region },
                    { label: "Telefone", value: profile.phone },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-muted-foreground mb-0.5">{item.label}</div>
                      <div className="font-medium">{item.value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {profile.description && (
                  <div className="pt-2">
                    <div className="text-muted-foreground text-sm mb-1">Descrição</div>
                    <p className="text-sm leading-relaxed">{profile.description}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    {[
                      { label: "Vagas Ativas", value: myJobs?.filter(j => j.status === "open").length ?? 0 },
                      { label: "Total de Vagas", value: myJobs?.length ?? 0 },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-secondary p-3">
                        <div className="text-2xl font-black text-primary">{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-yellow-600/30 bg-yellow-900/10 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <h3 className="font-bold">Destaque suas vagas</h3>
                  </div>
                  <Button
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs"
                    onClick={() => {
                      if (!selectedJobId) { toast.error("Selecione uma vaga primeiro na aba Candidaturas"); return; }
                      user && startCheckout("FEATURED_JOB", user.id, user.email ?? "", user.name ?? "", { jobId: String(selectedJobId) });
                    }}
                  >
                    Destacar Vaga R$49
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Vagas em destaque aparecem no topo da lista para representantes e recebem 3x mais candidaturas.</p>
              </div>

              <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="font-bold">Melhore seu ranking</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Empresas com rank mais alto atraem representantes premium. Contrate mais reps e publique vagas de qualidade para subir no ranking.
                </p>
                <div className="flex items-center gap-4">
                  {Object.entries(RANK_CONFIG).map(([key, cfg]) => (
                    <div key={key} className={`flex items-center gap-1 text-xs font-bold ${cfg.color}`}>
                      <Award className="w-3 h-3" />
                      {cfg.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
