import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, MapPin, Phone, Mail, Search, ChevronLeft, ChevronRight, Users, Filter, X } from "lucide-react";

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"
];

const PORTE_MAP: Record<string, string> = {
  "MEI": "MEI",
  "ME": "Microempresa",
  "EPP": "Pequeno Porte",
  "Demais": "Médio/Grande",
};

const CNAE_MAP: Record<string, string> = {
  "4611700": "Matérias-primas agrícolas",
  "4612500": "Combustíveis e químicos",
  "4613300": "Madeira e construção",
  "4614100": "Máquinas e equipamentos",
  "4615000": "Eletrodomésticos e TI",
  "4616800": "Têxteis e vestuário",
  "4617600": "Produtos farmacêuticos",
  "4618401": "Medicamentos e insumos",
  "4618402": "Instrumentos médico-hosp.",
  "4618403": "Jornais e publicações",
  "4618499": "Outros especializados",
  "4619200": "Mercadorias em geral",
};

export default function BaseCNPJ() {
  const [query, setQuery] = useState("");
  const [uf, setUf] = useState<string>("");
  const [cnae, setCnae] = useState<string>("");
  const [porte, setPorte] = useState<string>("");
  const [page, setPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<{ query: string; uf: string; cnae: string; porte: string }>({
    query: "", uf: "", cnae: "", porte: "",
  });

  const searchInput = useMemo(() => ({
    query: activeFilters.query || undefined,
    uf: activeFilters.uf || undefined,
    cnae: activeFilters.cnae || undefined,
    porte: activeFilters.porte || undefined,
    page,
    limit: 20,
  }), [activeFilters, page]);

  const { data, isLoading } = trpc.cnpjBase.search.useQuery(searchInput);
  const { data: stats } = trpc.cnpjBase.stats.useQuery();

  function handleSearch() {
    setActiveFilters({ query, uf, cnae, porte });
    setPage(1);
  }

  function clearFilters() {
    setQuery("");
    setUf("");
    setCnae("");
    setPorte("");
    setActiveFilters({ query: "", uf: "", cnae: "", porte: "" });
    setPage(1);
  }

  const hasFilters = activeFilters.query || activeFilters.uf || activeFilters.cnae || activeFilters.porte;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Base Nacional de Representantes</h1>
              <p className="text-sm text-muted-foreground">
                {stats ? (
                  <span><strong className="text-emerald-500">{stats.total.toLocaleString("pt-BR")}</strong> representantes comerciais ativos no Brasil (Receita Federal)</span>
                ) : (
                  "Carregando estatísticas..."
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {stats.byPorte.map(p => (
              <Card key={p.porte} className="border-0 bg-card/50">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-foreground">{Number(p.count).toLocaleString("pt-BR")}</div>
                  <div className="text-xs text-muted-foreground mt-1">{PORTE_MAP[p.porte ?? ""] ?? p.porte}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Search bar */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou município..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="pl-9"
              />
            </div>
            <Select value={uf} onValueChange={setUf}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os estados</SelectItem>
                {UF_LIST.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cnae} onValueChange={setCnae}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os segmentos</SelectItem>
                {Object.entries(CNAE_MAP).map(([code, label]) => (
                  <SelectItem key={code} value={code}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={porte} onValueChange={setPorte}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Porte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Todos os portes</SelectItem>
                {Object.entries(PORTE_MAP).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            {hasFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{data.total.toLocaleString("pt-BR")}</strong> resultados encontrados
                {hasFilters && " com os filtros aplicados"}
              </p>
              <p className="text-sm text-muted-foreground">
                Página {data.page} de {data.totalPages.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {data.items.map(rep => (
                <Card key={rep.id} className="border border-border/50 hover:border-emerald-500/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {rep.nomeFantasia || rep.razaoSocial || "—"}
                        </h3>
                        {rep.nomeFantasia && rep.razaoSocial && (
                          <p className="text-xs text-muted-foreground truncate">{rep.razaoSocial}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {rep.porte === "MEI" ? "MEI" : rep.porte === "ME" ? "ME" : rep.porte === "EPP" ? "EPP" : rep.porte ?? "—"}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {(rep.municipio || rep.uf) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{[rep.municipio, rep.uf].filter(Boolean).join(" — ")}</span>
                        </div>
                      )}
                      {rep.cnaeDescricao && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{rep.cnaeDescricao}</span>
                        </div>
                      )}
                      {rep.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{rep.telefone}</span>
                        </div>
                      )}
                      {rep.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3 h-3 shrink-0" />
                          <a href={`mailto:${rep.email}`} className="truncate text-emerald-500 hover:underline" onClick={e => e.stopPropagation()}>
                            {rep.email}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">{rep.cnpj}</span>
                      {rep.isMei === 1 && (
                        <Badge className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">MEI</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-4">
                {page} / {data.totalPages.toLocaleString("pt-BR")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Nenhum representante encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
