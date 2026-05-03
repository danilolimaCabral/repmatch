import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
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
  TrendingUp, Building2, Filter, MessageCircle, Send, Edit2, Bell,
  Shield, Award, BarChart2, Target, Zap, Plus, Trash2, PauseCircle, PlayCircle
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

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
  pending:  { label: "Aguardando", color: "bg-amber-50 text-amber-700 border-amber-200",   dot: "bg-amber-400",  icon: Clock },
  viewed:   { label: "Visualizado", color: "bg-blue-50 text-blue-700 border-blue-200",      dot: "bg-blue-400",   icon: CheckCircle },
  accepted: { label: "Aceito",      color: "bg-green-50 text-green-700 border-green-200",   dot: "bg-green-500",  icon: CheckCircle },
  rejected: { label: "Recusado",    color: "bg-red-50 text-red-700 border-red-200",         dot: "bg-red-400",    icon: XCircle },
  hired:    { label: "Contratado",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", icon: Star },
};

const TIER_CONFIG = {
  free:   { label: "Pendente", color: "bg-slate-100 text-slate-600",       upgrade: "Ativar plano Bronze — R$9,99/mês" },
  bronze: { label: "Bronze",   color: "bg-orange-100 text-orange-700",     upgrade: "Upgrade para Prata — R$19,90/mês" },
  prata:  { label: "Prata",    color: "bg-emerald-100 text-emerald-700",   upgrade: "Upgrade para Ouro — R$29,90/mês" },
  ouro:   { label: "Ouro",     color: "bg-amber-100 text-amber-700",       upgrade: null },
};

const RANK_TIER_MAP: Record<string, string[]> = {
  free: ["bronze", "silver"],
  bronze: ["bronze", "silver", "gold"],
  prata: ["bronze", "silver", "gold", "platinum"],
  ouro: ["bronze", "silver", "gold", "platinum"],
};

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#10b981"];

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
    <div className="flex flex-col h-72 border border-slate-200 rounded-xl overflow-hidden bg-white mt-4 shadow-sm">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
        <MessageCircle className="w-4 h-4 text-emerald-600" />
        <span className="text-sm font-semibold text-slate-700">Chat com a empresa</span>
        <span className="text-xs text-slate-400 ml-auto">Atualiza automaticamente</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {isLoading ? (
          <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : !messages?.length ? (
          <p className="text-center text-slate-400 text-sm pt-8">Nenhuma mensagem ainda. Inicie a conversa!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderUserId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? "bg-emerald-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"}`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? "text-white/60" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-3 border-t border-slate-100 flex gap-2 bg-white">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="bg-slate-50 border-slate-200 text-sm text-slate-800"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && message.trim()) {
              e.preventDefault();
              sendMutation.mutate({ applicationId, content: message.trim() });
            }
          }}
        />
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 shrink-0"
          disabled={!message.trim() || sendMutation.isPending}
          onClick={() => sendMutation.mutate({ applicationId, content: message.trim() })}
        >
          {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─// ─── Rep Direct Chat Tab ───────────────────────────────────────────────
function RepDirectChatTab({
  repId,
  repUserId,
  activeChatCompanyId,
  setActiveChatCompanyId,
  directChatInput,
  setDirectChatInput,
}: {
  repId: number;
  repUserId: number;
  activeChatCompanyId: number | null;
  setActiveChatCompanyId: (id: number | null) => void;
  directChatInput: string;
  setDirectChatInput: (v: string) => void;
}) {
  const utils = trpc.useUtils();
  const { data: conversations, isLoading: convsLoading } = trpc.directChat.listConversations.useQuery(undefined, { refetchInterval: 5000 });
  const { data: messages, isLoading: msgsLoading } = trpc.directChat.getMessages.useQuery(
    { companyId: activeChatCompanyId!, representativeId: repId },
    { enabled: !!activeChatCompanyId, refetchInterval: 4000 }
  );
  const sendMutation = trpc.directChat.sendMessage.useMutation({
    onSuccess: () => {
      setDirectChatInput("");
      utils.directChat.getMessages.invalidate();
      utils.directChat.listConversations.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSend = () => {
    if (!directChatInput.trim() || !activeChatCompanyId) return;
    sendMutation.mutate({ companyId: activeChatCompanyId, representativeId: repId, content: directChatInput.trim() });
  };

  return (
    <div className="p-8 flex gap-6 h-full">
      <div className="w-72 shrink-0">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Mensagens</h2>
        {convsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
        ) : !conversations?.length ? (
          <div className="text-center py-12 text-slate-400">
            <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma mensagem ainda.</p>
            <p className="text-xs mt-1">Empresas que desbloquearam seu contato podem iniciar conversas aqui.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(conversations as any[]).map((conv: any) => (
              <button
                key={conv.companyId}
                onClick={() => setActiveChatCompanyId(conv.companyId)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeChatCompanyId === conv.companyId
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                    {conv.companyName?.charAt(0) ?? "E"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-800 truncate">{conv.companyName}</div>
                    <div className="text-xs text-slate-400 truncate">{conv.lastMessage}</div>
                  </div>
                  {conv.unread > 0 && (
                    <span className="bg-emerald-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">{conv.unread}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {!activeChatCompanyId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Selecione uma conversa para ver as mensagens</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-sm text-slate-700">
                {(conversations as any[])?.find((c: any) => c.companyId === activeChatCompanyId)?.companyName ?? "Empresa"}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgsLoading ? (
                <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : !messages?.length ? (
                <p className="text-center text-slate-400 text-sm pt-8">Nenhuma mensagem ainda.</p>
              ) : (
                (messages as any[]).map((msg: any) => {
                  const isMe = msg.senderUserId === repUserId;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        isMe ? "bg-emerald-600 text-white rounded-br-sm" : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? "text-white/60" : "text-slate-400"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-slate-100 flex gap-2">
              <input
                className="flex-1 text-sm rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="Digite sua mensagem..."
                value={directChatInput}
                onChange={(e) => setDirectChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <button
                onClick={handleSend}
                disabled={!directChatInput.trim() || sendMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl px-4 py-2 flex items-center gap-1.5 text-sm font-medium transition-colors"
              >
                {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Theme Toggle ──────────────────────────────────────────────────
function RepThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  return (
    <Button
      size="sm"
      variant="ghost"
      className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-50 justify-start"
      onClick={toggleTheme}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
      {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    </Button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function RepDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"jobs" | "applications" | "profile" | "messages" | "myopportunities">("jobs");
  const [activeChatCompanyId, setActiveChatCompanyId] = useState<number | null>(null);
  const [directChatInput, setDirectChatInput] = useState("");
  const [searchRegion, setSearchRegion] = useState("");
  const [searchSegment, setSearchSegment] = useState("");
  const [minCommission, setMinCommission] = useState<number>(0);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "", phone: "", region: "", segment: "", experienceYears: 0,
    bio: "", availability: "negociavel" as string, workModel: "multiplas" as string,
    additionalSegments: "", cities: "", linkedinUrl: ""
  });

  const utils = trpc.useUtils();
  const { data: profile, isLoading: profileLoading } = trpc.representatives.myProfile.useQuery();
  const { data: allJobs, isLoading: jobsLoading } = trpc.jobs.list.useQuery({
    region: searchRegion || undefined,
    segment: searchSegment || undefined,
    repTier: profile?.subscriptionTier ?? "free",
  });
  const jobs = allJobs?.filter(j => !minCommission || Number(j.commissionPercentage ?? 0) >= minCommission);
  const { data: myApplications, isLoading: appsLoading } = trpc.candidaturas.myApplications.useQuery();
  const { data: myOpportunities, isLoading: oppsLoading } = trpc.opportunities.myList.useQuery();
  const [newOppOpen, setNewOppOpen] = useState(false);
  const [oppForm, setOppForm] = useState({ title: "", description: "", region: "", segment: "", availability: "imediata" as "imediata" | "30dias" | "60dias" | "negociavel", workModel: "multiplas" as "exclusivo" | "multiplas" | "indifferente", expectedCommission: "" });
  const createOppMutation = trpc.opportunities.create.useMutation({
    onSuccess: () => { toast.success("Oportunidade publicada!"); setNewOppOpen(false); utils.opportunities.myList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateOppStatusMutation = trpc.opportunities.updateStatus.useMutation({
    onSuccess: () => { toast.success("Status atualizado!"); utils.opportunities.myList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteOppMutation = trpc.opportunities.delete.useMutation({
    onSuccess: () => { toast.success("Oportunidade removida!"); utils.opportunities.myList.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

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

  // ── Derived stats ──────────────────────────────────────────────────────────
  const statusCounts = useMemo(() => {
    if (!myApplications) return [];
    const counts: Record<string, number> = {};
    myApplications.forEach(({ application }) => {
      const s = application.status ?? "pending";
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label ?? status,
      value,
    }));
  }, [myApplications]);

  const segmentCounts = useMemo(() => {
    if (!allJobs) return [];
    const counts: Record<string, number> = {};
    allJobs.forEach(j => {
      const s = j.segment ?? "Outros";
      counts[s] = (counts[s] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, value }));
  }, [allJobs]);

  const avgScore = useMemo(() => {
    if (!myApplications?.length) return 0;
    return Math.round(myApplications.reduce((s, a) => s + (a.application.totalScore ?? 0), 0) / myApplications.length);
  }, [myApplications]);

  const acceptedCount = useMemo(() =>
    myApplications?.filter(a => a.application.status === "accepted" || a.application.status === "hired").length ?? 0,
    [myApplications]
  );

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }
  if (!profile) {
    navigate("/onboarding");
    return null;
  }

  const tier = profile.subscriptionTier as keyof typeof TIER_CONFIG;
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.free;

  const openEditProfile = () => {
    setProfileForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      region: profile.region ?? "",
      segment: profile.segment ?? "",
      experienceYears: profile.experienceYears ?? 0,
      bio: profile.bio ?? "",
      availability: (profile as any).availability ?? "negociavel",
      workModel: (profile as any).workModel ?? "multiplas",
      additionalSegments: (profile as any).additionalSegments ?? "",
      cities: (profile as any).cities ?? "",
      linkedinUrl: (profile as any).linkedinUrl ?? "",
    });
    setEditProfileOpen(true);
  };

  return (
    <div data-theme="dashboard" className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex h-screen">

        {/* ─── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain mb-5" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                {profile.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm truncate text-slate-800">{profile.fullName}</div>
                <Badge className={`text-xs mt-0.5 border-0 ${tierConfig.color}`}>{tierConfig.label}</Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {[
              { id: "jobs",             label: "Oportunidades",       icon: Briefcase,       badge: allJobs?.length },
              { id: "applications",    label: "Candidaturas",        icon: Bell,            badge: myApplications?.length },
              { id: "myopportunities", label: "Minhas Vagas",         icon: Target,          badge: myOpportunities?.length },
              { id: "messages",        label: "Mensagens",            icon: MessageCircle },
              { id: "profile",         label: "Meu Perfil",          icon: User },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${activeTab === item.id ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            {tierConfig.upgrade && (
              <Button
                size="sm"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                onClick={() => startCheckout(
                  tier === "free" ? "REP_BRONZE" : tier === "bronze" ? "REP_PRATA" : "REP_OURO",
                  user?.id ?? 0, user?.email ?? "", user?.name ?? ""
                )}
              >
                <Star className="w-3 h-3 mr-1" />{tierConfig.upgrade}
              </Button>
            )}
            <RepThemeToggle />
            <Button
              size="sm" variant="ghost"
              className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              onClick={() => { logout(); navigate("/"); }}
            >
              <LogOut className="w-4 h-4 mr-2" />Sair
            </Button>
          </div>
        </aside>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1 overflow-auto bg-slate-50">

          {/* ══ Jobs Tab ══════════════════════════════════════════════════ */}
          {activeTab === "jobs" && (
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Oportunidades</h1>
                  <p className="text-slate-500 text-sm mt-1">
                    Plano <span className="font-semibold text-emerald-700">{tierConfig.label}</span> — {
                      tier === "free" ? "pagamento pendente — vagas bloqueadas" :
                      tier === "bronze" ? "vagas Bronze disponíveis" :
                      tier === "prata" ? "vagas até Prata" : "todas as vagas (Ouro incluso)"
                    }
                  </p>
                </div>
                <Badge className={`${tierConfig.color} border-0 px-3 py-1 text-sm font-semibold`}>{tierConfig.label}</Badge>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Vagas Disponíveis", value: allJobs?.length ?? 0, icon: Briefcase, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Candidaturas Enviadas", value: myApplications?.length ?? 0, icon: Send, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Propostas Aceitas", value: acceptedCount, icon: CheckCircle, color: "text-amber-600", bg: "bg-amber-50" },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-slate-500 font-medium">{kpi.label}</span>
                      <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                      </div>
                    </div>
                    <div className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              {(segmentCounts.length > 0 || statusCounts.length > 0) && (
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {segmentCounts.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Vagas por Segmento</h3>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={segmentCounts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {statusCounts.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4">Candidaturas por Status</h3>
                      <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={statusCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                              {statusCounts.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#64748b" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tier lock banner */}
              {tier === "free" && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span className="text-amber-800 font-medium">Pagamento pendente — ative um plano para acessar as vagas.</span>
                  </div>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                    onClick={() => startCheckout("REP_BRONZE", user?.id ?? 0, user?.email ?? "", user?.name ?? "")}>
                    Ativar Plano
                  </Button>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Select value={searchRegion || "all"} onValueChange={(v) => setSearchRegion(v === "all" ? "" : v)}>
                  <SelectTrigger className="flex-1 min-w-[180px] max-w-xs bg-white border-slate-200 text-slate-700">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Todas as regiões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as regiões</SelectItem>
                    {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={searchSegment || "all"} onValueChange={(v) => setSearchSegment(v === "all" ? "" : v)}>
                  <SelectTrigger className="flex-1 min-w-[180px] max-w-xs bg-white border-slate-200 text-slate-700">
                    <Briefcase className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <SelectValue placeholder="Todos os segmentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os segmentos</SelectItem>
                    {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[160px] max-w-[200px]">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="number" min={0} max={100}
                    placeholder="Comissão mín. %"
                    value={minCommission || ""}
                    onChange={(e) => setMinCommission(Number(e.target.value))}
                    className="pl-9 bg-white border-slate-200 text-slate-700"
                  />
                </div>
              </div>

              {/* Jobs List */}
              {jobsLoading ? (
                <div className="flex justify-center pt-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
              ) : !jobs?.length ? (
                <div className="text-center pt-16 text-slate-400">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold text-slate-600">Nenhuma vaga encontrada</p>
                  <p className="text-sm mt-1">Tente ajustar os filtros</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const isLocked = (job.minTierRequired === "bronze" && tier === "free") ||
                                     (job.minTierRequired === "prata" && tier !== "prata" && tier !== "ouro") ||
                                     (job.minTierRequired === "ouro" && tier !== "ouro");
                    const alreadyApplied = myApplications?.some(a => a.job?.id === job.id);
                    return (
                      <div key={job.id} className={`rounded-xl border p-5 bg-white transition-all shadow-sm ${isLocked ? "border-slate-200 opacity-60" : "border-slate-200 hover:border-emerald-300 hover:shadow-md"}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {job.isFeatured && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs"><Star className="w-3 h-3 mr-1" />Destaque</Badge>}
                              {job.createdAt && Date.now() - new Date(job.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000 && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Nova</Badge>
                              )}
                              {isLocked && <Badge className="bg-slate-100 text-slate-500 border-0 text-xs"><Lock className="w-3 h-3 mr-1" />Bloqueado</Badge>}
                            </div>
                            <h3 className="font-semibold text-base text-slate-900">{job.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                              {job.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>}
                              {job.commissionPercentage && (
                                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                                  <DollarSign className="w-3 h-3" />{job.commissionPercentage}% comissão
                                </span>
                              )}
                              {job.segment && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{job.segment}</span>}
                            </div>
                            {job.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>}
                          </div>
                          <div className="shrink-0">
                            {isLocked ? (
                              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                onClick={() => startCheckout(tier === "free" ? "REP_PREMIUM" : "REP_ELITE", user?.id ?? 0, user?.email ?? "", user?.name ?? "")}>
                                <Lock className="w-3 h-3 mr-1" />Desbloquear
                              </Button>
                            ) : alreadyApplied ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs px-3 py-1.5">
                                <CheckCircle className="w-3 h-3 mr-1" />Candidatado
                              </Badge>
                            ) : (
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                                disabled={applyMutation.isPending}
                                onClick={() => applyMutation.mutate({ jobId: job.id })}>
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

          {/* ══ Applications Tab ══════════════════════════════════════════ */}
          {activeTab === "applications" && (
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Minhas Candidaturas</h1>
                <p className="text-slate-500 text-sm mt-1">Acompanhe o status e negocie diretamente com as empresas via chat</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total",      value: myApplications?.length ?? 0,                                                                          color: "text-slate-700",   bg: "bg-slate-50",   icon: Bell },
                  { label: "Aceitas",    value: acceptedCount,                                                                                         color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle },
                  { label: "Aguardando", value: myApplications?.filter(a => a.application.status === "pending").length ?? 0,                           color: "text-amber-700",   bg: "bg-amber-50",   icon: Clock },
                  { label: "Score Médio", value: avgScore,                                                                                             color: "text-blue-700",    bg: "bg-blue-50",    icon: Target },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-slate-500 font-medium">{kpi.label}</span>
                      <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              {appsLoading ? (
                <div className="flex justify-center pt-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
              ) : !myApplications?.length ? (
                <div className="text-center pt-16 text-slate-400">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-semibold text-slate-600">Nenhuma candidatura ainda</p>
                  <p className="text-sm mt-1">Explore as oportunidades e candidate-se</p>
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setActiveTab("jobs")}>Ver Oportunidades</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myApplications.map(({ application, job }) => {
                    const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                    const StatusIcon = status.icon;
                    const chatOpen = openChatId === application.id;
                    return (
                      <div key={application.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-slate-900">{job?.title ?? "Vaga"}</h3>
                            <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 flex-wrap">
                              {job?.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.region}</span>}
                              {job?.segment && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{job.segment}</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge className={`${status.color} border text-xs`}>
                                <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                              </Badge>
                              <span className="text-xs text-slate-500">Score: <span className="text-emerald-700 font-bold">{application.totalScore}/100</span></span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="shrink-0 border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() => setOpenChatId(chatOpen ? null : application.id)}>
                            <MessageCircle className="w-4 h-4 mr-1.5" />{chatOpen ? "Fechar" : "Chat"}
                          </Button>
                        </div>
                        {chatOpen && <ChatPanel applicationId={application.id} currentUserId={user?.id ?? 0} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ Messages Tab ═══════════════════════════════════════════════ */}
          {activeTab === "messages" && profile && (
            <RepDirectChatTab
              repId={(profile as any).id}
              repUserId={user?.id ?? 0}
              activeChatCompanyId={activeChatCompanyId}
              setActiveChatCompanyId={setActiveChatCompanyId}
              directChatInput={directChatInput}
              setDirectChatInput={setDirectChatInput}
            />
          )}

          {/* ══ Minhas Vagas Tab ═════════════════════════════════════════ */}
          {activeTab === "myopportunities" && (
            <div className="p-8 max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Minhas Vagas</h1>
                  <p className="text-slate-500 text-sm mt-1">Publique sua disponibilidade para empresas e gerentes encontrarem você</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setNewOppOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Nova Vaga
                </Button>
              </div>

              {oppsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
              ) : !myOpportunities?.length ? (
                <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                  <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-700 mb-2">Nenhuma vaga publicada</h3>
                  <p className="text-slate-500 text-sm mb-6">Publique sua disponibilidade para que empresas possam encontrar você</p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setNewOppOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Publicar Disponibilidade
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOpportunities.map((opp) => (
                    <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 truncate">{opp.title}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              opp.status === "active" ? "bg-emerald-50 text-emerald-700" :
                              opp.status === "paused" ? "bg-amber-50 text-amber-700" :
                              "bg-slate-100 text-slate-500"
                            }`}>
                              {opp.status === "active" ? "Ativa" : opp.status === "paused" ? "Pausada" : "Encerrada"}
                            </span>
                          </div>
                          {opp.description && <p className="text-sm text-slate-500 mb-3 line-clamp-2">{opp.description}</p>}
                          <div className="flex flex-wrap gap-2">
                            {opp.region && <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1"><MapPin className="w-3 h-3" />{opp.region}</span>}
                            {opp.segment && <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1"><Briefcase className="w-3 h-3" />{opp.segment}</span>}
                            {opp.expectedCommission && <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-1"><DollarSign className="w-3 h-3" />{opp.expectedCommission}</span>}
                            {opp.availability && <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-1"><Clock className="w-3 h-3" />{{ imediata: "Imediata", "30dias": "30 dias", "60dias": "60 dias", negociavel: "Negociável" }[opp.availability]}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {opp.status === "active" ? (
                            <Button size="sm" variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50" onClick={() => updateOppStatusMutation.mutate({ id: opp.id, status: "paused" })}>
                              <PauseCircle className="w-4 h-4" />
                            </Button>
                          ) : opp.status === "paused" ? (
                            <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => updateOppStatusMutation.mutate({ id: opp.id, status: "active" })}>
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                          ) : null}
                          <Button size="sm" variant="outline" className="border-red-200 text-red-500 hover:bg-red-50" onClick={() => { if (confirm("Remover esta vaga?")) deleteOppMutation.mutate({ id: opp.id }); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal: Nova Vaga */}
              <Dialog open={newOppOpen} onOpenChange={setNewOppOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Publicar Disponibilidade</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Título *</Label>
                      <Input placeholder="Ex: Representante disponível para Alimentos - SP" value={oppForm.title} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea placeholder="Descreva sua experiência, portfólio de clientes e o que busca..." rows={3} value={oppForm.description} onChange={e => setOppForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Região</Label>
                        <Input placeholder="Ex: São Paulo - Capital" value={oppForm.region} onChange={e => setOppForm(f => ({ ...f, region: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Segmento</Label>
                        <Input placeholder="Ex: Alimentos e Bebidas" value={oppForm.segment} onChange={e => setOppForm(f => ({ ...f, segment: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Disponibilidade</Label>
                        <Select value={oppForm.availability} onValueChange={v => setOppForm(f => ({ ...f, availability: v as typeof f.availability }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="imediata">Imediata</SelectItem>
                            <SelectItem value="30dias">Em 30 dias</SelectItem>
                            <SelectItem value="60dias">Em 60 dias</SelectItem>
                            <SelectItem value="negociavel">Negociável</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Modelo de Trabalho</Label>
                        <Select value={oppForm.workModel} onValueChange={v => setOppForm(f => ({ ...f, workModel: v as typeof f.workModel }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="exclusivo">Exclusivo</SelectItem>
                            <SelectItem value="multiplas">Múltiplas Empresas</SelectItem>
                            <SelectItem value="indifferente">Indiferente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Comissão Esperada</Label>
                      <Input placeholder="Ex: 5% a 8%" value={oppForm.expectedCommission} onChange={e => setOppForm(f => ({ ...f, expectedCommission: e.target.value }))} />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setNewOppOpen(false)}>Cancelar</Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!oppForm.title || createOppMutation.isPending} onClick={() => createOppMutation.mutate(oppForm)}>
                        {createOppMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publicar"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ══ Profile Tab ═══════════════════════════════════════════════ */}
          {activeTab === "profile" && (
            <div className="p-8 max-w-2xl">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
                  <p className="text-slate-500 text-sm mt-1">Mantenha seu perfil atualizado para atrair mais empresas</p>
                </div>
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-slate-50" onClick={openEditProfile}>
                  <Edit2 className="w-4 h-4 mr-2" />Editar Perfil
                </Button>
              </div>

              {/* Profile Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-2xl">
                    {profile.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{profile.fullName}</h2>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge className={`${tierConfig.color} border-0`}>{tierConfig.label}</Badge>
                      {(profile as any).kycStatus === "approved" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2.5 py-0.5">
                          <Shield className="w-3 h-3" /> Identidade Verificada
                        </span>
                      )}
                      {(profile as any).coreStatus === "active" && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">
                          <Award className="w-3 h-3" /> CORE Ativo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Região", value: profile.region },
                    { label: "Segmento", value: profile.segment },
                    { label: "Experiência", value: profile.experienceYears ? `${profile.experienceYears} anos` : "—" },
                    { label: "Telefone", value: profile.phone ?? "—" },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                      <div className="text-slate-400 text-xs mb-0.5">{item.label}</div>
                      <div className="font-semibold text-slate-800">{item.value ?? "—"}</div>
                    </div>
                  ))}
                </div>

                {profile.bio && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-slate-400 text-xs mb-1">Bio</div>
                    <p className="text-sm leading-relaxed text-slate-700">{profile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-2">
                  {[
                    { label: "Candidaturas", value: myApplications?.length ?? 0, color: "text-slate-800" },
                    { label: "Score Médio", value: avgScore, color: "text-emerald-700" },
                    { label: "Taxa de Resposta", value: `${profile.responseRate ?? 0}%`, color: "text-blue-700" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-center">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification Card */}
              <div className="mt-5 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> Verificação de Perfil
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    {(profile as any).kycStatus === "approved" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1">
                        <Shield className="w-3.5 h-3.5" /> Identidade Verificada
                      </span>
                    ) : (profile as any).kycStatus === "pending" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1">
                        <Shield className="w-3.5 h-3.5" /> Em análise...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-full px-3 py-1">
                        <Shield className="w-3.5 h-3.5" /> Identidade não verificada
                      </span>
                    )}
                  </div>
                  {(profile as any).kycStatus !== "approved" && (profile as any).kycStatus !== "pending" && (
                    <a href="/verificacao">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7">
                        Verificar agora
                      </Button>
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {(profile as any).coreStatus === "active" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1">
                        <Award className="w-3.5 h-3.5" /> CORE Ativo
                        {(profile as any).coreValidUntil && (
                          <span className="opacity-70 ml-0.5">· vál. {new Date((profile as any).coreValidUntil).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 border border-slate-200 rounded-full px-3 py-1">
                        <Award className="w-3.5 h-3.5" /> CORE não validado
                      </span>
                    )}
                  </div>
                  {(profile as any).coreStatus !== "active" && (
                    <a href="/verificacao">
                      <Button size="sm" variant="outline" className="text-xs h-7 border-amber-200 text-amber-700 hover:bg-amber-50">
                        Validar CORE
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              {/* Upgrade Card */}
              {tierConfig.upgrade && (
                <div className="mt-5 bg-white rounded-xl border border-emerald-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Desbloqueie mais oportunidades</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    {tier === "free" ? "Ative o Bronze (R$9,99/mês) para aparecer para empresas e acessar vagas exclusivas." :
                     tier === "bronze" ? "Com o Prata (R$19,90/mês) você tem destaque na busca e acessa vagas Prata." :
                     "Com o Ouro (R$29,90/mês) você aparece em primeiro na busca e acessa TODAS as vagas."}
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    onClick={() => startCheckout(
                      tier === "free" ? "REP_BRONZE" : tier === "bronze" ? "REP_PRATA" : "REP_OURO",
                      user?.id ?? 0, user?.email ?? "", user?.name ?? ""
                    )}>
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
        <DialogContent className="bg-white border-slate-200 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Perfil</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 mt-2 max-h-[70vh] overflow-y-auto pr-1"
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate({
                ...profileForm,
                availability: profileForm.availability as "imediata" | "30dias" | "60dias" | "negociavel",
                workModel: profileForm.workModel as "exclusivo" | "multiplas" | "indifferente"
              });
            }}
          >
            <div>
              <Label className="text-slate-700">Nome completo</Label>
              <Input value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="mt-1 bg-slate-50 border-slate-200 text-slate-800" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-700">Região principal</Label>
                <Select value={profileForm.region} onValueChange={(v) => setProfileForm({ ...profileForm, region: v })}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 text-slate-700"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Segmento principal</Label>
                <Select value={profileForm.segment} onValueChange={(v) => setProfileForm({ ...profileForm, segment: v })}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 text-slate-700"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-700">Telefone</Label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="(11) 99999-9999" className="mt-1 bg-slate-50 border-slate-200 text-slate-800" />
              </div>
              <div>
                <Label className="text-slate-700">Anos de experiência</Label>
                <Input type="number" min={0} max={50} value={profileForm.experienceYears} onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })} className="mt-1 bg-slate-50 border-slate-200 text-slate-800" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-700">Disponibilidade</Label>
                <Select value={profileForm.availability} onValueChange={(v) => setProfileForm({ ...profileForm, availability: v })}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 text-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imediata">Disponível agora</SelectItem>
                    <SelectItem value="30dias">Em 30 dias</SelectItem>
                    <SelectItem value="60dias">Em 60 dias</SelectItem>
                    <SelectItem value="negociavel">Negociável</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700">Modelo de trabalho</Label>
                <Select value={profileForm.workModel} onValueChange={(v) => setProfileForm({ ...profileForm, workModel: v })}>
                  <SelectTrigger className="mt-1 bg-slate-50 border-slate-200 text-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exclusivo">Exclusivo</SelectItem>
                    <SelectItem value="multiplas">Múltiplas representadas</SelectItem>
                    <SelectItem value="indifferente">Indiferente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-700">Bio</Label>
              <Textarea value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} rows={3} placeholder="Descreva sua experiência e diferenciais..." className="mt-1 bg-slate-50 border-slate-200 text-slate-800 resize-none" />
            </div>
            <div>
              <Label className="text-slate-700">LinkedIn</Label>
              <Input value={profileForm.linkedinUrl} onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." className="mt-1 bg-slate-50 border-slate-200 text-slate-800" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1 border-slate-200 text-slate-600" onClick={() => setEditProfileOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
