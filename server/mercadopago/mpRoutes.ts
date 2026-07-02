import { Router, Request, Response } from "express";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getDb } from "../db";
import { representatives, companies, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const mpRouter = Router();

// ─── Planos e preços ─────────────────────────────────────────────────────────
export const MP_PLANS = {
  // Representantes
  REP_BRONZE:  { name: "RepMatch Bronze",    amount: 9.99,  interval: "monthly" as const, tier: "bronze",    userType: "rep" as const },
  REP_PRATA:   { name: "RepMatch Prata",     amount: 19.90, interval: "monthly" as const, tier: "prata",     userType: "rep" as const },
  REP_OURO:    { name: "RepMatch Ouro",      amount: 29.90, interval: "monthly" as const, tier: "ouro",      userType: "rep" as const },
  // Empresas
  COMPANY_STARTER:    { name: "Empresa Starter",    amount: 49,  interval: "monthly" as const, tier: "starter",    userType: "company" as const },
  COMPANY_PRO:        { name: "Empresa Pro",         amount: 149, interval: "monthly" as const, tier: "pro",        userType: "company" as const },
  COMPANY_ENTERPRISE: { name: "Empresa Enterprise",  amount: 399, interval: "monthly" as const, tier: "enterprise", userType: "company" as const },
  // Avulsos
  UNLOCK_CONTACT: { name: "Desbloquear Contato", amount: 29.00, interval: null, tier: null, userType: "company" as const },
  FEATURED_JOB:   { name: "Vaga em Destaque",    amount: 49.00, interval: null, tier: null, userType: "company" as const },
  // Gerente
  MANAGER_AVULSO:   { name: "Gerente — 1 Crédito",         amount: 29.90,  interval: null,           credits: 1,    tier: null, userType: "manager" as const },
  MANAGER_STARTER:  { name: "Gerente — 5 Créditos",        amount: 99.90,  interval: null,           credits: 5,    tier: null, userType: "manager" as const },
  MANAGER_PRO:      { name: "Gerente — 15 Créditos",       amount: 249.90, interval: null,           credits: 15,   tier: null, userType: "manager" as const },
  MANAGER_ILIMITADO:{ name: "Gerente — Ilimitado/mês",     amount: 499.90, interval: "monthly" as const, credits: 9999, tier: null, userType: "manager" as const },
} as const;

export type MPPlanKey = keyof typeof MP_PLANS;

// ─── Criar preferência de pagamento (Checkout Pro — cartão + Pix) ─────────────
mpRouter.post("/preference", async (req: Request, res: Response) => {
  try {
    const { planKey, userId, userEmail, userName, annual, repId, jobId } = req.body as {
      planKey: MPPlanKey;
      userId: number;
      userEmail: string;
      userName: string;
      annual?: boolean;
      repId?: number;
      jobId?: number;
    };

    const plan = MP_PLANS[planKey];
    if (!plan) return res.status(400).json({ error: "Plano inválido" });

    const origin = req.headers.origin ?? "http://localhost:3000";
    let amount: number = plan.amount;
    if (annual && plan.interval === "monthly") {
      amount = parseFloat((plan.amount * 0.8 * 12).toFixed(2));
    }

    const preference = new Preference(mp);
    const pref = await preference.create({
      body: {
        items: [{
          id: planKey,
          title: annual ? `${plan.name} — Anual` : plan.name,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        }],
        payer: {
          email: userEmail,
          name: userName,
        },
        metadata: {
          user_id: userId,
          plan_key: planKey,
          annual: annual ?? false,
          rep_id: repId ?? null,
          job_id: jobId ?? null,
        },
        back_urls: {
          success: `${origin}/dashboard/company?payment=success`,
          failure: `${origin}/planos?payment=failed`,
          pending: `${origin}/planos?payment=pending`,
        },
        auto_return: "approved",
        payment_methods: {
          excluded_payment_types: [],
          installments: 1,
        },
        statement_descriptor: "REPMATCH",
      },
    });

    return res.json({
      preferenceId: pref.id,
      initPoint: pref.init_point,
      sandboxInitPoint: pref.sandbox_init_point,
    });
  } catch (e: any) {
    console.error("[MP] preference error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Criar pagamento Pix ───────────────────────────────────────────────────────
mpRouter.post("/pix", async (req: Request, res: Response) => {
  try {
    const { planKey, userId, userEmail, userName, cpf, annual } = req.body as {
      planKey: MPPlanKey;
      userId: number;
      userEmail: string;
      userName: string;
      cpf: string;
      annual?: boolean;
    };

    const plan = MP_PLANS[planKey];
    if (!plan) return res.status(400).json({ error: "Plano inválido" });

    let amount: number = plan.amount;
    if (annual && plan.interval === "monthly") {
      amount = parseFloat((plan.amount * 0.8 * 12).toFixed(2));
    }

    const payment = new Payment(mp);
    const result = await payment.create({
      body: {
        transaction_amount: amount,
        description: annual ? `${plan.name} — Anual` : plan.name,
        payment_method_id: "pix",
        payer: {
          email: userEmail,
          first_name: userName.split(" ")[0],
          last_name: userName.split(" ").slice(1).join(" ") || userName.split(" ")[0],
          identification: {
            type: "CPF",
            number: cpf.replace(/\D/g, ""),
          },
        },
        metadata: {
          user_id: userId,
          plan_key: planKey,
          annual: annual ?? false,
        },
      },
    });

    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({
      paymentId: result.id,
      status: result.status,
      qrCode: txInfo?.qr_code,
      qrCodeBase64: txInfo?.qr_code_base64,
      expiresAt: result.date_of_expiration,
    });
  } catch (e: any) {
    console.error("[MP] pix error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Verificar status de pagamento ────────────────────────────────────────────
mpRouter.get("/payment/:id/status", async (req: Request, res: Response) => {
  try {
    const payment = new Payment(mp);
    const result = await payment.get({ id: Number(req.params.id) });
    return res.json({
      status: result.status,
      statusDetail: result.status_detail,
      amount: result.transaction_amount,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Webhook do Mercado Pago ──────────────────────────────────────────────────
mpRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body as { type?: string; data?: { id?: string } };
    console.log("[MP Webhook]", body.type, body.data?.id);

    if (body.type === "payment" && body.data?.id) {
      const payment = new Payment(mp);
      const result = await payment.get({ id: Number(body.data.id) });

      if (result.status === "approved") {
        const meta = result.metadata as Record<string, unknown>;
        const userId = meta?.user_id as number;
        const planKey = meta?.plan_key as MPPlanKey;
        const annual = meta?.annual as boolean;

        if (userId && planKey) {
          const plan = MP_PLANS[planKey];
          const db = await getDb();

          if (plan.userType === "rep") {
            await db!.update(representatives)
              .set({ subscriptionTier: plan.tier as any })
              .where(eq(representatives.userId, userId));
          } else if (plan.userType === "company") {
            await db!.update(companies)
              .set({ subscriptionTier: plan.tier as any })
              .where(eq(companies.userId, userId));
          }

          console.log(`[MP Webhook] Activated plan ${planKey} for user ${userId}`);
        }
      }
    }

    return res.json({ received: true });
  } catch (e: any) {
    console.error("[MP Webhook] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});
