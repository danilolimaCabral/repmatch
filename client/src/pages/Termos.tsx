import { Link } from "wouter";
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Ban, Scale, Shield } from "lucide-react";

const COMPANY_NAME = "RepMatch";
const COMPANY_EMAIL = "contato@repmatch.com.br";
const LAST_UPDATE = "30 de abril de 2026";

export default function Termos() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Termos de Uso</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-6">
            <FileText className="w-4 h-4" />
            Termos e Condições de Uso
          </div>
          <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
          <p className="text-muted-foreground">
            Última atualização: <strong>{LAST_UPDATE}</strong>
          </p>
          <p className="text-muted-foreground mt-2">
            Ao se cadastrar ou utilizar o <strong>{COMPANY_NAME}</strong>, você declara ter lido, compreendido
            e concordado com estes Termos de Uso. Se não concordar, não utilize a plataforma.
          </p>
        </div>

        <div className="space-y-10">

          <Section icon={<FileText className="w-5 h-5 text-green-500" />} title="1. Sobre o RepMatch">
            <p>
              O <strong>RepMatch</strong> é um marketplace digital que conecta <strong>representantes comerciais autônomos</strong>{" "}
              a <strong>empresas</strong> que buscam expandir sua força de vendas. A plataforma oferece:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Perfis públicos de representantes com filtros por região e segmento</li>
              <li>Publicação e busca de vagas para representação comercial</li>
              <li>Sistema de desbloqueio de contato direto</li>
              <li>Planos de assinatura para representantes e empresas</li>
            </ul>
            <p className="mt-3">
              O RepMatch atua como <strong>intermediário tecnológico</strong> e não é parte nos contratos
              de representação comercial firmados entre usuários.
            </p>
          </Section>

          <Section icon={<Shield className="w-5 h-5 text-green-500" />} title="2. Elegibilidade e Cadastro">
            <ul className="list-disc pl-6 space-y-2">
              <li>Você deve ter <strong>18 anos ou mais</strong> para usar a plataforma</li>
              <li>Pessoas jurídicas devem ser representadas por pessoa física autorizada</li>
              <li>Cada usuário pode ter apenas <strong>uma conta ativa</strong></li>
              <li>Você é responsável pela veracidade e atualização das informações cadastradas</li>
              <li>O cadastro é feito com e-mail e senha — você é responsável pela segurança e sigilo da sua senha</li>
              <li>Informações falsas ou enganosas resultam em suspensão imediata da conta</li>
            </ul>
          </Section>

          <Section icon={<FileText className="w-5 h-5 text-green-500" />} title="3. Uso Permitido">
            <p>Ao usar o RepMatch, você concorda em:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Usar a plataforma apenas para fins legítimos de representação comercial</li>
              <li>Fornecer informações verdadeiras e atualizadas no perfil</li>
              <li>Respeitar os outros usuários e manter conduta profissional</li>
              <li>Não compartilhar credenciais de acesso com terceiros</li>
              <li>Não utilizar dados de outros usuários para fins não autorizados</li>
            </ul>
          </Section>

          <Section icon={<Ban className="w-5 h-5 text-green-500" />} title="4. Uso Proibido">
            <p>É <strong>expressamente proibido</strong>:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>Criar perfis falsos ou se passar por outra pessoa ou empresa</li>
              <li>Publicar vagas fictícias ou com informações enganosas</li>
              <li>Usar a plataforma para spam, assédio ou comunicações não solicitadas</li>
              <li>Tentar acessar dados de outros usuários sem autorização</li>
              <li>Realizar engenharia reversa, scraping ou extração automatizada de dados</li>
              <li>Usar a plataforma para atividades ilegais ou que violem direitos de terceiros</li>
              <li>Contornar os sistemas de pagamento (ex.: combinar contato fora da plataforma para evitar o desbloqueio)</li>
              <li>Criar múltiplas contas para burlar restrições ou planos</li>
            </ul>
            <p className="mt-3">
              Violações resultam em suspensão ou exclusão permanente da conta, sem direito a reembolso.
            </p>
          </Section>

          <Section icon={<CreditCard className="w-5 h-5 text-green-500" />} title="5. Planos, Pagamentos e Reembolsos">
            <SubTitle>5.1 Planos de Assinatura</SubTitle>
            <p>
              O RepMatch oferece planos pagos mensais e anuais para representantes e empresas, conforme
              detalhado na página <Link href="/planos" className="text-green-400 hover:underline">/planos</Link>.
              O cadastro básico de representante é gratuito.
            </p>

            <SubTitle>5.2 Formas de Pagamento</SubTitle>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>PIX:</strong> chave (41) 99949-9815 — ativação manual em até 24h úteis após envio do comprovante</li>
              <li><strong>Cartão de crédito/débito:</strong> processado pelo Stripe com cobrança recorrente</li>
            </ul>

            <SubTitle>5.3 Renovação Automática</SubTitle>
            <p>
              Planos pagos via cartão renovam automaticamente ao final do período. Você pode cancelar
              a qualquer momento pelo dashboard — o acesso permanece até o fim do período pago.
            </p>

            <SubTitle>5.4 Política de Reembolso</SubTitle>
            <ul className="list-disc pl-6 space-y-1">
              <li>Reembolso integral em até <strong>7 dias</strong> após a primeira contratação (CDC — Art. 49)</li>
              <li>Após 7 dias, não há reembolso proporcional por período não utilizado</li>
              <li>Desbloqueios avulsos de contato (R$29) e vagas em destaque (R$49) não são reembolsáveis</li>
              <li>Em caso de falha técnica comprovada da plataforma, analisamos caso a caso</li>
            </ul>

            <SubTitle>5.5 Inadimplência</SubTitle>
            <p>
              O não pagamento resulta no downgrade automático para o plano gratuito, sem exclusão de dados.
            </p>
          </Section>

          <Section icon={<Shield className="w-5 h-5 text-green-500" />} title="6. Propriedade Intelectual">
            <p>
              Todo o conteúdo da plataforma — incluindo marca, logo, design, código-fonte, textos e funcionalidades —
              é propriedade do RepMatch e protegido por leis de propriedade intelectual.
            </p>
            <p className="mt-3">
              O conteúdo inserido pelos usuários (perfis, descrições, fotos) permanece de propriedade do usuário.
              Ao cadastrar conteúdo, você concede ao RepMatch uma licença não exclusiva, gratuita e mundial
              para exibir esse conteúdo na plataforma enquanto sua conta estiver ativa.
            </p>
          </Section>

          <Section icon={<AlertTriangle className="w-5 h-5 text-green-500" />} title="7. Limitação de Responsabilidade">
            <p>O RepMatch <strong>não se responsabiliza</strong> por:</p>
            <ul className="list-disc pl-6 space-y-2 mt-3">
              <li>O resultado de negociações ou contratos firmados entre usuários</li>
              <li>A veracidade das informações fornecidas pelos usuários</li>
              <li>Danos indiretos, lucros cessantes ou perdas decorrentes do uso da plataforma</li>
              <li>Interrupções temporárias por manutenção ou falhas técnicas</li>
              <li>Atos de terceiros, incluindo processadores de pagamento</li>
            </ul>
            <p className="mt-3">
              A responsabilidade máxima do RepMatch em qualquer circunstância é limitada ao valor
              pago pelo usuário nos últimos 3 meses.
            </p>
          </Section>

          <Section icon={<FileText className="w-5 h-5 text-green-500" />} title="8. Suspensão e Encerramento">
            <p>O RepMatch pode suspender ou encerrar sua conta, com ou sem aviso prévio, em caso de:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Violação destes Termos de Uso</li>
              <li>Suspeita de fraude ou atividade ilegal</li>
              <li>Solicitação de autoridade competente</li>
              <li>Inatividade prolongada (mais de 24 meses)</li>
            </ul>
            <p className="mt-3">
              Você pode encerrar sua conta a qualquer momento pelo dashboard ou por e-mail.
              Após o encerramento, seus dados serão tratados conforme a Política de Privacidade.
            </p>
          </Section>

          <Section icon={<Scale className="w-5 h-5 text-green-500" />} title="9. Lei Aplicável e Foro">
            <p>
              Estes Termos são regidos pelas leis brasileiras, incluindo o Código Civil, Código de Defesa
              do Consumidor (Lei 8.078/1990), Marco Civil da Internet (Lei 12.965/2014) e LGPD (Lei 13.709/2018).
            </p>
            <p className="mt-3">
              Fica eleito o foro da comarca de <strong>Curitiba/PR</strong> para dirimir quaisquer
              controvérsias, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </Section>

          <Section icon={<FileText className="w-5 h-5 text-green-500" />} title="10. Alterações nos Termos">
            <p className="text-muted-foreground">
              Podemos modificar estes Termos a qualquer momento. Alterações relevantes serão comunicadas
              com pelo menos <strong>15 dias de antecedência</strong> por e-mail ou aviso na plataforma.
              O uso continuado após a data de vigência implica aceitação das alterações.
            </p>
          </Section>

          <Section icon={<FileText className="w-5 h-5 text-green-500" />} title="11. Contato">
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <p>Para dúvidas sobre estes Termos:</p>
              <p className="text-muted-foreground text-sm mt-2">
                E-mail: <a href={`mailto:${COMPANY_EMAIL}`} className="text-green-400 hover:underline">{COMPANY_EMAIL}</a>
              </p>
              <p className="text-muted-foreground text-sm">
                WhatsApp: <a href="https://wa.me/5541999499815" className="text-green-400 hover:underline">(41) 99949-9815</a>
              </p>
            </div>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">© 2026 RepMatch. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacidade" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidade</Link>
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">Voltar ao início</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-green-500/10 rounded-lg">{icon}</div>
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="pl-12 space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-foreground mt-4 mb-2">{children}</p>;
}
