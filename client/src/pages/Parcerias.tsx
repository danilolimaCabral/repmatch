import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowLeft, Star, Shield, Award, Zap, Users, TrendingUp, Gift } from "lucide-react";

const LOGO_URL = "/manus-storage/repmatch-logo-nobg_ec328e76.png";

const ACTIVE_PARTNERS = [
  {
    name: "CORE",
    fullName: "Conselho dos Representantes Comerciais",
    logo: null,
    initials: "CORE",
    color: "bg-blue-600",
    description: "Cadastro no CORE reconhecido e validado automaticamente pela plataforma. Representantes com CORE ativo ganham destaque no perfil e maior credibilidade junto às empresas.",
    benefits: [
      "Selo CORE verificado no perfil",
      "Destaque nos resultados de busca",
      "Maior confiança das empresas contratantes",
      "Validação automática do número de registro",
    ],
    tag: "Parceiro Oficial",
    tagColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
];

const COMING_SOON_PARTNERS = [
  {
    name: "SEBRAE",
    initials: "SE",
    color: "bg-orange-500",
    description: "Capacitação e cursos gratuitos para representantes comerciais parceiros RepMatch.",
    benefit: "Cursos e capacitação gratuita",
  },
  {
    name: "Mercado Pago",
    initials: "MP",
    color: "bg-sky-500",
    description: "Receba suas comissões com segurança e rapidez via Pix e transferência bancária.",
    benefit: "Recebimento de comissões",
  },
  {
    name: "Serasa",
    initials: "SR",
    color: "bg-purple-600",
    description: "Consulta gratuita de CNPJ das empresas antes de fechar negócio.",
    benefit: "Consulta de crédito gratuita",
  },
  {
    name: "Contabilizei",
    initials: "CT",
    color: "bg-green-600",
    description: "Abertura de MEI/CNPJ com desconto exclusivo para representantes RepMatch.",
    benefit: "Abertura de CNPJ com desconto",
  },
  {
    name: "Porto Seguro",
    initials: "PS",
    color: "bg-red-600",
    description: "Seguro de vida e acidentes pessoais com condições especiais para representantes.",
    benefit: "Seguro de vida com desconto",
  },
  {
    name: "Vivo Empresas",
    initials: "VI",
    color: "bg-violet-600",
    description: "Planos de celular empresarial com desconto para representantes cadastrados.",
    benefit: "Plano celular com desconto",
  },
  {
    name: "iFood para Empresas",
    initials: "IF",
    color: "bg-red-500",
    description: "Créditos mensais no iFood para representantes ativos na plataforma.",
    benefit: "Créditos mensais iFood",
  },
  {
    name: "Localiza",
    initials: "LC",
    color: "bg-yellow-500",
    description: "Aluguel de veículos com tarifas especiais para representantes em viagens comerciais.",
    benefit: "Aluguel de carro com desconto",
  },
];

export default function Parcerias() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1 as any)}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <img src={LOGO_URL} alt="RepMatch" className="h-7 object-contain" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-sm font-semibold px-4 py-2 rounded-full mb-5">
            <Star className="w-4 h-4" />
            Ecossistema RepMatch
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Parcerias que impulsionam<br />
            <span className="text-emerald-600">sua carreira como representante</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Ao se cadastrar gratuitamente no RepMatch, você acessa um ecossistema completo de parceiros
            que oferecem benefícios exclusivos para representantes comerciais.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-14">
          {[
            { icon: Users, value: "100% Gratuito", label: "Cadastro e acesso", color: "text-emerald-600" },
            { icon: Shield, value: "CORE Verificado", label: "Credencial reconhecida", color: "text-blue-600" },
            { icon: Gift, value: "9+ Parceiros", label: "Benefícios exclusivos", color: "text-purple-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
              <stat.icon className={`w-8 h-8 mx-auto mb-3 ${stat.color}`} />
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Active Partners */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Parceiros Ativos</h2>
            <Badge className="bg-emerald-100 text-emerald-700 border-0">Disponível agora</Badge>
          </div>

          {ACTIVE_PARTNERS.map((partner) => (
            <div key={partner.name} className="bg-white rounded-2xl border-2 border-emerald-200 p-8 shadow-sm mb-4">
              <div className="flex items-start gap-6">
                <div className={`w-16 h-16 rounded-2xl ${partner.color} flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                  {partner.initials}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-2xl font-bold text-slate-900">{partner.name}</h3>
                    <Badge className={`${partner.tagColor} border text-xs font-semibold`}>
                      <Award className="w-3 h-3 mr-1" />
                      {partner.tag}
                    </Badge>
                  </div>
                  <p className="text-slate-500 text-sm mb-1 font-medium">{partner.fullName}</p>
                  <p className="text-slate-600 mb-5">{partner.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {partner.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Partners */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">Em breve</h2>
            <Badge className="bg-slate-100 text-slate-500 border-0">Chegando em breve</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {COMING_SOON_PARTNERS.map((partner) => (
              <div key={partner.name} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm opacity-80 relative overflow-hidden">
                <div className="absolute top-3 right-3">
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Em breve
                  </Badge>
                </div>
                <div className="flex items-start gap-4 pr-20">
                  <div className={`w-11 h-11 rounded-xl ${partner.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {partner.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">{partner.name}</h3>
                    <p className="text-xs text-slate-500 mb-2">{partner.description}</p>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                      <Zap className="w-3 h-3" />
                      {partner.benefit}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-10 text-center text-white">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-bold mb-3">Faça parte do ecossistema RepMatch</h2>
          <p className="text-emerald-100 mb-6 max-w-lg mx-auto">
            Cadastre-se gratuitamente e tenha acesso imediato ao CORE verificado e a todos os benefícios de parceria assim que forem lançados.
          </p>
          <Button
            onClick={() => navigate("/register")}
            className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-3 text-base"
          >
            Cadastrar gratuitamente
          </Button>
        </div>

      </div>
    </div>
  );
}
