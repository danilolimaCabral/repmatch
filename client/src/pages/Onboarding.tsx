import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Users, Loader2, CheckCircle, Briefcase, MapPin, Clock, Link, Search, BadgeCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const REGIONS = [
  "São Paulo - Capital", "São Paulo - Interior", "Rio de Janeiro", "Minas Gerais",
  "Paraná", "Santa Catarina", "Rio Grande do Sul", "Bahia", "Pernambuco",
  "Ceará", "Goiás", "Mato Grosso", "Mato Grosso do Sul", "Espírito Santo",
  "Pará", "Amazonas", "Maranhão", "Piauí", "Alagoas", "Sergipe",
  "Rio Grande do Norte", "Paraíba", "Tocantins", "Rondônia", "Acre",
  "Amapá", "Roraima", "Distrito Federal", "Nacional (Todo Brasil)",
];

const SEGMENTS = [
  "Alimentos e Bebidas", "Farmacêutico", "Cosméticos e Higiene", "Tecnologia",
  "Construção Civil", "Têxtil e Moda", "Automotivo", "Agronegócio",
  "Saúde e Médico", "Eletroeletrônicos", "Móveis e Decoração",
  "Serviços Financeiros", "Educação", "Logística", "Outros",
];

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"choose" | "rep-form" | "company-form">("choose");
  const [userType, setUserType] = useState<"representative" | "company" | null>(null);

  // Rep form state
  const [repForm, setRepForm] = useState({
    fullName: user?.name ?? "",
    phone: "",
    region: "",
    segment: "",
    experienceYears: 0,
    bio: "",
    availability: "negociavel" as "imediata" | "30dias" | "60dias" | "negociavel",
    workModel: "multiplas" as "exclusivo" | "multiplas" | "indifferente",
    additionalSegments: "",
    cities: "",
    linkedinUrl: "",
  });

  // Company form state
  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    cnpj: "",
    segment: "",
    region: "",
    phone: "",
    description: "",
  });
  const [cnpjVerified, setCnpjVerified] = useState(false);
  const [cnpjLookupCnpj, setCnpjLookupCnpj] = useState("");

  const cnpjQuery = trpc.companies.lookupCnpj.useQuery(
    { cnpj: cnpjLookupCnpj },
    {
      enabled: cnpjLookupCnpj.replace(/\D/g, "").length === 14,
      retry: false,
    }
  );

  // React to CNPJ query result
  useEffect(() => {
    if (cnpjQuery.isSuccess && cnpjQuery.data) {
      const data = cnpjQuery.data;
      setCompanyForm((prev) => ({
        ...prev,
        companyName: prev.companyName || data.razaoSocial || data.nomeFantasia,
        phone: prev.phone || data.telefone,
      }));
      setCnpjVerified(true);
      toast.success(`CNPJ verificado: ${data.razaoSocial || data.nomeFantasia}`);
    }
  }, [cnpjQuery.isSuccess, cnpjQuery.data]);

  useEffect(() => {
    if (cnpjQuery.isError && cnpjLookupCnpj) {
      setCnpjVerified(false);
      toast.error(cnpjQuery.error?.message || "CNPJ não encontrado");
    }
  }, [cnpjQuery.isError, cnpjQuery.error, cnpjLookupCnpj]);

  // LGPD consent state
  const [lgpdConsent, setLgpdConsent] = useState(false);

  const setTypeMutation = trpc.onboarding.setUserType.useMutation();
  const completeRepMutation = trpc.onboarding.completeRepProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil criado com sucesso!");
      navigate("/dashboard/rep");
    },
    onError: (e) => toast.error(e.message),
  });
  const completeCompanyMutation = trpc.onboarding.completeCompanyProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil da empresa criado!");
      navigate("/dashboard/company");
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleChooseType = async (type: "representative" | "company") => {
    setUserType(type);
    await setTypeMutation.mutateAsync({ userType: type });
    setStep(type === "representative" ? "rep-form" : "company-form");
  };

  const handleRepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar");
      return;
    }
    if (!repForm.region || !repForm.segment) {
      toast.error("Preencha região e segmento");
      return;
    }
    completeRepMutation.mutate({
      fullName: repForm.fullName || user?.name || "Representante",
      phone: repForm.phone || undefined,
      region: repForm.region,
      segment: repForm.segment,
      experienceYears: Number(repForm.experienceYears),
      bio: repForm.bio || undefined,
      availability: repForm.availability,
      workModel: repForm.workModel,
      additionalSegments: repForm.additionalSegments || undefined,
      cities: repForm.cities || undefined,
      linkedinUrl: repForm.linkedinUrl || undefined,
    });
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lgpdConsent) {
      toast.error("Você precisa aceitar os Termos de Uso e a Política de Privacidade para continuar");
      return;
    }
    if (!companyForm.companyName || !companyForm.segment) {
      toast.error("Preencha nome da empresa e segmento");
      return;
    }
    completeCompanyMutation.mutate(companyForm);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-center">
        <img src={LOGO_URL} alt="RepMatch" className="h-8 object-contain" />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Step: Choose Type */}
          {step === "choose" && (
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Bem-vindo ao RepMatch!</h1>
              <p className="text-muted-foreground mb-10">Como você vai usar a plataforma?</p>

              <div className="grid grid-cols-2 gap-6">
                <button
                  onClick={() => handleChooseType("company")}
                  disabled={setTypeMutation.isPending}
                  className="group rounded-2xl border-2 border-border bg-card p-8 text-center hover:border-primary transition-all cursor-pointer disabled:opacity-50"
                >
                  <Building2 className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-lg mb-2">Sou Empresa</div>
                  <div className="text-sm text-muted-foreground">Quero encontrar representantes comerciais</div>
                </button>

                <button
                  onClick={() => handleChooseType("representative")}
                  disabled={setTypeMutation.isPending}
                  className="group rounded-2xl border-2 border-border bg-card p-8 text-center hover:border-primary transition-all cursor-pointer disabled:opacity-50"
                >
                  <Users className="w-12 h-12 text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-lg mb-2">Sou Representante</div>
                  <div className="text-sm text-muted-foreground">Quero encontrar empresas para representar</div>
                </button>
              </div>

              {setTypeMutation.isPending && (
                <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configurando...</span>
                </div>
              )}
            </div>
          )}

          {/* Step: Rep Form */}
          {step === "rep-form" && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-400/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Complete seu perfil</h1>
                  <p className="text-muted-foreground text-sm">Representante Comercial</p>
                </div>
              </div>

              <form onSubmit={handleRepSubmit} className="space-y-5">
                <div>
                  <Label>Nome completo *</Label>
                  <Input
                    value={repForm.fullName}
                    onChange={(e) => setRepForm({ ...repForm, fullName: e.target.value })}
                    placeholder="Seu nome completo"
                    className="mt-1 bg-secondary border-border"
                    required
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={repForm.phone}
                    onChange={(e) => setRepForm({ ...repForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Região de atuação *</Label>
                    <Select onValueChange={(v) => setRepForm({ ...repForm, region: v })}>
                      <SelectTrigger className="mt-1 bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Segmento *</Label>
                    <Select onValueChange={(v) => setRepForm({ ...repForm, segment: v })}>
                      <SelectTrigger className="mt-1 bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Anos de experiência</Label>
                  <Input
                    type="number"
                    min={0}
                    max={50}
                    value={repForm.experienceYears}
                    onChange={(e) => setRepForm({ ...repForm, experienceYears: Number(e.target.value) })}
                    className="mt-1 bg-secondary border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Disponibilidade</Label>
                    <Select value={repForm.availability} onValueChange={(v: "imediata" | "30dias" | "60dias" | "negociavel") => setRepForm({ ...repForm, availability: v })}>
                      <SelectTrigger className="mt-1 bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imediata">Imediata</SelectItem>
                        <SelectItem value="30dias">Em 30 dias</SelectItem>
                        <SelectItem value="60dias">Em 60 dias</SelectItem>
                        <SelectItem value="negociavel">Negociável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Modelo de trabalho</Label>
                    <Select value={repForm.workModel} onValueChange={(v: "exclusivo" | "multiplas" | "indifferente") => setRepForm({ ...repForm, workModel: v })}>
                      <SelectTrigger className="mt-1 bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusivo">Exclusivo</SelectItem>
                        <SelectItem value="multiplas">Múltiplas empresas</SelectItem>
                        <SelectItem value="indifferente">Indiferente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Cidades/regiões de atuação</Label>
                  <Input
                    value={repForm.cities}
                    onChange={(e) => setRepForm({ ...repForm, cities: e.target.value })}
                    placeholder="Ex: Curitiba, Londrina, Maringá..."
                    className="mt-1 bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label>Segmentos adicionais</Label>
                  <Input
                    value={repForm.additionalSegments}
                    onChange={(e) => setRepForm({ ...repForm, additionalSegments: e.target.value })}
                    placeholder="Ex: Farmacêutico, Cosméticos..."
                    className="mt-1 bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-1"><Link className="w-3 h-3" /> LinkedIn (opcional)</Label>
                  <Input
                    value={repForm.linkedinUrl}
                    onChange={(e) => setRepForm({ ...repForm, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/seu-perfil"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label>Bio / Apresentação</Label>
                  <Textarea
                    value={repForm.bio}
                    onChange={(e) => setRepForm({ ...repForm, bio: e.target.value })}
                    placeholder="Descreva sua experiência, produtos que já vendeu, diferenciais..."
                    className="mt-1 bg-secondary border-border"
                    rows={3}
                  />
                </div>

                {/* LGPD Consent */}
                <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="lgpd-consent-rep"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-green-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="lgpd-consent-rep" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    Li e concordo com os{" "}
                    <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline font-medium">Termos de Uso</a>{" "}
                    e a{" "}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline font-medium">Política de Privacidade</a>,
                    incluindo o tratamento dos meus dados pessoais conforme a LGPD (Lei 13.709/2018).
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold py-6"
                  disabled={completeRepMutation.isPending || !lgpdConsent}
                >
                  {completeRepMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando perfil...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" />Criar meu perfil</>
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Step: Company Form */}
          {step === "company-form" && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Complete o perfil da empresa</h1>
                  <p className="text-muted-foreground text-sm">Empresa / Indústria</p>
                </div>
              </div>

              <form onSubmit={handleCompanySubmit} className="space-y-5">
                <div>
                  <Label>Nome da empresa *</Label>
                  <Input
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    placeholder="Razão social ou nome fantasia"
                    className="mt-1 bg-secondary border-border"
                    required
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    CNPJ
                    {cnpjVerified && (
                      <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={companyForm.cnpj}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCompanyForm({ ...companyForm, cnpj: val });
                        setCnpjVerified(false);
                      }}
                      placeholder="00.000.000/0001-00"
                      className="bg-secondary border-border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      disabled={companyForm.cnpj.replace(/\D/g, "").length !== 14 || cnpjQuery.isFetching}
                      onClick={() => setCnpjLookupCnpj(companyForm.cnpj)}
                      title="Consultar CNPJ"
                    >
                      {cnpjQuery.isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                  {cnpjQuery.data && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {cnpjQuery.data.razaoSocial} · {cnpjQuery.data.situacao} · {cnpjQuery.data.municipio}/{cnpjQuery.data.uf}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Segmento *</Label>
                    <Select onValueChange={(v) => setCompanyForm({ ...companyForm, segment: v })}>
                      <SelectTrigger className="mt-1 bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Região</Label>
                    <Select onValueChange={(v) => setCompanyForm({ ...companyForm, region: v })}>
                      <SelectTrigger className="mt-1 bg-secondary border-border">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    placeholder="(11) 3000-0000"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label>Descrição da empresa</Label>
                  <Textarea
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    placeholder="Descreva sua empresa, produtos, mercado de atuação..."
                    className="mt-1 bg-secondary border-border"
                    rows={4}
                  />
                </div>

                {/* LGPD Consent */}
                <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-lg border border-border">
                  <input
                    type="checkbox"
                    id="lgpd-consent-company"
                    checked={lgpdConsent}
                    onChange={(e) => setLgpdConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-green-500 cursor-pointer shrink-0"
                  />
                  <label htmlFor="lgpd-consent-company" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    Li e concordo com os{" "}
                    <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline font-medium">Termos de Uso</a>{" "}
                    e a{" "}
                    <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline font-medium">Política de Privacidade</a>,
                    incluindo o tratamento dos meus dados pessoais conforme a LGPD (Lei 13.709/2018).
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold py-6"
                  disabled={completeCompanyMutation.isPending || !lgpdConsent}
                >
                  {completeCompanyMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando empresa...</>
                  ) : (
                    <><CheckCircle className="w-4 h-4 mr-2" />Criar perfil da empresa</>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
