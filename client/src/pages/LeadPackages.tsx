import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { getLeadPackagePrice } from "@shared/leadPackages";
import { formatCnpj, formatCpf, isValidPayerDocument, normalizePayerDocument, type PayerDocumentType } from "@shared/const";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Database,
  FileCheck2,
  Loader2,
  LockKeyhole,
  MapPin,
  QrCode,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";
const REGIONS = ["Nacional", "São Paulo", "Rio de Janeiro", "Minas Gerais", "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco", "Goiás", "Distrito Federal"];
const SEGMENTS = ["Tecnologia", "Agronegócio", "Alimentos e Bebidas", "Construção Civil", "Concessionárias e automotivo", "Imobiliárias e construção", "Atacado e distribuição", "Farmacêutico", "Saúde e Médico", "Varejo", "Serviços", "Outro"];
const PIX_CHECKOUT_SESSION_KEY = "repmatch_campaign_pix_checkout";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCount(value: number) {
  return value.toLocaleString("pt-BR");
}

function InventorySkeleton() {
  return <span className="inline-block h-5 w-24 animate-pulse rounded bg-slate-200" aria-label="Carregando disponibilidade" />;
}

export default function LeadPackages() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [audience, setAudience] = useState<"b2b" | "b2c">("b2b");
  const [quantity, setQuantity] = useState<1000 | 2000>(2000);
  const [segment, setSegment] = useState("");
  const [region, setRegion] = useState("Nacional");
  const [notes, setNotes] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ orderId: number; price: number; quantity: number } | null>(null);
  const [pendingUnlimitedAccess, setPendingUnlimitedAccess] = useState<{ accessId: number; price: number; selectionLimit?: number } | null>(null);
  const [documentType, setDocumentType] = useState<PayerDocumentType>("CPF");
  const [payerDocument, setPayerDocument] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string; expiresAt?: string } | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");

  const { data: catalog, isLoading: catalogLoading } = trpc.leadPackages.catalog.useQuery();
  const { data: myOrders, refetch: refetchOrders } = trpc.leadPackages.myOrders.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: unlimitedAccess, refetch: refetchUnlimitedAccess } = trpc.leadPackages.myUnlimitedAccess.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: unlimitedRequest, refetch: refetchUnlimitedRequest } = trpc.leadPackages.myUnlimitedRequest.useQuery(undefined, { enabled: !!user, refetchInterval: 15_000 });
  const { data: unlimitedResults, isFetching: unlimitedResultsLoading } = trpc.leadPackages.searchUnlimitedCatalog.useQuery(
    { query: catalogSearch || undefined, audience: audience === "b2b" ? "b2b" : "b2c", limit: 50 },
    { enabled: !!unlimitedAccess },
  );
  const createOrder = trpc.leadPackages.createOrder.useMutation({
    onError: (error) => toast.error(error.message),
  });
  const createUnlimitedAccess = trpc.leadPackages.createUnlimitedAccess.useMutation({ onError: (error) => toast.error(error.message) });

  const currentPackage = useMemo(
    () => catalog?.[audience] ?? { quantity: 2000, price: audience === "b2b" ? 179 : 149, available: 0, states: 0 },
    [catalog, audience],
  );
  const selectedPrice = getLeadPackagePrice(audience, currentPackage.price, quantity);
  const leadStructuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Pacote de ${quantity.toLocaleString("pt-BR")} leads ${audience.toUpperCase()} | RepMatch`,
    description: audience === "b2b"
      ? `Pacote de ${quantity.toLocaleString("pt-BR")} empresas B2B ativas com recorte por setor e região, sujeito a análise e entrega manual.`
      : `Pacote de ${quantity.toLocaleString("pt-BR")} empresas com atuação B2C, com recorte por região e segmento, sujeito a análise e entrega manual.`,
    provider: { "@type": "Organization", name: "RepMatch", url: "https://repmatch.com.br" },
    areaServed: { "@type": "Country", name: "Brasil" },
    offers: { "@type": "Offer", price: selectedPrice.toFixed(2), priceCurrency: "BRL", availability: "https://schema.org/InStock", url: "https://repmatch.com.br/pacotes-leads" },
  }), [audience, quantity, selectedPrice]);

  const packageCopy = audience === "b2b"
    ? {
        title: "Busque seus leads B2B",
        subtitle: "Empresas ativas para abrir novas conversas comerciais.",
        icon: Building2,
        label: "Empresas B2B",
         bullets: ["CNPJ, CNAE e porte empresarial", "Recorte por setor, UF e cidade", "Telefone, e-mail e WhatsApp empresarial quando disponíveis"],
        helper: "Ideal para distribuidores, indústrias, software, serviços e expansão de canais.",
      }
    : {
        title: "Campanha B2C com foco em varejo",
        subtitle: "Empresas que atuam com o consumidor final para campanhas e parcerias.",
        icon: Users,
        label: "Empresas B2C",
        bullets: ["Empresas com atuação B2C ou mista", "Recorte por setor e área de atuação", "Preparação assistida antes da entrega"],
        helper: "Ideal para fornecedores, franquias, varejo, saúde, serviços e marcas de consumo.",
  };
  const PackageIcon = packageCopy.icon;
  const hasInventory = currentPackage.available > 0;
  const documentLabel = documentType === "CNPJ" ? "CNPJ da empresa pagadora" : "CPF do pagador";
  const documentPlaceholder = documentType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00";

  useEffect(() => {
    const resumeUnlimited = new URLSearchParams(window.location.search).get("retomar") === "ilimitado";
    if (!resumeUnlimited || unlimitedRequest?.status !== "pending_payment" || pendingOrder || pendingUnlimitedAccess) return;
    setPendingUnlimitedAccess({ accessId: unlimitedRequest.id, price: Number(unlimitedRequest.amount) });
    setPix(null);
  }, [pendingOrder, pendingUnlimitedAccess, unlimitedRequest]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedAudience = params.get("audience");
    const requestedQuantity = Number(params.get("quantity"));
    const requestedSegment = params.get("segment");
    if (requestedAudience === "b2b" || requestedAudience === "b2c") setAudience(requestedAudience);
    if (requestedQuantity === 1000 || requestedQuantity === 2000) setQuantity(requestedQuantity);
    if (requestedSegment) setSegment(requestedSegment);
  }, []);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(PIX_CHECKOUT_SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { savedAt: number; order?: { orderId: number; price: number; quantity: number }; unlimited?: { accessId: number; price: number }; pix?: { qrCode: string; qrCodeBase64: string; expiresAt?: string } };
      if (!saved.pix || Date.now() - saved.savedAt > 60 * 60 * 1000) { window.sessionStorage.removeItem(PIX_CHECKOUT_SESSION_KEY); return; }
      if (saved.order) setPendingOrder(saved.order);
      if (saved.unlimited) setPendingUnlimitedAccess(saved.unlimited);
      setPix(saved.pix);
    } catch {
      window.sessionStorage.removeItem(PIX_CHECKOUT_SESSION_KEY);
    }
  }, []);

  function closePixCheckout() {
    window.sessionStorage.removeItem(PIX_CHECKOUT_SESSION_KEY);
    setPendingOrder(null);
    setPendingUnlimitedAccess(null);
    setPix(null);
    setDocumentError("");
  }

  async function beginCheckout() {
    if (!user) {
      toast.info("Crie sua conta com e-mail e senha para acompanhar seu pedido.");
      navigate("/register?purchase=leads&returnTo=/pacotes-leads");
      return;
    }
    if (!legalConsent) {
      toast.error("Confirme o uso responsável e compatível com a LGPD para continuar.");
      return;
    }
    const result = await createOrder.mutateAsync({ audience, quantity, segment: segment || undefined, region: region || undefined, notes: notes || undefined, legalConsent: true });
    setPendingOrder(result);
    setPix(null);
  }

  function resumeCampaignPayment(order: { id: number; audience: "b2b" | "b2c"; quantity: number; totalAmount: string | number; segment: string | null; region: string | null; notes: string | null }) {
    setAudience(order.audience);
    setQuantity(order.quantity === 1000 ? 1000 : 2000);
    setSegment(order.segment ?? "");
    setRegion(order.region ?? "Nacional");
    setNotes(order.notes ?? "");
    setPendingUnlimitedAccess(null);
    setPendingOrder({ orderId: order.id, price: Number(order.totalAmount), quantity: order.quantity });
    setPix(null);
  }

  async function beginUnlimitedCheckout(selectionLimit: 0 | 100 | 250 = 0) {
    if (!user) {
      toast.info("Crie sua conta com e-mail e senha para pesquisar o catálogo sem limites.");
      navigate("/register?purchase=leads&returnTo=/pacotes-leads");
      return;
    }
    if (unlimitedRequest?.status === "pending_payment") {
      setPendingOrder(null);
      setPendingUnlimitedAccess({ accessId: unlimitedRequest.id, price: Number(unlimitedRequest.amount) });
      setPix(null);
      return;
    }
    const result = await createUnlimitedAccess.mutateAsync({ selectionLimit });
    setPendingOrder(null);
    setPendingUnlimitedAccess(result);
    setPix(null);
  }

  async function generatePix() {
    if ((!pendingOrder && !pendingUnlimitedAccess) || !user) return;
    const digits = normalizePayerDocument(documentType, payerDocument);
    if (!isValidPayerDocument(documentType, digits)) {
      setDocumentError(documentType === "CNPJ" ? "Confira os 14 dígitos do CNPJ do pagador." : "Confira os 11 dígitos do CPF do pagador.");
      return;
    }
    setDocumentError("");
    setPixLoading(true);
    try {
      const isUnlimited = !!pendingUnlimitedAccess;
      const response = await fetch(isUnlimited ? "/api/mp/market-search-unlimited-pix" : "/api/mp/lead-package-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUnlimited
          ? { accessId: pendingUnlimitedAccess!.accessId, userId: user.id, userEmail: user.email ?? "", userName: user.name ?? "Cliente RepMatch", documentType, document: digits }
          : { orderId: pendingOrder!.orderId, userId: user.id, userEmail: user.email ?? "", userName: user.name ?? "Cliente RepMatch", documentType, document: digits }),
      });
      const data = await response.json();
      if (!response.ok || !data.qrCode) throw new Error(data.error ?? "Não foi possível gerar o PIX.");
      const nextPix = { qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64, expiresAt: data.expiresAt };
      setPix(nextPix);
      window.sessionStorage.setItem(PIX_CHECKOUT_SESSION_KEY, JSON.stringify({
        savedAt: Date.now(),
        order: pendingOrder ?? undefined,
        unlimited: pendingUnlimitedAccess ?? undefined,
        pix: nextPix,
      }));
      refetchOrders();
      refetchUnlimitedAccess();
      refetchUnlimitedRequest();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar o PIX.");
    } finally {
      setPixLoading(false);
    }
  }

  async function openCardCheckout() {
    if (!pendingOrder && !pendingUnlimitedAccess) return;
    try {
      const response = await fetch("/api/mp/checkout-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: pendingUnlimitedAccess ? "market_search_unlimited" : "lead_package",
          resourceId: pendingUnlimitedAccess?.accessId ?? pendingOrder!.orderId,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.initPoint) throw new Error(data.error ?? "Não foi possível abrir o checkout.");
      toast.info("Abrindo checkout seguro do Mercado Pago...");
      window.open(data.initPoint, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir checkout por cartão.");
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f8f7] text-slate-950">
      <SEO
        title="Busque Leads B2B e B2C | Lista de Empresas por Segmento"
        description="Busque seus leads B2B ou B2C por segmento e região. Escolha empresas individualmente, mantenha sua lista na conta e exporte para o CRM."
        keywords="buscar leads B2B, comprar leads B2B, lista de empresas, lista de empresas por segmento, empresas por CNAE, prospecção B2B, leads B2C"
        canonical="/pacotes-leads"
        structuredData={leadStructuredData}
      />

      <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/")} className="flex min-w-0 items-center gap-2" aria-label="Voltar para início">
            <img src={LOGO_URL} className="h-8 w-auto sm:h-9" alt="RepMatch" />
            <span className="hidden border-l border-slate-200 pl-3 text-sm font-bold text-slate-700 sm:inline">Central de Campanhas</span>
          </button>
          <button onClick={() => navigate("/")} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"><ArrowLeft className="h-4 w-4" />Voltar</button>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden border-b border-emerald-100 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_10%,rgba(110,231,183,.35),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(45,212,191,.28),transparent_25%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.14em] text-emerald-100"><Sparkles className="h-3.5 w-3.5" />Base comercial para crescer</span>
              <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">Busque seus leads e comece a próxima campanha com o público certo.</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-50/90 sm:text-lg">Busque empresas B2B ou B2C, defina segmento e região e selecione os registros que fazem sentido para a sua estratégia comercial.</p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-emerald-50">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Segmentação assistida</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Empresas com CNPJ</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Pagamento por PIX ou cartão</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/15 bg-white/[.09] p-5 backdrop-blur-sm sm:col-span-2">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-200">Inventário comercial</p><p className="mt-2 text-3xl font-black sm:text-4xl">{catalogLoading ? <InventorySkeleton /> : hasInventory ? `${formatCount(currentPackage.available)}+` : "Em preparação"}</p><p className="mt-1 text-sm text-emerald-50/80">empresas elegíveis para campanhas {audience.toUpperCase()}</p></div><div className="rounded-2xl bg-emerald-300/15 p-3 text-emerald-200"><Database className="h-7 w-7" /></div></div>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/[.07] p-4"><MapPin className="h-5 w-5 text-emerald-300" /><p className="mt-4 text-2xl font-black">{catalogLoading ? <InventorySkeleton /> : currentPackage.states || "—"}</p><p className="mt-1 text-xs font-medium text-emerald-100/80">estados com disponibilidade</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/[.07] p-4"><FileCheck2 className="h-5 w-5 text-emerald-300" /><p className="mt-4 text-2xl font-black">1k ou 2k</p><p className="mt-1 text-xs font-medium text-emerald-100/80">empresas por campanha</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.14em] text-indigo-700">Nova base especial</p>
              <h2 className="mt-1 text-xl font-black text-slate-950">Contatos B2C para imobiliárias, automotivo e produtos digitais</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600">Pacotes de 50 ou 100 contatos, seleção individual, lista permanente e plano ilimitado por R$ 999/mês.</p>
            </div>
            <button onClick={() => navigate("/contatos-b2c")} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-extrabold text-white transition hover:bg-indigo-700"><Users className="h-4 w-4" />Ver contatos B2C</button>
          </div>
          <div className="mb-6 max-w-2xl"><p className="text-sm font-extrabold uppercase tracking-[.14em] text-emerald-700">Busque seus leads</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Qual público você quer alcançar?</h2><p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">Use segmento e região para montar uma lista comercial alinhada ao seu objetivo. Você escolhe os registros antes de salvar na sua conta.</p></div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_14px_45px_-30px_rgba(15,23,42,.45)] sm:p-7">
               <div className="grid gap-3 sm:grid-cols-2">
                 {(["b2b", "b2c"] as const).map((type) => {
                  const selected = audience === type;
                  const Icon = type === "b2b" ? Building2 : Users;
                  const item = catalog?.[type];
                  return <button key={type} onClick={() => setAudience(type)} className={`min-h-[170px] rounded-2xl border p-5 text-left transition-all ${selected ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-sm"}`}>
                    <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl ${selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-5 w-5" /></span>{selected && <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">Selecionado</span>}</div>
                    <p className="mt-5 text-lg font-black">{type === "b2b" ? "Campanha B2B" : "Campanha B2C"}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{type === "b2b" ? "Empresas ativas para prospecção e expansão comercial." : "Empresas com atuação no consumidor final, varejo e serviços."}</p>
                    <p className="mt-3 text-xs font-bold text-emerald-700">{catalogLoading ? <InventorySkeleton /> : `${formatCount(item?.available ?? 0)}+ empresas disponíveis`}</p>
                  </button>;
                 })}
               </div>

               <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                 <p className="text-xs font-extrabold uppercase tracking-[.13em] text-amber-800">Campanhas prontas para vender mais</p>
                 <div className="mt-3 grid gap-3 sm:grid-cols-2">
                   <button onClick={() => { setAudience("b2b"); setSegment("Concessionárias e automotivo"); }} className="rounded-xl border border-amber-200 bg-white p-3 text-left transition hover:border-amber-400 hover:shadow-sm"><p className="font-black text-slate-900">Concessionárias e automotivo</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Lojas, veículos, peças e serviços automotivos para novas parcerias.</p></button>
                   <button onClick={() => { setAudience("b2b"); setSegment("Imobiliárias e construção"); }} className="rounded-xl border border-amber-200 bg-white p-3 text-left transition hover:border-amber-400 hover:shadow-sm"><p className="font-black text-slate-900">Imobiliárias e construção</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Imobiliárias, construtoras e parceiros do mercado imobiliário.</p></button>
                 </div>
               </div>

               <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:p-5">
                <div className="flex items-start gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><PackageIcon className="h-5 w-5" /></div><div><h2 className="text-xl font-black">{packageCopy.title}</h2><p className="mt-1 text-sm text-slate-600">{packageCopy.subtitle}</p></div></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">{packageCopy.bullets.map((item) => <div key={item} className="flex gap-2 rounded-xl bg-white p-3 text-xs font-semibold leading-relaxed text-slate-700 shadow-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}</div>)}</div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">{packageCopy.helper}</p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-slate-700">Tamanho do pacote</p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {([1000, 2000] as const).map((option) => {
                    const selected = quantity === option;
                    const optionPrice = getLeadPackagePrice(audience, currentPackage.price, option);
                    return <button key={option} onClick={() => setQuantity(option)} className={`rounded-2xl border p-4 text-left transition ${selected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}><span className="text-xl font-black">{option.toLocaleString("pt-BR")}</span><span className="block text-xs text-slate-500">empresas</span><span className="mt-2 block text-sm font-extrabold text-emerald-700">{catalogLoading ? "Consultando" : formatBRL(optionPrice)}</span></button>;
                  })}
                </div>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-bold text-slate-700">Segmento prioritário
                  <select value={segment} onChange={(event) => setSegment(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                    <option value="">Todos os segmentos</option>{SEGMENTS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold text-slate-700">Cobertura da campanha
                  <select value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                    {REGIONS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-4 block text-sm font-bold text-slate-700">Descreva o perfil que procura <span className="font-normal text-slate-400">(opcional)</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} placeholder="Ex.: empresas de médio porte no varejo alimentício do Sul, com telefone disponível" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" />
              </label>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                <input type="checkbox" checked={legalConsent} onChange={(event) => setLegalConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600" />
                <span><strong className="text-slate-800">Uso comercial responsável.</strong> Confirmo que a campanha terá finalidade legítima, transparência e conformidade com a LGPD. A composição do lote é revisada antes da entrega.</span>
              </label>
            </div>

            <aside className="h-fit rounded-3xl bg-slate-950 p-5 text-white shadow-[0_20px_55px_-25px_rgba(2,44,34,.75)] sm:p-7 lg:sticky lg:top-24">
              <p className="text-xs font-extrabold uppercase tracking-[.16em] text-emerald-300">Resumo da campanha</p>
              <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-4xl font-black">{quantity.toLocaleString("pt-BR")}</p><p className="mt-1 text-sm text-slate-300">empresas {audience.toUpperCase()} no seu lote</p></div><div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300"><Target className="h-6 w-6" /></div></div>
              <div className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm text-slate-200"><div className="flex items-center justify-between gap-3"><span>Segmento</span><strong className="text-right text-white">{segment || "Multissetorial"}</strong></div><div className="flex items-center justify-between gap-3"><span>Região</span><strong className="text-right text-white">{region}</strong></div><div className="flex items-center justify-between gap-3"><span>Disponibilidade</span><strong className="text-right text-emerald-300">{catalogLoading ? "Consultando" : hasInventory ? "Em estoque" : "Sob consulta"}</strong></div></div>
              <div className="mt-6 rounded-2xl bg-white/[.08] p-4"><p className="text-xs font-semibold text-slate-300">Investimento do pacote</p><p className="mt-1 text-3xl font-black">{catalogLoading ? "..." : formatBRL(selectedPrice)}</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Valor proporcional configurado para novos pedidos</p></div>
              <button onClick={beginCheckout} disabled={createOrder.isPending || catalogLoading} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-extrabold text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60">
                {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Solicitar por PIX <ArrowRight className="h-4 w-4" />
              </button>
              <div className="mt-4 flex gap-2 text-xs leading-relaxed text-slate-300"><LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Você pode pagar por PIX ou cartão. Após a confirmação, o pedido entra para revisão e entrega manual.</div>
              <div className="mt-6"><p className="text-xs font-extrabold uppercase tracking-[.13em] text-emerald-300">Planos mensais B2B</p><div className="mt-3 grid gap-3">{(catalog?.monthlyPlans ?? [{ selectionLimit: 100 as const, price: 99, label: "Essencial", description: "Até 100 empresas salvas" }, { selectionLimit: 250 as const, price: 299, label: "Profissional", description: "Até 250 empresas salvas" }, { selectionLimit: 0 as const, price: catalog?.unlimitedMonthly?.price ?? 499, label: "Ilimitado", description: "Pesquisa e exportação sem limite" }]).map((plan) => <div key={plan.selectionLimit} className={`rounded-2xl border p-4 ${plan.selectionLimit === 0 ? "border-emerald-300/30 bg-emerald-400/10" : "border-white/15 bg-white/[.06]"}`}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{plan.label}</p><p className="mt-1 text-xs text-slate-200">{plan.description} · 30 dias</p></div><strong className="text-xl">{formatBRL(plan.price)}<span className="text-xs font-semibold text-slate-300">/mês</span></strong></div><button onClick={() => beginUnlimitedCheckout(plan.selectionLimit)} disabled={createUnlimitedAccess.isPending || !!unlimitedAccess || unlimitedRequest?.status === "pending_approval"} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60">{createUnlimitedAccess.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : unlimitedRequest?.status === "pending_payment" ? <QrCode className="h-4 w-4" /> : <Database className="h-4 w-4" />}{unlimitedAccess ? "Plano mensal ativo" : unlimitedRequest?.status === "pending_payment" ? "Retomar pagamento" : unlimitedRequest?.status === "pending_approval" ? "Pagamento em análise" : `Escolher ${plan.label}`}</button></div>)}</div>{unlimitedAccess?.expiresAt && <p className="mt-3 text-center text-xs font-medium text-emerald-100">Plano ativo até {new Date(unlimitedAccess.expiresAt).toLocaleDateString("pt-BR")}</p>}</div>
            </aside>
          </div>

          <section className="mt-10 grid gap-4 sm:grid-cols-3">
            {[{ icon: Target, title: "Briefing objetivo", text: "Você define público, setor e região." }, { icon: FileCheck2, title: "Curadoria antes da entrega", text: "O lote passa por revisão operacional." }, { icon: CircleDollarSign, title: "Compra por PIX", text: "Pagamento e aprovação em etapas claras." }].map((item) => <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5"><item.icon className="h-5 w-5 text-emerald-600" /><h3 className="mt-4 font-black">{item.title}</h3><p className="mt-1 text-sm leading-relaxed text-slate-600">{item.text}</p></div>)}
          </section>

          {user && myOrders && myOrders.length > 0 && (
            <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-extrabold uppercase tracking-[.14em] text-emerald-700">Acompanhamento</p><h2 className="mt-1 text-2xl font-black">Meus pedidos de campanha</h2></div>
                <p className="text-sm text-slate-500">Atualizado automaticamente</p>
              </div>
              <div className="mt-5 space-y-3">
                {myOrders.slice(0, 5).map((order) => {
                  const pendingPayment = order.status === "pending_payment";
                  return <div key={order.id} className={`flex flex-col gap-3 rounded-2xl border p-4 text-sm sm:flex-row sm:items-center sm:justify-between ${pendingPayment ? "border-amber-200 bg-amber-50/50" : "border-slate-100"}`}>
                    <div><p className="font-black">{order.quantity.toLocaleString("pt-BR")} empresas {order.audience.toUpperCase()}</p><p className="mt-1 text-xs text-slate-500">{order.segment || "Multissetorial"} · {order.region || "Nacional"}</p></div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${pendingPayment ? "bg-amber-100 text-amber-800" : order.status === "pending_approval" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"}`}>{pendingPayment ? "Aguardando PIX" : order.status === "pending_approval" ? "PIX confirmado — em análise" : order.status === "approved" ? "Em preparação" : order.status === "delivered" ? "Entregue" : order.status}</span>
                      {pendingPayment && <button onClick={() => resumeCampaignPayment(order)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><QrCode className="h-3.5 w-3.5" />Retomar PIX</button>}
                      {["approved", "delivered"].includes(order.status) && <button onClick={() => navigate("/dashboard/company?tab=leadPackages")} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"><Target className="h-3.5 w-3.5" />Escolher leads</button>}
                    </div>
                  </div>;
                })}
              </div>
            </section>
          )}
        </section>
      </main>

      {(pendingOrder || pendingUnlimitedAccess) && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
          <div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Etapa final</p>
                <h2 className="mt-1 text-xl font-black">{pendingUnlimitedAccess ? (pendingUnlimitedAccess.selectionLimit ? `Plano B2B ${pendingUnlimitedAccess.selectionLimit} empresas` : "Plano B2B Ilimitado") : "Pagamento da campanha"}</h2>
                <p className="mt-1 text-sm text-slate-600">{pendingUnlimitedAccess ? `${pendingUnlimitedAccess.selectionLimit ? `Até ${pendingUnlimitedAccess.selectionLimit} empresas salvas` : "Pesquisas e exportação ilimitadas"} · 30 dias · ${formatBRL(pendingUnlimitedAccess.price)}` : `${audience.toUpperCase()} · ${pendingOrder!.quantity.toLocaleString("pt-BR")} empresas · ${formatBRL(pendingOrder!.price)}`}</p>
              </div>
              <button onClick={closePixCheckout} className="grid h-9 w-9 place-items-center rounded-full text-2xl text-slate-400 transition hover:bg-slate-100" aria-label="Fechar">×</button>
            </div>

            {!pix ? (
              <>
                <fieldset className="mt-6">
                  <legend className="text-sm font-bold text-slate-900">Tipo de documento do pagador</legend>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {(["CPF", "CNPJ"] as const).map((type) => (
                      <button key={type} type="button" onClick={() => { setDocumentType(type); setPayerDocument(""); setDocumentError(""); }} className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold transition ${documentType === type ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-100" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`} aria-pressed={documentType === type}>
                        {type === "CPF" ? "Pessoa física · CPF" : "Empresa · CNPJ"}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label className="mt-5 block text-sm font-bold">
                  {documentLabel}
                  <input inputMode="numeric" autoComplete="off" value={payerDocument} onChange={(event) => { const next = documentType === "CNPJ" ? formatCnpj(event.target.value) : formatCpf(event.target.value); setPayerDocument(next); if (documentError) setDocumentError(""); }} placeholder={documentPlaceholder} aria-invalid={!!documentError} className={`mt-2 min-h-12 w-full rounded-xl border px-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${documentError ? "border-red-400 bg-red-50" : "border-slate-200"}`} />
                </label>
                {documentError && <p className="mt-2 text-sm font-medium text-red-700" role="alert">{documentError}</p>}
                <p className="mt-2 text-xs leading-relaxed text-slate-500">O {documentType} é solicitado pelo Mercado Pago para emitir o PIX e não aparece na entrega do pedido.</p>
                <button onClick={generatePix} disabled={pixLoading} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {pixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Gerar QR Code PIX
                </button>
                <button onClick={openCardCheckout} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 px-4 py-3 font-bold text-emerald-800 transition hover:bg-emerald-50"><CreditCard className="h-4 w-4" />Pagar com cartão de crédito</button>
              </>
            ) : (
              <div className="mt-6 text-center">
                <img src={`data:image/png;base64,${pix.qrCodeBase64}`} className="mx-auto h-52 w-52" alt="QR Code PIX" />
                <p className="mt-4 font-black">PIX gerado com sucesso</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">A confirmação leva seu pedido para análise e ativação assistida.</p>
                <button onClick={() => navigator.clipboard.writeText(pix.qrCode).then(() => toast.success("Código PIX copiado"))} className="mt-4 min-h-12 w-full rounded-xl border border-emerald-300 px-4 py-3 text-sm font-bold text-emerald-700">Copiar código PIX</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
