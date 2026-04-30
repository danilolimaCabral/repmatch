import { Link } from "wouter";
import { ArrowLeft, Shield, Eye, Database, UserX, Bell, Lock, Mail } from "lucide-react";

const COMPANY_NAME = "RepMatch";
const COMPANY_EMAIL = "privacidade@repmatch.com.br";
const COMPANY_WHATSAPP = "41999499815";
const LAST_UPDATE = "30 de abril de 2026";

export default function Privacidade() {
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
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Política de Privacidade</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-green-400 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Conformidade LGPD — Lei 13.709/2018
          </div>
          <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-muted-foreground">
            Última atualização: <strong>{LAST_UPDATE}</strong>
          </p>
          <p className="text-muted-foreground mt-2">
            Esta Política de Privacidade descreve como o <strong>{COMPANY_NAME}</strong> coleta, usa, armazena e protege
            seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)
            e demais normas aplicáveis.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-10">

          {/* 1. Controlador */}
          <Section icon={<Database className="w-5 h-5 text-green-500" />} title="1. Controlador dos Dados">
            <p>
              O controlador responsável pelo tratamento dos seus dados pessoais é:
            </p>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
              <p><strong>RepMatch Tecnologia Ltda.</strong></p>
              <p className="text-muted-foreground text-sm mt-1">Marketplace de Representantes Comerciais</p>
              <p className="text-muted-foreground text-sm">E-mail: <a href={`mailto:${COMPANY_EMAIL}`} className="text-green-400 hover:underline">{COMPANY_EMAIL}</a></p>
              <p className="text-muted-foreground text-sm">WhatsApp: <a href={`https://wa.me/55${COMPANY_WHATSAPP}`} className="text-green-400 hover:underline">(41) 99949-9815</a></p>
            </div>
          </Section>

          {/* 2. Dados coletados */}
          <Section icon={<Eye className="w-5 h-5 text-green-500" />} title="2. Dados Pessoais Coletados">
            <p>Coletamos os seguintes dados, conforme o tipo de usuário:</p>

            <SubTitle>2.1 Representantes Comerciais</SubTitle>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Nome completo e e-mail (fornecidos no cadastro)</li>
              <li>Telefone de contato</li>
              <li>Região de atuação e segmentos de mercado</li>
              <li>Tempo de experiência e portfólio</li>
              <li>Disponibilidade e modelo de trabalho</li>
              <li>URL do LinkedIn (opcional)</li>
              <li>Foto de perfil (opcional)</li>
              <li>Dados de pagamento (processados pelo Stripe — não armazenamos dados de cartão)</li>
            </ul>

            <SubTitle>2.2 Empresas</SubTitle>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Nome do responsável e e-mail corporativo</li>
              <li>CNPJ e razão social (consultados via BrasilAPI — Receita Federal)</li>
              <li>Telefone e segmento de atuação</li>
              <li>Região de interesse</li>
              <li>Dados de pagamento (processados pelo Stripe)</li>
            </ul>

            <SubTitle>2.3 Dados de Uso</SubTitle>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Endereço IP e dados de navegação (logs de acesso)</li>
              <li>Cookies de sessão (necessários para funcionamento)</li>
              <li>Cookies analíticos (apenas com seu consentimento)</li>
              <li>Histórico de buscas e matches realizados na plataforma</li>
            </ul>
          </Section>

          {/* 3. Finalidades */}
          <Section icon={<Bell className="w-5 h-5 text-green-500" />} title="3. Finalidades do Tratamento">
            <p>Seus dados são tratados para as seguintes finalidades, com base legal correspondente:</p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 pr-4 font-semibold">Finalidade</th>
                    <th className="text-left py-3 pr-4 font-semibold">Base Legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Criar e gerenciar sua conta", "Execução de contrato (Art. 7º, V)"],
                    ["Conectar representantes e empresas (match)", "Execução de contrato (Art. 7º, V)"],
                    ["Processar pagamentos via Stripe/PIX", "Execução de contrato (Art. 7º, V)"],
                    ["Enviar notificações de match e vagas", "Legítimo interesse (Art. 7º, IX)"],
                    ["Melhorar a plataforma com analytics", "Consentimento (Art. 7º, I)"],
                    ["Cumprir obrigações legais e fiscais", "Obrigação legal (Art. 7º, II)"],
                    ["Prevenir fraudes e garantir segurança", "Legítimo interesse (Art. 7º, IX)"],
                  ].map(([fin, base]) => (
                    <tr key={fin} className="border-b border-border/50">
                      <td className="py-3 pr-4">{fin}</td>
                      <td className="py-3">{base}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 4. Compartilhamento */}
          <Section icon={<Lock className="w-5 h-5 text-green-500" />} title="4. Compartilhamento de Dados">
            <p>Seus dados <strong>não são vendidos</strong> a terceiros. Compartilhamos apenas com:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li><strong>Stripe Inc.</strong> — processamento de pagamentos com cartão. Política: <a href="https://stripe.com/br/privacy" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">stripe.com/br/privacy</a></li>
              <li><strong>BrasilAPI / Receita Federal</strong> — consulta pública de CNPJ (dados já públicos)</li>
              <li><strong>Autenticação própria</strong> — e-mail e senha com JWT</li>
              <li><strong>Empresas contratantes</strong> — apenas os dados do perfil que o representante optou por tornar visível</li>
              <li><strong>Autoridades públicas</strong> — quando exigido por lei ou ordem judicial</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              Todos os fornecedores são contratualmente obrigados a proteger seus dados e só podem usá-los
              para as finalidades especificadas.
            </p>
          </Section>

          {/* 5. Direitos do titular */}
          <Section icon={<UserX className="w-5 h-5 text-green-500" />} title="5. Seus Direitos como Titular (LGPD)">
            <p>Nos termos dos Arts. 17 a 22 da LGPD, você tem direito a:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {[
                ["Acesso", "Solicitar uma cópia de todos os dados que temos sobre você"],
                ["Correção", "Corrigir dados incompletos, inexatos ou desatualizados"],
                ["Anonimização", "Solicitar a anonimização de dados desnecessários"],
                ["Portabilidade", "Receber seus dados em formato estruturado (JSON/CSV)"],
                ["Exclusão", "Solicitar a exclusão dos seus dados pessoais"],
                ["Revogação", "Revogar o consentimento dado anteriormente"],
                ["Oposição", "Opor-se ao tratamento baseado em legítimo interesse"],
                ["Informação", "Saber com quem compartilhamos seus dados"],
              ].map(([title, desc]) => (
                <div key={title} className="p-3 bg-muted/20 rounded-lg border border-border/50">
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-muted-foreground text-xs mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm">
                Para exercer qualquer direito, envie uma solicitação para{" "}
                <a href={`mailto:${COMPANY_EMAIL}`} className="text-green-400 hover:underline font-medium">{COMPANY_EMAIL}</a>{" "}
                ou via WhatsApp{" "}
                <a href={`https://wa.me/55${COMPANY_WHATSAPP}`} className="text-green-400 hover:underline font-medium">(41) 99949-9815</a>.
                Respondemos em até <strong>15 dias úteis</strong>.
              </p>
            </div>
          </Section>

          {/* 6. Retenção */}
          <Section icon={<Database className="w-5 h-5 text-green-500" />} title="6. Retenção e Exclusão de Dados">
            <p>Mantemos seus dados pelo tempo necessário para as finalidades descritas:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li><strong>Dados de conta ativa:</strong> enquanto a conta estiver ativa</li>
              <li><strong>Após exclusão da conta:</strong> 90 dias para backup, depois exclusão permanente</li>
              <li><strong>Dados fiscais e de pagamento:</strong> 5 anos (obrigação legal — Código Tributário)</li>
              <li><strong>Logs de acesso:</strong> 6 meses (Marco Civil da Internet — Lei 12.965/2014)</li>
              <li><strong>Registros de consentimento:</strong> 5 anos após revogação</li>
            </ul>
            <p className="mt-4 text-muted-foreground">
              Você pode solicitar a exclusão imediata da sua conta e dados pessoais a qualquer momento
              pelo dashboard ou por e-mail. Dados sujeitos a obrigações legais serão mantidos pelo prazo mínimo exigido.
            </p>
          </Section>

          {/* 7. Segurança */}
          <Section icon={<Lock className="w-5 h-5 text-green-500" />} title="7. Segurança dos Dados">
            <p>Adotamos as seguintes medidas técnicas e organizacionais para proteger seus dados:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-3">
              <li><strong>Criptografia em trânsito:</strong> HTTPS/TLS em todas as comunicações</li>
              <li><strong>Autenticação segura:</strong> senhas armazenadas com hash bcrypt — nunca em texto simples</li>
              <li><strong>Sessões assinadas:</strong> cookies HttpOnly + SameSite + Secure com JWT</li>
              <li><strong>Dados de pagamento:</strong> processados exclusivamente pelo Stripe (PCI DSS Level 1)</li>
              <li><strong>Banco de dados:</strong> acesso restrito com credenciais rotacionadas</li>
              <li><strong>Contatos mascarados:</strong> telefones e e-mails de representantes são ocultados até desbloqueio pago</li>
              <li><strong>Controle de acesso:</strong> cada usuário acessa apenas seus próprios dados</li>
              <li><strong>Monitoramento:</strong> logs de acesso e auditoria de operações sensíveis</li>
            </ul>
          </Section>

          {/* 8. Cookies */}
          <Section icon={<Eye className="w-5 h-5 text-green-500" />} title="8. Cookies">
            <p>Utilizamos dois tipos de cookies:</p>
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-muted/20 rounded-lg border border-border">
                <p className="font-semibold text-sm">Cookies Essenciais (sempre ativos)</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Necessários para o funcionamento da plataforma: sessão de login, preferências de interface.
                  Não podem ser desativados sem comprometer o funcionamento do site.
                </p>
              </div>
              <div className="p-4 bg-muted/20 rounded-lg border border-border">
                <p className="font-semibold text-sm">Cookies Analíticos (com consentimento)</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Usados para entender como os usuários navegam na plataforma e melhorar a experiência.
                  Você pode aceitar ou recusar no banner de cookies.
                </p>
              </div>
            </div>
          </Section>

          {/* 9. Menores */}
          <Section icon={<Shield className="w-5 h-5 text-green-500" />} title="9. Menores de Idade">
            <p className="text-muted-foreground">
              O RepMatch é destinado exclusivamente a pessoas com <strong>18 anos ou mais</strong>.
              Não coletamos intencionalmente dados de menores de idade. Se identificarmos que um menor
              forneceu dados sem consentimento dos responsáveis, excluiremos esses dados imediatamente.
            </p>
          </Section>

          {/* 10. Alterações */}
          <Section icon={<Bell className="w-5 h-5 text-green-500" />} title="10. Alterações nesta Política">
            <p className="text-muted-foreground">
              Podemos atualizar esta Política periodicamente. Quando houver alterações relevantes,
              notificaremos você por e-mail ou por aviso na plataforma com pelo menos <strong>15 dias de antecedência</strong>.
              O uso continuado da plataforma após a data de vigência implica aceitação das alterações.
            </p>
          </Section>

          {/* 11. Contato DPO */}
          <Section icon={<Mail className="w-5 h-5 text-green-500" />} title="11. Encarregado de Dados (DPO)">
            <p className="text-muted-foreground">
              Nosso Encarregado de Proteção de Dados (DPO) pode ser contatado para dúvidas sobre
              privacidade, exercício de direitos ou reclamações:
            </p>
            <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
              <p className="font-semibold">Encarregado de Dados — RepMatch</p>
              <p className="text-muted-foreground text-sm mt-1">
                E-mail: <a href={`mailto:${COMPANY_EMAIL}`} className="text-green-400 hover:underline">{COMPANY_EMAIL}</a>
              </p>
              <p className="text-muted-foreground text-sm">
                WhatsApp: <a href={`https://wa.me/55${COMPANY_WHATSAPP}`} className="text-green-400 hover:underline">(41) 99949-9815</a>
              </p>
              <p className="text-muted-foreground text-sm mt-2">
                Você também pode registrar reclamações na{" "}
                <a href="https://www.gov.br/anpd" className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  ANPD — Autoridade Nacional de Proteção de Dados
                </a>.
              </p>
            </div>
          </Section>

        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">© 2026 RepMatch. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/termos" className="text-muted-foreground hover:text-foreground transition-colors">Termos de Uso</Link>
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
