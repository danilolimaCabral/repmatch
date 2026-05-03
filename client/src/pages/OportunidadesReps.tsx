import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Briefcase, DollarSign, Clock, Search, ChevronLeft, ChevronRight,
  Loader2, Target, ArrowRight, Shield, Award
} from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const REGIONS = [
  "São Paulo - Capital", "São Paulo - Interior", "Rio de Janeiro", "Minas Gerais",
  "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco",
  "Ceará", "Goiás", "Mato Grosso do Sul", "Mato Grosso", "Pará", "Maranhão",
  "Espírito Santo", "Amazonas", "Rio Grande do Norte", "Piauí", "Alagoas",
  "Sergipe", "Rondônia", "Tocantins", "Acre", "Amapá", "Roraima",
];

const SEGMENTS = [
  "Alimentos e Bebidas", "Farmacêutico", "Cosméticos e Higiene", "Tecnologia",
  "Construção Civil", "Têxtil e Vestuário", "Automotivo", "Agronegócio",
  "Saúde e Médico", "Eletroeletrônicos", "Moveleiro", "Educação",
  "Financeiro", "Logística", "Varejo", "Indústria Química",
];

const AVAILABILITY_LABEL: Record<string, string> = {
  imediata: "Disponível Agora",
  "30dias": "Em 30 dias",
  "60dias": "Em 60 dias",
  negociavel: "Negociável",
};

const AVAILABILITY_COLOR: Record<string, string> = {
  imediata: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "30dias": "bg-blue-50 text-blue-700 border-blue-200",
  "60dias": "bg-amber-50 text-amber-700 border-amber-200",
  negociavel: "bg-slate-50 text-slate-600 border-slate-200",
};

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`;
  return d.toLocaleDateString("pt-BR");
}

export default function OportunidadesReps() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [region, setRegion] = useState("");
  const [segment, setSegment] = useState("");
  const [availability, setAvailability] = useState<"" | "imediata" | "30dias" | "60dias" | "negociavel">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryInput = useMemo(() => ({
    region: region || undefined,
    segment: segment || undefined,
    availability: availability || undefined,
    page,
    limit: 18,
  }), [region, segment, availability, page]);

  const { data, isLoading } = trpc.opportunities.listPublic.useQuery(queryInput);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 18);

  const filtered = search
    ? items.filter(o =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        (o.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (o.repName ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : items;

  const resetFilters = () => {
    setRegion("");
    setSegment("");
    setAvailability("");
    setSearch("");
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
          </button>
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-500">
            <Target className="w-4 h-4 text-emerald-600" />
            <span>Representantes publicando disponibilidade</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/dashboard/company")}>
                Meu Painel
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" className="border-slate-200 text-slate-700" onClick={() => navigate("/login")}>
                  Entrar
                </Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/register")}>
                  Cadastrar
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1.5 text-emerald-400 text-sm font-medium mb-4">
            <Target className="w-4 h-4" />
            Representantes disponíveis para contratação
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3">
            Encontre Representantes <span className="text-emerald-400">Disponíveis</span>
          </h1>
          <p className="text-slate-300 text-lg mb-6">
            Representantes comerciais publicando sua disponibilidade para novas parcerias.
            Filtre por região, segmento e disponibilidade.
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-400" /> Perfis verificados</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-amber-400" /> CORE validado</span>
            <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-blue-400" />{total} disponíveis agora</span>
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              className="pl-9 h-9 border-slate-200 text-sm"
              placeholder="Buscar por título, segmento ou nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={region} onValueChange={v => { setRegion(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-48 h-9 border-slate-200 text-sm">
              <SelectValue placeholder="Região" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as regiões</SelectItem>
              {REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={segment} onValueChange={v => { setSegment(v === "all" ? "" : v); setPage(1); }}>
            <SelectTrigger className="w-48 h-9 border-slate-200 text-sm">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os segmentos</SelectItem>
              {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={availability} onValueChange={v => { setAvailability(v === "all" ? "" : v as typeof availability); setPage(1); }}>
            <SelectTrigger className="w-44 h-9 border-slate-200 text-sm">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer disponibilidade</SelectItem>
              <SelectItem value="imediata">Disponível Agora</SelectItem>
              <SelectItem value="30dias">Em 30 dias</SelectItem>
              <SelectItem value="60dias">Em 60 dias</SelectItem>
              <SelectItem value="negociavel">Negociável</SelectItem>
            </SelectContent>
          </Select>
          {(region || segment || availability || search) && (
            <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700 h-9" onClick={resetFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500">
            {isLoading ? "Carregando..." : `${total} oportunidade${total !== 1 ? "s" : ""} encontrada${total !== 1 ? "s" : ""}`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <Target className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma oportunidade encontrada</h3>
            <p className="text-slate-500 text-sm mb-6">Tente ajustar os filtros ou cadastre-se para receber alertas</p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate("/register")}>
              Cadastrar-se gratuitamente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((opp) => (
              <div key={opp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">{opp.title}</h3>
                    {opp.repName && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {opp.repName.split(" ")[0]} {opp.repName.split(" ").slice(-1)[0]}
                        {(opp.repExperienceYears ?? 0) > 0 && ` · ${opp.repExperienceYears} anos de exp.`}
                      </p>
                    )}
                  </div>
                  {opp.availability && (
                    <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full border ${AVAILABILITY_COLOR[opp.availability] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                      {AVAILABILITY_LABEL[opp.availability]}
                    </span>
                  )}
                </div>

                {/* Description */}
                {opp.description && (
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">{opp.description}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {opp.region && (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">
                      <MapPin className="w-3 h-3" />{opp.region}
                    </span>
                  )}
                  {opp.segment && (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2 py-0.5">
                      <Briefcase className="w-3 h-3" />{opp.segment}
                    </span>
                  )}
                  {opp.expectedCommission && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
                      <DollarSign className="w-3 h-3" />{opp.expectedCommission}
                    </span>
                  )}
                  {opp.workModel && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                      {{ exclusivo: "Exclusivo", multiplas: "Múltiplas empresas", indifferente: "Indiferente" }[opp.workModel]}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{timeAgo(opp.createdAt)}
                  </span>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                    onClick={() => navigate(user ? "/dashboard/company" : "/register")}
                  >
                    {user ? "Ver contato" : "Entrar em contato"} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-slate-600">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* CTA for guests */}
        {!user && filtered.length > 0 && (
          <div className="mt-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-black mb-2">Encontrou o representante ideal?</h2>
            <p className="text-emerald-100 mb-6">Cadastre-se gratuitamente para ver o contato completo e iniciar a conversa</p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold" onClick={() => navigate("/register")}>
                Criar conta grátis
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                Já tenho conta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
