import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import {
  Briefcase, Building2, Users, LogOut, Plus, MapPin, DollarSign,
  Loader2, Star, CheckCircle, Clock, XCircle, Award, TrendingUp,
  ChevronRight, Eye, Crown, Medal, Linkedin, Search, BadgeCheck, Pencil, Shield,
  BarChart3, Target, Zap, ArrowUpRight, ArrowDownRight, MessageSquare, Send,
  ShoppingCart, Trash2, Upload, X as XIcon, QrCode
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
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

const RANK_CONFIG = {
  bronze: { label: "Bronze", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  silver: { label: "Silver", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
  gold: { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  platinum: { label: "Platinum", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" },
};

const TIER_CONFIG = {
  starter: { label: "Starter", color: "bg-slate-100 text-slate-600" },
  pro: { label: "Pro", color: "bg-emerald-100 text-emerald-700" },
  enterprise: { label: "Enterprise", color: "bg-amber-100 text-amber-700" },
};

const STATUS_CONFIG = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  viewed: { label: "Visualizado", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Eye },
  accepted: { label: "Aceito", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Recusado", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  hired: { label: "Contratado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Star },
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

async function startCheckout(productKey: string, userId: number, userEmail: string, userName: string, extraData?: { jobId?: number; repId?: number }) {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productKey, userId, userEmail, userName, jobId: extraData?.jobId, repId: extraData?.repId }),
    });
    const data = await res.json() as { url?: string; error?: string };
    if (data.url) { toast.info("Redirecionando para o pagamento..."); window.open(data.url, "_blank"); }
    else toast.error(data.error ?? "Erro ao iniciar pagamento");
  } catch {
    toast.error("Erro ao conectar com o servidor de pagamento");
  }
}

// ─── Direct Chat Tab Component ──────────────────────────────────────────────
function DirectChatTab({
  companyId,
  companyUserId,
  activeChatRepId,
  setActiveChatRepId,
  activeChatCompanyId,
  setActiveChatCompanyId,
  directChatInput,
  setDirectChatInput,
}: {
  companyId: number;
  companyUserId: number;
  activeChatRepId: number | null;
  setActiveChatRepId: (id: number | null) => void;
  activeChatCompanyId: number | null;
  setActiveChatCompanyId: (id: number | null) => void;
  directChatInput: string;
  setDirectChatInput: (v: string) => void;
}) {
  const utils = trpc.useUtils();
  const { data: conversations, isLoading: convsLoading } = trpc.directChat.listConversations.useQuery(undefined, { refetchInterval: 5000 });
  const { data: messages, isLoading: msgsLoading } = trpc.directChat.getMessages.useQuery(
    { companyId: activeChatCompanyId ?? companyId, representativeId: activeChatRepId! },
    { enabled: !!activeChatRepId, refetchInterval: 4000 }
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
    if (!directChatInput.trim() || !activeChatRepId) return;
    sendMutation.mutate({ companyId: activeChatCompanyId ?? companyId, representativeId: activeChatRepId, content: directChatInput.trim() });
  };

  return (
    <div className="p-8 flex gap-6 h-full">
      {/* Conversation List */}
      <div className="w-72 shrink-0">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Mensagens</h2>
        {convsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
        ) : !conversations?.length ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma conversa ainda.</p>
            <p className="text-xs mt-1">Desbloqueie um contato na aba Buscar Representantes para iniciar uma conversa.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(conversations as any[]).map((conv: any) => (
              <button
                key={conv.representativeId}
                onClick={() => { setActiveChatRepId(conv.representativeId); setActiveChatCompanyId(companyId); }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  activeChatRepId === conv.representativeId
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                    {conv.repName?.charAt(0) ?? "R"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-800 truncate">{conv.repName}</div>
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

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {!activeChatRepId ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Selecione uma conversa para ver as mensagens</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-sm text-slate-700">
                {(conversations as any[])?.find((c: any) => c.representativeId === activeChatRepId)?.repName ?? "Representante"}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {msgsLoading ? (
                <div className="flex justify-center pt-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
              ) : !messages?.length ? (
                <p className="text-center text-slate-400 text-sm pt-8">Nenhuma mensagem ainda. Inicie a conversa!</p>
              ) : (
                (messages as any[]).map((msg: any) => {
                  const isMe = msg.senderUserId === companyUserId;
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

function ThemeToggleCompact() {
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

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "applications" | "profile" | "search" | "messages">("overview");
  const [activeChatRepId, setActiveChatRepId] = useState<number | null>(null);
  const [activeChatCompanyId, setActiveChatCompanyId] = useState<number | null>(null);
  const [directChatInput, setDirectChatInput] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [searchRegion, setSearchRegion] = useState<string | undefined>(undefined);
  const [searchSegment, setSearchSegment] = useState<string | undefined>(undefined);
  const [searchTier, setSearchTier] = useState<"bronze" | "prata" | "ouro" | undefined>(undefined);
  const [searchKycApproved, setSearchKycApproved] = useState(false);
  const [searchCoreActive, setSearchCoreActive] = useState(false);
  const [searchAvailability, setSearchAvailability] = useState<string | undefined>(undefined);
  const [searchSortBy, setSearchSortBy] = useState<"availability" | "rating" | "tier" | "recent">("tier");
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [openChatId, setOpenChatId] = useState<number | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [previewRegion, setPreviewRegion] = useState<string | undefined>(undefined);
  const [previewSegment, setPreviewSegment] = useState<string | undefined>(undefined);

  // ─── Cart state (desbloqueio em lote) ─────────────────────────────────────
  const [cart, setCart] = useState<Array<{ id: number; name: string }>>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartStep, setCartStep] = useState<"summary" | "qrcode" | "upload" | "done">("summary");
  const [pixProofFile, setPixProofFile] = useState<File | null>(null);
  const [pixProofUploading, setPixProofUploading] = useState(false);
  const [currentRequestId, setCurrentRequestId] = useState<number | null>(null);
  const [pixCountdown, setPixCountdown] = useState(30);
  const pixCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Query para pedidos de desbloqueio pendentes
  const { data: myUnlockRequests } = trpc.unlockRequests.myRequests.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });
  const pendingUnlockRequests = (myUnlockRequests ?? []).filter(
    r => r.status === "pending_payment" || r.status === "pending_approval"
  );

  const createUnlockRequest = trpc.unlockRequests.create.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const uploadPixProof = trpc.unlockRequests.uploadPixProof.useMutation({
    onError: (e) => { setPixProofUploading(false); toast.error(e.message); },
  });

  const addToCart = (repId: number, repName: string) => {
    if (cart.some(c => c.id === repId)) { toast.info("Já está no carrinho"); return; }
    setCart(prev => [...prev, { id: repId, name: repName }]);
    toast.success(`${repName} adicionado ao carrinho`);
  };
  const removeFromCart = (repId: number) => setCart(prev => prev.filter(c => c.id !== repId));

  const handleCheckoutCart = async () => {
    if (cart.length === 0) return;
    try {
      // 1. Create the unlock request in DB
      const res = await createUnlockRequest.mutateAsync({ repIds: cart.map(c => c.id), paymentMethod: "pix" });
      if (!res) return;

      // 2. Create MP Checkout Pro preference
      const prefRes = await fetch("/api/mp/unlock-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Origin": window.location.origin },
        body: JSON.stringify({
          requestId: res.requestId,
          repIds: cart.map(c => c.id),
          userId: user?.id,
          userEmail: user?.email ?? "",
          userName: user?.name ?? "",
        }),
      });
      const prefData = await prefRes.json();
      if (!prefRes.ok) throw new Error(prefData.error ?? "Erro ao criar pagamento");

      // 3. Redirect to MP Checkout
      const checkoutUrl = prefData.initPoint;
      toast.success("Redirecionando para o pagamento...");
      setCartOpen(false);
      setCart([]);
      window.open(checkoutUrl, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao processar pagamento");
    }
  };

  const handlePixProofUpload = async () => {
    if (!pixProofFile || !currentRequestId) return;
    setPixProofUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      await uploadPixProof.mutateAsync({
        requestId: currentRequestId,
        fileBase64: base64,
        fileName: pixProofFile.name,
        mimeType: pixProofFile.type,
      });
      setPixProofUploading(false);
      setCartStep("done");
      setCart([]);
      toast.success("Comprovante enviado! Aguarde a aprovação do admin.");
    };
    reader.readAsDataURL(pixProofFile);
  };

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRepId, setReviewRepId] = useState<number | null>(null);
  const [reviewRepName, setReviewRepName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const submitReview = trpc.reviews.submit.useMutation({
    onSuccess: () => { toast.success("Avaliação enviada com sucesso!"); setReviewModalOpen(false); setReviewComment(""); setReviewRating(5); },
    onError: (e) => toast.error(e.message),
  });

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({ companyName: "", cnpj: "", segment: "", region: "", phone: "", description: "" });
  const [cnpjLookup, setCnpjLookup] = useState("");
  const [cnpjVerified, setCnpjVerified] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    commissionPercentage: "",
    region: "",
    segment: "",
    minTierRequired: "bronze" as "bronze" | "prata" | "ouro",
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
  const { data: searchData, isLoading: searchLoading } = trpc.representatives.listForCompany.useQuery(
    { region: searchRegion, segment: searchSegment, tier: searchTier, page: searchPage, limit: 20, kycApproved: searchKycApproved || undefined, coreActive: searchCoreActive || undefined, availability: searchAvailability, sortBy: searchSortBy },
    { enabled: activeTab === "search" }
  );
  const { data: availableNowData } = trpc.representatives.countAvailableNow.useQuery(undefined, { staleTime: 60_000 });

  const utils = trpc.useUtils();

  const cnpjQuery = trpc.companies.lookupCnpj.useQuery(
    { cnpj: cnpjLookup },
    { enabled: cnpjLookup.replace(/\D/g, "").length === 14, retry: false }
  );
  useEffect(() => {
    if (cnpjQuery.isSuccess && cnpjQuery.data) {
      const d = cnpjQuery.data;
      setProfileEditForm((prev) => ({
        ...prev,
        companyName: prev.companyName || d.razaoSocial || d.nomeFantasia,
        phone: prev.phone || d.telefone,
      }));
      setCnpjVerified(true);
      toast.success(`CNPJ verificado: ${d.razaoSocial || d.nomeFantasia}`);
    }
  }, [cnpjQuery.isSuccess, cnpjQuery.data]);
  useEffect(() => {
    if (cnpjQuery.isError && cnpjLookup) {
      setCnpjVerified(false);
      toast.error(cnpjQuery.error?.message || "CNPJ não encontrado");
    }
  }, [cnpjQuery.isError, cnpjQuery.error, cnpjLookup]);

  const updateProfileMutation = trpc.companies.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      setEditProfileOpen(false);
      utils.companies.myProfile.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const createJobMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Vaga publicada com sucesso!");
      setCreateJobOpen(false);
      setJobForm({ title: "", description: "", commissionPercentage: "", region: "", segment: "", minTierRequired: "bronze" as "bronze" | "prata" | "ouro" });
      utils.jobs.myJobs.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: chatMessages, refetch: refetchChat } = trpc.messages.list.useQuery(
    { applicationId: openChatId! },
    { enabled: !!openChatId, refetchInterval: openChatId ? 3000 : false }
  );
  const sendMessageMutation = trpc.messages.send.useMutation({
    onSuccess: () => { setChatInput(""); refetchChat(); },
    onError: (e) => toast.error(e.message),
  });
  const updateStatusMutation = trpc.candidaturas.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado!");
      utils.candidaturas.byJob.invalidate();
    },
  });
  const updateJobMutation = trpc.jobs.update.useMutation({
    onSuccess: () => {
      toast.success("Vaga atualizada!");
      utils.jobs.myJobs.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment");
    if (paymentStatus === "success") {
      const repId = params.get("rep_id");
      const jobId = params.get("job_id");
      if (repId) {
        toast.success("Pagamento confirmado! Contato desbloqueado com sucesso.");
        setActiveTab("search");
        utils.representatives.listForCompany.invalidate();
      } else if (jobId) {
        toast.success("Vaga destacada com sucesso!");
        utils.jobs.myJobs.invalidate();
      } else {
        toast.success("Pagamento confirmado! Seu plano foi atualizado.");
        utils.companies.myProfile.invalidate();
      }
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "cancelled") {
      toast.info("Pagamento cancelado.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate("/onboarding");
    }
  }, [profileLoading, profile, navigate]);

  // Computed chart data
  const jobStatusData = useMemo(() => {
    if (!myJobs) return [];
    const counts: Record<string, number> = { Aberta: 0, Pausada: 0, Fechada: 0 };
    myJobs.forEach(j => {
      if (j.status === "open") counts["Aberta"]++;
      else if (j.status === "paused") counts["Pausada"]++;
      else counts["Fechada"]++;
    });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [myJobs]);

  const jobSegmentData = useMemo(() => {
    if (!myJobs) return [];
    const counts: Record<string, number> = {};
    myJobs.forEach(j => { if (j.segment) counts[j.segment] = (counts[j.segment] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name: name.split(" ")[0], value }));
  }, [myJobs]);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) return null;

  const rank = profile.dynamicRank as keyof typeof RANK_CONFIG;
  const rankConfig = RANK_CONFIG[rank] ?? RANK_CONFIG.bronze;
  const tier = profile.subscriptionTier as keyof typeof TIER_CONFIG;
  const tierConfig = TIER_CONFIG[tier] ?? TIER_CONFIG.starter;

  const activeJobs = myJobs?.filter(j => j.status === "open").length ?? 0;
  const totalJobs = myJobs?.length ?? 0;
  const featuredJobs = myJobs?.filter(j => j.isFeatured).length ?? 0;

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm.title) { toast.error("Título é obrigatório"); return; }
    createJobMutation.mutate({
      ...jobForm,
      commissionPercentage: jobForm.commissionPercentage ? Number(jobForm.commissionPercentage) : undefined,
    });
  };

  const navItems = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "jobs", label: "Minhas Vagas", icon: Briefcase },
    { id: "applications", label: "Candidaturas", icon: Users },
    { id: "search", label: "Buscar Representantes", icon: Eye },
    { id: "messages", label: "Mensagens", icon: MessageSquare },
    { id: "profile", label: "Perfil da Empresa", icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0">
        <div className="p-5 border-b border-slate-100">
          <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain mb-4" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {profile.companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate text-slate-800">{profile.companyName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tierConfig.color}`}>{tierConfig.label}</span>
                <span className={`text-xs font-bold ${rankConfig.color}`}>{rankConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-emerald-600" : ""}`} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-1">
          <ThemeToggleCompact />
          {user?.role === "admin" && (
            <Button
              size="sm" variant="ghost"
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => navigate("/admin")}
            >
              <span className="mr-2">🔑</span>Painel Admin
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            onClick={() => { logout(); navigate("/"); }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
              <p className="text-slate-500 text-sm mt-1">Acompanhe o desempenho das suas vagas e candidaturas</p>
            </div>

            {/* ─── Aviso de pagamento pendente ─── */}
            {pendingUnlockRequests.length > 0 && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-800">
                    {pendingUnlockRequests.some(r => r.status === "pending_approval")
                      ? "⏳ Pagamento aguardando aprovação do administrador"
                      : "📋 Comprovante de pagamento aguardando envio"}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {pendingUnlockRequests.some(r => r.status === "pending_approval")
                      ? `Você tem ${pendingUnlockRequests.filter(r => r.status === "pending_approval").length} pedido(s) de desbloqueio com comprovante enviado. O administrador irá revisar e liberar os contatos em até 24h.`
                      : `Você tem ${pendingUnlockRequests.filter(r => r.status === "pending_payment").length} pedido(s) de desbloqueio aguardando envio do comprovante Pix.`}
                  </p>
                  {pendingUnlockRequests.some(r => r.status === "pending_payment") && (
                    <button
                      className="mt-2 text-xs font-semibold text-amber-700 underline hover:text-amber-900"
                      onClick={() => { setCartOpen(true); setCurrentRequestId(pendingUnlockRequests.find(r => r.status === "pending_payment")?.id ?? null); setCartStep("upload"); }}
                    >
                      Enviar comprovante agora →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {[
                {
                  label: "Vagas Ativas",
                  value: activeJobs,
                  icon: Briefcase,
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                  sub: `${totalJobs} total`,
                },
                {
                  label: "Em Destaque",
                  value: featuredJobs,
                  icon: Star,
                  color: "text-amber-600",
                  bg: "bg-amber-50",
                  sub: "vagas destacadas",
                },
                {
                  label: "Segmento",
                  value: profile.segment ?? "—",
                  icon: Target,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                  sub: profile.region ?? "Brasil",
                  isText: true,
                },
                {
                  label: "Plano",
                  value: tierConfig.label,
                  icon: Zap,
                  color: "text-violet-600",
                  bg: "bg-violet-50",
                  sub: rankConfig.label,
                  isText: true,
                },
              ].map((kpi) => (
                <Card key={kpi.label} className="border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-slate-500">{kpi.label}</span>
                      <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                        <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${kpi.isText ? "text-slate-800 text-lg" : "text-slate-900"}`}>
                      {kpi.value}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{kpi.sub}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Job Status Pie */}
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-700">Status das Vagas</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobStatusData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                      <Briefcase className="w-8 h-8 mr-2 opacity-30" />
                      Nenhuma vaga publicada ainda
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={jobStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {jobStatusData.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v} vaga(s)`, ""]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Vagas por Segmento Bar */}
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-700">Vagas por Segmento</CardTitle>
                </CardHeader>
                <CardContent>
                  {jobSegmentData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                      <BarChart3 className="w-8 h-8 mr-2 opacity-30" />
                      Publique vagas com segmento para ver o gráfico
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={jobSegmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
                        <Tooltip formatter={(v) => [`${v} vaga(s)`, "Vagas"]} />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-700">Vagas Recentes</CardTitle>
                <Button size="sm" variant="ghost" className="text-emerald-600 hover:text-emerald-700 text-xs" onClick={() => setActiveTab("jobs")}>
                  Ver todas <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {jobsLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /></div>
                ) : !myJobs?.length ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhuma vaga publicada ainda.
                    <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white block mx-auto" onClick={() => setActiveTab("jobs")}>
                      <Plus className="w-3 h-3 mr-1" />Publicar primeira vaga
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myJobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                        <div>
                          <div className="font-medium text-sm text-slate-800">{job.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{job.region ?? "Brasil"} · {job.segment ?? "Geral"}</div>
                        </div>
                        <Badge className={
                          job.status === "open" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                          job.status === "paused" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }>
                          {job.status === "open" ? "Aberta" : job.status === "paused" ? "Pausada" : "Fechada"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Jobs Tab ─────────────────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Minhas Vagas</h1>
                <p className="text-slate-500 text-sm mt-1">Gerencie suas vagas e visualize candidatos</p>
              </div>
              <Dialog open={createJobOpen} onOpenChange={setCreateJobOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Vaga
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-slate-200 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-slate-800">Publicar nova vaga</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateJob} className="space-y-4 mt-2">
                    <div>
                      <Label className="text-slate-700">Título da vaga *</Label>
                      <Input
                        value={jobForm.title}
                        onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                        placeholder="Ex: Representante Comercial SP - Alimentos"
                        className="mt-1 border-slate-200 bg-white focus:border-emerald-400"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-slate-700">Descrição</Label>
                      <Textarea
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        placeholder="Descreva a vaga, produtos, metas, benefícios..."
                        className="mt-1 border-slate-200 bg-white"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-700">Comissão (%)</Label>
                        <Input
                          type="number" min={0} max={100}
                          value={jobForm.commissionPercentage}
                          onChange={(e) => setJobForm({ ...jobForm, commissionPercentage: e.target.value })}
                          placeholder="Ex: 5"
                          className="mt-1 border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-700">Acesso mínimo</Label>
                        <Select
                          value={jobForm.minTierRequired}
                          onValueChange={(v) => setJobForm({ ...jobForm, minTierRequired: v as "bronze" | "prata" | "ouro" })}
                        >
                          <SelectTrigger className="mt-1 border-slate-200 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bronze">Bronze+ (R$9,99)</SelectItem>
                            <SelectItem value="prata">Prata+ (R$19,90)</SelectItem>
                            <SelectItem value="ouro">Ouro apenas (R$29,90)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-slate-700">Região</Label>
                        <Select onValueChange={(v) => setJobForm({ ...jobForm, region: v })}>
                          <SelectTrigger className="mt-1 border-slate-200 bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-700">Segmento</Label>
                        <Select onValueChange={(v) => setJobForm({ ...jobForm, segment: v })}>
                          <SelectTrigger className="mt-1 border-slate-200 bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={createJobMutation.isPending}>
                      {createJobMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      Publicar Vaga
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {jobsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : myJobs?.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="mb-4 text-slate-500">Você ainda não publicou nenhuma vaga.</p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setCreateJobOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />Publicar primeira vaga
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myJobs?.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge className={job.status === "open" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : job.status === "paused" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                            {job.status === "open" ? "Aberta" : job.status === "paused" ? "Pausada" : "Fechada"}
                          </Badge>
                          {job.isFeatured && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              <Star className="w-3 h-3 mr-1 fill-amber-500" />Destaque
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">{job.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          {job.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.region}</span>}
                          {job.commissionPercentage && <span className="text-emerald-600 font-semibold">{job.commissionPercentage}% comissão</span>}
                          {job.segment && <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{job.segment}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50"
                          onClick={() => { setSelectedJobId(job.id); setActiveTab("applications"); }}>
                          <Users className="w-3.5 h-3.5 mr-1" />Candidatos
                        </Button>
                        {job.status === "open" ? (
                          <Button size="sm" variant="outline" className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                            onClick={() => updateJobMutation.mutate({ id: job.id, status: "paused" })} disabled={updateJobMutation.isPending}>
                            Pausar
                          </Button>
                        ) : job.status === "paused" ? (
                          <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => updateJobMutation.mutate({ id: job.id, status: "open" })} disabled={updateJobMutation.isPending}>
                            Reabrir
                          </Button>
                        ) : null}
                        {job.status !== "closed" && (
                          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => updateJobMutation.mutate({ id: job.id, status: "closed" })} disabled={updateJobMutation.isPending}>
                            Fechar
                          </Button>
                        )}
                      </div>
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
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Candidaturas</h1>
                <p className="text-slate-500 text-sm mt-1">Gerencie os candidatos às suas vagas</p>
              </div>
              {myJobs && myJobs.length > 0 && (
                <Select
                  value={selectedJobId?.toString() ?? ""}
                  onValueChange={(v) => setSelectedJobId(Number(v))}
                >
                  <SelectTrigger className="w-64 border-slate-200 bg-white ml-auto">
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
              <div className="text-center py-16 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-slate-500">Selecione uma vaga para ver as candidaturas.</p>
              </div>
            ) : appsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="font-semibold mb-4 text-slate-500 text-xs uppercase tracking-wider">Candidatos ({jobApplications?.length ?? 0})</h2>
                  <div className="space-y-3">
                    {jobApplications?.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-slate-200 p-6">Nenhuma candidatura ainda.</div>
                    ) : jobApplications?.map(({ application, rep }) => {
                      const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                      const StatusIcon = status.icon;
                      return (
                        <div key={application.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-slate-800">{rep.fullName}</div>
                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                {rep.region && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rep.region}</span>}
                                {rep.segment && <span>{rep.segment}</span>}
                                {rep.experienceYears && <span>{rep.experienceYears}a exp.</span>}
                              </div>
                              {application.llmAnalysis && (
                                <p className="text-xs text-slate-400 mt-1.5 italic">"{application.llmAnalysis}"</p>
                              )}
                            </div>
                            <div className="text-right ml-3">
                              <div className="text-emerald-600 font-black text-xl">{application.totalScore}</div>
                              <div className="text-xs text-slate-400">score</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                            <Badge className={`text-xs border ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />{status.label}
                            </Badge>
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs"
                                onClick={() => updateStatusMutation.mutate({ id: application.id, status: "accepted" })}>Aceitar</Button>
                              <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-xs"
                                onClick={() => updateStatusMutation.mutate({ id: application.id, status: "rejected" })}>Recusar</Button>
                              <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                                onClick={() => { setOpenChatId(openChatId === application.id ? null : application.id); setChatInput(""); }}>
                                {openChatId === application.id ? "Fechar Chat" : "Chat"}
                              </Button>
                            </div>
                          </div>
                          {openChatId === application.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <div className="h-40 overflow-y-auto space-y-2 mb-2 pr-1">
                                {!chatMessages?.length && (
                                  <div className="text-xs text-slate-400 text-center py-4">Nenhuma mensagem ainda. Inicie a conversa!</div>
                                )}
                                {chatMessages?.map((msg) => (
                                  <div key={msg.id} className={`flex ${msg.senderUserId === user?.id ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${msg.senderUserId === user?.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                                      {msg.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  className="flex-1 text-xs rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  placeholder="Digite uma mensagem..."
                                  value={chatInput}
                                  onChange={(e) => setChatInput(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter" && chatInput.trim()) sendMessageMutation.mutate({ applicationId: application.id, content: chatInput.trim() }); }}
                                />
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
                                  disabled={!chatInput.trim() || sendMessageMutation.isPending}
                                  onClick={() => sendMessageMutation.mutate({ applicationId: application.id, content: chatInput.trim() })}>
                                  Enviar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="font-semibold text-slate-500 text-xs uppercase tracking-wider">Top Matches por IA</h2>
                    <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">✦ Análise Inteligente</span>
                  </div>
                  <div className="space-y-4">
                    {topMatches?.map((m: any, i: number) => {
                      const rep = m.rep;
                      const score = m.score as number;
                      const bd = m.breakdown as any;
                      const criteria = bd?.criteria;
                      const strengths: string[] = bd?.strengths ?? [];
                      const revenueEstimate: string | null = bd?.revenueEstimate ?? null;
                      const cnaeDescricao: string | null = bd?.cnaeDescricao ?? null;
                      const scoreColor = score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-500" : "text-slate-400";
                      const scoreBorderBg = score >= 80 ? "border-emerald-200 bg-emerald-50/30" : score >= 50 ? "border-amber-200 bg-amber-50/30" : "border-slate-200 bg-white";
                      return (
                        <div key={rep.id} className={`rounded-xl border ${scoreBorderBg} p-4 shadow-sm`}>
                          {/* Header */}
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm flex-shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-slate-800">{rep.fullName}</div>
                              <div className="text-xs text-slate-400 mt-0.5">{rep.region} · {rep.segment}</div>
                              {cnaeDescricao && <div className="text-xs text-slate-400 mt-0.5 truncate">CNAE: {cnaeDescricao}</div>}
                            </div>
                            <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                              <div className={`font-black text-2xl leading-none ${scoreColor}`}>{score}</div>
                              <div className="text-[10px] text-slate-400">/ 100 pts</div>
                            </div>
                          </div>
                          {/* Score bar */}
                          <div className="mb-3">
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-slate-300"}`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                          </div>
                          {/* Criteria breakdown */}
                          {criteria && (
                            <div className="grid grid-cols-3 gap-1.5 mb-3">
                              {[
                                { label: "Região", pts: criteria.region?.points ?? 0, max: 40, ok: criteria.region?.match },
                                { label: "Segmento", pts: criteria.segment?.points ?? 0, max: 30, ok: criteria.segment?.match },
                                { label: "Experiência", pts: criteria.experience?.points ?? 0, max: 20, ok: (criteria.experience?.years ?? 0) >= 3 },
                                { label: "Ativo", pts: criteria.active?.points ?? 0, max: 5, ok: criteria.active?.isActive },
                                { label: "KYC", pts: criteria.kyc?.points ?? 0, max: 3, ok: criteria.kyc?.approved },
                                { label: "CORE", pts: criteria.core?.points ?? 0, max: 2, ok: criteria.core?.active },
                              ].map(({ label, pts, max, ok }) => (
                                <div key={label} className={`rounded-lg p-1.5 text-center border ${ok ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                                  <div className={`text-xs font-bold ${ok ? "text-emerald-700" : "text-slate-400"}`}>{pts}/{max}</div>
                                  <div className="text-[10px] text-slate-500 leading-tight">{label}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Strengths */}
                          {strengths.length > 0 && (
                            <div className="mb-3">
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Pontos Fortes</div>
                              <div className="flex flex-wrap gap-1">
                                {strengths.map((s: string, si: number) => (
                                  <span key={si} className="text-[11px] bg-white border border-emerald-200 text-emerald-700 rounded-full px-2 py-0.5">{s}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Revenue estimate */}
                          {revenueEstimate && (
                            <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-600 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                              <span className="text-blue-500">💰</span>
                              <span><strong>Faturamento estimado:</strong> {revenueEstimate}</span>
                            </div>
                          )}
                          {/* Experience */}
                          {(rep.experienceYears ?? 0) > 0 && (
                            <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
                              <span>⏱</span>
                              <span><strong>{rep.experienceYears} anos</strong> de experiência em representação comercial</span>
                            </div>
                          )}
                          {/* Action */}
                          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                            onClick={() => user && startCheckout("UNLOCK_CONTACT", user.id, user.email ?? "", user.name ?? "", { repId: rep.id })}>
                            🔓 Desbloquear contato completo — R$29
                          </Button>
                        </div>
                      );
                    })}
                    {!topMatches?.length && (
                      <div className="text-center py-8 text-slate-400 text-sm bg-white rounded-xl border border-slate-200 p-6">
                        Selecione uma vaga para ver os top matches da IA.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Cart Modal ──────────────────────────────────────────────────────────────────────────────────── */}
        <Dialog open={cartOpen} onOpenChange={(o) => { setCartOpen(o); if (!o) { setCartStep("summary"); setPixProofFile(null); } }}>
          <DialogContent className="bg-white border-slate-200 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                {cartStep === "summary" && "Carrinho de Desbloqueios"}
                {cartStep === "qrcode" && "Pagar via Pix — QR Code"}
                {cartStep === "upload" && "Enviar Comprovante"}
                {cartStep === "done" && "Solicitação Enviada!"}
              </DialogTitle>
            </DialogHeader>

            {cartStep === "summary" && (
              <div className="space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum representante no carrinho.</p>
                    <p className="text-xs mt-1">Clique em "+ Carrinho" nos cards para adicionar.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cart.map(c => (
                        <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">{c.name.charAt(0)}</div>
                            <span className="text-sm text-slate-700 font-medium">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">R$29</span>
                            <button onClick={() => removeFromCart(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="font-semibold text-slate-700">{cart.length} representante{cart.length > 1 ? "s" : ""}</span>
                      <span className="text-lg font-bold text-emerald-700">R${cart.length * 29}</span>
                    </div>
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
                      Após o pagamento aprovado, os contatos serão liberados automaticamente.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        onClick={() => handleCheckoutCart()}
                        disabled={createUnlockRequest.isPending}
                      >
                        {createUnlockRequest.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <span className="mr-2 text-base">💳</span>}
                        Pagar com Mercado Pago
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── QR Code Step (30s countdown) ─── */}
            {cartStep === "qrcode" && (
              <div className="space-y-4">
                {/* QR Code visual */}
                <div className="bg-white border-2 border-emerald-200 rounded-xl p-4 text-center">
                  <div className="w-40 h-40 mx-auto mb-3 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                    {/* QR Code SVG gerado via API pública */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126580014BR.GOV.BCB.PIX0136${encodeURIComponent("41999499815")}5204000053039865802BR5924RepMatch6009SAO PAULO62070503***6304`}
                      alt="QR Code Pix"
                      className="w-36 h-36 rounded"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Ou use a chave Pix abaixo:</p>
                  <div className="flex items-center justify-center gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                    <span className="text-base font-bold text-emerald-700">41999499815</span>
                    <button onClick={() => { navigator.clipboard.writeText("41999499815"); toast.success("Chave copiada!"); }} className="text-emerald-500 hover:text-emerald-700 ml-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                  </div>
                  <p className="text-sm font-bold text-emerald-700 mt-2">Valor: R${cart.length * 29}</p>
                </div>
                {/* Countdown */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">{pixCountdown}</div>
                    <span className="text-sm text-amber-700 font-medium">segundos para ir para o upload do comprovante</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${((30 - pixCountdown) / 30) * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-slate-200 text-slate-600"
                  onClick={() => { if (pixCountdownRef.current) clearInterval(pixCountdownRef.current); setCartStep("upload"); }}
                >
                  Já paguei — Enviar comprovante agora
                </Button>
              </div>
            )}

            {/* ─── Upload Comprovante Step ─── */}
            {cartStep === "upload" && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                  <p className="text-xs text-emerald-700">Pagamento via Pix para <strong>41999499815</strong></p>
                  <p className="text-sm font-bold text-emerald-800">Valor: R${cart.length * 29}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 text-sm font-semibold">Comprovante de Pagamento *</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-300 transition-colors" onClick={() => document.getElementById('pix-proof-input')?.click()}>
                    {pixProofFile ? (
                      <div className="flex items-center justify-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{pixProofFile.name}</span>
                      </div>
                    ) : (
                      <div className="text-slate-400">
                        <Upload className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Clique para selecionar o comprovante (JPG, PNG, PDF)</p>
                      </div>
                    )}
                    <input id="pix-proof-input" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setPixProofFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={handlePixProofUpload}
                  disabled={!pixProofFile || pixProofUploading}
                >
                  {pixProofUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Enviar Comprovante
                </Button>
                <p className="text-xs text-slate-400 text-center">Após o envio, o admin irá revisar e liberar os contatos em até 24h.</p>
              </div>
            )}

            {cartStep === "done" && (
              <div className="text-center py-6 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Solicitação Enviada!</h3>
                <p className="text-sm text-slate-500">Seu comprovante foi recebido. O admin irá revisar e liberar os contatos em até 24h.</p>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setCartOpen(false); setCartStep("summary"); }}>
                  Fechar
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Search Tab ──────────────────────────────────────────────────────────────────────────────────── */}
        {activeTab === "search" && (
          <div className="p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 mb-1">Buscar Representantes</h1>
                <p className="text-slate-500 text-sm">
                  Encontre representantes qualificados por região, segmento e disponibilidade. Contatos desbloqueados aparecem com dados completos.
                </p>
              </div>
              {/* Cart button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex-shrink-0 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Carrinho
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{cart.length}</span>
                )}
              </button>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <Select value={searchRegion ?? "all"} onValueChange={v => { setSearchRegion(v === "all" ? undefined : v); setSearchPage(1); }}>
                <SelectTrigger className="w-52 border-slate-200 bg-white"><SelectValue placeholder="Todas as regiões" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as regiões</SelectItem>
                  {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchSegment ?? "all"} onValueChange={v => { setSearchSegment(v === "all" ? undefined : v); setSearchPage(1); }}>
                <SelectTrigger className="w-52 border-slate-200 bg-white"><SelectValue placeholder="Todos os segmentos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os segmentos</SelectItem>
                  {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={searchTier ?? "all"} onValueChange={v => { setSearchTier(v === "all" ? undefined : v as "bronze" | "prata" | "ouro"); setSearchPage(1); }}>
                <SelectTrigger className="w-44 border-slate-200 bg-white"><SelectValue placeholder="Todos os planos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="prata">Prata</SelectItem>
                  <SelectItem value="ouro">Ouro</SelectItem>
                </SelectContent>
              </Select>
              <Select value={searchAvailability ?? "all"} onValueChange={v => { setSearchAvailability(v === "all" ? undefined : v); setSearchPage(1); }}>
                <SelectTrigger className="w-52 border-slate-200 bg-white"><SelectValue placeholder="Qualquer disponibilidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer disponibilidade</SelectItem>
                  <SelectItem value="imediata">🟢 Disponível imediatamente</SelectItem>
                  <SelectItem value="30dias">🟡 Disponível em 30 dias</SelectItem>
                  <SelectItem value="60dias">🟠 Disponível em 60 dias</SelectItem>
                  <SelectItem value="negociavel">⚪ Negociável</SelectItem>
                </SelectContent>
              </Select>
              {(searchRegion || searchSegment || searchTier || searchKycApproved || searchCoreActive || searchAvailability) && (
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600" onClick={() => { setSearchRegion(undefined); setSearchSegment(undefined); setSearchTier(undefined); setSearchKycApproved(false); setSearchCoreActive(false); setSearchAvailability(undefined); setSearchPage(1); }}>
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-5">
              <button onClick={() => { setSearchKycApproved(!searchKycApproved); setSearchPage(1); }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${searchKycApproved ? "bg-emerald-600 text-white border-emerald-500" : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300 hover:text-emerald-600"}`}>
                <Shield className="w-3.5 h-3.5" />Identidade Verificada{searchKycApproved && " ✓"}
              </button>
              <button onClick={() => { setSearchCoreActive(!searchCoreActive); setSearchPage(1); }}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${searchCoreActive ? "bg-amber-600 text-white border-amber-500" : "bg-white text-slate-500 border-slate-200 hover:border-amber-300 hover:text-amber-600"}`}>
                <Award className="w-3.5 h-3.5" />CORE Ativo{searchCoreActive && " ✓"}
              </button>
            </div>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Ordenar por:</span>
                <Select value={searchSortBy} onValueChange={v => { setSearchSortBy(v as "availability" | "rating" | "tier" | "recent"); setSearchPage(1); }}>
                  <SelectTrigger className="w-52 h-8 text-xs border-slate-200 bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="availability">🟢 Mais disponíveis primeiro</SelectItem>
                    <SelectItem value="tier">🏆 Plano (Ouro › Prata › Bronze)</SelectItem>
                    <SelectItem value="rating">⭐ Melhor avaliação</SelectItem>
                    <SelectItem value="recent">🕒 Mais recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!searchLoading && searchData && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span><span className="font-bold text-slate-800">{searchData.total}</span> representantes encontrados</span>
                  {searchData.unlockedIds.length > 0 && (
                    <span className="text-emerald-600 font-medium">· {searchData.unlockedIds.length} contato{searchData.unlockedIds.length > 1 ? "s" : ""} desbloqueado{searchData.unlockedIds.length > 1 ? "s" : ""}</span>
                  )}
                  {availableNowData && availableNowData.count > 0 && (
                    <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">🟢 {availableNowData.count} disponíveis agora</span>
                  )}
                </div>
              )}
            </div>
            {searchLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> Carregando representantes...
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(searchData?.reps ?? []).map((rep) => {
                    const isUnlocked = searchData?.unlockedIds.includes(rep.id);
                    const tierBadge = rep.subscriptionTier === "ouro" ? "bg-amber-100 text-amber-700 border-amber-200" : rep.subscriptionTier === "prata" ? "bg-blue-100 text-blue-700 border-blue-200" : rep.subscriptionTier === "bronze" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-slate-100 text-slate-600 border-slate-200";
                    const tierLabel = rep.subscriptionTier === "ouro" ? "Ouro" : rep.subscriptionTier === "prata" ? "Prata" : rep.subscriptionTier === "bronze" ? "Bronze" : "Pendente";
                    // Before unlock: name, segment, experience, CORE status only
                    // After unlock: full contact (phone, email, linkedin, bio, city, CNPJ)
                    const coreActive = (rep as any).coreStatus === 'active';
                    return (
                      <div key={rep.id} className={`rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${isUnlocked ? "border-emerald-200" : "border-slate-200"}`}>
                        <div className="flex justify-between items-start mb-1">
                          {isUnlocked ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Contato Desbloqueado</Badge>
                          ) : (
                            <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-xs">🔒 Contato bloqueado</Badge>
                          )}
                          <Badge className={`text-xs border ${tierBadge}`}>{tierLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mb-3 mt-2">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 bg-emerald-100 text-emerald-700">
                            {rep.fullName?.charAt(0) ?? "R"}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate text-slate-800">{rep.fullName ?? "Rep. Comercial"}</div>
                            {rep.availability === "imediata" && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs mt-0.5">🟢 Disponível agora</Badge>
                            )}
                          </div>
                        </div>
                        {/* Always visible: segment, experience, CORE status */}
                        <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                          <div className="flex items-center gap-1.5"><Briefcase className="w-3 h-3" />{rep.segment ?? "Geral"}</div>
                          <div className="flex items-center gap-1.5"><Award className="w-3 h-3" />{rep.experienceYears ?? 0} anos de experiência</div>
                          <div className="flex items-center gap-1.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{Number(rep.averageRating ?? 0).toFixed(1)} avaliação</div>
                          <div className="flex items-center gap-1.5">
                            {coreActive
                              ? <><BadgeCheck className="w-3 h-3 text-emerald-600" /><span className="text-emerald-600 font-medium">CORE Ativo</span></>
                              : <><Shield className="w-3 h-3 text-slate-300" /><span className="text-slate-400">Sem CORE</span></>}
                          </div>
                        </div>
                        {/* Contact info — only visible after unlock */}
                        <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                          {isUnlocked ? (
                            <>
                              {(rep as any).nomeFantasia && (
                                <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                                  <span>🏢</span>{(rep as any).nomeFantasia}
                                </div>
                              )}
                              {(rep as any).cnpj && (
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <span>💼</span>CNPJ: {(rep as any).cnpj}
                                </div>
                              )}
                              {((rep as any).cidade || (rep as any).estado) && (
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <MapPin className="w-3 h-3" />{(rep as any).cidade && (rep as any).estado ? `${(rep as any).cidade} - ${(rep as any).estado}` : ((rep as any).cidade ?? (rep as any).estado)}
                                </div>
                              )}
                              {rep.phone && (
                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <span>📞</span>{rep.phone}
                                </div>
                              )}
                              {rep.email && (
                                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                  <span>📧</span>{rep.email}
                                </div>
                              )}
                              {rep.linkedinUrl && (
                                <a href={rep.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 hover:underline">
                                  <Linkedin className="w-3 h-3" />LinkedIn
                                </a>
                              )}
                              {rep.bio && (
                                <div className="text-xs mt-1 text-slate-600 border-t border-slate-100 pt-2">{rep.bio}</div>
                              )}
                            </>
                          ) : (
                            <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-3 text-center">
                              <p className="text-[11px] text-slate-400">🔒 Desbloqueie para ver telefone, e-mail, cidade e bio</p>
                            </div>
                          )}
                        </div>
                        {isUnlocked ? (
                          <Button size="sm" variant="outline" className="w-full mt-3 text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setReviewRepId(rep.id); setReviewRepName(rep.fullName ?? ""); setReviewModalOpen(true); }}>
                            <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> Avaliar Representante
                          </Button>
                        ) : cart.some(c => c.id === rep.id) ? (
                          <Button size="sm" variant="outline" className="w-full mt-3 text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                            onClick={() => removeFromCart(rep.id)}>
                            <ShoppingCart className="w-3 h-3 mr-1" /> No carrinho — remover
                          </Button>
                        ) : (
                          <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            onClick={() => addToCart(rep.id, rep.fullName ?? "Representante")}>
                            <ShoppingCart className="w-3 h-3 mr-1" /> Adicionar ao carrinho — R$29
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {searchData && searchData.total > 20 && (
                  <div className="flex justify-center gap-3 mt-6">
                    <Button variant="outline" size="sm" className="border-slate-200" disabled={searchPage === 1} onClick={() => setSearchPage(p => Math.max(1, p - 1))}>Anterior</Button>
                    <span className="text-sm text-slate-500 flex items-center">Página {searchPage} de {Math.ceil(searchData.total / 20)}</span>
                    <Button variant="outline" size="sm" className="border-slate-200" disabled={searchPage >= Math.ceil(searchData.total / 20)} onClick={() => setSearchPage(p => p + 1)}>Próxima</Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Messages Tab ─────────────────────────────────────────── */}
        {activeTab === "messages" && (
          <DirectChatTab
            companyId={profile.id}
            companyUserId={user?.id ?? 0}
            activeChatRepId={activeChatRepId}
            setActiveChatRepId={setActiveChatRepId}
            activeChatCompanyId={activeChatCompanyId}
            setActiveChatCompanyId={setActiveChatCompanyId}
            directChatInput={directChatInput}
            setDirectChatInput={setDirectChatInput}
          />
        )}

        {/* ─── Profile Tab ─────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Perfil da Empresa</h1>
              <p className="text-slate-500 text-sm mt-1">Informações públicas da sua empresa no RepMatch</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-slate-700">Informações da Empresa</CardTitle>
                    <Button size="sm" variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50"
                      onClick={() => {
                        setProfileEditForm({ companyName: profile.companyName ?? "", cnpj: profile.cnpj ?? "", segment: profile.segment ?? "", region: profile.region ?? "", phone: profile.phone ?? "", description: profile.description ?? "" });
                        setCnpjVerified(false); setCnpjLookup(""); setEditProfileOpen(true);
                      }}>
                      <Pencil className="w-3.5 h-3.5 mr-1" /> Editar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-5 text-sm">
                      {[
                        { label: "Nome da Empresa", value: profile.companyName },
                        { label: "CNPJ", value: profile.cnpj },
                        { label: "Segmento", value: profile.segment },
                        { label: "Região", value: profile.region },
                        { label: "Telefone", value: profile.phone },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">{item.label}</div>
                          <div className="font-medium text-slate-800">{item.value ?? "—"}</div>
                        </div>
                      ))}
                    </div>
                    {profile.description && (
                      <div className="mt-5 pt-4 border-t border-slate-100">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-2">Descrição</div>
                        <p className="text-sm leading-relaxed text-slate-700">{profile.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-5 h-5 text-amber-600" />
                      <h3 className="font-semibold text-slate-800">Destaque suas vagas</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Vagas em destaque aparecem no topo da lista para representantes e recebem 3x mais candidaturas.</p>
                    {(() => {
                      const openJobs = myJobs?.filter(j => j.status === "open") ?? [];
                      if (!myJobs || myJobs.length === 0) return <p className="text-sm text-slate-500 italic">Crie uma vaga primeiro para poder destacá-la.</p>;
                      if (openJobs.length === 0) return <p className="text-sm text-slate-500 italic">Nenhuma vaga aberta no momento.</p>;
                      return (
                        <div className="flex items-center gap-3">
                          <Select value={selectedJobId?.toString() ?? ""} onValueChange={(v) => setSelectedJobId(Number(v))}>
                            <SelectTrigger className="flex-1 border-amber-200 bg-white text-sm"><SelectValue placeholder="Selecione a vaga para destacar..." /></SelectTrigger>
                            <SelectContent>{openJobs.map((j) => <SelectItem key={j.id} value={j.id.toString()}>{j.title}</SelectItem>)}</SelectContent>
                          </Select>
                          <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs whitespace-nowrap" disabled={!selectedJobId}
                            onClick={() => { if (!selectedJobId) return; user && startCheckout("FEATURED_JOB", user.id, user.email ?? "", user.name ?? "", { jobId: selectedJobId }); }}>
                            <Star className="w-3 h-3 mr-1" />Destacar R$49
                          </Button>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-5">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardContent className="p-5">
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-4">Estatísticas</div>
                    <div className="space-y-4">
                      {[
                        { label: "Vagas Ativas", value: myJobs?.filter(j => j.status === "open").length ?? 0, color: "bg-emerald-500" },
                        { label: "Total de Vagas", value: myJobs?.length ?? 0, color: "bg-blue-500" },
                        { label: "Em Destaque", value: myJobs?.filter(j => j.isFeatured).length ?? 0, color: "bg-amber-500" },
                      ].map((stat) => (
                        <div key={stat.label}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-slate-600">{stat.label}</span>
                            <span className="font-bold text-slate-800">{stat.value}</span>
                          </div>
                          <Progress value={stat.value > 0 ? Math.min(100, (stat.value / Math.max(myJobs?.length ?? 1, 1)) * 100) : 0} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-emerald-200 bg-emerald-50 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-slate-800">Ranking</h3>
                    </div>
                    <div className={`text-2xl font-black mb-1 ${rankConfig.color}`}>{rankConfig.label}</div>
                    <p className="text-xs text-slate-500">Contrate mais representantes e publique vagas de qualidade para subir no ranking.</p>
                    <div className="flex items-center gap-3 mt-3">
                      {Object.entries(RANK_CONFIG).map(([key, cfg]) => (
                        <div key={key} className={`flex items-center gap-1 text-xs font-bold ${cfg.color}`}>
                          <Award className="w-3 h-3" />{cfg.label}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ─── Edit Profile Dialog ─────────────────────────────────────── */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="bg-white border-slate-200 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Editar Perfil da Empresa</DialogTitle>
            </DialogHeader>
            <form className="space-y-4 mt-2" onSubmit={(e) => { e.preventDefault(); updateProfileMutation.mutate(profileEditForm); }}>
              <div>
                <Label className="text-slate-700">Nome da empresa</Label>
                <Input value={profileEditForm.companyName} onChange={(e) => setProfileEditForm({ ...profileEditForm, companyName: e.target.value })} className="mt-1 border-slate-200 bg-white" />
              </div>
              <div>
                <Label className="text-slate-700 flex items-center gap-2">
                  CNPJ {cnpjVerified && <span className="flex items-center gap-1 text-xs text-emerald-600"><BadgeCheck className="w-3.5 h-3.5" /> Verificado</span>}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input value={profileEditForm.cnpj} onChange={(e) => { setProfileEditForm({ ...profileEditForm, cnpj: e.target.value }); setCnpjVerified(false); }} placeholder="00.000.000/0001-00" className="border-slate-200 bg-white" />
                  <Button type="button" variant="outline" size="icon" className="shrink-0 border-slate-200"
                    disabled={profileEditForm.cnpj.replace(/\D/g, "").length !== 14 || cnpjQuery.isFetching}
                    onClick={() => setCnpjLookup(profileEditForm.cnpj)}>
                    {cnpjQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
                {cnpjQuery.data && <p className="text-xs text-slate-400 mt-1">{cnpjQuery.data.razaoSocial} · {cnpjQuery.data.situacao} · {cnpjQuery.data.municipio}/{cnpjQuery.data.uf}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-700">Segmento</Label>
                  <Select value={profileEditForm.segment} onValueChange={(v) => setProfileEditForm({ ...profileEditForm, segment: v })}>
                    <SelectTrigger className="mt-1 border-slate-200 bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-slate-700">Região</Label>
                  <Select value={profileEditForm.region} onValueChange={(v) => setProfileEditForm({ ...profileEditForm, region: v })}>
                    <SelectTrigger className="mt-1 border-slate-200 bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-slate-700">Telefone</Label>
                <Input value={profileEditForm.phone} onChange={(e) => setProfileEditForm({ ...profileEditForm, phone: e.target.value })} placeholder="(11) 3000-0000" className="mt-1 border-slate-200 bg-white" />
              </div>
              <div>
                <Label className="text-slate-700">Descrição</Label>
                <Textarea value={profileEditForm.description} onChange={(e) => setProfileEditForm({ ...profileEditForm, description: e.target.value })} rows={3} className="mt-1 border-slate-200 bg-white" />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : "Salvar alterações"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>

      {/* ─── Modal de Avaliação ─────────────────────────────────────────── */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Avaliar {reviewRepName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-700 text-sm font-medium">Nota (1 a 5 estrelas)</Label>
              <div className="flex gap-2 mt-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} className="focus:outline-none">
                    <Star className={`w-8 h-8 transition-colors ${n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-slate-700 text-sm font-medium">Comentário (opcional)</Label>
              <Textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Descreva sua experiência com este representante..."
                rows={3}
                maxLength={500}
                className="mt-1 border-slate-200 bg-white"
              />
              <p className="text-xs text-slate-400 mt-1">{reviewComment.length}/500 caracteres</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-slate-200" onClick={() => setReviewModalOpen(false)}>Cancelar</Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                disabled={submitReview.isPending || !reviewRepId}
                onClick={() => reviewRepId && submitReview.mutate({ representativeId: reviewRepId, rating: reviewRating, comment: reviewComment || undefined })}
              >
                {submitReview.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</> : "Enviar Avaliação"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
