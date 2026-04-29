import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Briefcase, User, Bell, LogOut, Search, MapPin, DollarSign,
  ChevronRight, Loader2, Star, Lock, CheckCircle, Clock, XCircle,
  TrendingUp, Building2, Filter
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

const STATUS_CONFIG = {
  pending: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  viewed: { label: "Visualizado", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle },
  accepted: { label: "Aceito", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  rejected: { label: "Recusado", color: "bg-red-500/20 text-red-400", icon: XCircle },
  hired: { label: "Contratado", color: "bg-primary/20 text-primary", icon: Star },
};

const TIER_CONFIG = {
  free: { label: "Free", color: "bg-zinc-700 text-zinc-300", upgrade: "Upgrade para Premium" },
  premium: { label: "Premium", color: "bg-green-900 text-green-300", upgrade: "Upgrade para Elite" },
  elite: { label: "Elite", color: "bg-yellow-900 text-yellow-300", upgrade: null },
};

async function startCheckout(productKey: string, userId: number, userEmail: string, userName: string) {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productKey, userId, userEmail, userName }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) window.open(data.url, "_blank");
    else toast.error(data.error ?? "Erro ao iniciar pagamento");
  } catch {
    toast.error("Erro ao conectar com o servidor de pagamento");
  }
}

export default function RepDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "profile">("jobs");
  const [searchRegion, setSearchRegion] = useState("");
  const [searchSegment, setSearchSegment] = useState("");

  const { data: profile, isLoading: profileLoading } = trpc.representatives.myProfile.useQuery();
  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.list.useQuery({
    region: searchRegion || undefined,
    segment: searchSegment || undefined,
    repTier: profile?.subscriptionTier ?? "free",
  });
  const { data: myApplications, isLoading: appsLoading } = trpc.candidaturas.myApplications.useQuery();

  const applyMutation = trpc.candidaturas.submit.useMutation({
    onSuccess: () => {
      toast.success("Candidatura enviada com sucesso!");
      utils.candidaturas.myApplications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const utils = trpc.useUtils();

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

  const tier = profile.subscriptionTier as keyof typeof TIER_CONFIG;
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const appliedJobIds = new Set(myApplications?.map((a) => a.application.jobId) ?? []);

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <div className="flex h-screen">
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain mb-4" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate">{profile.fullName}</div>
                <Badge className={`text-xs mt-0.5 ${tierConfig.color}`}>{tierConfig.label}</Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "jobs", label: "Vagas", icon: Briefcase },
              { id: "applications", label: "Minhas Candidaturas", icon: CheckCircle },
              { id: "profile", label: "Meu Perfil", icon: User },
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

          <div className="p-4 border-t border-border space-y-2">
            {tierConfig.upgrade && (
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground text-xs font-bold"
                onClick={() => {
                  const productKey = tier === "free" ? "REP_PREMIUM" : "REP_ELITE";
                  startCheckout(productKey, user?.id ?? 0, user?.email ?? "", user?.name ?? "");
                }}
              >
                <Star className="w-3 h-3 mr-1" />
                {tierConfig.upgrade}
              </Button>
            )}
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

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {/* ─── Jobs Tab ─────────────────────────────────────────────────── */}
          {activeTab === "jobs" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Vagas disponíveis</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {tier === "free" ? "Plano Free: acesso a vagas Bronze/Silver" :
                     tier === "premium" ? "Plano Premium: acesso a vagas até Gold" :
                     "Plano Elite: acesso a TODAS as vagas"}
                  </p>
                </div>
                <Badge className={tierConfig.color}>{tierConfig.label}</Badge>
              </div>

              {/* Filters */}
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por região..."
                    value={searchRegion}
                    onChange={(e) => setSearchRegion(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por segmento..."
                    value={searchSegment}
                    onChange={(e) => setSearchSegment(e.target.value)}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
              </div>

              {jobsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : jobs?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma vaga encontrada com esses filtros.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs?.map((job) => {
                    const alreadyApplied = appliedJobIds.has(job.id);
                    const isLocked = (job.minTierRequired === "premium" && tier === "free") ||
                                     (job.minTierRequired === "elite" && tier !== "elite");
                    return (
                      <div
                        key={job.id}
                        className={`rounded-xl border bg-card p-6 transition-all ${
                          isLocked ? "opacity-60 border-border" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {job.isFeatured && (
                                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                                  <Star className="w-3 h-3 mr-1" />Destaque
                                </Badge>
                              )}
                              {isLocked && (
                                <Badge className="bg-zinc-700 text-zinc-300 text-xs">
                                  <Lock className="w-3 h-3 mr-1" />
                                  Requer {job.minTierRequired === "premium" ? "Premium" : "Elite"}
                                </Badge>
                              )}
                            </div>
                            <h3 className="font-bold text-lg">{job.title}</h3>
                            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">{job.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                              {job.region && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />{job.region}
                                </span>
                              )}
                              {job.commissionPercentage && (
                                <span className="flex items-center gap-1 text-primary font-semibold">
                                  <DollarSign className="w-3.5 h-3.5" />{job.commissionPercentage}% comissão
                                </span>
                              )}
                              {job.segment && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />{job.segment}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="ml-4 flex-shrink-0">
                            {alreadyApplied ? (
                              <Badge className="bg-green-500/20 text-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />Candidatado
                              </Badge>
                            ) : isLocked ? (
                              <Button size="sm" variant="outline" className="border-border text-muted-foreground" disabled>
                                <Lock className="w-3 h-3 mr-1" />Bloqueado
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-primary text-primary-foreground"
                                onClick={() => applyMutation.mutate({ jobId: job.id })}
                                disabled={applyMutation.isPending}
                              >
                                {applyMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Candidatar-se"}
                                <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Applications Tab ─────────────────────────────────────────── */}
          {activeTab === "applications" && (
            <div className="p-8">
              <h1 className="text-2xl font-black mb-6">Minhas Candidaturas</h1>

              {appsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : myApplications?.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Você ainda não se candidatou a nenhuma vaga.</p>
                  <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => setActiveTab("jobs")}>
                    Ver vagas disponíveis
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myApplications?.map(({ application, job }) => {
                    const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    return (
                      <div key={application.id} className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{job.title}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              {job.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>}
                              {job.commissionPercentage && <span className="text-primary font-semibold">{job.commissionPercentage}% comissão</span>}
                            </div>
                            {application.llmAnalysis && (
                              <p className="text-xs text-muted-foreground mt-2 italic">"{application.llmAnalysis}"</p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <Badge className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                            <div className="mt-2 text-xs text-muted-foreground">
                              Score: <span className="text-primary font-bold">{application.totalScore}/100</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── Profile Tab ──────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <div className="p-8 max-w-2xl">
              <h1 className="text-2xl font-black mb-6">Meu Perfil</h1>

              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-2xl">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.fullName}</h2>
                    <Badge className={`mt-1 ${tierConfig.color}`}>{tierConfig.label}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Região", value: profile.region },
                    { label: "Segmento", value: profile.segment },
                    { label: "Experiência", value: profile.experienceYears ? `${profile.experienceYears} anos` : "—" },
                    { label: "Telefone", value: profile.phone ?? "—" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="text-muted-foreground mb-0.5">{item.label}</div>
                      <div className="font-medium">{item.value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {profile.bio && (
                  <div className="pt-2">
                    <div className="text-muted-foreground text-sm mb-1">Bio</div>
                    <p className="text-sm leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    {[
                      { label: "Candidaturas", value: myApplications?.length ?? 0 },
                      { label: "Score Médio", value: myApplications?.length ? Math.round(myApplications.reduce((s, a) => s + (a.application.totalScore ?? 0), 0) / myApplications.length) : 0 },
                      { label: "Taxa de Resposta", value: `${profile.responseRate ?? 0}%` },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg bg-secondary p-3">
                        <div className="text-2xl font-black text-primary">{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {tierConfig.upgrade && (
                <div className="mt-6 rounded-xl border border-primary/30 bg-primary/5 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">Desbloqueie mais oportunidades</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tier === "free"
                      ? "Com o Premium (R$ 19/mês) você acessa vagas de empresas Gold e tem perfil em destaque."
                      : "Com o Elite (R$ 49/mês) você acessa TODAS as vagas, incluindo empresas Platinum."}
                  </p>
                  <Button
                    className="bg-primary text-primary-foreground font-bold"
                    onClick={() => {
                      const productKey = tier === "free" ? "REP_PREMIUM" : "REP_ELITE";
                      startCheckout(productKey, user?.id ?? 0, user?.email ?? "", user?.name ?? "");
                    }}
                  >
                    {tierConfig.upgrade}
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
