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
  ShoppingCart, Trash2, Upload, X as XIcon, QrCode, BookUser, Phone, Mail, ExternalLink, Menu, Lock, Instagram, CreditCard
} from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import * as XLSX from "xlsx";
import { CONTACT_UNLOCK_PRICE } from "@shared/const";
import { getLeadPackagePrice } from "@shared/leadPackages";
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
  starter:    { label: "Empresa",      color: "bg-slate-100 text-slate-600" },
  pro:        { label: "Empresa",      color: "bg-emerald-100 text-emerald-700" },
  enterprise: { label: "Empresa",      color: "bg-emerald-100 text-emerald-700" },
  free:       { label: "Empresa",      color: "bg-slate-100 text-slate-600" },
};

const STATUS_CONFIG = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  viewed: { label: "Visualizado", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Eye },
  accepted: { label: "Aceito", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Recusado", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  hired: { label: "Contratado", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Star },
};

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

function brazilianPhoneNumber(phone: string | null | undefined) {
  let digits = (phone ?? "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  if (digits.startsWith("0") && (digits.length === 11 || digits.length === 12)) digits = digits.slice(1);
  return digits.length === 10 || digits.length === 11 ? digits : null;
}

function safeSpreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function LeadDirectContactActions({ phone, companyName }: { phone: string | null; companyName: string }) {
  const number = brazilianPhoneNumber(phone);
  if (!number) return null;
  const message = `Olá! Encontrei a ${companyName} na RepMatch e gostaria de conversar sobre uma oportunidade comercial.`;
  const whatsappUrl = `https://wa.me/55${number}?text=${encodeURIComponent(message)}`;
  return <div className="mt-3 grid grid-cols-2 gap-2"><a href={`tel:+55${number}`} aria-label={`Ligar para ${companyName}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-200 bg-white px-3 text-sm font-bold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"><Phone className="mr-2 h-4 w-4" />Ligar</a><a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label={`Conversar no WhatsApp com ${companyName}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"><MessageSquare className="mr-2 h-4 w-4" />WhatsApp</a></div>;
}

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
    <div className="flex h-full flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:gap-6 lg:p-8">
      {/* Conversation List */}
      <div className="w-full shrink-0 lg:w-72">
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
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "applications" | "profile" | "search" | "marketB2B" | "marketB2C" | "leadPackages" | "savedLeads" | "messages" | "contacts">(() => {
    const tab = new URLSearchParams(location.split("?")[1] ?? "").get("tab");
    return tab === "leadPackages" || tab === "savedLeads" ? tab : "overview";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const leadBuyerProfileRecoveryStarted = useRef(false);
  const [activeChatRepId, setActiveChatRepId] = useState<number | null>(null);
  const [activeChatCompanyId, setActiveChatCompanyId] = useState<number | null>(null);
  const [marketSearch, setMarketSearch] = useState("");
  const [marketPackageSegment, setMarketPackageSegment] = useState("");
  const [openedLeadPackageId, setOpenedLeadPackageId] = useState<number | null>(null);
  const [openedLeadPackageSegment, setOpenedLeadPackageSegment] = useState("");
  const [openedLeadPackageOffset, setOpenedLeadPackageOffset] = useState(0);
  const [marketPixData, setMarketPixData] = useState<{ qrCode: string; qrCodeBase64: string; label: string; price: number } | null>(null);
  const [marketPixLoading, setMarketPixLoading] = useState(false);
  const [marketPixSeconds, setMarketPixSeconds] = useState(60);
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
  const [cartStep, setCartStep] = useState<"summary" | "pix_form" | "pix_qr">("summary");
  const [pixCountdown, setPixCountdown] = useState(300); // 5 min
  const pixCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cpfInput, setCpfInput] = useState("");
  const [pixData, setPixData] = useState<{ paymentId: number; qrCode: string; qrCodeBase64: string } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Query para pedidos de desbloqueio pendentes
  const { data: myUnlockRequests } = trpc.unlockRequests.myRequests.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchInterval: 15_000,
  });
  const pendingUnlockRequests = (myUnlockRequests ?? []).filter(
    r => r.status === "pending_payment" || r.status === "pending_approval"
  );

  const createUnlockRequest = trpc.unlockRequests.create.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const trackPurchaseInterest = trpc.representativeInterest.trackPurchaseClick.useMutation();

  const addToCart = (repId: number, repName: string, source: "search" | "top_match" = "search") => {
    const previewName = repName.trim() || "Representante Comercial";
    if (cart.some(c => c.id === repId)) { toast.info("Já está no carrinho"); return; }
    setCart(prev => [...prev, { id: repId, name: previewName }]);
    trackPurchaseInterest.mutate({ representativeId: repId, source });
    toast.success(`${previewName} adicionado ao carrinho`);
  };
  const removeFromCart = (repId: number) => setCart(prev => prev.filter(c => c.id !== repId));

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
  const { data: pricing } = trpc.pricing.contactUnlockPrice.useQuery();
  const contactUnlockPrice = pricing?.price ?? CONTACT_UNLOCK_PRICE;
  const contactUnlockPriceLabel = contactUnlockPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Toast de boas-vindas — dispara uma vez por sessão quando o perfil carrega
  useEffect(() => {
    if (profile && !sessionStorage.getItem("company_welcome_shown")) {
      sessionStorage.setItem("company_welcome_shown", "1");
      const firstName = user?.name?.split(" ")[0] ?? "Empresa";
      toast.success(`Bem-vindo de volta, ${firstName}! 👋`, {
        description: "Seu painel está pronto. Encontre os melhores representantes!",
        duration: 4000,
      });
    }
  }, [profile, user?.name]);

  // ─── Promoção: 1 contato grátis ──────────────────────────────────────────────
  const { data: freeUnlockStatus, refetch: refetchFreeUnlockStatus } = trpc.contacts.freeUnlockStatus.useQuery(undefined, {
    staleTime: 60_000,
  });
  const freeUnlockMutation = trpc.contacts.freeUnlock.useMutation({
    onSuccess: (result: { success: boolean; alreadyUnlocked?: boolean; wasFree?: boolean }) => {
      if (result.wasFree) {
        toast.success("🎁 Contato desbloqueado gratuitamente! Aproveite.");
      } else {
        toast.success("Contato desbloqueado!");
      }
      refetchFreeUnlockStatus();
      utils.representatives.listForCompany.invalidate();
      utils.representatives.autoMatch.invalidate();
      utils.contacts.myUnlockedContacts.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });
  const { data: jobApplications, isLoading: appsLoading } = trpc.candidaturas.byJob.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );
  const { data: topMatches } = trpc.jobs.topMatches.useQuery(
    { jobId: selectedJobId! },
    { enabled: !!selectedJobId }
  );
  const searchInput = useMemo(() => ({
    region: searchRegion,
    segment: searchSegment,
    tier: searchTier,
    page: searchPage,
    limit: 20,
    kycApproved: searchKycApproved || undefined,
    coreActive: searchCoreActive || undefined,
    availability: searchAvailability,
    sortBy: searchSortBy,
  }), [searchRegion, searchSegment, searchTier, searchPage, searchKycApproved, searchCoreActive, searchAvailability, searchSortBy]);

  const { data: searchData, isLoading: searchLoading } = trpc.representatives.listForCompany.useQuery(
    searchInput,
    { enabled: activeTab === "search", staleTime: 30_000, retry: 1 }
  );

  // ─── Meus Contatos (desbloqueados) ─────────────────────────────────────────────
  const { data: myContacts, isLoading: contactsLoading } = trpc.contacts.myUnlockedContacts.useQuery(undefined, {
    enabled: activeTab === "contacts",
    staleTime: 60_000,
  });
  const marketTabActive = activeTab === "marketB2B" || activeTab === "marketB2C";
  const marketAudience = activeTab === "marketB2C" ? "b2c" : "b2b";
  const { data: marketCatalog } = trpc.leadPackages.catalog.useQuery(undefined, { enabled: marketTabActive });
  const createMarketLeadOrder = trpc.leadPackages.createOrder.useMutation({ onError: (error) => toast.error(error.message) });
  const createMarketUnlimited = trpc.leadPackages.createUnlimitedAccess.useMutation({ onError: (error) => toast.error(error.message) });
  const { data: marketAccess } = trpc.leadPackages.myUnlimitedAccess.useQuery(undefined, { enabled: marketTabActive, refetchInterval: 20_000 });
  const { data: marketRequest } = trpc.leadPackages.myUnlimitedRequest.useQuery(undefined, { enabled: marketTabActive, refetchInterval: 15_000 });
  const { data: myLeadPackages, isLoading: myLeadPackagesLoading } = trpc.leadPackages.myOrders.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const openedLeadPackageInput = useMemo(() => ({
    orderId: openedLeadPackageId ?? 0,
    segment: openedLeadPackageSegment || undefined,
    offset: openedLeadPackageOffset,
    limit: 50,
  }), [openedLeadPackageId, openedLeadPackageSegment, openedLeadPackageOffset]);
  const { data: openedLeadPackageResults, isFetching: openedLeadPackageLoading } = trpc.leadPackages.searchReleasedPackage.useQuery(openedLeadPackageInput, { enabled: activeTab === "leadPackages" && !!openedLeadPackageId });
  const { data: marketResults, isFetching: marketLoading } = trpc.leadPackages.searchUnlimitedCatalog.useQuery(
    { audience: marketAudience, query: marketSearch || undefined, limit: 50 },
    { enabled: marketTabActive && !!marketAccess },
  );

  useEffect(() => {
    if (!marketPixData) return;
    const countdown = window.setInterval(() => {
      setMarketPixSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(countdown);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [marketPixData]);

  const startMarketPackagePix = async (quantity: 1000 | 2000) => {
    if (!user) { navigate("/register?purchase=leads&returnTo=/dashboard/company"); return; }
    const cnpjDigits = profile?.cnpj?.replace(/\D/g, "") ?? "";
    if (cnpjDigits.length !== 14) {
      toast.error("Complete o CNPJ no Perfil da Empresa para gerar o PIX empresarial.");
      setActiveTab("profile");
      return;
    }
    setMarketPixLoading(true);
    try {
      const order = await createMarketLeadOrder.mutateAsync({
        audience: marketAudience,
        quantity,
        segment: marketPackageSegment || undefined,
        region: "Nacional",
        legalConsent: true,
      });
      const response = await fetch("/api/mp/lead-package-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          userId: user.id,
          userEmail: user.email ?? "",
          userName: user.name ?? profile?.companyName ?? "Cliente RepMatch",
          documentType: "CNPJ",
          document: cnpjDigits,
        }),
      });
      const pix = await response.json();
      if (!response.ok || !pix.qrCode || !pix.qrCodeBase64) throw new Error(pix.error ?? "Não foi possível gerar o QR Code PIX.");
      setMarketPixSeconds(60);
      setMarketPixData({ qrCode: pix.qrCode, qrCodeBase64: pix.qrCodeBase64, label: `${quantity.toLocaleString("pt-BR")} empresas ${marketAudience.toUpperCase()}`, price: Number(order.price) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o pagamento PIX.");
    } finally {
      setMarketPixLoading(false);
    }
  };

  const startMarketUnlimitedPix = async () => {
    if (!user) { navigate("/register?purchase=leads&returnTo=/dashboard/company"); return; }
    const cnpjDigits = profile?.cnpj?.replace(/\D/g, "") ?? "";
    if (cnpjDigits.length !== 14) { toast.error("Complete o CNPJ no Perfil da Empresa para gerar o PIX empresarial."); setActiveTab("profile"); return; }
    setMarketPixLoading(true);
    try {
      const access = await createMarketUnlimited.mutateAsync();
      const response = await fetch("/api/mp/market-search-unlimited-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessId: access.accessId, userId: user.id, userEmail: user.email ?? "", userName: user.name ?? profile?.companyName ?? "Cliente RepMatch", documentType: "CNPJ", document: cnpjDigits }),
      });
      const pix = await response.json();
      if (!response.ok || !pix.qrCode || !pix.qrCodeBase64) throw new Error(pix.error ?? "Não foi possível gerar o QR Code PIX.");
      setMarketPixSeconds(60);
      setMarketPixData({ qrCode: pix.qrCode, qrCodeBase64: pix.qrCodeBase64, label: "Plano Pesquisa Ilimitada · 30 dias", price: Number(access.price) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o pagamento PIX.");
    } finally {
      setMarketPixLoading(false);
    }
  };

  const openMarketCardCheckout = async (kind: "lead_package" | "market_search_unlimited", resourceId: number) => {
    try {
      const response = await fetch("/api/mp/checkout-pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, resourceId }) });
      const data = await response.json();
      if (!response.ok || !data.initPoint) throw new Error(data.error ?? "Não foi possível abrir o checkout.");
      toast.info("Escolha PIX ou cartão de crédito no Mercado Pago.");
      window.open(data.initPoint, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir checkout por cartão.");
    }
  };

  const startMarketPackageCardCheckout = async (quantity: 1000 | 2000) => {
    if (!user) { navigate("/register?purchase=leads&returnTo=/dashboard/company"); return; }
    const order = await createMarketLeadOrder.mutateAsync({ audience: marketAudience, quantity, segment: marketPackageSegment || undefined, region: "Nacional", legalConsent: true });
    await openMarketCardCheckout("lead_package", order.orderId);
  };

  const startMarketMonthlyCardCheckout = async () => {
    if (!user) { navigate("/register?purchase=leads&returnTo=/dashboard/company"); return; }
    const access = await createMarketUnlimited.mutateAsync();
    await openMarketCardCheckout("market_search_unlimited", access.accessId);
  };


  const downloadSavedLeadSpreadsheet = async () => {
    const { rows } = await downloadSavedMarketLeads.mutateAsync();
    if (!rows.length) { toast.info("Sua lista ainda não possui leads para exportar."); return; }
    const spreadsheetRows = rows.map((row) => ({
      "Razão social": safeSpreadsheetCell(row.razaoSocial), "Nome fantasia": safeSpreadsheetCell(row.nomeFantasia),
      "CNPJ": safeSpreadsheetCell(row.cnpj), "CNAE / ramo": safeSpreadsheetCell(row.cnaeDescricao),
      "Segmento": safeSpreadsheetCell(row.segmento), "Porte": safeSpreadsheetCell(row.porte),
      "Data de abertura": safeSpreadsheetCell(row.dataAbertura), "Cidade": safeSpreadsheetCell(row.cidade),
      "Estado": safeSpreadsheetCell(row.estado), "CEP": safeSpreadsheetCell(row.cep),
      "Endereço": safeSpreadsheetCell(row.endereco), "Telefone": safeSpreadsheetCell(row.telefone),
      "E-mail": safeSpreadsheetCell(row.email), "Site": safeSpreadsheetCell(row.site), "Instagram": safeSpreadsheetCell(row.instagram),
    }));
    const worksheet = XLSX.utils.json_to_sheet(spreadsheetRows);
    worksheet["!cols"] = [24, 24, 16, 34, 22, 14, 18, 20, 10, 12, 42, 18, 32, 32, 28].map((wch) => ({ wch }));
    worksheet["!autofilter"] = { ref: `A1:O${spreadsheetRows.length + 1}` };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Minha Lista de Leads");
    XLSX.writeFile(workbook, "repmatch-minha-lista-de-leads.xlsx", { compression: true });
    toast.success(`${rows.length.toLocaleString("pt-BR")} leads foram exportados em Excel.`);
  };

  // ─── Auto-Match: ativa quando não há filtros manuais ativos ───────────────────
  const hasManualFilters = !!(searchRegion || searchSegment || searchTier || searchKycApproved || searchCoreActive || searchAvailability);
  const autoMatchInput = useMemo(() => ({ page: searchPage, limit: 20 }), [searchPage]);
  const { data: autoMatchData, isLoading: autoMatchLoading } = trpc.representatives.autoMatch.useQuery(
    autoMatchInput,
    { enabled: activeTab === "search" && !hasManualFilters, staleTime: 60_000, retry: 1 }
  );

  // Decide qual fonte de dados usar: autoMatch (sem filtros) ou busca manual (com filtros)
  const activeSearchData = hasManualFilters ? searchData : (autoMatchData ?? searchData);
  // Quando não há filtros manuais, só depende do autoMatch (não bloquear pelo searchLoading lento)
  const activeSearchLoading = hasManualFilters ? searchLoading : autoMatchLoading;
  const { data: availableNowData } = trpc.representatives.countAvailableNow.useQuery(undefined, { staleTime: 60_000 });

  const utils = trpc.useUtils();
  const { data: representativeMonthlyAccess, refetch: refetchRepresentativeMonthlyAccess } = trpc.representativeMonthly.myAccess.useQuery(undefined, { enabled: activeTab === "search", refetchInterval: 20_000 });
  const { data: representativeMonthlyRequest, refetch: refetchRepresentativeMonthlyRequest } = trpc.representativeMonthly.myRequest.useQuery(undefined, { enabled: activeTab === "search", refetchInterval: 20_000 });
  const createRepresentativeMonthlyAccess = trpc.representativeMonthly.createAccess.useMutation({ onError: (error) => toast.error(error.message) });
  const unlockWithRepresentativeMonthlyPlan = trpc.representativeMonthly.unlockRepresentative.useMutation({
    onSuccess: (result) => {
      toast.success(result.alreadyUnlocked ? "Este representante já estava liberado." : `Contato desbloqueado. Restam ${result.remaining} créditos no plano.`);
      refetchRepresentativeMonthlyAccess();
      utils.representatives.listForCompany.invalidate();
      utils.representatives.autoMatch.invalidate();
      utils.contacts.myUnlockedContacts.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const openRepresentativeMonthlyCheckout = async (accessId: number) => {
    try {
      const response = await fetch("/api/mp/checkout-pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "representative_monthly", resourceId: accessId }) });
      const data = await response.json();
      if (!response.ok || !data.initPoint) throw new Error(data.error ?? "Não foi possível abrir o checkout.");
      toast.info("Escolha PIX ou cartão de crédito no Mercado Pago.");
      window.open(data.initPoint, "_blank", "noopener,noreferrer");
      refetchRepresentativeMonthlyRequest();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir checkout.");
    }
  };
  const startRepresentativeMonthlyCheckout = async () => {
    const request = await createRepresentativeMonthlyAccess.mutateAsync();
    await openRepresentativeMonthlyCheckout(request.accessId);
  };
  const ensureLeadBuyerProfile = trpc.companies.ensureLeadBuyerProfile.useMutation({
    onSuccess: () => utils.companies.myProfile.invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const { data: leadCredits } = trpc.leadPackages.getLeadCredits.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: savedMarketLeads, isLoading: savedMarketLeadsLoading } = trpc.leadPackages.mySavedLeads.useQuery(undefined, { enabled: activeTab === "savedLeads" || activeTab === "leadPackages" });
  const saveMarketLead = trpc.leadPackages.saveLeadFromPackage.useMutation({
    onSuccess: (result) => {
      utils.leadPackages.getLeadCredits.invalidate();
      utils.leadPackages.mySavedLeads.invalidate();
      utils.leadPackages.searchReleasedPackage.invalidate();
      toast.success(result.alreadySaved ? "Este lead já está na sua lista." : `Lead salvo. Restam ${result.remaining.toLocaleString("pt-BR")} créditos.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const downloadSavedMarketLeads = trpc.leadPackages.downloadSavedLeads.useMutation({ onError: (error) => toast.error(error.message) });

  useEffect(() => {
    if (!profileLoading && !profile && !myLeadPackagesLoading && (myLeadPackages?.length ?? 0) > 0 && !leadBuyerProfileRecoveryStarted.current) {
      leadBuyerProfileRecoveryStarted.current = true;
      ensureLeadBuyerProfile.mutate();
    }
  }, [profileLoading, profile, myLeadPackagesLoading, myLeadPackages, ensureLeadBuyerProfile]);

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
    const unlockStatus = params.get("unlock");

    if (unlockStatus === "success") {
      // Retorno do Checkout Pro de desbloqueio em lote
      const requestIdParam = params.get("requestId");
      setActiveTab("search");
      utils.representatives.listForCompany.invalidate();
      utils.unlockRequests.myRequests.invalidate();
      if (requestIdParam) {
        const reqId = Number(requestIdParam);
        setTimeout(async () => {
          try {
            const reqs = await utils.unlockRequests.myRequests.fetch();
            const req = (reqs as any[])?.find((r: any) => r.id === reqId);
            if (req && req.inactiveCount && req.inactiveCount > 0) {
              const n = req.inactiveCount;
              toast.warning(
                `${n} representante${n > 1 ? "s" : ""} não ${n > 1 ? "foram desbloqueados" : "foi desbloqueado"} pois o CNPJ está inativo na Receita Federal. Os demais foram liberados normalmente.`,
                { duration: 8000 }
              );
            } else {
              toast.success("Pagamento confirmado! Contatos desbloqueados com sucesso.");
            }
          } catch {
            toast.success("Pagamento confirmado! Contatos desbloqueados com sucesso.");
          }
        }, 2000);
      } else {
        toast.success("Pagamento confirmado! Contatos desbloqueados com sucesso.");
      }
      window.history.replaceState({}, "", window.location.pathname);
    } else if (paymentStatus === "success") {
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
    } else if (paymentStatus === "cancelled" || unlockStatus === "failed") {
      toast.info("Pagamento cancelado.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profileLoading && !profile && !myLeadPackagesLoading && (myLeadPackages?.length ?? 0) === 0) {
      // Se o perfil da empresa não existe, enviar para onboarding com type=company
      // O parâmetro ?type=company evita o loop pois o Onboarding não redireciona de volta quando há URL param
      navigate("/onboarding?type=company");
    }
  }, [profileLoading, profile, myLeadPackagesLoading, myLeadPackages, navigate]);

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

  if (profileLoading || (!profile && (myLeadPackagesLoading || ensureLeadBuyerProfile.isPending))) {
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
  const releasedLeadPackageCount = (myLeadPackages ?? []).filter(order => ["approved", "delivered"].includes(order.status)).length;

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
    { id: "marketB2B", label: "Buscar B2B", icon: Building2 },
    { id: "marketB2C", label: "Buscar B2C", icon: Users },
    { id: "leadPackages", label: "Pacotes de Leads", icon: ShoppingCart },
    { id: "savedLeads", label: "Minha Lista de Leads", icon: BookUser },
    { id: "contacts", label: "Meus Contatos", icon: BookUser },
    { id: "messages", label: "Mensagens", icon: MessageSquare },
    { id: "profile", label: "Perfil da Empresa", icon: Building2 },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 lg:flex">
      {mobileMenuOpen && (
        <button type="button" aria-label="Fechar menu" className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-2.5rem))] flex-col border-r border-slate-100 bg-white shadow-2xl transition-transform duration-200 lg:static lg:w-64 lg:translate-x-0 lg:shadow-sm ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Logo + profile */}
        <div className="p-5 border-b border-slate-100">
          <div className="mb-5 flex items-center justify-between gap-3">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
            <button type="button" aria-label="Fechar menu" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileMenuOpen(false)}><XIcon className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              {profile.companyName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate text-slate-800">{profile.companyName}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tierConfig.color}`}>{tierConfig.label}</span>
                <span className={`text-[10px] font-bold ${rankConfig.color}`}>{rankConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as typeof activeTab); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <item.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === item.id ? "text-white" : ""}`} />
              <span className="truncate">{item.label}</span>
              {item.id === "search" && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === item.id ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                }`}>173k+</span>
              )}
              {item.id === "leadPackages" && releasedLeadPackageCount > 0 && (
                <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === item.id ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                }`}>{releasedLeadPackageCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-1">
          <ThemeToggleCompact />
          {user?.role === "admin" && (
            <Button
              size="sm" variant="ghost"
              className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 justify-start"
              onClick={() => navigate("/admin")}
            >
              <span className="mr-2">🔑</span>Painel Admin
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-50 justify-start"
            onClick={() => { logout(); navigate("/"); }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>

      {/* ─── Main ────────────────────────────────────────────────────────── */}
      <main className="min-w-0 flex-1 overflow-auto">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:hidden">
          <button type="button" aria-label="Abrir menu" aria-expanded={mobileMenuOpen} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm" onClick={() => setMobileMenuOpen(true)}><Menu className="h-5 w-5" /></button>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">Painel da Empresa</p><p className="truncate text-xs text-slate-500">{navItems.find((item) => item.id === activeTab)?.label}</p></div>
        </header>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800">Visão Geral</h1>
              <p className="text-slate-500 text-sm mt-1">Acompanhe o desempenho das suas vagas e candidaturas</p>
            </div>

            {/* ─── Aviso de pagamento pendente (aprovação) ─── */}
            {pendingUnlockRequests.some(r => r.status === "pending_approval") && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-800">⏳ Pagamento confirmado — liberando contatos automaticamente</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    O pagamento foi identificado. O administrador irá liberar seus contatos pelo painel em breve.
                  </p>
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

          {/* Welcome Banner */}
          <div className="px-4 pt-4 pb-0 sm:px-6 sm:pt-6 lg:px-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {(user?.name ?? "U").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">Bem-vindo de volta</p>
                <h2 className="text-lg font-bold text-slate-900">Olá, {user?.name?.split(" ")[0] ?? "Empresa"}! 👋</h2>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-xs text-slate-400">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}</p>
                <p className="text-xs font-semibold text-blue-600 mt-0.5">Painel da Empresa</p>
              </div>
            </div>
          </div>

        {/* ─── Jobs Tab ─────────────────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div className="p-4 sm:p-6 lg:p-8">
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
          <div className="p-4 sm:p-6 lg:p-8">
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
                  <SelectTrigger className="w-full border-slate-200 bg-white sm:ml-auto sm:w-64">
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
                            onClick={() => {
                              addToCart(rep.id, String(rep.fullName ?? "").trim() || "Representante Comercial", "top_match");
                              setCartOpen(true);
                            }}>
                            <ShoppingCart className="w-3 h-3 mr-1" /> Adicionar ao carrinho — {contactUnlockPriceLabel}
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
        <Dialog open={cartOpen} onOpenChange={(o) => {
          setCartOpen(o);
          if (!o) {
            setCartStep("summary");
            setPixData(null);
            setCpfInput("");
            setPixCountdown(300);
            if (pixCountdownRef.current) clearInterval(pixCountdownRef.current);
          }
        }}>
          <DialogContent className="bg-white border-slate-200 max-w-md shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-slate-800 flex items-center gap-2 text-base font-bold">
                {cartStep === "summary" && <><ShoppingCart className="w-5 h-5 text-emerald-600" /> Carrinho de Desbloqueios</>}
                {cartStep === "pix_form" && <><QrCode className="w-5 h-5 text-emerald-600" /> Pagar via PIX</>}
                {cartStep === "pix_qr" && <><QrCode className="w-5 h-5 text-emerald-600" /> QR Code PIX</>}
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
                      {cart.map(c => {
                        const cartName = c.name.trim() || "Representante Comercial";
                        return (
                          <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                            <div className="min-w-0 flex items-center gap-2">
                              <div className="w-7 h-7 shrink-0 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">{cartName.charAt(0)}</div>
                              <span className="truncate text-sm font-medium text-slate-700">{cartName}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-slate-500">{contactUnlockPriceLabel}</span>
                              <button onClick={() => removeFromCart(c.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                      <span className="font-semibold text-slate-700">{cart.length} perfil{cart.length > 1 ? "is" : ""} selecionado{cart.length > 1 ? "s" : ""}</span>
                      <span className="text-lg font-bold text-emerald-700">{(cart.length * contactUnlockPrice).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                    </div>
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 leading-relaxed">
                      Você libera telefone, e-mail, cidade e apresentação profissional de cada perfil. Após a confirmação do Mercado Pago, os contatos são liberados automaticamente na sua conta.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2" onClick={() => setCartStep("pix_form")} disabled={createUnlockRequest.isPending || checkoutLoading}><QrCode className="w-4 h-4" />Gerar QR Code PIX</Button>
                      <Button variant="outline" className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold flex items-center justify-center gap-2" disabled={createUnlockRequest.isPending || checkoutLoading} onClick={async () => { try { setCheckoutLoading(true); const request = await createUnlockRequest.mutateAsync({ repIds: cart.map((item) => item.id), paymentMethod: "stripe" }); const response = await fetch("/api/mp/checkout-pro", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "unlock_batch", resourceId: request.requestId }) }); const data = await response.json(); if (!response.ok || !data.initPoint) throw new Error(data.error ?? "Não foi possível abrir o checkout."); toast.info("Escolha cartão ou PIX no Mercado Pago."); window.open(data.initPoint, "_blank", "noopener,noreferrer"); } catch (error) { toast.error(error instanceof Error ? error.message : "Erro ao abrir checkout."); } finally { setCheckoutLoading(false); } }}><CreditCard className="w-4 h-4" />Pagar com cartão</Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─── PIX Form Step (CPF) ─── */}
            {cartStep === "pix_form" && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
                  Para gerar o QR Code PIX, precisamos do seu CPF (exigência do Banco Central para pagamentos instantâneos).
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">CPF do pagador</label>
                  <input
                    type="text"
                    value={cpfInput}
                    onChange={e => {
                      const d = e.target.value.replace(/\D/g, "").slice(0, 11);
                      const fmt = d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                        .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
                        .replace(/(\d{3})(\d{3})/, "$1.$2")
                        .replace(/(\d{3})/, "$1");
                      setCpfInput(fmt);
                    }}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
                    maxLength={14}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-slate-200" onClick={() => setCartStep("summary")}>Voltar</Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={async () => {
                      const rawCpf = cpfInput.replace(/\D/g, "");
                      if (rawCpf.length !== 11) { toast.error("Informe um CPF válido com 11 dígitos"); return; }
                      setCheckoutLoading(true);
                      try {
                        const res = await createUnlockRequest.mutateAsync({ repIds: cart.map(c => c.id), paymentMethod: "pix" });
                        if (!res) return;
                        const pixRes = await fetch("/api/mp/unlock-pix", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            requestId: res.requestId,
                            repIds: cart.map(c => c.id),
                            userId: user?.id,
                            userEmail: user?.email ?? "",
                            userName: user?.name ?? "",
                            cpf: rawCpf,
                          }),
                        });
                        const pixJson = await pixRes.json();
                        if (!pixRes.ok) throw new Error(pixJson.error ?? "Erro ao gerar PIX");
                        setPixData({ paymentId: pixJson.paymentId, qrCode: pixJson.qrCode, qrCodeBase64: pixJson.qrCodeBase64 });
                        setPixCountdown(300);
                        if (pixCountdownRef.current) clearInterval(pixCountdownRef.current);
                        pixCountdownRef.current = setInterval(() => {
                          setPixCountdown(c => {
                            if (c <= 1) { clearInterval(pixCountdownRef.current!); return 0; }
                            return c - 1;
                          });
                        }, 1000);
                        setCartStep("pix_qr");
                      } catch (e: any) {
                        toast.error(e.message ?? "Erro ao gerar PIX");
                      } finally {
                        setCheckoutLoading(false);
                      }
                    }}
                    disabled={checkoutLoading || cpfInput.replace(/\D/g, "").length !== 11}
                  >
                    {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
                    Gerar QR Code
                  </Button>
                </div>
              </div>
            )}

            {/* ─── PIX QR Code Step ─── */}
            {cartStep === "pix_qr" && pixData && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-black font-mono ${pixCountdown < 60 ? "text-red-500" : "text-emerald-600"}`}>
                    {String(Math.floor(pixCountdown / 60)).padStart(2, "0")}:{String(pixCountdown % 60).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-slate-400">tempo restante para pagar</div>
                </div>
                {pixData.qrCodeBase64 && (
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-xl border-2 border-emerald-200 shadow-sm">
                      <img
                        src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                  </div>
                )}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">PIX Copia e Cola</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-xs text-slate-600 truncate">{pixData.qrCode?.slice(0, 40)}...</div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.qrCode);
                        setPixCopied(true);
                        toast.success("Código PIX copiado!");
                        setTimeout(() => setPixCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex-shrink-0"
                    >
                      {pixCopied ? <CheckCircle className="w-3.5 h-3.5" /> : <QrCode className="w-3.5 h-3.5" />}
                      {pixCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
                <div className="text-xs text-center text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  Após a confirmação do Mercado Pago, seu pedido ficará visível para o administrador liberar os contatos manualmente.
                </div>
                <Button variant="outline" className="w-full border-slate-200" onClick={() => {
                  setCartOpen(false);
                  setCartStep("summary");
                  setPixData(null);
                  setCart([]);
                  if (pixCountdownRef.current) clearInterval(pixCountdownRef.current);
                  utils.unlockRequests.myRequests.invalidate();
                  toast.success("Pagamento enviado. Aguarde a confirmação e a liberação do administrador.");
                }}>Fechar — já paguei</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ─── Search Tab ──────────────────────────────────────────────────────────────────────────────────── */}
        {activeTab === "search" && (
          <div className="p-4 sm:p-6 lg:p-8">
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
            {/* Banner de promoção: 1 contato grátis */}
            {freeUnlockStatus?.available && (
              <div className="mb-5 flex items-center gap-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl px-5 py-4 shadow-md">
                <div className="text-3xl">🎁</div>
                <div className="flex-1">
                  <p className="font-bold text-base leading-tight">Você tem 1 desbloqueio gratuito!</p>
                  <p className="text-emerald-100 text-sm mt-0.5">Escolha qualquer representante e clique em <strong>"Desbloquear grátis"</strong> para ver o contato completo sem pagar nada.</p>
                </div>
                <div className="shrink-0 bg-white/20 rounded-xl px-3 py-1.5 text-sm font-semibold">Grátis</div>
              </div>
            )}
            {freeUnlockStatus?.used && (
              <div className="mb-5 flex items-center gap-3 bg-slate-50 border border-slate-200 text-slate-600 rounded-2xl px-5 py-3">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm">Você já usou seu desbloqueio gratuito. Para ver mais contatos, desbloqueie por <strong>{contactUnlockPriceLabel} cada</strong>.</p>
              </div>
            )}
            <section className="mb-5 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-xs font-extrabold uppercase tracking-[.13em] text-violet-700">Plano mensal para recrutamento</p><h2 className="mt-1 text-xl font-black text-slate-900">100 representantes por 30 dias</h2><p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Desbloqueie até 100 perfis no mês por R$ 599. O carrinho e os contatos avulsos continuam disponíveis quando preferir pagar só pelo que usar.</p></div>
                <div className="shrink-0 sm:text-right"><p className="text-2xl font-black text-violet-800">R$ 599<span className="text-xs font-semibold text-slate-500">/mês</span></p>{representativeMonthlyAccess?.access ? <p className="mt-1 text-xs font-bold text-violet-700">{representativeMonthlyAccess.remaining} de {representativeMonthlyAccess.access.unlockLimit} desbloqueios restantes</p> : representativeMonthlyRequest?.status === "pending_approval" ? <p className="mt-1 text-xs font-bold text-amber-700">Pagamento em análise</p> : null}</div>
              </div>
              {!representativeMonthlyAccess?.access && <Button onClick={representativeMonthlyRequest?.status === "pending_payment" ? () => openRepresentativeMonthlyCheckout(representativeMonthlyRequest.id) : startRepresentativeMonthlyCheckout} disabled={createRepresentativeMonthlyAccess.isPending} className="mt-4 min-h-11 bg-violet-700 text-white hover:bg-violet-800"><CreditCard className="mr-2 h-4 w-4" />{representativeMonthlyRequest?.status === "pending_payment" ? "Concluir com PIX ou cartão" : representativeMonthlyRequest?.status === "pending_approval" ? "Pagamento em análise" : "Assinar plano mensal"}</Button>}
              {representativeMonthlyAccess?.access && <p className="mt-4 text-xs text-slate-500">Plano ativo até {representativeMonthlyAccess.access.expiresAt ? new Date(representativeMonthlyAccess.access.expiresAt).toLocaleDateString("pt-BR") : "o fim da vigência"}. Use o botão “Desbloquear com plano” nos perfis.</p>}
            </section>

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

            </div>
            {/* Banner de Auto-Match */}
            {!hasManualFilters && autoMatchData?.autoMatchActive && (
              <div className="mb-5 flex items-start gap-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-base flex-shrink-0 shadow-sm">
                  🤖
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-violet-800">🤖 Match Automático Ativo</p>
                  <p className="text-xs text-violet-600 mt-0.5">{autoMatchData.matchReason}</p>
                  {autoMatchData.compatibleSegments && autoMatchData.compatibleSegments.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {autoMatchData.compatibleSegments.slice(0, 4).map((seg: string) => (
                        <span key={seg} className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{seg}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  className="text-[10px] text-violet-500 hover:text-violet-700 underline flex-shrink-0 mt-1"
                  onClick={() => { setSearchRegion(profile.region ?? undefined); setSearchPage(1); }}
                >Filtrar manualmente</button>
              </div>
            )}

            {activeSearchLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" /> {!hasManualFilters ? "Calculando matches..." : "Carregando representantes..."}
              </div>
            ) : (
              <>
                {(activeSearchData as any)?.isFallback && searchSegment && (
                  <div className="mb-4 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                    <span className="text-base">⚠️</span>
                    <span>Não encontramos representantes em <strong>{searchSegment}</strong>. Exibindo representantes de outros segmentos que podem te atender.</span>
                  </div>
                )}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(activeSearchData?.reps ?? []).map((rep) => {
                    const isUnlocked = activeSearchData?.unlockedIds.includes(rep.id as never);
                    const autoMatchScore = (rep as any).autoMatchScore as number | undefined;
                    const tierBadge = rep.subscriptionTier === "ouro" ? "bg-amber-100 text-amber-700 border-amber-200" : rep.subscriptionTier === "prata" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-orange-100 text-orange-700 border-orange-200";
                    const tierLabel = rep.subscriptionTier === "ouro" ? "🏆 Ouro" : rep.subscriptionTier === "prata" ? "🥈 Prata" : "🥉 Bronze";
                    const coreActive = (rep as any).coreStatus === 'active';
                    // Avatar color based on name initial
                    const avatarColors = [
                      "from-emerald-400 to-emerald-600",
                      "from-blue-400 to-blue-600",
                      "from-violet-400 to-violet-600",
                      "from-amber-400 to-amber-600",
                      "from-rose-400 to-rose-600",
                      "from-cyan-400 to-cyan-600",
                    ];
                    const previewName = String(rep.fullName ?? (rep as any).nomeFantasia ?? "").trim() || "Representante Comercial";
                    const previewInitial = previewName.charAt(0).toUpperCase() || "R";
                    const avatarColor = avatarColors[(previewName.charCodeAt(0) || 0) % avatarColors.length];
                    const yearsExperience = Number(rep.experienceYears ?? 0);
                    const segmentLabel = rep.segment && rep.segment !== "Outros" ? rep.segment : "Atuação comercial diversa";
                    const showAutoMatch = autoMatchScore !== undefined && autoMatchScore >= 50;
                    const availabilityLabels: Record<string, string> = { imediata: "Disponível agora", "30dias": "Disponível em até 30 dias", "60dias": "Disponível em até 60 dias", negociavel: "Disponibilidade negociável" };
                    const workModelLabels: Record<string, string> = { exclusivo: "Atuação exclusiva", multiplas: "Multimarcas", indifferente: "Modelo flexível" };
                    const availabilityLabel = availabilityLabels[rep.availability ?? "negociavel"] ?? "Disponibilidade a combinar";
                    const workModelLabel = workModelLabels[rep.workModel ?? "multiplas"] ?? "Modelo comercial flexível";
                    const publicCnae = String((rep as any).cnaeDescricao ?? "").trim();
                    const rawBusinessSize = String((rep as any).porte ?? "").trim();
                    const businessSize = (rep as any).isMei ? "MEI" : rawBusinessSize;
                    const openedYear = String((rep as any).dataAbertura ?? "").match(/\d{4}/)?.[0] ?? null;
                    const publicProfileFacts = [
                      { label: "Segmento", value: segmentLabel, icon: "💼" },
                      ...(publicCnae ? [{ label: "Atividade principal", value: publicCnae, icon: "◈" }] : []),
                      ...(businessSize ? [{ label: "Porte", value: businessSize, icon: "▦" }] : []),
                      ...(openedYear ? [{ label: "Atuação desde", value: openedYear, icon: "◷" }] : []),
                    ].slice(0, 4);
                    return (
                      <div key={rep.id} className={`rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 ${isUnlocked ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200"}`}>
                        {/* Card header strip */}
                        <div className={`h-1.5 w-full ${isUnlocked ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-slate-200 to-slate-300"}`} />
                        <div className="p-5">
                          {/* Top row: avatar + name + status badges */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0 bg-gradient-to-br ${avatarColor} text-white shadow-sm`}>
                              {previewInitial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-800">{previewName}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {isUnlocked ? (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    <CheckCircle className="w-2.5 h-2.5" />Desbloqueado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    🔒 Contato protegido
                                  </span>
                                )}
                                {rep.availability === "imediata" && (
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                                    🟢 Disponível
                                  </span>
                                )}
                                {showAutoMatch && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    autoMatchScore >= 70 ? "bg-violet-100 text-violet-700 border-violet-200" :
                                    autoMatchScore >= 40 ? "bg-amber-50 text-amber-600 border-amber-200" :
                                    "bg-slate-50 text-slate-500 border-slate-200"
                                  }`}>
                                    🤖 {autoMatchScore}% match
                                  </span>
                                )}
                              </div>
                            </div>
                            {rep.subscriptionTier !== "free" && <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border flex-shrink-0 ${tierBadge}`}>{tierLabel}</span>}
                          </div>

                          {/* Destaques reais do perfil */}
                          <div className="mb-4 grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Experiência</p>
                              <p className="mt-0.5 text-sm font-bold text-slate-800">{yearsExperience > 0 ? `${yearsExperience}+ anos` : "Perfil comercial"}</p>
                            </div>
                            <div className={`rounded-xl border p-2.5 ${coreActive || (rep as any).situacaoCadastral === "Ativa" ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
                              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Situação</p>
                              <p className={`mt-0.5 text-sm font-bold ${coreActive || (rep as any).situacaoCadastral === "Ativa" ? "text-emerald-700" : "text-slate-700"}`}>{coreActive ? "CORE ativo" : (rep as any).situacaoCadastral === "Ativa" ? "Cadastro ativo" : "Em análise"}</p>
                            </div>
                          </div>

                          {!isUnlocked && (
                            <div className="mb-4 overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white">
                              <div className="flex items-center justify-between border-b border-emerald-100 px-3 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Dados públicos do perfil</p>
                                <span className="text-[10px] font-medium text-emerald-600">Informações verificadas</span>
                              </div>
                              <div className="grid grid-cols-2 gap-px bg-emerald-100">
                                {publicProfileFacts.map((fact) => (
                                  <div key={fact.label} className="min-w-0 bg-white px-3 py-2.5">
                                    <p className="text-[10px] font-medium text-slate-400">{fact.icon} {fact.label}</p>
                                    <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-snug text-slate-700">{fact.value}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1.5 px-3 py-2.5">
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm">{availabilityLabel}</span>
                                <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-600 shadow-sm">{workModelLabel}</span>
                                {rep.portfolioSize && <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-emerald-700 shadow-sm">Carteira: {rep.portfolioSize}</span>}
                              </div>
                            </div>
                          )}

                          {/* Contact info — only visible after unlock */}
                          <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3">
                            {isUnlocked ? (
                              <>
                                {(rep as any).nomeFantasia && (
                                  <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                                    <span>🏢</span><span className="truncate">{(rep as any).nomeFantasia}</span>
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
                                  <div className="text-xs mt-1 text-slate-600 border-t border-slate-100 pt-2 line-clamp-2">{rep.bio}</div>
                                )}
                              </>
                            ) : (
                              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/40 p-3">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5 rounded-lg bg-emerald-100 p-1.5 text-emerald-700"><Lock className="h-3.5 w-3.5" /></div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-emerald-800">Fale direto com este perfil</p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-700">Desbloqueie telefone, e-mail, cidade e apresentação profissional em um único pagamento.</p>
                                  </div>
                                  <span className="shrink-0 text-xs font-bold text-emerald-700">{contactUnlockPriceLabel}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action button */}
                          {isUnlocked ? (
                            <Button size="sm" variant="outline" className="w-full mt-4 text-xs border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => { setReviewRepId(rep.id); setReviewRepName(rep.fullName ?? ""); setReviewModalOpen(true); }}>
                              <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" /> Avaliar Representante
                            </Button>
                          ) : representativeMonthlyAccess?.access ? (
                            <Button size="sm" className="w-full mt-4 bg-violet-700 hover:bg-violet-800 text-white text-xs font-semibold" disabled={unlockWithRepresentativeMonthlyPlan.isPending || representativeMonthlyAccess.remaining === 0}
                              onClick={() => unlockWithRepresentativeMonthlyPlan.mutate({ representativeId: rep.id })}>
                              {unlockWithRepresentativeMonthlyPlan.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}{representativeMonthlyAccess.remaining === 0 ? "Limite mensal atingido" : `Desbloquear com plano · ${representativeMonthlyAccess.remaining} restantes`}
                            </Button>
                          ) : cart.some(c => c.id === rep.id) ? (
                            <Button size="sm" variant="outline" className="w-full mt-4 text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                              onClick={() => removeFromCart(rep.id)}>
                              <ShoppingCart className="w-3 h-3 mr-1" /> No carrinho — remover
                            </Button>
                          ) : freeUnlockStatus?.available ? (
                            <div className="mt-4 flex flex-col gap-2">
                              <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-sm"
                                disabled={freeUnlockMutation.isPending}
                                onClick={() => freeUnlockMutation.mutate({ representativeId: rep.id })}>
                                {freeUnlockMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <span className="mr-1">🎁</span>}
                                Desbloquear grátis
                              </Button>
                              <Button size="sm" variant="outline" className="w-full text-xs border-slate-200 text-slate-500"
                                onClick={() => addToCart(rep.id, previewName)}>
                                <ShoppingCart className="w-3 h-3 mr-1" /> Desbloquear contato — {contactUnlockPriceLabel}
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                              onClick={() => addToCart(rep.id, previewName)}>
                              <ShoppingCart className="w-3 h-3 mr-1" /> Desbloquear contato — {contactUnlockPriceLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {activeSearchData && activeSearchData.total > 20 && (
                  <div className="flex justify-center gap-3 mt-6">
                    <Button variant="outline" size="sm" className="border-slate-200" disabled={searchPage === 1} onClick={() => setSearchPage(p => Math.max(1, p - 1))}>Anterior</Button>
                    <span className="text-sm text-slate-500 flex items-center">Página {searchPage} de {Math.ceil(activeSearchData.total / 20)}</span>
                    <Button variant="outline" size="sm" className="border-slate-200" disabled={searchPage >= Math.ceil(activeSearchData.total / 20)} onClick={() => setSearchPage(p => p + 1)}>Próxima</Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── Catálogo B2B/B2C ─────────────────────────────────────── */}
        {marketTabActive && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">Prospecção para o seu time comercial</p><h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Buscar empresas {marketAudience.toUpperCase()}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Encontre empresas para seu vendedor prospectar, trabalhar no RepMatch ou importar no CRM. O acesso é liberado pelo Plano Pesquisa Ilimitada.</p></div>
            {!marketAccess ? (
              marketRequest?.status === "pending_payment" ? (
                <Card className="border-amber-200 bg-amber-50/60 shadow-sm">
                  <CardContent className="p-6 text-center sm:p-8">
                    <Clock className="mx-auto h-10 w-10 text-amber-600" />
                    <p className="mt-4 text-xs font-extrabold uppercase tracking-[.14em] text-amber-700">Solicitação guardada no seu carrinho</p>
                    <h2 className="mt-2 text-xl font-black text-slate-900">Aguardando pagamento PIX</h2>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Seu Plano Pesquisa Ilimitada de R$ {Number(marketRequest.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} está reservado. Retome o pagamento para gerar ou copiar o QR Code.</p>
                    <Button onClick={() => navigate("/pacotes-leads?retomar=ilimitado")} className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700"><QrCode className="mr-2 h-4 w-4" />Retomar pagamento PIX</Button>
                  </CardContent>
                </Card>
              ) : marketRequest?.status === "pending_approval" ? (
                <Card className="border-blue-200 bg-blue-50/60 shadow-sm">
                  <CardContent className="p-6 text-center sm:p-8">
                    <CheckCircle className="mx-auto h-10 w-10 text-blue-600" />
                    <p className="mt-4 text-xs font-extrabold uppercase tracking-[.14em] text-blue-700">PIX confirmado</p>
                    <h2 className="mt-2 text-xl font-black text-slate-900">Aguardando sua liberação</h2>
                    <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Recebemos seu pagamento. A equipe está conferindo a solicitação e ativará as pesquisas ilimitadas por 30 dias.</p>
                    <Button variant="outline" onClick={() => navigate("/pacotes-leads")} className="mt-5 border-blue-300 text-blue-700 hover:bg-blue-100">Acompanhar solicitação</Button>
                  </CardContent>
                </Card>
              ) : (
                <section className="space-y-5">
                  <Card className="border-emerald-200 bg-white shadow-sm">
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><Target className="h-5 w-5" /></div><div><p className="text-xs font-extrabold uppercase tracking-[.13em] text-emerald-700">Escolha seu público</p><h2 className="mt-1 text-xl font-black text-slate-900">Pacotes para prospecção {marketAudience.toUpperCase()}</h2><p className="mt-1 text-sm text-slate-600">Selecione um segmento e escolha o tamanho do seu lote. Você segue direto para o carrinho e QR Code PIX.</p></div></div>
                      <label className="mt-5 block text-sm font-bold text-slate-700">Segmento que deseja prospectar
                        <select value={marketPackageSegment} onChange={(event) => setMarketPackageSegment(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                          <option value="">Todos os segmentos</option>{SEGMENTS.map((item) => <option key={item} value={item}>{item}</option>)}
                        </select>
                      </label>
                    </CardContent>
                  </Card>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {([1000, 2000] as const).map((quantity) => {
                      const configuredPrice = marketCatalog?.[marketAudience]?.price ?? (marketAudience === "b2b" ? 179 : 149);
                      const price = getLeadPackagePrice(marketAudience, configuredPrice, quantity);
                      return <Card key={quantity} className={`overflow-hidden border shadow-sm ${quantity === 2000 ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200"}`}><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><Badge className={quantity === 2000 ? "bg-emerald-600 text-white hover:bg-emerald-600" : "bg-slate-100 text-slate-700 hover:bg-slate-100"}>{quantity === 2000 ? "Mais escolhido" : "Comece agora"}</Badge><Users className="h-5 w-5 text-emerald-600" /></div><h3 className="mt-4 text-2xl font-black text-slate-900">{quantity.toLocaleString("pt-BR")}</h3><p className="text-sm text-slate-600">empresas {marketAudience.toUpperCase()} para seu time prospectar</p><p className="mt-5 text-3xl font-black text-emerald-700">{price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p><p className="mt-1 text-xs text-slate-500">CNPJ, segmento, região e contatos empresariais quando disponíveis.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><Button onClick={() => startMarketPackagePix(quantity)} disabled={marketPixLoading} className="min-h-12 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60">{marketPixLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}Gerar PIX agora</Button><Button variant="outline" onClick={() => startMarketPackageCardCheckout(quantity)} disabled={marketPixLoading} className="min-h-12 border-emerald-300 text-emerald-800 hover:bg-emerald-50"><CreditCard className="mr-2 h-4 w-4" />Cartão</Button></div></CardContent></Card>;
                    })}
                    <Card className="overflow-hidden border-emerald-300 bg-gradient-to-br from-emerald-950 to-emerald-800 text-white shadow-sm"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><Badge className="bg-emerald-300 text-emerald-950 hover:bg-emerald-300">Melhor para equipes</Badge><Crown className="h-5 w-5 text-emerald-200" /></div><h3 className="mt-4 text-2xl font-black">Ilimitado</h3><p className="text-sm text-emerald-100">Pesquise quantas empresas quiser durante 30 dias.</p><p className="mt-5 text-3xl font-black">{(marketCatalog?.unlimitedMonthly?.price ?? 599).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}<span className="text-sm font-semibold text-emerald-100">/mês</span></p><p className="mt-1 text-xs text-emerald-100">Filtros, contatos disponíveis e exportação para seu CRM.</p><div className="mt-5 grid gap-2 sm:grid-cols-2"><Button onClick={startMarketUnlimitedPix} disabled={marketPixLoading} className="min-h-12 border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50 disabled:opacity-60">{marketPixLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}PIX</Button><Button onClick={startMarketMonthlyCardCheckout} disabled={marketPixLoading} className="min-h-12 bg-emerald-300 text-emerald-950 hover:bg-emerald-200"><CreditCard className="mr-2 h-4 w-4" />Cartão</Button></div></CardContent></Card>
                  </div>
                  <Card className="border-dashed border-emerald-300 bg-emerald-50/50 shadow-none"><CardContent className="p-5"><div className="flex items-start gap-3"><Eye className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" /><div><p className="font-black text-slate-900">Veja como seu lote chega</p><p className="mt-1 text-sm text-slate-600">A amostra abaixo mostra os campos organizados para importar no CRM. Dados individuais só são liberados depois da confirmação do PIX.</p></div></div><div className="mt-4 overflow-hidden rounded-xl border border-emerald-100 bg-white"><div className="grid grid-cols-3 gap-2 border-b border-emerald-100 bg-emerald-100/60 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-emerald-900"><span>Empresa</span><span>Localização</span><span>Contato</span></div><div className="grid grid-cols-3 gap-2 px-3 py-3 text-xs text-slate-600"><span className="truncate">Empresa {marketAudience.toUpperCase()} •••</span><span className="truncate">Cidade · UF</span><span className="truncate">Telefone/e-mail*</span></div></div><p className="mt-3 text-xs text-slate-500">Inclui CNPJ, razão social, segmento/CNAE, porte, endereço, cidade/UF e, quando disponível, telefone, e-mail, site e Instagram empresarial.</p></CardContent></Card>
                  <Dialog open={!!marketPixData} onOpenChange={(open) => { if (!open) setMarketPixData(null); }}>
                    <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-3xl p-5 sm:p-6">
                      <DialogHeader><DialogTitle className="text-xl font-black">{marketPixSeconds > 0 ? "PIX do pacote gerado" : "Pedido solicitado, verificando o PIX"}</DialogTitle></DialogHeader>
                      {marketPixData && <div className="text-center">
                        <p className="mt-1 text-sm text-slate-600">{marketPixData.label} · {marketPixData.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                        {marketPixSeconds > 0 ? <>
                          <div className="mt-4 inline-flex items-center rounded-full bg-amber-50 px-4 py-2 text-sm font-extrabold text-amber-800"><Clock className="mr-2 h-4 w-4" />Pague em {String(Math.floor(marketPixSeconds / 60)).padStart(2, "0")}:{String(marketPixSeconds % 60).padStart(2, "0")}</div>
                          <div className="mx-auto mt-4 w-fit rounded-2xl border-2 border-emerald-200 bg-white p-3"><img src={`data:image/png;base64,${marketPixData.qrCodeBase64}`} alt="QR Code PIX do pacote" className="h-56 w-56" /></div>
                          <p className="mt-4 font-bold text-emerald-700">Escaneie ou copie o código PIX</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-500">Após o pagamento, o pedido fica disponível para aprovação e liberação administrativa.</p>
                          <Button onClick={() => navigator.clipboard.writeText(marketPixData.qrCode).then(() => toast.success("Código PIX copiado"))} className="mt-5 min-h-12 w-full bg-emerald-600 text-white hover:bg-emerald-700"><QrCode className="mr-2 h-4 w-4" />Copiar código PIX</Button>
                        </> : <>
                          <div className="mx-auto mt-5 grid h-28 w-28 place-items-center rounded-full bg-amber-50 text-amber-700"><Clock className="h-12 w-12" /></div>
                          <p className="mt-5 font-bold text-slate-900">Pedido solicitado, verificando o PIX.</p>
                          <p className="mt-2 text-sm leading-relaxed text-slate-600">O QR Code expirou após um minuto. Seu pedido continua salvo e entrará em liberação assim que o pagamento for confirmado.</p>
                          <Button variant="outline" onClick={() => setMarketPixData(null)} className="mt-5 min-h-12 w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">Fechar e gerar novo QR se necessário</Button>
                        </>}
                      </div>}
                    </DialogContent>
                  </Dialog>
                </section>
              )
            ) : <>
              <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={marketSearch} onChange={(event) => setMarketSearch(event.target.value)} className="min-h-12 pl-10" placeholder="Buscar por empresa, cidade, CNAE ou segmento" /></div>
                <Badge className="h-10 justify-center rounded-xl bg-emerald-100 px-4 text-emerald-800 hover:bg-emerald-100">Acesso ativo até {marketAccess.expiresAt ? new Date(marketAccess.expiresAt).toLocaleDateString("pt-BR") : ""}</Badge>
              </div>
              {marketLoading ? <div className="py-16 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" /></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{!marketResults?.length ? <p className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Nenhuma empresa encontrada com estes filtros.</p> : marketResults.map((company) => <Card key={company.id} className="border-slate-200 bg-white"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-slate-900">{company.nomeFantasia || company.razaoSocial}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{company.cnaeDescricao || company.segmento || "Empresa comercial"}</p></div><Badge className="shrink-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{company.porte || "Empresa"}</Badge></div><div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600"><p>{company.cidade || "Cidade não informada"}{company.estado ? ` · ${company.estado}` : ""}</p><p className="truncate">{company.telefone || "Telefone não informado"}</p><p className="truncate">{company.email || "E-mail não informado"}</p></div></CardContent></Card>)}</div>}
            </>}
          </div>
        )}

        {/* ─── Pacotes de Leads liberados ───────────────────────────────── */}
        {activeTab === "leadPackages" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">Área do comprador</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Pacotes de Leads</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Aqui ficam os seus pacotes liberados. Baixe o CSV organizado para importar no CRM ou trabalhe os dados com o seu time comercial.</p>
            </div>

            {releasedLeadPackageCount === 0 ? (
              <Card className="border-dashed border-emerald-300 bg-white shadow-sm">
                <CardContent className="p-7 text-center sm:p-10">
                  <ShoppingCart className="mx-auto h-10 w-10 text-emerald-600" />
                  <h2 className="mt-4 text-xl font-black text-slate-900">Nenhum pacote liberado ainda</h2>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">Depois que o Mercado Pago confirmar o pagamento, o pacote aparece aqui automaticamente para você escolher os leads.</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button onClick={() => setActiveTab("marketB2B")} className="bg-emerald-600 text-white hover:bg-emerald-700"><Building2 className="mr-2 h-4 w-4" />Buscar B2B</Button>
                    <Button variant="outline" onClick={() => setActiveTab("marketB2C")} className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"><Users className="mr-2 h-4 w-4" />Buscar B2C</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {(myLeadPackages ?? []).filter(order => ["approved", "delivered"].includes(order.status)).map((order) => (
                  <Card key={order.id} className="overflow-hidden border-emerald-200 bg-white shadow-sm">
                    <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-extrabold text-emerald-800">Pacote liberado</span>
                            <span className="text-xs font-semibold text-slate-500">Pedido #{order.id}</span>
                          </div>
                          <h2 className="mt-3 text-xl font-black text-slate-900">{order.quantity.toLocaleString("pt-BR")} empresas {order.audience.toUpperCase()} para prospecção</h2>
                          <p className="mt-1 text-sm text-slate-600">{order.segment || "Todos os segmentos"} · {order.region || "Cobertura nacional"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button onClick={() => { setOpenedLeadPackageId(order.id); setOpenedLeadPackageSegment(order.segment ?? ""); setOpenedLeadPackageOffset(0); }} className="min-h-12 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"><Search className="mr-2 h-4 w-4" />Escolher leads do pacote</Button>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:grid-cols-3">
                        <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Empresas</p><p className="mt-1 text-sm font-bold text-slate-800">{order.quantity.toLocaleString("pt-BR")} registros organizados</p></div>
                        <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Campos incluídos</p><p className="mt-1 text-sm font-bold text-slate-800">CNPJ, segmento, cidade e porte</p></div>
                        <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Contatos empresariais</p><p className="mt-1 text-sm font-bold text-slate-800">Telefone e e-mail quando disponíveis</p></div>
                      </div>
                      {openedLeadPackageId === order.id && (
                        <div className="mt-5 rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-extrabold uppercase tracking-[.12em] text-emerald-700">Buscar dentro do seu pacote</p>
                              <p className="mt-1 text-sm text-slate-600">Escolha o segmento. A pesquisa traz até {order.quantity.toLocaleString("pt-BR")} empresas do seu lote, com os dados empresariais disponíveis.</p>
                            </div>
                            <label className="block text-sm font-bold text-slate-700">Segmento
                              <select value={openedLeadPackageSegment} onChange={(event) => { setOpenedLeadPackageSegment(event.target.value); setOpenedLeadPackageOffset(0); }} className="mt-1 min-h-11 w-full min-w-52 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-emerald-500 sm:w-60">
                                <option value="">Todos os segmentos</option>
                                {SEGMENTS.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
                              </select>
                            </label>
                          </div>
                          {openedLeadPackageLoading ? <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-600" /></div> : openedLeadPackageResults ? <>
                            <div className="mt-4 grid gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm sm:grid-cols-2"><span className="font-bold text-emerald-900">{openedLeadPackageResults.total.toLocaleString("pt-BR")} leads encontrados</span><span className="text-emerald-800">Limite deste pacote: {order.quantity.toLocaleString("pt-BR")}</span><span className="font-bold text-emerald-900">Saldo acumulado: {leadCredits?.remaining?.toLocaleString("pt-BR") ?? 0} crédito{(leadCredits?.remaining ?? 0) !== 1 ? "s" : ""}</span><span className="text-emerald-800">Usados: {leadCredits?.used?.toLocaleString("pt-BR") ?? 0} de {leadCredits?.total?.toLocaleString("pt-BR") ?? 0}</span></div>
                            {(leadCredits?.remaining ?? 0) === 0 && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><strong>Créditos esgotados.</strong> Você já salvou todos os leads contratados. Compre outro pacote para somar novos créditos.</div>}
                            {openedLeadPackageResults.total === 0 ? <p className="mt-4 text-sm text-slate-600">Nenhum lead disponível com este segmento e região. Escolha outro segmento ou todos os segmentos.</p> : <><div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-[1180px] w-full text-left text-xs"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-3 font-bold">Empresa</th><th className="px-3 py-3 font-bold">Ramo e porte</th><th className="px-3 py-3 font-bold">Localização</th><th className="px-3 py-3 font-bold">Contato e presença</th><th className="px-3 py-3 font-bold">Sua lista</th></tr></thead><tbody className="divide-y divide-slate-100">{openedLeadPackageResults.rows.map((lead) => { const alreadySaved = openedLeadPackageResults.savedLeadIds.includes(lead.id); return <tr key={lead.id}><td className="px-3 py-3 font-semibold text-slate-800">{lead.nomeFantasia || lead.razaoSocial}<span className="mt-0.5 block font-normal text-slate-500">{lead.razaoSocial}{lead.cnpj ? ` · ${lead.cnpj}` : ""}</span></td><td className="px-3 py-3 text-slate-600">{lead.segmento || lead.cnaeDescricao || "Não informado"}<span className="mt-0.5 block">CNAE: {lead.cnaeDescricao || "Não informado"}</span><span className="mt-0.5 block">Porte: {lead.porte || "Não informado"}</span><span className="mt-0.5 block">Abertura: {lead.dataAbertura || "Não informada"}</span><span className="mt-0.5 block">Funcionários: não informado pela fonte</span></td><td className="px-3 py-3 text-slate-600">{lead.cidade || "Cidade não informada"}{lead.estado ? ` · ${lead.estado}` : ""}<span className="mt-0.5 block">{lead.endereco || "Endereço não informado"}</span><span className="mt-0.5 block">CEP: {lead.cep || "Não informado"}</span></td><td className="px-3 py-3 text-slate-600">{lead.telefone || "Telefone não informado"}<span className="mt-0.5 block">{lead.email || "E-mail não informado"}</span><span className="mt-0.5 block">{lead.site || "Site não informado"}</span><span className="mt-0.5 block">{lead.instagram || "Instagram não informado"}</span></td><td className="px-3 py-3"><Button size="sm" disabled={alreadySaved || saveMarketLead.isPending || (leadCredits?.remaining ?? 0) === 0} onClick={() => saveMarketLead.mutate({ orderId: order.id, marketLeadId: lead.id })} className={alreadySaved ? "bg-slate-100 text-slate-600 hover:bg-slate-100" : "bg-emerald-600 text-white hover:bg-emerald-700"}>{alreadySaved ? <><CheckCircle className="mr-1 h-3.5 w-3.5" />Salvo</> : <><Plus className="mr-1 h-3.5 w-3.5" />Adicionar</>}</Button></td></tr>})}</tbody></table></div><div className="mt-3 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Mostrando {openedLeadPackageResults.offset + 1}–{openedLeadPackageResults.offset + openedLeadPackageResults.rows.length} de {openedLeadPackageResults.total.toLocaleString("pt-BR")} registros. Adicione somente os que interessam à sua lista.</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={openedLeadPackageResults.offset === 0} onClick={() => setOpenedLeadPackageOffset((offset) => Math.max(0, offset - 50))}>Anterior</Button><Button size="sm" variant="outline" disabled={!openedLeadPackageResults.hasMore} onClick={() => setOpenedLeadPackageOffset((offset) => offset + 50)}>Próximos 50</Button></div></div></>}
                          </> : null}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Minha Lista de Leads ─────────────────────────────────────── */}
        {activeTab === "savedLeads" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-emerald-700">Sua base selecionada</p>
              <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Minha Lista de Leads</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Aqui ficam os leads que você escolheu nos seus pacotes. Eles permanecem disponíveis na sua conta e podem ser exportados para o CRM quando quiser.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-emerald-100"><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Salvos</p><p className="mt-1 text-xl font-black text-slate-900">{leadCredits?.used?.toLocaleString("pt-BR") ?? 0}</p></div>
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-emerald-100"><p className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700">Créditos restantes</p><p className="mt-1 text-xl font-black text-slate-900">{leadCredits?.remaining?.toLocaleString("pt-BR") ?? 0}</p></div>
                <Button onClick={downloadSavedLeadSpreadsheet} disabled={!savedMarketLeads?.length || downloadSavedMarketLeads.isPending} className="min-h-12 self-center bg-emerald-600 text-white hover:bg-emerald-700"><ExternalLink className="mr-2 h-4 w-4" />Baixar lista em Excel</Button>
              </div>
            </div>
            {savedMarketLeadsLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div> : !savedMarketLeads?.length ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><BookUser className="mx-auto h-10 w-10 text-emerald-500" /><h2 className="mt-4 text-xl font-black text-slate-800">Sua lista ainda está vazia</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Abra um pacote liberado, pesquise por segmento e adicione apenas os leads que interessam ao seu time.</p><Button onClick={() => setActiveTab("leadPackages")} className="mt-5 bg-emerald-600 text-white hover:bg-emerald-700"><ShoppingCart className="mr-2 h-4 w-4" />Ver pacotes liberados</Button></div> : <div className="grid gap-4 md:grid-cols-2">
              {savedMarketLeads.map((lead) => <Card key={lead.savedId} className="border-emerald-100 shadow-sm"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-black text-slate-900">{lead.nomeFantasia || lead.razaoSocial}</h2><p className="mt-1 text-sm text-slate-500">{lead.razaoSocial}</p></div><Badge className="bg-emerald-100 text-emerald-800">Salvo</Badge></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Cadastro</p><p className="mt-1 font-semibold text-slate-800">CNPJ: {lead.cnpj}</p><p className="mt-1 text-slate-600">Porte: {lead.porte || "Não informado"}</p><p className="mt-1 text-slate-600">Abertura: {lead.dataAbertura || "Não informada"}</p><p className="mt-1 text-slate-600">Funcionários: não informado pela fonte</p></div><div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Segmento e localização</p><p className="mt-1 font-semibold text-slate-800">{lead.segmento || lead.cnaeDescricao || "Não informado"}</p><p className="mt-1 text-slate-600">{lead.cidade || "Cidade não informada"}{lead.estado ? ` · ${lead.estado}` : ""}</p><p className="mt-1 text-slate-600">{lead.endereco || "Endereço não informado"}</p><p className="mt-1 text-slate-600">CEP: {lead.cep || "Não informado"}</p></div><div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Contato</p><p className="mt-1 font-semibold text-slate-800">{lead.telefone || "Telefone não informado"}</p><p className="mt-1 break-all text-slate-600">{lead.email || "E-mail não informado"}</p><LeadDirectContactActions phone={lead.telefone} companyName={lead.nomeFantasia || lead.razaoSocial} /></div><div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Presença digital</p><p className="mt-1 break-all text-slate-600">{lead.site || "Site não informado"}</p><p className="mt-1 break-all text-slate-600">{lead.instagram || "Instagram não informado"}</p></div></div></CardContent></Card>)}
            </div>}
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

        {/* ─── Meus Contatos Tab ─────────────────────────────────────────────── */}
        {activeTab === "contacts" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Meus Contatos</h1>
              <p className="text-slate-500 text-sm mt-1">Representantes cujos dados de contato você desbloqueou</p>
            </div>
            {contactsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
            ) : !myContacts || myContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4"><BookUser className="w-8 h-8 text-emerald-400" /></div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhum contato desbloqueado ainda</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-5">Acesse a aba <strong>Buscar Representantes</strong> e desbloqueie os contatos dos representantes que te interessam.</p>
                <Button onClick={() => setActiveTab("search")} className="bg-emerald-600 hover:bg-emerald-700 text-white"><Search className="w-4 h-4 mr-2" />Buscar Representantes</Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4"><span className="text-sm text-slate-500">{myContacts.length} contato{myContacts.length !== 1 ? "s" : ""} desbloqueado{myContacts.length !== 1 ? "s" : ""}</span></div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myContacts.map((c) => (
                    <div key={c.representativeId} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                          {c.avatarUrl ? <img src={c.avatarUrl} alt={c.fullName ?? ""} className="w-full h-full object-cover" /> : <span className="text-white font-black text-lg">{(c.fullName ?? "?").charAt(0).toUpperCase()}</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{c.fullName ?? "Representante comercial"}</div>
                          <div className="text-xs text-slate-500 line-clamp-2">{c.cnaeDescricao ?? c.segment ?? "Atuação comercial"}</div>
                          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Contato desbloqueado</span>
                        </div>
                      </div>
                      <div className="space-y-3 border-t border-slate-100 pt-3">
                        <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">Contato direto</h4>
                          <div className="space-y-2">
                            {c.phone ? <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-emerald-600"><Phone className="h-4 w-4 shrink-0 text-emerald-600" /><span className="truncate">{c.phone}</span></a> : <div className="flex items-center gap-2 text-sm text-slate-400"><Phone className="h-4 w-4 shrink-0" /><span>Telefone não informado</span></div>}
                            {c.email ? <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm font-medium text-slate-800 hover:text-emerald-600"><Mail className="h-4 w-4 shrink-0 text-emerald-600" /><span className="truncate">{c.email}</span></a> : <div className="flex items-center gap-2 text-sm text-slate-400"><Mail className="h-4 w-4 shrink-0" /><span>E-mail não informado</span></div>}
                          </div>
                        </section>
                        <section className="rounded-xl border border-sky-100 bg-sky-50/60 p-3">
                          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-sky-700">Localização</h4>
                          <div className="space-y-2 text-sm text-slate-700">
                            {c.cityName || c.city ? <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-sky-600" /><span><strong>Cidade:</strong> {c.cityName ?? c.city}{c.state ? ` · ${c.state}` : ""}</span></div> : <div className="flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4 shrink-0" /><span>Cidade não informada</span></div>}
                            {c.address ? <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" /><span><strong>Endereço:</strong> {c.address}{c.cep ? ` · CEP ${c.cep}` : ""}</span></div> : <div className="flex items-center gap-2 text-slate-400"><Building2 className="h-4 w-4 shrink-0" /><span>Endereço não informado</span></div>}
                            {(c.address || c.cityName || c.city) && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([c.address, c.cityName ?? c.city, c.state, c.cep].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-sky-700 hover:text-sky-900"><ExternalLink className="h-3.5 w-3.5" />Abrir no mapa</a>}
                          </div>
                        </section>
                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">Dados da empresa</h4>
                          <div className="space-y-2 text-sm text-slate-700">
                            {c.legalName && <div className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span><strong>Razão social:</strong> {c.legalName}</span></div>}
                            {c.cnpj && <div className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-slate-500" /><span><strong>CNPJ:</strong> {c.cnpj}{c.cnpjStatus ? ` · ${c.cnpjStatus}` : ""}</span></div>}
                            {c.cnaeDescricao && <div className="flex items-start gap-2"><Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" /><span><strong>Ramo/CNAE:</strong> {c.cnaeDescricao}{c.cnaeCode ? ` · ${c.cnaeCode}` : ""}</span></div>}
                            {c.porte && <p><strong>Porte:</strong> {c.porte}{c.isMei ? " · MEI" : ""}</p>}
                            {c.openingDate && <p><strong>Ativa desde:</strong> {new Date(c.openingDate).toLocaleDateString("pt-BR")}</p>}
                            {c.bio && <p className="border-t border-slate-200 pt-2 text-slate-600">{c.bio}</p>}
                          </div>
                        </section>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {c.phone && <a href={`https://wa.me/55${c.phone.replace(/\D/g, "").replace(/^55/, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"><MessageSquare className="mr-2 h-4 w-4" />WhatsApp</a>}
                        {c.email && <a href={`mailto:${c.email}`} className="inline-flex h-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"><Mail className="mr-2 h-4 w-4" />Enviar e-mail</a>}
                        {c.linkedinUrl && <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"><Linkedin className="mr-2 h-4 w-4" />LinkedIn</a>}
                        {!c.linkedinUrl && c.socialSearchTerm && <a href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(c.socialSearchTerm)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"><Linkedin className="mr-2 h-4 w-4" />Buscar LinkedIn</a>}
                        {c.socialSearchTerm && <a href={`https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com ${c.socialSearchTerm}`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-lg border border-pink-200 bg-pink-50 px-3 text-sm font-semibold text-pink-700 transition-colors hover:bg-pink-100"><Instagram className="mr-2 h-4 w-4" />Buscar Instagram</a>}
                      </div>
                      <div className="text-xs text-slate-400 pt-1">Desbloqueado em {new Date(c.unlockedAt!).toLocaleDateString("pt-BR")}{c.pricePaid && Number(c.pricePaid) > 0 && <span className="ml-2">· R$ {Number(c.pricePaid).toFixed(2)}</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── Profile Tab ─────────────────────────────────────────────── */}
        {activeTab === "profile" && (
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Perfil da Empresa</h1>
              <p className="text-slate-500 text-sm mt-1">Informações públicas da sua empresa no RepMatch</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-5">
                {/* Card de Logo da Empresa */}
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-slate-700">Logo da Empresa</CardTitle>
                    <p className="text-xs text-slate-400">A logo aparece nos cards de vagas para representantes. Formatos: JPG, PNG, SVG (máx. 2MB)</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-5">
                      {/* Preview */}
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {profile.logoUrl ? (
                          <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                          <div className="text-slate-300 text-center">
                            <Building2 className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-xs">Sem logo</span>
                          </div>
                        )}
                      </div>
                      {/* Upload */}
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/svg+xml,image/webp"
                          className="hidden"
                          id="logo-upload-input"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) { toast.error("Arquivo muito grande. Máximo 2MB."); return; }
                            const toastId = toast.loading("Enviando logo...");
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              const res = await fetch("/api/upload", { method: "POST", body: formData });
                              if (!res.ok) throw new Error("Erro no upload");
                              const { url } = await res.json() as { url: string };
                              await updateProfileMutation.mutateAsync({ logoUrl: url });
                              toast.success("Logo atualizada!", { id: toastId });
                            } catch (err) {
                              toast.error("Erro ao enviar logo. Tente novamente.", { id: toastId });
                            }
                            e.target.value = "";
                          }}
                        />
                        <label htmlFor="logo-upload-input">
                          <Button size="sm" variant="outline" className="border-slate-200 cursor-pointer" asChild>
                            <span><Upload className="w-3.5 h-3.5 mr-1.5" />{profile.logoUrl ? "Trocar Logo" : "Enviar Logo"}</span>
                          </Button>
                        </label>
                        {profile.logoUrl && (
                          <Button size="sm" variant="ghost" className="ml-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => updateProfileMutation.mutateAsync({ logoUrl: "" }).then(() => toast.success("Logo removida!"))}>
                            <XIcon className="w-3.5 h-3.5 mr-1" />Remover
                          </Button>
                        )}
                        <p className="text-xs text-slate-400 mt-2">Recomendado: 200×200px ou maior, fundo transparente (PNG)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
