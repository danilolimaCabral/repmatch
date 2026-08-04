import { Resend } from "resend";
import { ENV } from "./_core/env";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(ENV.resendApiKey || process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = "RepMatch <noreply@itskilltech.com.br>";
const SITE_URL = "https://repmatch.com.br";

// ─── Base Template ────────────────────────────────────────────────────────────

function baseTemplate(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RepMatch</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #F0F4F8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.10); }
    .header { background: #0a0a0a; padding: 28px 40px; text-align: center; }
    .header-logo { display: inline-flex; align-items: center; gap: 10px; }
    .header-logo-icon { width: 36px; height: 36px; background: #16a34a; border-radius: 8px; display: inline-block; }
    .header-logo-text { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header-logo-text span { color: #4ade80; }
    .hero { background: linear-gradient(135deg, #052e16 0%, #14532d 100%); padding: 40px 40px 36px; text-align: center; }
    .hero-badge { display: inline-block; background: rgba(74,222,128,0.15); border: 1px solid rgba(74,222,128,0.3); color: #4ade80; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }
    .hero h1 { color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; line-height: 1.3; letter-spacing: -0.5px; }
    .hero p { color: rgba(255,255,255,0.7); margin: 12px 0 0; font-size: 15px; line-height: 1.6; }
    .body { padding: 40px; }
    .body p { color: #374151; font-size: 15px; line-height: 1.75; margin: 0 0 18px; }
    .body p strong { color: #111827; }
    .cta-wrapper { text-align: center; margin: 32px 0; }
    .cta { display: inline-block; background: #16a34a; color: #ffffff !important; text-decoration: none; padding: 15px 40px; border-radius: 10px; font-size: 16px; font-weight: 700; letter-spacing: -0.2px; }
    .cta-secondary { display: inline-block; background: transparent; color: #16a34a !important; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; border: 2px solid #16a34a; margin-top: 12px; }
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 28px 0; }
    .info-card { background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px 24px; margin: 20px 0; }
    .info-card-title { font-size: 13px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px; }
    .info-card p { margin: 0; color: #166534; font-size: 14px; line-height: 1.7; }
    .info-card .row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 14px; color: #166534; }
    .info-card .row:last-child { margin-bottom: 0; }
    .stat-row { display: flex; gap: 0; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; margin: 24px 0; }
    .stat-cell { flex: 1; padding: 16px; text-align: center; border-right: 1px solid #E5E7EB; }
    .stat-cell:last-child { border-right: none; }
    .stat-num { font-size: 22px; font-weight: 800; color: #16a34a; line-height: 1; }
    .stat-label { font-size: 11px; color: #9CA3AF; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .steps { margin: 20px 0; }
    .step { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; }
    .step-num { width: 28px; height: 28px; background: #16a34a; color: #fff; border-radius: 50%; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-text { font-size: 14px; color: #374151; line-height: 1.6; padding-top: 4px; }
    .step-text strong { color: #111827; }
    .alert-card { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .alert-card p { margin: 0; color: #9A3412; font-size: 14px; }
    .footer { background: #F9FAFB; border-top: 1px solid #E5E7EB; padding: 28px 40px; text-align: center; }
    .footer p { color: #9CA3AF; font-size: 12px; margin: 0 0 6px; line-height: 1.7; }
    .footer a { color: #6B7280; text-decoration: none; }
    .footer a:hover { color: #16a34a; }
    .social-links { margin: 16px 0 0; }
    .social-links a { display: inline-block; margin: 0 6px; color: #9CA3AF !important; font-size: 12px; text-decoration: none; }
    @media (max-width: 600px) {
      .wrapper { margin: 0; border-radius: 0; }
      .hero, .body, .footer { padding-left: 24px; padding-right: 24px; }
      .header { padding-left: 24px; padding-right: 24px; }
      .stat-row { flex-direction: column; }
      .stat-cell { border-right: none; border-bottom: 1px solid #E5E7EB; }
      .stat-cell:last-child { border-bottom: none; }
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ""}
  <div class="wrapper">
    <div class="header">
      <div class="header-logo">
        <div class="header-logo-icon"></div>
        <div class="header-logo-text">Rep<span>Match</span></div>
      </div>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} RepMatch · Marketplace de Representantes Comerciais</p>
      <p><a href="${SITE_URL}">repmatch.com.br</a> · <a href="${SITE_URL}/privacidade">Privacidade</a> · <a href="${SITE_URL}/termos">Termos</a></p>
      <p style="margin-top:10px; font-size:11px; color:#D1D5DB;">Você recebeu este e-mail porque se cadastrou na plataforma RepMatch.<br/>Para cancelar notificações, acesse seu painel e ajuste as preferências.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── 1. Boas-vindas — Representante ──────────────────────────────────────────

export async function sendWelcomeRepEmail(params: {
  to: string;
  name: string;
  region: string;
  segment: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.name?.split(" ")[0] || "Representante";

    const content = `
      <div class="hero">
        <div class="hero-badge">🎉 Bem-vindo ao RepMatch</div>
        <h1>Olá, ${firstName}! Seu perfil está ativo.</h1>
        <p>Você agora faz parte da maior rede de representantes comerciais do Brasil.</p>
      </div>
      <div class="body">
        <p>Seu cadastro como representante comercial foi concluído com sucesso. A partir de agora, empresas do seu segmento podem encontrar você na plataforma.</p>
        <div class="info-card">
          <div class="info-card-title">📋 Seu perfil</div>
          <div class="row">📍 Região: <strong>${params.region}</strong></div>
          <div class="row">📂 Segmento: <strong>${params.segment}</strong></div>
          <div class="row">⭐ Plano atual: <strong>Free</strong></div>
        </div>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text"><strong>Explore as vagas disponíveis</strong> — veja oportunidades compatíveis com seu perfil e região.</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text"><strong>Candidate-se às vagas</strong> — nosso algoritmo calcula seu score de compatibilidade automaticamente.</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text"><strong>Considere um plano pago</strong> — planos Bronze, Prata e Ouro aumentam sua visibilidade e dão acesso a mais vagas.</div>
          </div>
        </div>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/rep" class="cta">Acessar meu painel →</a>
        </div>
        <hr class="divider" />
        <p style="font-size:13px; color:#6B7280; text-align:center;">Dúvidas? Fale conosco pelo WhatsApp: <a href="https://wa.me/5541999499815" style="color:#16a34a;">(41) 99949-9815</a></p>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `🎉 Bem-vindo ao RepMatch, ${firstName}! Seu perfil está ativo`,
      html: baseTemplate(content, `Seu cadastro como representante foi aprovado. Acesse o painel e comece a se candidatar às vagas.`),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendWelcomeRepEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 2. Boas-vindas — Empresa ─────────────────────────────────────────────────

export async function sendWelcomeCompanyEmail(params: {
  to: string;
  name: string;
  companyName: string;
  segment: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.name?.split(" ")[0] || "Gestor";

    const content = `
      <div class="hero">
        <div class="hero-badge">🏢 Empresa cadastrada</div>
        <h1>${firstName}, sua empresa está na plataforma!</h1>
        <p>Encontre representantes qualificados para sua região e segmento em minutos.</p>
      </div>
      <div class="body">
        <p>O cadastro da <strong>${params.companyName}</strong> foi concluído com sucesso. Agora você pode buscar representantes, publicar vagas e receber candidaturas diretamente na plataforma.</p>
        <div class="stat-row">
          <div class="stat-cell">
            <div class="stat-num">9.677</div>
            <div class="stat-label">Representantes</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num">27</div>
            <div class="stat-label">Estados</div>
          </div>
          <div class="stat-cell">
            <div class="stat-num">R$29</div>
            <div class="stat-label">Por contato</div>
          </div>
        </div>
        <div class="steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text"><strong>Busque representantes</strong> — filtre por região, segmento e experiência.</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text"><strong>Publique uma vaga</strong> — receba candidaturas com score de compatibilidade automático.</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text"><strong>Desbloqueie o contato</strong> — por apenas R$29 você acessa telefone e e-mail direto do representante.</div>
          </div>
        </div>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/company" class="cta">Acessar meu painel →</a>
        </div>
        <hr class="divider" />
        <p style="font-size:13px; color:#6B7280; text-align:center;">Precisa de ajuda? <a href="https://wa.me/5541999499815" style="color:#16a34a;">Fale conosco no WhatsApp</a></p>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `🏢 ${params.companyName} está no RepMatch! Encontre representantes agora`,
      html: baseTemplate(content, `Sua empresa está cadastrada. Busque representantes qualificados por região e segmento.`),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendWelcomeCompanyEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 3. Confirmação de Candidatura — Representante ───────────────────────────

export async function sendApplicationConfirmationEmail(params: {
  to: string;
  repName: string;
  jobTitle: string;
  companyName: string;
  region: string;
  segment: string;
  totalScore: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.repName?.split(" ")[0] || "Representante";
    const scoreColor = params.totalScore >= 70 ? "#16a34a" : params.totalScore >= 50 ? "#d97706" : "#dc2626";
    const scoreLabel = params.totalScore >= 70 ? "Alto" : params.totalScore >= 50 ? "Médio" : "Baixo";

    const content = `
      <div class="hero">
        <div class="hero-badge">✅ Candidatura enviada</div>
        <h1>${firstName}, sua candidatura foi registrada!</h1>
        <p>A empresa receberá sua candidatura e entrará em contato se houver interesse.</p>
      </div>
      <div class="body">
        <p>Sua candidatura para a vaga abaixo foi enviada com sucesso:</p>
        <div class="info-card">
          <div class="info-card-title">💼 Detalhes da vaga</div>
          <div class="row">📋 Vaga: <strong>${params.jobTitle}</strong></div>
          <div class="row">🏢 Empresa: <strong>${params.companyName}</strong></div>
          <div class="row">📍 Região: <strong>${params.region}</strong></div>
          <div class="row">📂 Segmento: <strong>${params.segment}</strong></div>
          <div class="row">🎯 Seu score: <strong style="color:${scoreColor};">${params.totalScore}/100 (${scoreLabel})</strong></div>
        </div>
        <p>O score de compatibilidade é calculado automaticamente com base na sua região, segmento e experiência. Quanto maior o score, maior a chance de ser selecionado.</p>
        <div class="alert-card">
          <p>💡 <strong>Dica:</strong> Complete seu perfil com LinkedIn, bio detalhada e cidades de atuação para aumentar seu score nas próximas candidaturas.</p>
        </div>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/rep" class="cta">Ver minhas candidaturas →</a>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `✅ Candidatura enviada: ${params.jobTitle} — ${params.companyName}`,
      html: baseTemplate(content, `Sua candidatura para ${params.jobTitle} foi registrada com score ${params.totalScore}/100.`),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendApplicationConfirmationEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 4. Nova Candidatura — Notificação para Empresa ──────────────────────────

export async function sendNewApplicationToCompanyEmail(params: {
  to: string;
  companyName: string;
  repName: string;
  repRegion: string;
  repSegment: string;
  repExperience: number;
  jobTitle: string;
  totalScore: number;
  aiSummary?: string; // JSON string: { points: string[], summary: string }
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.companyName?.split(" ")[0] || "Gestor";
    const scoreColor = params.totalScore >= 70 ? "#16a34a" : params.totalScore >= 50 ? "#d97706" : "#dc2626";
    const scoreLabel = params.totalScore >= 70 ? "⭐ Alto" : params.totalScore >= 50 ? "Médio" : "Baixo";

    // Parse AI summary if available
    let aiPoints: string[] = [];
    let aiOverallSummary = "";
    if (params.aiSummary) {
      try {
        const parsed = JSON.parse(params.aiSummary);
        aiPoints = Array.isArray(parsed.points) ? parsed.points.slice(0, 3) : [];
        aiOverallSummary = typeof parsed.summary === "string" ? parsed.summary : "";
      } catch { /* ignore parse errors */ }
    }

    const aiSummaryBlock = aiPoints.length > 0 ? `
        <div style="background: linear-gradient(135deg, #052e16 0%, #14532d 100%); border-radius: 12px; padding: 20px 24px; margin: 20px 0;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
            <span style="background: rgba(74,222,128,0.2); border: 1px solid rgba(74,222,128,0.4); color: #4ade80; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">Gerado por IA</span>
          </div>
          <div style="color: #d1fae5; font-size: 14px; font-weight: 600; margin-bottom: 12px; line-height: 1.5;">${aiOverallSummary}</div>
          ${aiPoints.map(point => `<div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;"><span style="color: #4ade80; font-size: 16px; line-height: 1; flex-shrink: 0; margin-top: 1px;">&#10003;</span><span style="color: rgba(255,255,255,0.85); font-size: 13px; line-height: 1.6;">${point}</span></div>`).join("")}
        </div>` : "";

    const content = `
      <div class="hero">
        <div class="hero-badge">📬 Nova candidatura</div>
        <h1>Um representante se candidatou à sua vaga!</h1>
        <p>Acesse o painel para ver o perfil completo e entrar em contato.</p>
      </div>
      <div class="body">
        <p>Olá, <strong>${firstName}</strong>! A vaga <strong>"${params.jobTitle}"</strong> recebeu uma nova candidatura:</p>
        <div class="info-card">
          <div class="info-card-title">👤 Candidato</div>
          <div class="row">👤 Nome: <strong>${params.repName}</strong></div>
          <div class="row">📍 Região: <strong>${params.repRegion}</strong></div>
          <div class="row">📂 Segmento: <strong>${params.repSegment}</strong></div>
          <div class="row">📅 Experiência: <strong>${params.repExperience} ano${params.repExperience !== 1 ? "s" : ""}</strong></div>
          <div class="row">🎯 Score de match: <strong style="color:${scoreColor};">${params.totalScore}/100 (${scoreLabel})</strong></div>
        </div>
        ${aiSummaryBlock}
        <p>Acesse o painel para ver o perfil completo, histórico e desbloquear o contato direto do representante por R$29.</p>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/company" class="cta">Ver candidatura →</a>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `📬 Nova candidatura: ${params.repName} (${params.totalScore}/100) — ${params.jobTitle}`,
      html: baseTemplate(content, `${params.repName} se candidatou à vaga ${params.jobTitle} com score ${params.totalScore}/100.`),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendNewApplicationToCompanyEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 5. Confirmação de Pagamento — Desbloqueio de Contato ────────────────────

export async function sendContactUnlockedEmail(params: {
  to: string;
  companyName: string;
  repName: string;
  repPhone?: string;
  repEmail?: string;
  repRegion: string;
  repSegment: string;
  amountPaid: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.companyName?.split(" ")[0] || "Gestor";

    const content = `
      <div class="hero">
        <div class="hero-badge">🔓 Contato desbloqueado</div>
        <h1>Pagamento confirmado! Contato liberado.</h1>
        <p>Os dados de contato do representante estão disponíveis abaixo e no seu painel.</p>
      </div>
      <div class="body">
        <p>Olá, <strong>${firstName}</strong>! Seu pagamento de <strong>R$${params.amountPaid}</strong> foi confirmado. O contato direto de <strong>${params.repName}</strong> foi desbloqueado:</p>
        <div class="info-card">
          <div class="info-card-title">📞 Dados de contato</div>
          <div class="row">👤 Nome: <strong>${params.repName}</strong></div>
          <div class="row">📍 Região: <strong>${params.repRegion}</strong></div>
          <div class="row">📂 Segmento: <strong>${params.repSegment}</strong></div>
          ${params.repPhone ? `<div class="row">📱 Telefone/WhatsApp: <strong>${params.repPhone}</strong></div>` : ""}
          ${params.repEmail ? `<div class="row">📧 E-mail: <strong>${params.repEmail}</strong></div>` : ""}
        </div>
        ${params.repPhone ? `
        <div class="cta-wrapper">
          <a href="https://wa.me/55${params.repPhone.replace(/\D/g, "")}" class="cta">Enviar WhatsApp →</a>
        </div>` : `
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/company" class="cta">Ver no painel →</a>
        </div>`}
        <hr class="divider" />
        <p style="font-size:13px; color:#6B7280;">Guarde este e-mail como comprovante. Os dados também estão disponíveis permanentemente no seu painel em <a href="${SITE_URL}/dashboard/company" style="color:#16a34a;">Contatos Desbloqueados</a>.</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `🔓 Contato desbloqueado: ${params.repName} — RepMatch`,
      html: baseTemplate(content, `Pagamento confirmado. Acesse o contato direto de ${params.repName}.`),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendContactUnlockedEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 6. Confirmação de Assinatura de Plano ───────────────────────────────────

export async function sendSubscriptionConfirmedEmail(params: {
  to: string;
  name: string;
  planName: string;
  planPrice: string;
  userType: "representative" | "company";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.name?.split(" ")[0] || "usuário";
    const dashboardPath = params.userType === "representative" ? "/dashboard/rep" : "/dashboard/company";

    const repBenefits = [
      "Apareça em destaque nas buscas das empresas",
      "Acesso a vagas exclusivas do seu plano",
      "Badge de verificação no perfil",
      "Candidaturas ilimitadas",
    ];
    const companyBenefits = [
      "Busca ilimitada de representantes",
      "Publicação de vagas em destaque",
      "Acesso prioritário a novos representantes",
      "Relatórios de match e analytics",
    ];
    const benefits = params.userType === "representative" ? repBenefits : companyBenefits;

    const content = `
      <div class="hero">
        <div class="hero-badge">⭐ Plano ativado</div>
        <h1>${firstName}, seu plano ${params.planName} está ativo!</h1>
        <p>Obrigado pela confiança. Aproveite todos os benefícios do seu novo plano.</p>
      </div>
      <div class="body">
        <p>Seu pagamento de <strong>R$${params.planPrice}/mês</strong> foi confirmado e o plano <strong>${params.planName}</strong> já está ativo na sua conta.</p>
        <div class="info-card">
          <div class="info-card-title">✅ Benefícios do plano ${params.planName}</div>
          ${benefits.map(b => `<div class="row">✓ ${b}</div>`).join("")}
        </div>
        <div class="cta-wrapper">
          <a href="${SITE_URL}${dashboardPath}" class="cta">Acessar meu painel →</a>
        </div>
        <hr class="divider" />
        <p style="font-size:13px; color:#6B7280; text-align:center;">A assinatura renova automaticamente todo mês. Para cancelar, acesse seu painel em <a href="${SITE_URL}${dashboardPath}" style="color:#16a34a;">Meu Plano</a>.</p>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `⭐ Plano ${params.planName} ativado — RepMatch`,
      html: baseTemplate(content, `Seu plano ${params.planName} foi ativado com sucesso.`),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendSubscriptionConfirmedEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 7. Finalizar Cadastro (legado — mantido para compatibilidade) ────────────

export async function sendFinalizarCadastroEmail(params: {
  to: string;
  name: string;
  userType?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.name?.split(" ")[0] || "usuário";
    const typeLabel =
      params.userType === "representative"
        ? "representante comercial"
        : params.userType === "company"
        ? "empresa"
        : "usuário";

    const content = `
      <div class="hero">
        <div class="hero-badge">⚡ Ação necessária</div>
        <h1>Olá, ${firstName}! Seu cadastro está quase completo.</h1>
        <p>Finalize seu perfil para aparecer nas buscas da plataforma.</p>
      </div>
      <div class="body">
        <p>Notamos que você criou uma conta na RepMatch como <strong>${typeLabel}</strong>, mas ainda não finalizou seu perfil.</p>
        <div class="info-card">
          <div class="info-card-title">O que você ganha ao completar o perfil</div>
          <div class="row">✅ Aparecer nas buscas da plataforma</div>
          <div class="row">✅ Conectar-se com ${params.userType === "representative" ? "empresas que buscam representantes" : "representantes do seu segmento"}</div>
          <div class="row">✅ Receber notificações de match automático</div>
        </div>
        <p>Leva menos de 5 minutos para completar.</p>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard" class="cta">Completar meu cadastro →</a>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: "⚡ Complete seu cadastro no RepMatch",
      html: baseTemplate(content),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendFinalizarCadastroEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 8. Match Notification — Empresa ─────────────────────────────────────────

export async function sendMatchNotificationToCompany(params: {
  to: string;
  companyName: string;
  repName: string;
  repSegment: string;
  repRegion: string;
  matchScore: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();

    const content = `
      <div class="hero">
        <div class="hero-badge">🤖 Match Automático</div>
        <h1>Novo representante compatível encontrado!</h1>
        <p>Nosso algoritmo identificou um perfil que combina com sua empresa.</p>
      </div>
      <div class="body">
        <p>Olá, <strong>${params.companyName}</strong>! Identificamos um representante que combina com o perfil da sua empresa:</p>
        <div class="info-card">
          <div class="info-card-title">👤 Representante compatível</div>
          <div class="row">👤 Nome: <strong>${params.repName}</strong></div>
          <div class="row">📂 Segmento: <strong>${params.repSegment}</strong></div>
          <div class="row">📍 Região: <strong>${params.repRegion}</strong></div>
          <div class="row">🎯 Score: <strong style="color:#16a34a;">${params.matchScore}%</strong></div>
        </div>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/company" class="cta">Ver representante →</a>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `🤖 Novo match: ${params.repName} (${params.matchScore}% compatível)`,
      html: baseTemplate(content),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendMatchNotificationToCompany error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── 9. Match Notification — Representante ───────────────────────────────────

export async function sendMatchNotificationToRep(params: {
  to: string;
  repName: string;
  companyName: string;
  jobTitle: string;
  segment: string;
  region: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const firstName = params.repName?.split(" ")[0] || "representante";

    const content = `
      <div class="hero">
        <div class="hero-badge">💼 Nova Vaga Compatível</div>
        <h1>${firstName}, uma empresa quer te conhecer!</h1>
        <p>Há uma vaga que combina com seu perfil. Candidate-se agora.</p>
      </div>
      <div class="body">
        <p>A empresa <strong>${params.companyName}</strong> publicou uma vaga que combina com seu perfil:</p>
        <div class="info-card">
          <div class="info-card-title">📋 Detalhes da vaga</div>
          <div class="row">📋 Vaga: <strong>${params.jobTitle}</strong></div>
          <div class="row">🏢 Empresa: <strong>${params.companyName}</strong></div>
          <div class="row">📂 Segmento: <strong>${params.segment}</strong></div>
          <div class="row">📍 Região: <strong>${params.region}</strong></div>
        </div>
        <div class="cta-wrapper">
          <a href="${SITE_URL}/dashboard/rep" class="cta">Ver vaga e candidatar →</a>
        </div>
      </div>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `💼 Nova vaga compatível: ${params.jobTitle} — ${params.companyName}`,
      html: baseTemplate(content),
    });

    if (result.error) return { success: false, error: result.error.message };
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendMatchNotificationToRep error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}
