import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import {
  Briefcase, User, LogOut, Search, MapPin, DollarSign,
  ChevronRight, Loader2, Star, Lock, CheckCircle, Clock, XCircle,
  TrendingUp, Building2, Filter, MessageCircle, Send, Edit2, Bell
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
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

const STATUS_CONFIG = {
  pending: { label: "Aguardando", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  viewed: { label: "Visualizado", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle },
  accepted: { label: "Aceito", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  rejected: { label: "Recusado", color: "bg-red-500/20 text-red-400", icon: XCircle },
  hired: { label: "Contratado", color: "bg-primary/20 text-primary", icon: Star },
};

const TIER_CONFIG = {
  free: { label: "Free", color: "bg-secondary text-muted-foreground", upgrade: "Upgrade para Bronze — R$9,99/mês" },
  bronze: { label: "Bronze", color: "bg-orange-500/15 text-orange-400", upgrade: "Upgrade para Prata — R$19,90/mês" },
  prata: { label: "Prata", color: "bg-primary/15 text-primary", upgrade: "Upgrade para Ouro — R$29,90/mês" },
  ouro: { label: "Ouro", color: "bg-amber-500/15 text-amber-400", upgrade: null },
};

const RANK_TIER_MAP: Record<string, string[]> = {
  free: ["bronze", "silver"],
  bronze: ["bronze", "silver", "gold"],
  prata: ["bronze", "silver", "gold", "platinum"],
  ouro: ["bronze", "silver", "gold", "platinum"],
};

async function startCheckout(productKey: string, userId: number, userEmail: string, userName: string) {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productKey, userId, userEmail, userName }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) { toast.info("Redirecionando para o pagamento..."); window.open(data.url, "_blank"); }
    else toast.error(data.error ?? "Erro ao iniciar pagamento");
  } catch {
    toast.error("Erro ao conectar com o servidor de pagamento");
  }
}

// ─── Chat Component ──────────────────────────────────────────────────────────
function ChatPanel({ applicationId, currentUserId }: { applicationId: number; currentUserId: number }) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();
  const { data: messages, isLoading } = trpc.messages.list.useQuery({ applicationId }, { refetchInterval: 4000 });
  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => {
      setMessage("");
      utils.messages.list.invalidate({ applicationId });
    },
    onError: (e) => toast.error(e.message),
  });
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-72 border border-border rounded-xl overflow-hidden bg-background mt-4">
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 bg-secondary/50">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Chat com a empresa</span>
        <span className="text-xs text-muted-foreground ml-auto">Atualiza automaticamente</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !messages?.length ? (
          <p className="text-center text-muted-foreground text-sm pt-8">Nenhuma mensagem ainda. Inicie a conversa!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUserId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="bg-secondary border-border text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && message.trim()) {
              e.preventDefault();
              sendMutation.mutate({ applicationId, content: message.trim() });
            }
          }}
        />
        <Button
          size="sm"
          className="bg-primary text-primary-foreground px-3 shrink-0"
          disabled={!message.trim() || sendMutation.isPending}
          onClick={() => sendMutation.mutate({ applicationId, content: message.trim() })}
        >
          {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function RepDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "profile">("jobs");
  const [searchRegion, setSearchRegion] = useState("");
  const [searchSegment, setSearchSegment] = useState("");
  const [minCommission, setMinCommission] = useState<number>(0);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", phone: "", region: "", segment: "", experienceYears: 0, bio: "" });

  const utils = trpc.useUtils();
  const { data: profile, isLoading: profileLoading } = trpc.representatives.myProfile.useQuery();
  const { data: allJobs, isLoading: jobsLoading } = trpc.jobs.list.useQuery({
    region: searchRegion || undefined,
    segment: searchSegment || undefined,
    repTier: profile?.subscriptionTier ?? "free",
  });
  const jobs = allJobs?.filter(j => !minCommission || Number(j.commissionPercentage ?? 0) >= minCommission);
  const { data: myApplications, isLoading: appsLoading } = trpc.candidaturas.myApplications.useQuery();

  const applyMutation = trpc.candidaturas.submit.useMutation({
    onSuccess: () => {
      toast.success("Candidatura enviada com sucesso!");
      utils.candidaturas.myApplications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateProfileMutation = trpc.representatives.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setEditProfileOpen(false);
      utils.representatives.myProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
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

  const tier = profile.subscriptionTier as keyof typeof TIER_CONFIG;
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.free;
  const allowedRanks = RANK_TIER_MAP[tier] ?? ["bronze", "silver"];
  const acceptedApps = myApplications?.filter(a => a.application.status === "accepted" || a.application.status === "hired") ?? [];

  const openEditProfile = () => {
    setProfileForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      region: profile.region ?? "",
      segment: profile.segment ?? "",
      experienceYears: profile.experienceYears ?? 0,
      bio: profile.bio ?? "",
    });
    setEditProfileOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex h-screen">
        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
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
              { id: "jobs", label: "Oportunidades", icon: Briefcase, badge: allJobs?.length },
              { id: "applications", label: "Candidaturas", icon: Bell, badge: myApplications?.length },
              { id: "profile", label: "Meu Perfil", icon: User },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-primary/20 text-primary text-xs font-bold rounded-full px-1.5 py-0.5">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-border space-y-2">
            {tierConfig.upgrade && (
              <Button
                size="sm"
                className="w-full bg-primary text-primary-foreground text-xs font-bold"
                onClick={() => startCheckout(tier === "free" ? "REP_BRONZE" : tier === "bronze" ? "REP_PRATA" : "REP_OURO", user?.id ?? 0, user?.email ?? "", user?.name ?? "")}
              >
                <Star className="w-3 h-3 mr-1" />{tierConfig.upgrade}
              </Button>
            )}
            <Button size="sm" variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => { logout(); navigate("/"); }}>
              <LogOut className="w-4 h-4 mr-2" />Sair
            </Button>
          </div>
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto">

          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black">Oportunidades</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Plano <span className="text-primary font-semibold">{tierConfig.label}</span> — {
                      tier === "free" ? "apenas vagas Free" :
                      tier === "bronze" ? "vagas Free + Bronze" :
                      tier === "prata" ? "vagas até Prata" : "todas as vagas (Ouro incluso)"
                    }
                  </p>
                </div>
                <Badge className={tierConfig.color}>{tierConfig.label}</Badge>
              </div>

              {tier === "free" && (
                <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-primary" />
                    <span>Plano Free — vagas Bronze, Prata e Ouro estão bloqueadas.</span>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground text-xs font-bold" onClick={() => startCheckout("REP_BRONZE", user?.id ?? 0, user?.email ?? "", user?.name ?? "")}>
                    Fazer Upgrade
                  </Button>
                </div>
              )}

                <div className="flex flex-wrap gap-3 mb-6">
                <Select value={searchRegion || "all"} onValueChange={(v) => setSearchRegion(v === "all" ? "" : v)}>
                  <SelectTrigger className="flex-1 min-w-[180px] max-w-xs bg-secondary border-border">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Todas as regiões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as regiões</SelectItem>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={searchSegment || "all"} onValueChange={(v) => setSearchSegment(v === "all" ? "" : v)}>
                  <SelectTrigger className="flex-1 min-w-[180px] max-w-xs bg-secondary border-border">
                    <Briefcase className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Todos os segmentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os segmentos</SelectItem>
                    {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[160px] max-w-[200px]">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number" min={0} max={100}
                    placeholder="Comissão mín. %"
                    value={minCommission || ""}
                    onChange={(e) => setMinCommission(Number(e.target.value))}
                    className="pl-9 bg-secondary border-border"
                  />
                </div>
              </div>

              {jobsLoading ? (
                <div className="flex justify-center pt-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : !jobs?.length ? (
                <div className="text-center pt-16 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">Nenhuma vaga encontrada</p>
                  <p className="text-sm mt-1">Tente ajustar os filtros</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => {
                    const isLocked = (job.minTierRequired === "bronze" && tier === "free") ||
                                     (job.minTierRequired === "prata" && tier !== "prata" && tier !== "ouro") ||
                                     (job.minTierRequired === "ouro" && tier !== "ouro");
                    const alreadyApplied = myApplications?.some(a => a.job?.id === job.id);
                    return (
                      <div key={job.id} className={`rounded-xl border p-5 transition-all ${isLocked ? "border-border opacity-60 bg-card" : "border-border bg-card hover:border-primary/40"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {job.isFeatured && <Badge className="bg-yellow-500/20 text-yellow-400 text-xs"><Star className="w-3 h-3 mr-1" />Destaque</Badge>}
                              {job.createdAt && Date.now() - new Date(job.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000 && (
                                <Badge className="bg-green-500/20 text-green-400 text-xs">Nova</Badge>
                              )}
                              {isLocked && <Badge className="bg-secondary text-muted-foreground text-xs"><Lock className="w-3 h-3 mr-1" />Bloqueado</Badge>}
                            </div>
                            <h3 className="font-bold text-base">{job.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                              {job.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>}
                              {job.commissionPercentage && <span className="flex items-center gap-1 text-primary font-semibold"><DollarSign className="w-3 h-3" />{job.commissionPercentage}% comissão</span>}
                              {job.segment && <span className="text-xs text-muted-foreground">{job.segment}</span>}
                            </div>
                            {job.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>}
                          </div>
                          <div className="shrink-0">
                            {isLocked ? (
                              <Button size="sm" className="bg-primary text-primary-foreground text-xs font-bold" onClick={() => startCheckout(tier === "free" ? "REP_PREMIUM" : "REP_ELITE", user?.id ?? 0, user?.email ?? "", user?.name ?? "")}>
                                <Lock className="w-3 h-3 mr-1" />Desbloquear
                              </Button>
                            ) : alreadyApplied ? (
                              <Badge className="bg-green-900/30 text-green-400 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Candidatado</Badge>
                            ) : (
                              <Button size="sm" className="bg-primary text-primary-foreground font-bold" disabled={applyMutation.isPending} onClick={() => applyMutation.mutate({ jobId: job.id })}>
                                <ChevronRight className="w-4 h-4 mr-1" />Candidatar
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

          {/* Applications Tab */}
          {activeTab === "applications" && (
            <div className="p-8">
              <h1 className="text-2xl font-black mb-2">Minhas Candidaturas</h1>
              <p className="text-muted-foreground text-sm mb-6">Acompanhe o status e negocie diretamente com as empresas via chat</p>

              {appsLoading ? (
                <div className="flex justify-center pt-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
              ) : !myApplications?.length ? (
                <div className="text-center pt-16 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold">Nenhuma candidatura ainda</p>
                  <p className="text-sm mt-1">Explore as oportunidades e candidate-se</p>
                  <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => setActiveTab("jobs")}>Ver Oportunidades</Button>
                </div>
              ) : (
                <div className="space-y-4">
                    {myApplications.map(({ application, job }) => {
                    const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    const chatOpen = openChatId === application.id;
                    return (
                      <div key={application.id} className="rounded-xl border border-border bg-card p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base">{job?.title ?? "Vaga"}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                              {job?.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>}
                              {job?.segment && <span className="text-xs">{job.segment}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={status.color}><StatusIcon className="w-3 h-3 mr-1" />{status.label}</Badge>
                              <span className="text-xs text-muted-foreground">Score: <span className="text-primary font-bold">{application.totalScore}/100</span></span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="shrink-0 border-border" onClick={() => setOpenChatId(chatOpen ? null : application.id)}>
                            <MessageCircle className="w-4 h-4 mr-1.5" />{chatOpen ? "Fechar" : "Chat"}
                          </Button>
                        </div>
                        {chatOpen && <ChatPanel applicationId={application.id} currentUserId={user?.id ?? 0} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {acceptedApps.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-lg font-black mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />Propostas Aceitas
                  </h2>
                  <div className="space-y-3">
                    {acceptedApps.map(({ application, job }) => (
                      <div key={application.id} className="rounded-xl border border-green-700/40 bg-green-900/10 p-4 flex items-center justify-between">
                        <div>
                          <div className="font-bold">{job?.title}</div>
                          <div className="text-sm text-muted-foreground">{job?.segment ?? "—"}</div>
                        </div>
                        <Badge className="bg-green-900/30 text-green-400">{application.status === "hired" ? "Contratado" : "Aceito"}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="p-8 max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-black">Meu Perfil</h1>
                <Button variant="outline" size="sm" className="border-border" onClick={openEditProfile}>
                  <Edit2 className="w-4 h-4 mr-2" />Editar Perfil
                </Button>
              </div>
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
                    {tier === "free" ? "Com o Bronze (R$9,99/mês) você aparece para mais empresas e acessa vagas exclusivas." : tier === "bronze" ? "Com o Prata (R$19,90/mês) você tem destaque na busca e acessa vagas Prata." : "Com o Ouro (R$29,90/mês) você aparece em primeiro na busca e acessa TODAS as vagas."}
                  </p>
                  <Button className="bg-primary text-primary-foreground font-bold" onClick={() => startCheckout(tier === "free" ? "REP_BRONZE" : tier === "bronze" ? "REP_PRATA" : "REP_OURO", user?.id ?? 0, user?.email ?? "", user?.name ?? "")}>
                    {tierConfig.upgrade}
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─── Edit Profile Dialog ─────────────────────────────────────────── */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
          </DialogHeader>
          <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileForm); }}>
            <div>
              <Label>Nome completo</Label>
              <Input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="mt-1 bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Região</Label>
                <Select value={profileForm.region} onValueChange={(v) => setProfileForm({ ...profileForm, region: v })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Segmento</Label>
                <Select value={profileForm.segment} onValueChange={(v) => setProfileForm({ ...profileForm, segment: v })}>
                  <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 bg-secondary border-border" />
              </div>
              <div>
                <Label>Anos de experiência</Label>
                <Input type="number" min={0} max={50} value={profileForm.experienceYears} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })} className="mt-1 bg-secondary border-border" />
              </div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} placeholder="Conte sobre sua experiência..." className="mt-1 bg-secondary border-border" rows={3} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-border" onClick={() => setEditProfileOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-primary text-primary-foreground font-bold" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
