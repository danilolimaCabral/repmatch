import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Building2, Users, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/repmatch-logo_d1cd60d4.png";

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
    if (!repForm.region || !repForm.segment) {
      toast.error("Preencha região e segmento");
      return;
    }
    completeRepMutation.mutate({
      ...repForm,
      fullName: repForm.fullName || user?.name || "Representante",
      experienceYears: Number(repForm.experienceYears),
    });
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

                <div>
                  <Label>Bio / Apresentação</Label>
                  <Textarea
                    value={repForm.bio}
                    onChange={(e) => setRepForm({ ...repForm, bio: e.target.value })}
                    placeholder="Descreva sua experiência, produtos que já vendeu, diferenciais..."
                    className="mt-1 bg-secondary border-border"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold py-6"
                  disabled={completeRepMutation.isPending}
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
                  <Label>CNPJ</Label>
                  <Input
                    value={companyForm.cnpj}
                    onChange={(e) => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="mt-1 bg-secondary border-border"
                  />
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

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold py-6"
                  disabled={completeCompanyMutation.isPending}
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
