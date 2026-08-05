import { Resend } from "resend";
import { ENV } from "./_core/env";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(ENV.resendApiKey || process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL = "RepMatch <noreply@itskilltech.com.br>";
const SITE_URL = "https://repmatch.com.br";

// ─── Templates ────────────────────────────────────────────────────────────────

export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RepMatch</title>
  <style>
    body { margin: 0; padding: 0; background: #F5F6F8; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .body h2 { color: #111827; font-size: 22px; margin: 0 0 16px; }
    .body p { color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .cta { display: block; width: fit-content; margin: 28px auto; background: #16a34a; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 16px; font-weight: 600; text-align: center; }
    .divider { border: none; border-top: 1px solid #E5E7EB; margin: 28px 0; }
    .footer { background: #F9FAFB; padding: 24px 40px; text-align: center; }
    .footer p { color: #9CA3AF; font-size: 12px; margin: 0; line-height: 1.6; }
    .badge { display: inline-block; background: #DCFCE7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .info-box { background: #F0FDF4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 0 8px 8px 0; margin: 20px 0; }
    .info-box p { margin: 0; color: #166534; font-size: 14px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>RepMatch</h1>
      <p>Conectando empresas a representantes comerciais</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} RepMatch · <a href="${SITE_URL}" style="color:#6B7280;">repmatch.com.br</a></p>
      <p style="margin-top:6px;">Você recebeu este email porque se cadastrou na plataforma RepMatch.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Email: Finalizar Cadastro ────────────────────────────────────────────────

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
      <span class="badge">⚡ Ação necessária</span>
      <h2>Olá, ${firstName}! Seu cadastro está quase completo.</h2>
      <p>Notamos que você criou uma conta na RepMatch como <strong>${typeLabel}</strong>, mas ainda não finalizou seu perfil.</p>
      <p>Com o perfil completo você poderá:</p>
      <div class="info-box">
        <p>✅ Aparecer nas buscas da plataforma<br/>
        ✅ Conectar-se com ${params.userType === "representative" ? "empresas que buscam representantes" : "representantes do seu segmento"}<br/>
        ✅ Receber notificações de match automático por CNAE</p>
      </div>
      <p>Leva menos de 5 minutos para completar. Clique no botão abaixo:</p>
      <a href="${SITE_URL}/dashboard" class="cta">Completar meu cadastro →</a>
      <hr class="divider" />
      <p style="font-size:13px; color:#6B7280;">Se você não se lembra de ter criado uma conta, pode ignorar este email com segurança.</p>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: "⚡ Complete seu cadastro no RepMatch",
      html: baseTemplate(content),
    });

    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendFinalizarCadastroEmail error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── Email: Novo Match para Empresa ──────────────────────────────────────────

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
      <span class="badge">🤖 Match Automático</span>
      <h2>Novo representante compatível com sua empresa!</h2>
      <p>Olá, <strong>${params.companyName}</strong>! Identificamos um representante que combina com o perfil da sua empresa:</p>
      <div class="info-box">
        <p><strong>👤 ${params.repName}</strong><br/>
        📂 Segmento: ${params.repSegment}<br/>
        📍 Região: ${params.repRegion}<br/>
        🎯 Score de compatibilidade: <strong>${params.matchScore}%</strong></p>
      </div>
      <p>Acesse a plataforma para ver o perfil completo e entrar em contato:</p>
      <a href="${SITE_URL}/dashboard" class="cta">Ver representante →</a>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `🤖 Novo match: ${params.repName} (${params.matchScore}% compatível)`,
      html: baseTemplate(content),
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendMatchNotificationToCompany error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}

// ─── Email: Novo Match para Representante ────────────────────────────────────

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
      <span class="badge">💼 Nova Vaga Compatível</span>
      <h2>${firstName}, uma empresa quer te conhecer!</h2>
      <p>A empresa <strong>${params.companyName}</strong> publicou uma vaga que combina com seu perfil:</p>
      <div class="info-box">
        <p><strong>📋 ${params.jobTitle}</strong><br/>
        📂 Segmento: ${params.segment}<br/>
        📍 Região: ${params.region}</p>
      </div>
      <p>Acesse a plataforma para ver os detalhes e se candidatar:</p>
      <a href="${SITE_URL}/dashboard" class="cta">Ver vaga →</a>
    `;

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: `💼 Nova vaga compatível: ${params.jobTitle} — ${params.companyName}`,
      html: baseTemplate(content),
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error("[Email] sendMatchNotificationToRep error:", err);
    return { success: false, error: err?.message ?? "Erro desconhecido" };
  }
}
