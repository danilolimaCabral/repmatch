import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, Building2, CheckCircle2, FileCheck2, Loader2, MapPin, QrCode, ShieldCheck, Target, Users } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";
const REGIONS = ["Nacional", "São Paulo", "Rio de Janeiro", "Minas Gerais", "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco", "Goiás", "Distrito Federal"];
const SEGMENTS = ["Tecnologia", "Agronegócio", "Alimentos e Bebidas", "Construção Civil", "Farmacêutico", "Automotivo", "Saúde e Médico", "Varejo", "Serviços", "Outro"];

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function LeadPackages() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [audience, setAudience] = useState<"b2b" | "b2c">("b2b");
  const [segment, setSegment] = useState("");
  const [region, setRegion] = useState("Nacional");
  const [notes, setNotes] = useState("");
  const [legalConsent, setLegalConsent] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{ orderId: number; price: number } | null>(null);
  const [cpf, setCpf] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pix, setPix] = useState<{ qrCode: string; qrCodeBase64: string } | null>(null);

  const { data: catalog, isLoading: catalogLoading } = trpc.leadPackages.catalog.useQuery();
  const { data: myOrders, refetch: refetchOrders } = trpc.leadPackages.myOrders.useQuery(undefined, { enabled: !!user, refetchInterval: 20_000 });
  const createOrder = trpc.leadPackages.createOrder.useMutation({
    onError: (error) => toast.error(error.message),
  });

  const currentPackage = useMemo(() => catalog?.[audience] ?? { quantity: 2000, price: audience === "b2b" ? 1490 : 990 }, [catalog, audience]);

  async function beginCheckout() {
    if (!user) {
      toast.info("Entre ou crie sua conta para solicitar o pacote.");
      navigate("/login");
      return;
    }
    if (!legalConsent) {
      toast.error("Confirme o uso responsável e compatível com a LGPD para continuar.");
      return;
    }
    const result = await createOrder.mutateAsync({ audience, segment: segment || undefined, region: region || undefined, notes: notes || undefined, legalConsent: true });
    setPendingOrder(result);
    setPix(null);
  }

  async function generatePix() {
    if (!pendingOrder || !user) return;
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) {
      toast.error("Informe um CPF válido com 11 dígitos para gerar o PIX.");
      return;
    }
    setPixLoading(true);
    try {
      const response = await fetch("/api/mp/lead-package-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: pendingOrder.orderId, userId: user.id, userEmail: user.email ?? "", userName: user.name ?? "Cliente RepMatch", cpf: digits }),
      });
      const data = await response.json();
      if (!response.ok || !data.qrCode) throw new Error(data.error ?? "Não foi possível gerar o PIX.");
      setPix({ qrCode: data.qrCode, qrCodeBase64: data.qrCodeBase64 });
      refetchOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar o PIX.");
    } finally {
      setPixLoading(false);
    }
  }

  const packageCopy = audience === "b2b"
    ? { title: "Leads B2B qualificados", subtitle: "Empresas e decisores para acelerar sua prospecção", icon: Building2, bullets: ["2.000 empresas para trabalhar", "Filtros por setor e região", "Briefing de público sob demanda"] }
    : { title: "Leads B2C segmentados", subtitle: "Público consumidor para campanhas e relacionamento", icon: Users, bullets: ["2.000 contatos segmentados", "Recorte por região e interesse", "Briefing de público sob demanda"] };
  const PackageIcon = packageCopy.icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("/")} className="flex min-w-0 items-center gap-2" aria-label="Voltar para início">
            <img src={LOGO_URL} className="h-8 w-auto" alt="RepMatch" />
            <span className="hidden text-sm font-semibold sm:inline">Pacotes de Leads</span>
          </button>
          <button onClick={() => navigate("/")} className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" />Voltar</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700"><Target className="h-3.5 w-3.5" />Prospecção sob medida</span>
          <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">Escolha o público certo para sua próxima campanha</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">Selecione um pacote de 2.000 leads, descreva o público desejado e receba uma proposta de entrega após análise e confirmação do PIX.</p>
        </section>

        <section className="mt-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="grid grid-cols-2 gap-3">
              {(["b2b", "b2c"] as const).map((type) => {
                const selected = audience === type;
                const Icon = type === "b2b" ? Building2 : Users;
                return <button key={type} onClick={() => setAudience(type)} className={`rounded-2xl border p-4 text-left transition-all ${selected ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                  <Icon className={`h-6 w-6 ${selected ? "text-emerald-600" : "text-slate-500"}`} />
                  <p className="mt-3 text-base font-extrabold">{type.toUpperCase()}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{type === "b2b" ? "Empresas e decisores" : "Consumidores segmentados"}</p>
                </button>;
              })}
            </div>

            <div className="mt-7 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><PackageIcon className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-black">{packageCopy.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{packageCopy.subtitle}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">Segmento
                <select value={segment} onChange={(event) => setSegment(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-emerald-500">
                  <option value="">Todos os segmentos</option>{SEGMENTS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-semibold text-slate-700">Região
                <select value={region} onChange={(event) => setRegion(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-emerald-500">
                  {REGIONS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm font-semibold text-slate-700">Detalhes do público desejado <span className="font-normal text-slate-400">(opcional)</span>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000} rows={3} placeholder="Ex.: decisores de RH em indústrias de médio porte" className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500" />
            </label>
            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
              <input type="checkbox" checked={legalConsent} onChange={(event) => setLegalConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
              <span>Confirmo que usarei os dados exclusivamente para finalidades legítimas, com transparência e em conformidade com a LGPD. A disponibilização do lote está sujeita a análise e disponibilidade.</span>
            </label>
          </div>

          <aside className="rounded-3xl border border-emerald-200 bg-emerald-950 p-5 text-white shadow-xl sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Seu pacote</p>
            <div className="mt-5 flex items-end justify-between gap-3"><div><p className="text-4xl font-black">2.000</p><p className="mt-1 text-sm text-emerald-100">leads {audience.toUpperCase()} para trabalhar</p></div><PackageIcon className="h-10 w-10 text-emerald-300" /></div>
            <div className="mt-6 border-t border-white/15 pt-5">
              {packageCopy.bullets.map((item) => <div key={item} className="mb-3 flex items-center gap-2 text-sm text-emerald-50"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />{item}</div>)}
            </div>
            <div className="mt-6 rounded-2xl bg-white/10 p-4"><p className="text-xs text-emerald-100">Investimento do pacote</p><p className="mt-1 text-3xl font-black">{catalogLoading ? "..." : formatBRL(currentPackage.price)}</p><p className="mt-1 text-xs text-emerald-100">Preço configurado para novos pedidos</p></div>
            <button onClick={beginCheckout} disabled={createOrder.isPending || catalogLoading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50 disabled:opacity-60">
              {createOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Solicitar pacote por PIX
            </button>
            <div className="mt-4 flex gap-2 text-xs leading-relaxed text-emerald-100"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />Pagamento confirmado segue para aprovação e entrega manual. Não há entrega automática de dados.</div>
          </aside>
        </section>

        {user && myOrders && myOrders.length > 0 && <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Meus pedidos de leads</h2><div className="mt-4 space-y-3">{myOrders.slice(0, 5).map((order) => <div key={order.id} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{order.quantity.toLocaleString("pt-BR")} leads {order.audience.toUpperCase()}</p><p className="mt-0.5 text-xs text-slate-500">{order.segment || "Todos os segmentos"} · {order.region || "Nacional"}</p></div><span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{order.status === "pending_payment" ? "Aguardando PIX" : order.status === "pending_approval" ? "PIX confirmado — em análise" : order.status === "approved" ? "Em preparação" : order.status === "delivered" ? "Entregue" : order.status}</span></div>)}</div></section>}
      </main>

      {pendingOrder && <div className="fixed inset-0 z-50 flex items-end bg-slate-950/50 p-0 sm:items-center sm:justify-center sm:p-4"><div className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-7"><div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-black">Pagamento do pacote</h2><p className="mt-1 text-sm text-slate-600">{audience.toUpperCase()} · 2.000 leads · {formatBRL(pendingOrder.price)}</p></div><button onClick={() => setPendingOrder(null)} className="text-2xl text-slate-400">×</button></div>{!pix ? <><label className="mt-6 block text-sm font-semibold">CPF do pagador<input inputMode="numeric" value={cpf} onChange={(event) => setCpf(event.target.value)} placeholder="000.000.000-00" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-emerald-500" /></label><button onClick={generatePix} disabled={pixLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-60">{pixLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}Gerar QR Code PIX</button></> : <div className="mt-6 text-center"><img src={`data:image/png;base64,${pix.qrCodeBase64}`} className="mx-auto h-52 w-52" alt="QR Code PIX" /><p className="mt-4 text-sm font-semibold">PIX gerado com sucesso</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Após a confirmação, seu pedido ficará em análise para entrega manual.</p><button onClick={() => navigator.clipboard.writeText(pix.qrCode).then(() => toast.success("Código PIX copiado"))} className="mt-4 w-full rounded-xl border border-emerald-300 px-4 py-3 text-sm font-bold text-emerald-700">Copiar código PIX</button></div>}</div></div>}
    </div>
  );
}
