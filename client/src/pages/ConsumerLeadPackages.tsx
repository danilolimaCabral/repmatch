import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import SEO from "@/components/SEO";
import { formatCpf, formatCnpj, isValidPayerDocument, normalizePayerDocument, type PayerDocumentType } from "@shared/const";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  ArrowLeft, Check, CheckCircle2, Database, Download, FileCheck2, Loader2,
  CreditCard, LockKeyhole, Mail, Phone, QrCode, ShieldCheck, Sparkles, Users,
} from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";
const PIX_SESSION_KEY = "repmatch_consumer_lead_pix_checkout";

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function safeSpreadsheetCell(value: unknown) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function toPhoneLink(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 12 ? `tel:+${digits}` : null;
}

export default function ConsumerLeadPackages() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [quantity, setQuantity] = useState<50 | 100>(50);
  const [legalConsent, setLegalConsent] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ orderId: number; price: number; quantity: number } | null>(null);
  const [pendingUnlimited, setPendingUnlimited] = useState<{ accessId: number; price: number } | null>(null);
  const [documentType, setDocumentType] = useState<PayerDocumentType>("CPF");
  const [payerDocument, setPayerDocument] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);
  const [openedOrderId, setOpenedOrderId] = useState<number | null>(null);
  const [packageOffset, setPackageOffset] = useState(0);
  const [unlimitedOffset, setUnlimitedOffset] = useState(0);

  const { data: catalog, isLoading: catalogLoading } = trpc.consumerLeadPackages.catalog.useQuery();
  const { data: orders, refetch: refetchOrders } = trpc.consumerLeadPackages.myOrders.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: credits } = trpc.consumerLeadPackages.getLeadCredits.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: unlimitedAccess, refetch: refetchUnlimited } = trpc.consumerLeadPackages.myUnlimitedAccess.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: unlimitedRequest, refetch: refetchUnlimitedRequest } = trpc.consumerLeadPackages.myUnlimitedRequest.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const { data: savedLeads, isLoading: savedLoading } = trpc.consumerLeadPackages.mySavedLeads.useQuery(undefined, { enabled: !!user });
  const packageInput = useMemo(() => ({ orderId: openedOrderId ?? 0, offset: packageOffset, limit: 50 }), [openedOrderId, packageOffset]);
  const { data: packageResults, isFetching: packageLoading } = trpc.consumerLeadPackages.searchReleasedPackage.useQuery(packageInput, { enabled: !!openedOrderId });
  const { data: unlimitedResults, isFetching: unlimitedLoading } = trpc.consumerLeadPackages.searchUnlimited.useQuery({ offset: unlimitedOffset, limit: 50 }, { enabled: !!unlimitedAccess });

  const createOrder = trpc.consumerLeadPackages.createOrder.useMutation({ onError: (error) => toast.error(error.message) });
  const createUnlimited = trpc.consumerLeadPackages.createUnlimitedAccess.useMutation({ onError: (error) => toast.error(error.message) });
  const savePackageLead = trpc.consumerLeadPackages.saveLeadFromPackage.useMutation({
    onSuccess: (result) => {
      utils.consumerLeadPackages.getLeadCredits.invalidate();
      utils.consumerLeadPackages.mySavedLeads.invalidate();
      utils.consumerLeadPackages.searchReleasedPackage.invalidate();
      toast.success(result.alreadySaved ? "Este contato já está na sua lista." : `Contato salvo. Restam ${result.remaining} créditos B2C.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const saveUnlimitedLead = trpc.consumerLeadPackages.saveLeadFromUnlimited.useMutation({
    onSuccess: (result) => {
      utils.consumerLeadPackages.mySavedLeads.invalidate();
      utils.consumerLeadPackages.searchUnlimited.invalidate();
      toast.success(result.alreadySaved ? "Este contato já está na sua lista." : `Contato salvo. Restam ${result.remaining} contatos no plano mensal.`);
    },
    onError: (error) => toast.error(error.message),
  });
  const downloadSaved = trpc.consumerLeadPackages.downloadSavedLeads.useMutation({ onError: (error) => toast.error(error.message) });

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(PIX_SESSION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { savedAt: number; order?: { orderId: number; price: number; quantity: number }; unlimited?: { accessId: number; price: number }; pix?: { qrCode: string; qrCodeBase64: string } };
      if (!saved.pix || Date.now() - saved.savedAt > 60 * 60 * 1000) { window.sessionStorage.removeItem(PIX_SESSION_KEY); return; }
      if (saved.order) setPendingOrder(saved.order);
      if (saved.unlimited) setPendingUnlimited(saved.unlimited);
      setPix(saved.pix);
    } catch {
      window.sessionStorage.removeItem(PIX_SESSION_KEY);
    }
  }, []);

  function requireAccount() {
    if (user) return true;
    toast.info("Crie sua conta com e-mail e senha para comprar e guardar sua lista B2C.");
    navigate("/register?purchase=consumer-leads&returnTo=/contatos-b2c");
    return false;
  }

  async function beginPackageCheckout() {
    if (!requireAccount()) return;
    if (!legalConsent) { toast.error("Confirme o uso responsável e compatível com a LGPD para continuar."); return; }
    const result = await createOrder.mutateAsync({ quantity, legalConsent: true });
    setPendingUnlimited(null);
    setPendingOrder(result);
    setPix(null);
  }

  async function beginUnlimitedCheckout() {
    if (!requireAccount()) return;
    if (!legalConsent) { toast.error("Confirme o uso responsável e compatível com a LGPD para continuar."); return; }
    const result = await createUnlimited.mutateAsync({ legalConsent: true });
    setPendingOrder(null);
    setPendingUnlimited(result);
    setPix(null);
  }

  async function openCardCheckout(kind: "consumer_lead_package" | "consumer_lead_monthly", resourceId: number) {
    try {
      const response = await fetch("/api/mp/checkout-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, resourceId }),
      });
      const data = await response.json();
      if (!response.ok || !data.initPoint) throw new Error(data.error ?? "Não foi possível abrir o checkout.");
      toast.info("Abrindo o checkout seguro do Mercado Pago...");
      window.open(data.initPoint, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao abrir checkout por cartão.");
    }
  }

  async function generatePix() {
    if (!user || (!pendingOrder && !pendingUnlimited)) return;
    const digits = normalizePayerDocument(documentType, payerDocument);
    if (!isValidPayerDocument(documentType, digits)) {
      setDocumentError(documentType === "CPF" ? "Confira os 11 dígitos do CPF do pagador." : "Confira os 14 dígitos do CNPJ do pagador.");
      return;
    }
    setPixLoading(true);
    setDocumentError("");
    try {
      const isUnlimited = !!pendingUnlimited;
      const response = await fetch(isUnlimited ? "/api/mp/consumer-lead-unlimited-pix" : "/api/mp/consumer-lead-package-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isUnlimited
          ? { accessId: pendingUnlimited!.accessId, userId: user.id, userEmail: user.email ?? "", userName: user.name ?? "Cliente RepMatch", documentType, document: digits }
          : { orderId: pendingOrder!.orderId, userId: user.id, userEmail: user.email ?? "", userName: user.name ?? "Cliente RepMatch", documentType, document: digits }),
      });
      const data = await response.json();
      if (!response.ok || !data.qrCode || !data.qrCodeBase64) throw new Error(data.error ?? "Não foi possível gerar o PIX.");
      const nextPix = { qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 };
      setPix(nextPix);
      window.sessionStorage.setItem(PIX_SESSION_KEY, JSON.stringify({ savedAt: Date.now(), order: pendingOrder ?? undefined, unlimited: pendingUnlimited ?? undefined, pix: nextPix }));
      refetchOrders();
      refetchUnlimited();
      refetchUnlimitedRequest();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar o PIX.");
    } finally {
      setPixLoading(false);
    }
  }

  async function exportSavedLeads() {
    const { rows } = await downloadSaved.mutateAsync();
    if (!rows.length) { toast.info("Sua lista ainda não possui contatos para exportar."); return; }
    const worksheet = XLSX.utils.json_to_sheet(rows.map((lead) => ({
      "Nome": safeSpreadsheetCell(lead.fullName),
      "Telefone": safeSpreadsheetCell(lead.phone),
      "E-mail": safeSpreadsheetCell(lead.email),
    })));
    worksheet["!cols"] = [{ wch: 34 }, { wch: 20 }, { wch: 38 }];
    worksheet["!autofilter"] = { ref: `A1:C${rows.length + 1}` };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Minha Lista B2C");
    XLSX.writeFile(workbook, "repmatch-minha-lista-b2c.xlsx", { compression: true });
    toast.success(`${rows.length} contatos exportados em Excel.`);
  }

  function closePix() {
    window.sessionStorage.removeItem(PIX_SESSION_KEY);
    setPendingOrder(null);
    setPendingUnlimited(null);
    setPix(null);
    setDocumentError("");
  }

  const releasedOrders = (orders ?? []).filter((order) => ["approved", "delivered"].includes(order.status));
  const price = catalog?.packages.find((item) => item.quantity === quantity)?.price ?? (quantity === 50 ? 99 : 199);

  return <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-950">
    <SEO title="Contatos B2C para imobiliárias, automotivo e produtos digitais | RepMatch" description="Base B2C de contatos com consentimento declarado na origem. Compre 50 ou 100 contatos, escolha um a um, guarde a lista e exporte em Excel." canonical="/contatos-b2c" />
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2"><img src={LOGO_URL} alt="RepMatch" className="h-8 w-auto" /><span className="hidden border-l border-slate-200 pl-3 text-sm font-bold text-slate-700 sm:inline">Contatos B2C</span></button>
        <button onClick={() => navigate("/pacotes-leads")} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" />Leads empresariais</button>
      </div>
    </header>

    <main>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-950 to-cyan-950 text-white">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_12%_10%,rgba(99,102,241,.6),transparent_28%),radial-gradient(circle_at_86%_70%,rgba(34,211,238,.38),transparent_24%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-white/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.14em] text-cyan-100"><Sparkles className="h-3.5 w-3.5" />Base especial B2C</span><h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl">Encontre pessoas para a próxima conversa certa.</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">Para imobiliárias, automotivo e produtos digitais. Você escolhe os contatos individualmente, mantém sua lista na conta e baixa em Excel quando quiser.</p><div className="mt-7 flex flex-wrap gap-3 text-sm font-semibold text-slate-100"><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" />Consentimento declarado na origem</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" />Seleção individual</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" />PIX e lista permanente</span></div></div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><Database className="h-6 w-6 text-cyan-200" /><p className="mt-4 text-3xl font-black">{catalogLoading ? "…" : (catalog?.available ?? 0).toLocaleString("pt-BR")}</p><p className="mt-1 text-sm text-slate-200">contatos disponíveis</p></div><div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><Phone className="h-6 w-6 text-cyan-200" /><p className="mt-4 text-3xl font-black">{catalogLoading ? "…" : (catalog?.withPhone ?? 0).toLocaleString("pt-BR")}</p><p className="mt-1 text-sm text-slate-200">com telefone</p></div><div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur"><Mail className="h-6 w-6 text-cyan-200" /><p className="mt-4 text-3xl font-black">{catalogLoading ? "…" : (catalog?.withEmail ?? 0).toLocaleString("pt-BR")}</p><p className="mt-1 text-sm text-slate-200">com e-mail</p></div></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-indigo-700">Escolha o tamanho da lista</p><h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Contatos B2C para sua prospecção</h2><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">Os dados pessoais só são exibidos depois que você adiciona o contato à sua lista. Não há download automático de lote completo.</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{([50, 100] as const).map((option) => { const optionPrice = catalog?.packages.find((item) => item.quantity === option)?.price ?? (option === 50 ? 99 : 199); const selected = quantity === option; return <button key={option} onClick={() => setQuantity(option)} className={`rounded-2xl border p-5 text-left transition ${selected ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}><div className="flex items-start justify-between"><Users className={`h-6 w-6 ${selected ? "text-indigo-600" : "text-slate-400"}`} />{selected && <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-extrabold text-white">SELECIONADO</span>}</div><p className="mt-5 text-3xl font-black">{option}</p><p className="mt-1 text-sm text-slate-600">contatos para escolher</p><p className="mt-4 text-xl font-black text-indigo-700">{formatBRL(optionPrice)}</p></button>; })}</div><label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600"><input type="checkbox" checked={legalConsent} onChange={(event) => setLegalConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-indigo-600" /><span><strong className="text-slate-900">Uso responsável e legítimo.</strong> Confirmo que vou respeitar a finalidade comercial, a transparência, as preferências de contato e a LGPD. Não usarei a base para spam, discriminação ou revenda.</span></label></div>
            <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-cyan-800">Para equipes que pesquisam todos os dias</p><h2 className="mt-2 text-2xl font-black">Plano B2C 500 contatos</h2><p className="mt-2 text-sm text-slate-600">Escolha até 500 contatos durante 30 dias; sua lista continua guardada na conta.</p></div><div className="shrink-0 rounded-2xl bg-slate-950 px-5 py-4 text-white"><p className="text-2xl font-black">R$ 499<span className="text-xs font-semibold text-slate-300">/mês</span></p><p className="mt-1 text-xs text-slate-300">500 contatos · 30 dias</p></div></div><button onClick={beginUnlimitedCheckout} disabled={createUnlimited.isPending || !!unlimitedAccess || unlimitedRequest?.status === "pending_approval"} className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-extrabold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">{createUnlimited.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}{unlimitedAccess ? "Plano B2C ativo" : unlimitedRequest?.status === "pending_payment" ? "Retomar PIX do plano" : unlimitedRequest?.status === "pending_approval" ? "PIX em análise" : "Assinar plano de 500"}</button></div>
          </div>
          <aside className="h-fit rounded-3xl bg-slate-950 p-6 text-white shadow-xl lg:sticky lg:top-24"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-cyan-300">Resumo do pacote</p><div className="mt-6 flex items-end justify-between"><div><p className="text-5xl font-black">{quantity}</p><p className="mt-1 text-sm text-slate-300">contatos B2C selecionáveis</p></div><div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-300"><Users className="h-6 w-6" /></div></div><div className="mt-6 space-y-3 border-y border-white/10 py-5 text-sm text-slate-200"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />Você escolhe contato por contato</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />Nome e canais disponíveis após salvar</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-300" />Lista guardada e exportável</p></div><div className="mt-6 rounded-2xl bg-white/10 p-4"><p className="text-xs text-slate-300">Investimento</p><p className="mt-1 text-3xl font-black">{formatBRL(price)}</p></div><button onClick={beginPackageCheckout} disabled={createOrder.isPending || catalogLoading} className="mt-6 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3.5 text-sm font-extrabold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60">{createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Solicitar por PIX</button><p className="mt-4 flex gap-2 text-xs leading-relaxed text-slate-300"><LockKeyhole className="h-4 w-4 shrink-0 text-cyan-300" />Após a confirmação do PIX, o administrador libera seus créditos para você escolher os contatos.</p></aside>
        </div>

        {user && <section className="mt-10 space-y-6">
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm sm:p-7"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-indigo-700">Minha base B2C</p><div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-black">Contatos que você escolheu</h2><p className="mt-1 text-sm text-slate-600">A lista fica associada à sua conta e só contém os dados que você liberou.</p></div><button onClick={exportSavedLeads} disabled={!savedLeads?.length || downloadSaved.isPending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"><Download className="h-4 w-4" />Baixar Excel</button></div><div className="mt-5 flex flex-wrap gap-3"><div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-indigo-100"><p className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">Salvos</p><p className="mt-1 text-xl font-black">{savedLeads?.length ?? 0}</p></div><div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-indigo-100"><p className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">Créditos restantes</p><p className="mt-1 text-xl font-black">{credits?.remaining ?? 0}</p></div>{unlimitedAccess && <div className="rounded-2xl bg-cyan-100 px-4 py-3 text-cyan-950"><p className="text-[10px] font-extrabold uppercase tracking-wide">Plano de 500 ativo</p><p className="mt-1 text-sm font-black">até {unlimitedAccess.expiresAt ? new Date(unlimitedAccess.expiresAt).toLocaleDateString("pt-BR") : ""}</p></div>}</div></div>

          {savedLoading ? <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" /></div> : savedLeads?.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{savedLeads.map((lead) => { const phoneLink = toPhoneLink(lead.phone); return <article key={lead.savedId} className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-black text-slate-900">{lead.fullName}</p><p className="mt-1 text-xs font-bold uppercase tracking-wide text-indigo-700">Contato selecionado</p></div><span className="rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-800">Salvo</span></div><div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">{lead.phone ? <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">Telefone</p><a href={phoneLink ?? undefined} className="mt-1 inline-flex items-center gap-2 font-bold text-indigo-700 hover:underline"><Phone className="h-4 w-4" />{lead.phone}</a></div> : null}{lead.email ? <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">E-mail</p><a href={`mailto:${lead.email}`} className="mt-1 break-all font-bold text-indigo-700 hover:underline"><Mail className="mr-2 inline h-4 w-4" />{lead.email}</a></div> : null}</div></article>; })}</div> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Users className="mx-auto h-10 w-10 text-indigo-500" /><h2 className="mt-4 text-xl font-black">Sua lista B2C está vazia</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Quando um pacote for liberado, escolha os contatos um a um. Nome e os canais de contato disponíveis serão guardados aqui.</p></div>}

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[.14em] text-indigo-700">Créditos liberados</p><h2 className="mt-2 text-2xl font-black">Escolha seus contatos</h2><p className="mt-1 text-sm text-slate-600">O contato só é revelado e salvo depois da sua escolha individual.</p></div>{(credits?.remaining ?? 0) === 0 && releasedOrders.length > 0 && <span className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">Créditos esgotados — compre outro pacote.</span>}</div>{!releasedOrders.length && !unlimitedAccess ? <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">Assim que o PIX for confirmado e o administrador liberar o pedido, os créditos aparecerão aqui.</p> : <div className="mt-6 space-y-4">{releasedOrders.map((order) => <div key={order.id} className="rounded-2xl border border-indigo-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">Pacote de {order.quantity} contatos B2C</p><p className="mt-1 text-sm text-slate-600">{order.status === "delivered" ? "Liberado" : "Aprovado"} · créditos acumuláveis na sua conta</p></div><button onClick={() => { setOpenedOrderId(order.id); setPackageOffset(0); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-700"><Users className="h-4 w-4" />Escolher contatos</button></div>{openedOrderId === order.id && <ConsumerSelection results={packageResults} loading={packageLoading} offset={packageOffset} onPrevious={() => setPackageOffset((value) => Math.max(0, value - 50))} onNext={() => setPackageOffset((value) => value + 50)} onSave={(leadId) => savePackageLead.mutate({ orderId: order.id, consumerLeadId: leadId })} saving={savePackageLead.isPending} creditsRemaining={credits?.remaining ?? 0} />}</div>)}{unlimitedAccess && <div className="rounded-2xl border border-cyan-200 bg-cyan-50/50 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-slate-900">Plano B2C 500 contatos ativo</p><p className="mt-1 text-sm text-slate-600">Escolha até 500 contatos no período ativo até {unlimitedAccess.expiresAt ? new Date(unlimitedAccess.expiresAt).toLocaleDateString("pt-BR") : "o fim da vigência"}.</p></div><button onClick={() => setUnlimitedOffset(0)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white hover:bg-cyan-700"><Database className="h-4 w-4" />Pesquisar base</button></div>{unlimitedOffset >= 0 && <ConsumerSelection results={unlimitedResults} loading={unlimitedLoading} offset={unlimitedOffset} onPrevious={() => setUnlimitedOffset((value) => Math.max(0, value - 50))} onNext={() => setUnlimitedOffset((value) => value + 50)} onSave={(leadId) => saveUnlimitedLead.mutate({ consumerLeadId: leadId })} saving={saveUnlimitedLead.isPending} unlimited />}</div>}</div>}</section>
        </section>}
      </section>
    </main>

    {(pendingOrder || pendingUnlimited) && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4"><div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-indigo-700">Etapa final</p><h2 className="mt-1 text-xl font-black">{pendingUnlimited ? "Plano B2C 500 contatos" : "Pagamento do pacote B2C"}</h2><p className="mt-1 text-sm text-slate-600">{pendingUnlimited ? `30 dias · ${formatBRL(pendingUnlimited.price)}` : `${pendingOrder!.quantity} contatos · ${formatBRL(pendingOrder!.price)}`}</p></div><button onClick={closePix} className="grid h-9 w-9 place-items-center rounded-full text-2xl text-slate-400 hover:bg-slate-100" aria-label="Fechar">×</button></div>{!pix ? <><fieldset className="mt-6"><legend className="text-sm font-bold">Documento do pagador</legend><div className="mt-2 grid grid-cols-2 gap-3">{(["CPF", "CNPJ"] as const).map((type) => <button key={type} type="button" onClick={() => { setDocumentType(type); setPayerDocument(""); setDocumentError(""); }} className={`min-h-12 rounded-xl border px-3 text-sm font-extrabold ${documentType === type ? "border-indigo-600 bg-indigo-50 text-indigo-800" : "border-slate-200 text-slate-600"}`}>{type === "CPF" ? "Pessoa física · CPF" : "Empresa · CNPJ"}</button>)}</div></fieldset><label className="mt-5 block text-sm font-bold">{documentType === "CPF" ? "CPF do pagador" : "CNPJ da empresa pagadora"}<input inputMode="numeric" value={payerDocument} onChange={(event) => { setPayerDocument(documentType === "CPF" ? formatCpf(event.target.value) : formatCnpj(event.target.value)); setDocumentError(""); }} placeholder={documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} className={`mt-2 min-h-12 w-full rounded-xl border px-3 outline-none focus:border-indigo-500 ${documentError ? "border-red-400 bg-red-50" : "border-slate-200"}`} /></label>{documentError && <p className="mt-2 text-sm font-medium text-red-700">{documentError}</p>}<p className="mt-3 text-xs leading-relaxed text-slate-500">O documento é usado somente pelo Mercado Pago para emitir o PIX e não aparece na sua lista B2C.</p><button onClick={generatePix} disabled={pixLoading} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">{pixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Gerar QR Code PIX</button><button onClick={() => openCardCheckout(pendingUnlimited ? "consumer_lead_monthly" : "consumer_lead_package", pendingUnlimited?.accessId ?? pendingOrder!.orderId)} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-indigo-300 px-4 py-3 font-bold text-indigo-700 hover:bg-indigo-50"><CreditCard className="h-4 w-4" />Pagar com cartão de crédito</button></> : <div className="mt-6 text-center"><img src={`data:image/png;base64,${pix.qrCodeBase64}`} className="mx-auto h-52 w-52" alt="QR Code PIX" /><p className="mt-4 font-black">PIX gerado com sucesso</p><p className="mt-1 text-xs text-slate-500">Pedido solicitado, verificando o PIX.</p><button onClick={() => navigator.clipboard.writeText(pix.qrCode).then(() => toast.success("Código PIX copiado"))} className="mt-4 min-h-12 w-full rounded-xl border border-indigo-300 px-4 py-3 text-sm font-bold text-indigo-700">Copiar código PIX</button></div>}</div></div>}
  </div>;
}

function ConsumerSelection({ results, loading, offset, onPrevious, onNext, onSave, saving, creditsRemaining, unlimited = false }: {
  results: { total: number; offset: number; hasMore: boolean; savedLeadIds: number[]; selectionLimit?: number; used?: number; remaining?: number; rows: Array<{ id: number; hasPhone: boolean; hasEmail: boolean }> } | undefined;
  loading: boolean;
  offset: number;
  onPrevious: () => void;
  onNext: () => void;
  onSave: (leadId: number) => void;
  saving: boolean;
  creditsRemaining?: number;
  unlimited?: boolean;
}) {
  if (loading) return <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" /></div>;
  if (!results) return null;
  const monthlyExhausted = unlimited && (results.remaining ?? 0) === 0;
  return <div className="mt-5"><div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="font-bold text-slate-900">{results.total.toLocaleString("pt-BR")} contatos disponíveis</span><span className="text-slate-600">{unlimited ? `${results.remaining ?? 0} de ${results.selectionLimit ?? 500} contatos restantes no plano` : `${creditsRemaining ?? 0} créditos restantes`}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{results.rows.map((lead, index) => { const saved = results.savedLeadIds.includes(lead.id); return <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-900">Contato B2C #{String(offset + index + 1).padStart(5, "0")}</p><p className="mt-1 text-xs text-slate-500">Dados revelados apenas após adicionar à sua lista.</p></div>{saved && <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-800">Salvo</span>}</div><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">{lead.hasPhone && <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-cyan-800">Telefone disponível</span>}{lead.hasEmail && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-800">E-mail disponível</span>}</div><button disabled={saved || saving || (!unlimited && (creditsRemaining ?? 0) === 0) || monthlyExhausted} onClick={() => onSave(lead.id)} className={saved || monthlyExhausted ? "mt-5 min-h-11 w-full rounded-xl bg-slate-100 text-sm font-bold text-slate-600" : "mt-5 min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"}>{saved ? "Já está na sua lista" : monthlyExhausted ? "Limite mensal atingido" : "Adicionar à minha lista"}</button></article>; })}</div><div className="mt-4 flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>Mostrando {results.rows.length ? `${results.offset + 1}–${results.offset + results.rows.length}` : "0"} de {results.total.toLocaleString("pt-BR")} contatos.</p><div className="flex gap-2"><button onClick={onPrevious} disabled={results.offset === 0} className="min-h-10 rounded-lg border border-slate-200 px-3 font-bold disabled:opacity-50">Anterior</button><button onClick={onNext} disabled={!results.hasMore} className="min-h-10 rounded-lg border border-slate-200 px-3 font-bold disabled:opacity-50">Próximos 50</button></div></div></div>;
}
