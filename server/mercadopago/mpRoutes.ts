import { Router, Request, Response } from "express";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getDb } from "../db";
import { representatives, companies, users, unlockRequests, unlockRequestItems, leadPackageOrders, marketLeadAccesses } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { CONTACT_UNLOCK_PRICE } from "@shared/const";
import { notifyOwner } from "../_core/notification";

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
  UNLOCK_CONTACT: { name: "Desbloquear Contato", amount: CONTACT_UNLOCK_PRICE, interval: null, tier: null, userType: "company" as const },
  FEATURED_JOB:   { name: "Vaga em Destaque",    amount: 49.00, interval: null, tier: null, userType: "company" as const },
  // Gerente
  MANAGER_AVULSO:   { name: "Gerente — 1 Crédito",         amount: CONTACT_UNLOCK_PRICE,  interval: null,           credits: 1,    tier: null, userType: "manager" as const },
  MANAGER_STARTER:  { name: "Gerente — 5 Créditos",        amount: 49.50,  interval: null,           credits: 5,    tier: null, userType: "manager" as const },
  MANAGER_PRO:      { name: "Gerente — 15 Créditos",       amount: 148.50, interval: null,           credits: 15,   tier: null, userType: "manager" as const },
  MANAGER_ILIMITADO:{ name: "Gerente — Ilimitado/mês",     amount: 499.90, interval: "monthly" as const, credits: 9999, tier: null, userType: "manager" as const },
} as const;

export type MPPlanKey = keyof typeof MP_PLANS;

// ─── Criar preferência para desbloqueio em lote (Checkout Pro) ───────────────
mpRouter.post("/unlock-preference", async (req: Request, res: Response) => {
  try {
    const { requestId, repIds, userId, userEmail, userName } = req.body as {
      requestId: number;
      repIds: number[];
      userId: number;
      userEmail: string;
      userName: string;
    };

    if (!requestId || !repIds?.length) return res.status(400).json({ error: "Dados inválidos" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [unlockRequest] = await db.select({ totalAmount: unlockRequests.totalAmount })
      .from(unlockRequests)
      .where(eq(unlockRequests.id, requestId))
      .limit(1);
    if (!unlockRequest) return res.status(404).json({ error: "Solicitação não encontrada" });
    const totalAmount = Number(unlockRequest.totalAmount);
    const origin = req.headers.origin ?? "http://localhost:3000";

    const preference = new Preference(mp);
    const pref = await preference.create({
      body: {
        items: [{
          id: `UNLOCK_BATCH_${requestId}`,
          title: `Desbloqueio de ${repIds.length} representante${repIds.length > 1 ? "s" : ""} — RepMatch`,
          quantity: 1,
          unit_price: totalAmount,
          currency_id: "BRL",
        }],
        payer: { email: userEmail, name: userName },
        metadata: {
          type: "unlock_batch",
          request_id: requestId,
          user_id: userId,
          rep_ids: repIds,
        },
        back_urls: {
          success: `${origin}/dashboard/company?unlock=success&requestId=${requestId}`,
          failure: `${origin}/dashboard/company?unlock=failed`,
          pending: `${origin}/dashboard/company?unlock=pending`,
        },
        auto_return: "approved",
        payment_methods: { installments: 1 },
        statement_descriptor: "REPMATCH",
      },
    });

    return res.json({
      preferenceId: pref.id,
      initPoint: pref.init_point,
      sandboxInitPoint: pref.sandbox_init_point,
    });
  } catch (e: any) {
    console.error("[MP] unlock-preference error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});


// ─── Gerar PIX para desbloqueio em lote ──────────────────────────────────────
mpRouter.post("/unlock-pix", async (req: Request, res: Response) => {
  try {
    const { requestId, repIds, userId, userEmail, userName, cpf } = req.body as {
      requestId: number;
      repIds: number[];
      userId: number;
      userEmail: string;
      userName: string;
      cpf: string;
    };

    if (!requestId || !repIds?.length) return res.status(400).json({ error: "Dados inválidos" });

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [unlockRequest] = await db.select({ totalAmount: unlockRequests.totalAmount })
      .from(unlockRequests)
      .where(eq(unlockRequests.id, requestId))
      .limit(1);
    if (!unlockRequest) return res.status(404).json({ error: "Solicitação não encontrada" });
    const totalAmount = Number(unlockRequest.totalAmount);

    const payment = new Payment(mp);
    const result = await payment.create({
      body: {
        transaction_amount: totalAmount,
        description: `Desbloqueio de ${repIds.length} representante${repIds.length > 1 ? "s" : ""} — RepMatch`,
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
          type: "unlock_batch",
          request_id: requestId,
          user_id: userId,
          rep_ids: repIds,
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
    console.error("[MP] unlock-pix error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Gerar PIX para pacote de leads B2B/B2C ───────────────────────────────────
mpRouter.post("/lead-package-pix", async (req: Request, res: Response) => {
  try {
    const { orderId, userId, userEmail, userName, cpf } = req.body as {
      orderId: number; userId: number; userEmail: string; userName: string; cpf: string;
    };
    if (!orderId || !userId || !cpf?.replace(/\D/g, "")) return res.status(400).json({ error: "Dados inválidos" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [order] = await db.select({ id: leadPackageOrders.id, audience: leadPackageOrders.audience, quantity: leadPackageOrders.quantity, totalAmount: leadPackageOrders.totalAmount, status: leadPackageOrders.status })
      .from(leadPackageOrders)
      .where(and(eq(leadPackageOrders.id, orderId), eq(leadPackageOrders.userId, userId)))
      .limit(1);
    if (!order || order.status !== "pending_payment") return res.status(404).json({ error: "Pedido não disponível para pagamento" });
    const audienceLabel = order.audience === "b2b" ? "B2B" : "B2C";
    const payment = new Payment(mp);
    const result = await payment.create({
      body: {
        transaction_amount: Number(order.totalAmount),
        description: `Pacote ${audienceLabel} — ${order.quantity.toLocaleString("pt-BR")} leads | RepMatch`,
        payment_method_id: "pix",
        payer: {
          email: userEmail,
          first_name: userName.split(" ")[0],
          last_name: userName.split(" ").slice(1).join(" ") || userName.split(" ")[0],
          identification: { type: "CPF", number: cpf.replace(/\D/g, "") },
        },
        metadata: { type: "lead_package", order_id: orderId, user_id: userId, audience: order.audience },
      },
    });
    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({ paymentId: result.id, status: result.status, qrCode: txInfo?.qr_code, qrCodeBase64: txInfo?.qr_code_base64, expiresAt: result.date_of_expiration });
  } catch (e: any) {
    console.error("[MP] lead-package-pix error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Gerar PIX para o Plano Pesquisa Ilimitada ─────────────────────────────────
mpRouter.post("/market-search-unlimited-pix", async (req: Request, res: Response) => {
  try {
    const { accessId, userId, userEmail, userName, cpf } = req.body as { accessId: number; userId: number; userEmail: string; userName: string; cpf: string };
    if (!accessId || !userId || !cpf?.replace(/\D/g, "")) return res.status(400).json({ error: "Dados inválidos" });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [access] = await db.select({ id: marketLeadAccesses.id, amount: marketLeadAccesses.amount, status: marketLeadAccesses.status })
      .from(marketLeadAccesses).where(and(eq(marketLeadAccesses.id, accessId), eq(marketLeadAccesses.userId, userId))).limit(1);
    if (!access || access.status !== "pending_payment") return res.status(404).json({ error: "Plano não disponível para pagamento" });
    const payment = new Payment(mp);
    const result = await payment.create({ body: {
      transaction_amount: Number(access.amount), description: "Plano Pesquisa Ilimitada — 30 dias | RepMatch", payment_method_id: "pix",
      payer: { email: userEmail, first_name: userName.split(" ")[0], last_name: userName.split(" ").slice(1).join(" ") || userName.split(" ")[0], identification: { type: "CPF", number: cpf.replace(/\D/g, "") } },
      metadata: { type: "market_search_unlimited", access_id: accessId, user_id: userId },
    }});
    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({ paymentId: result.id, status: result.status, qrCode: txInfo?.qr_code, qrCodeBase64: txInfo?.qr_code_base64, expiresAt: result.date_of_expiration });
  } catch (e: any) {
    console.error("[MP] market-search-unlimited-pix error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});

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
        const db = await getDb();
        if (!db) return res.json({ received: true });

        // ── Plano Pesquisa Ilimitada: PIX confirmado, ativação manual ─────────
        if (meta?.type === "market_search_unlimited") {
          const accessId = Number(meta.access_id);
          if (accessId) {
            const [access] = await db.select({ id: marketLeadAccesses.id, status: marketLeadAccesses.status, amount: marketLeadAccesses.amount })
              .from(marketLeadAccesses).where(eq(marketLeadAccesses.id, accessId)).limit(1);
            if (access?.status === "pending_payment") {
              await db.update(marketLeadAccesses).set({ status: "pending_approval", mpPaymentId: String(result.id), adminNotes: "PIX confirmado pelo Mercado Pago — aguardando ativação manual por 30 dias." }).where(eq(marketLeadAccesses.id, accessId));
              void notifyOwner({ title: `PIX confirmado — Plano Ilimitado #${accessId}`, content: `Pagamento de R$ ${Number(access.amount).toFixed(2)} confirmado. Acesse Admin > Comercial para ativar 30 dias de pesquisa ilimitada.` }).catch((error) => console.error("[MP Webhook] unlimited notification error:", error));
            }
          }
        // ── Pacote de leads: PIX confirmado, entrega manual ──────────────────
        } else if (meta?.type === "lead_package") {
          const orderId = Number(meta.order_id);
          if (orderId) {
            const [leadOrder] = await db.select({ id: leadPackageOrders.id, status: leadPackageOrders.status, audience: leadPackageOrders.audience, quantity: leadPackageOrders.quantity, totalAmount: leadPackageOrders.totalAmount })
              .from(leadPackageOrders).where(eq(leadPackageOrders.id, orderId)).limit(1);
            if (leadOrder && leadOrder.status === "pending_payment") {
              await db.update(leadPackageOrders).set({
                status: "pending_approval",
                mpPaymentId: String(result.id),
                adminNotes: "PIX confirmado pelo Mercado Pago — aguardando revisão e entrega manual.",
              }).where(eq(leadPackageOrders.id, orderId));
              void notifyOwner({
                title: `PIX confirmado — pacote ${leadOrder.audience.toUpperCase()} #${orderId}`,
                content: `Pagamento de R$ ${Number(leadOrder.totalAmount).toFixed(2)} para ${leadOrder.quantity.toLocaleString("pt-BR")} leads confirmado. Acesse Admin > Comercial para revisar e entregar manualmente.`,
              }).catch((error) => console.error("[MP Webhook] lead order notification error:", error));
            }
          }
        // ── Desbloqueio em lote: pagamento confirmado, liberação manual ───────
        } else if (meta?.type === "unlock_batch") {
          const requestId = Number(meta.request_id);

          if (requestId) {
            const [unlockReq] = await db.select({ id: unlockRequests.id, status: unlockRequests.status, companyId: unlockRequests.companyId, totalAmount: unlockRequests.totalAmount })
              .from(unlockRequests).where(eq(unlockRequests.id, requestId)).limit(1);

            if (unlockReq && unlockReq.status === "pending_payment") {
              const items = await db.select({ id: unlockRequestItems.id })
                .from(unlockRequestItems)
                .where(eq(unlockRequestItems.unlockRequestId, requestId));

              await db.update(unlockRequests)
                .set({
                  status: "pending_approval",
                  stripePaymentId: String(result.id),
                  adminNotes: "PIX confirmado pelo Mercado Pago — aguardando liberação manual.",
                })
                .where(eq(unlockRequests.id, requestId));

              void notifyOwner({
                title: `PIX confirmado — liberar pedido #${requestId}`,
                content: `O Mercado Pago confirmou R$ ${Number(unlockReq.totalAmount).toFixed(2)} para ${items.length} contato(s). Acesse Admin > Desbloqueios para liberar manualmente.`,
              }).catch((error) => console.error("[MP Webhook] owner notification error:", error));

              console.log(`[MP Webhook] PIX approved for request #${requestId}; awaiting manual approval for ${items.length} contact(s)`);
            }
          }
        } else {
          // ── Planos de assinatura ─────────────────────────────────────────────
          const userId = meta?.user_id as number;
          const planKey = meta?.plan_key as MPPlanKey;

          if (userId && planKey) {
            const plan = MP_PLANS[planKey];

            if (plan.userType === "rep") {
              await db.update(representatives)
                .set({ subscriptionTier: plan.tier as any })
                .where(eq(representatives.userId, userId));
            } else if (plan.userType === "company") {
              await db.update(companies)
                .set({ subscriptionTier: plan.tier as any })
                .where(eq(companies.userId, userId));
            }

            console.log(`[MP Webhook] Activated plan ${planKey} for user ${userId}`);
          }
        }
      }
    }

    return res.json({ received: true });
  } catch (e: any) {
    console.error("[MP Webhook] error:", e.message);
    return res.status(500).json({ error: e.message });
  }
});
