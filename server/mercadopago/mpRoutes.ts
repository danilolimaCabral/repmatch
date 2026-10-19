import { Router, Request, Response } from "express";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import { getDb } from "../db";
import { representatives, companies, users, unlockRequests, unlockRequestItems, unlockedContacts, leadPackageOrders, marketLeadAccesses, consumerLeadOrders, consumerLeadAccesses, representativeMonthlyAccesses } from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { CONTACT_UNLOCK_PRICE, isValidCpf, isValidPayerDocument, normalizeCpf, normalizePayerDocument, type PayerDocumentType } from "@shared/const";
import { notifyOwner } from "../_core/notification";
import { getAuthUser } from "../_core/context";

const mp = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const mpRouter = Router();

function getPayerName(userName?: string) {
  const names = (userName ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: names[0] ?? "Cliente",
    lastName: names.slice(1).join(" ") || "RepMatch",
  };
}

function paymentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/identification|cpf|cnpj|payer|data.*invalid|invalid.*data/i.test(message)) {
    return "Não foi possível validar os dados do pagador. Confira o CPF ou CNPJ e tente novamente.";
  }
  return message || "Não foi possível gerar o PIX. Tente novamente.";
}

function getPayerDocument(documentType?: PayerDocumentType, document?: string, legacyCpf?: string) {
  const type: PayerDocumentType = documentType === "CNPJ" ? "CNPJ" : "CPF";
  const number = normalizePayerDocument(type, document ?? legacyCpf);
  return { type, number, valid: isValidPayerDocument(type, number) };
}

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

type CheckoutResourceKind = "lead_package" | "market_search_unlimited" | "consumer_lead_package" | "consumer_lead_monthly" | "representative_monthly" | "unlock_batch";

// Checkout hospedado pelo Mercado Pago: mantém PIX e habilita cartão sem a
// aplicação receber dados sensíveis do cartão.
mpRouter.post("/checkout-pro", async (req: Request, res: Response) => {
  try {
    const { kind, resourceId } = req.body as { kind?: CheckoutResourceKind; resourceId?: number };
    const sessionUser = await getAuthUser(req);
    if (!sessionUser) return res.status(401).json({ error: "Entre na sua conta para continuar o pagamento." });
    if (!kind || !resourceId) return res.status(400).json({ error: "Pedido inválido para checkout." });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });

    let amount = 0;
    let title = "Pagamento RepMatch";
    let metadata: Record<string, string | number> = { type: kind, user_id: sessionUser.id };
    let returnPath = "/dashboard/company";

    if (kind === "lead_package") {
      const [order] = await db.select().from(leadPackageOrders).where(and(eq(leadPackageOrders.id, resourceId), eq(leadPackageOrders.userId, sessionUser.id))).limit(1);
      if (!order || order.status !== "pending_payment") return res.status(404).json({ error: "Pedido de leads não disponível para pagamento." });
      amount = Number(order.totalAmount);
      title = `Pacote ${order.audience.toUpperCase()} — ${order.quantity.toLocaleString("pt-BR")} leads`;
      metadata = { type: "lead_package", order_id: order.id, user_id: sessionUser.id, audience: order.audience };
      returnPath = "/pacotes-leads";
    } else if (kind === "market_search_unlimited") {
      const [access] = await db.select().from(marketLeadAccesses).where(and(eq(marketLeadAccesses.id, resourceId), eq(marketLeadAccesses.userId, sessionUser.id))).limit(1);
      if (!access || access.status !== "pending_payment") return res.status(404).json({ error: "Plano B2B não disponível para pagamento." });
      amount = Number(access.amount);
      title = access.selectionLimit === 0 ? "Plano B2B Ilimitado — 30 dias" : `Plano B2B — ${access.selectionLimit} empresas / 30 dias`;
      metadata = { type: "market_search_unlimited", access_id: access.id, user_id: sessionUser.id };
    } else if (kind === "consumer_lead_package") {
      const [order] = await db.select().from(consumerLeadOrders).where(and(eq(consumerLeadOrders.id, resourceId), eq(consumerLeadOrders.userId, sessionUser.id))).limit(1);
      if (!order || order.status !== "pending_payment") return res.status(404).json({ error: "Pacote B2C não disponível para pagamento." });
      amount = Number(order.totalAmount);
      title = `Pacote B2C — ${order.quantity} contatos`;
      metadata = { type: "consumer_lead_package", order_id: order.id, user_id: sessionUser.id, quantity: order.quantity };
      returnPath = "/contatos-b2c";
    } else if (kind === "consumer_lead_monthly") {
      const [access] = await db.select().from(consumerLeadAccesses).where(and(eq(consumerLeadAccesses.id, resourceId), eq(consumerLeadAccesses.userId, sessionUser.id))).limit(1);
      if (!access || access.status !== "pending_payment") return res.status(404).json({ error: "Plano B2C não disponível para pagamento." });
      amount = Number(access.amount);
      title = `Plano B2C — ${access.selectionLimit} contatos / 30 dias`;
      metadata = { type: "consumer_lead_unlimited", access_id: access.id, user_id: sessionUser.id };
      returnPath = "/contatos-b2c";
    } else if (kind === "representative_monthly") {
      const [access] = await db.select().from(representativeMonthlyAccesses).where(and(eq(representativeMonthlyAccesses.id, resourceId), eq(representativeMonthlyAccesses.userId, sessionUser.id))).limit(1);
      if (!access || access.status !== "pending_payment") return res.status(404).json({ error: "Plano de representantes não disponível para pagamento." });
      amount = Number(access.amount);
      title = `Plano Representantes — ${access.unlockLimit} desbloqueios / 30 dias`;
      metadata = { type: "representative_monthly", access_id: access.id, user_id: sessionUser.id };
    } else {
      const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.userId, sessionUser.id)).limit(1);
      if (!company) return res.status(403).json({ error: "Empresa não encontrada." });
      const [request] = await db.select().from(unlockRequests).where(and(eq(unlockRequests.id, resourceId), eq(unlockRequests.companyId, company.id))).limit(1);
      if (!request || request.status !== "pending_payment") return res.status(404).json({ error: "Carrinho não disponível para pagamento." });
      amount = Number(request.totalAmount);
      title = "Desbloqueio de representantes";
      metadata = { type: "unlock_batch", request_id: request.id, user_id: sessionUser.id };
    }

    const origin = req.headers.origin ?? "https://repmatch.com.br";
    // O Mercado Pago só aceita auto_return com uma back URL HTTPS. No preview
    // local mantemos o checkout funcional, sem tentar um redirecionamento inválido.
    const canAutoReturn = /^https:\/\//i.test(origin);
    const preference = new Preference(mp);
    const pref = await preference.create({ body: {
      items: [{ id: `${kind}_${resourceId}`, title, quantity: 1, unit_price: amount, currency_id: "BRL" }],
      payer: { email: sessionUser.email ?? undefined, name: sessionUser.name ?? undefined },
      metadata,
      back_urls: { success: `${origin}${returnPath}?payment=success`, failure: `${origin}${returnPath}?payment=failed`, pending: `${origin}${returnPath}?payment=pending` },
      ...(canAutoReturn ? { auto_return: "approved" as const } : {}),
      payment_methods: { installments: 12 },
      statement_descriptor: "REPMATCH",
    }});
    return res.json({ preferenceId: pref.id, initPoint: pref.init_point, sandboxInitPoint: pref.sandbox_init_point });
  } catch (error) {
    console.error("[MP] checkout-pro error:", error);
    return res.status(500).json({ error: "Não foi possível abrir o checkout. Tente novamente." });
  }
});

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
    const payerCpf = normalizeCpf(cpf);
    if (!isValidCpf(payerCpf)) return res.status(400).json({ error: "CPF inválido. Confira os 11 dígitos do pagador." });

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
          first_name: getPayerName(userName).firstName,
          last_name: getPayerName(userName).lastName,
          identification: {
            type: "CPF",
            number: payerCpf,
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
  } catch (e: unknown) {
    console.error("[MP] unlock-pix error:", e);
    return res.status(500).json({ error: paymentErrorMessage(e) });
  }
});

// ─── Gerar PIX para pacote de leads B2B/B2C ───────────────────────────────────
mpRouter.post("/lead-package-pix", async (req: Request, res: Response) => {
  try {
    const { orderId, userId, userEmail, userName, documentType, document, cpf } = req.body as {
      orderId: number; userId: number; userEmail: string; userName: string; documentType?: PayerDocumentType; document?: string; cpf?: string;
    };
    if (!orderId || !userId) return res.status(400).json({ error: "Dados inválidos" });
    const payerDocument = getPayerDocument(documentType, document, cpf);
    if (!payerDocument.valid) return res.status(400).json({ error: `${payerDocument.type} inválido. Confira os dígitos do pagador.` });
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
          first_name: getPayerName(userName).firstName,
          last_name: getPayerName(userName).lastName,
          identification: { type: payerDocument.type, number: payerDocument.number },
        },
        metadata: { type: "lead_package", order_id: orderId, user_id: userId, audience: order.audience },
      },
    });
    if (result.id) {
      await db.update(leadPackageOrders).set({
        mpPaymentId: String(result.id),
        adminNotes: "QR Code PIX emitido pelo Mercado Pago — aguardando confirmação do pagamento.",
      }).where(eq(leadPackageOrders.id, orderId));
    }
    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({ paymentId: result.id, status: result.status, qrCode: txInfo?.qr_code, qrCodeBase64: txInfo?.qr_code_base64, expiresAt: result.date_of_expiration });
  } catch (e: unknown) {
    console.error("[MP] lead-package-pix error:", e);
    return res.status(500).json({ error: paymentErrorMessage(e) });
  }
});

// ─── Gerar PIX para pacote B2C de contatos PF ──────────────────────────────────
mpRouter.post("/consumer-lead-package-pix", async (req: Request, res: Response) => {
  try {
    const { orderId, userId, userEmail, userName, documentType, document, cpf } = req.body as {
      orderId: number; userId: number; userEmail: string; userName: string; documentType?: PayerDocumentType; document?: string; cpf?: string;
    };
    const sessionUser = await getAuthUser(req);
    if (!sessionUser || sessionUser.id !== userId) return res.status(401).json({ error: "Entre na sua conta para gerar o PIX deste pedido." });
    if (!orderId) return res.status(400).json({ error: "Dados inválidos" });
    const payerDocument = getPayerDocument(documentType, document, cpf);
    if (!payerDocument.valid) return res.status(400).json({ error: `${payerDocument.type} inválido. Confira os dígitos do pagador.` });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [order] = await db.select({ id: consumerLeadOrders.id, quantity: consumerLeadOrders.quantity, totalAmount: consumerLeadOrders.totalAmount, status: consumerLeadOrders.status })
      .from(consumerLeadOrders).where(and(eq(consumerLeadOrders.id, orderId), eq(consumerLeadOrders.userId, sessionUser.id))).limit(1);
    if (!order || order.status !== "pending_payment") return res.status(404).json({ error: "Pedido B2C não disponível para pagamento" });
    const payment = new Payment(mp);
    const result = await payment.create({ body: {
      transaction_amount: Number(order.totalAmount),
      description: `Pacote B2C PF — ${order.quantity} contatos | RepMatch`,
      payment_method_id: "pix",
      payer: { email: sessionUser.email || userEmail, first_name: getPayerName(sessionUser.name || userName).firstName, last_name: getPayerName(sessionUser.name || userName).lastName, identification: { type: payerDocument.type, number: payerDocument.number } },
      metadata: { type: "consumer_lead_package", order_id: orderId, user_id: sessionUser.id, quantity: order.quantity },
    }});
    if (result.id) await db.update(consumerLeadOrders).set({ mpPaymentId: String(result.id), adminNotes: "QR Code PIX emitido pelo Mercado Pago — aguardando confirmação do pagamento." }).where(eq(consumerLeadOrders.id, orderId));
    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({ paymentId: result.id, status: result.status, qrCode: txInfo?.qr_code, qrCodeBase64: txInfo?.qr_code_base64, expiresAt: result.date_of_expiration });
  } catch (e: unknown) {
    console.error("[MP] consumer-lead-package-pix error:", e);
    return res.status(500).json({ error: paymentErrorMessage(e) });
  }
});

// ─── Gerar PIX para plano B2C PF ilimitado ─────────────────────────────────────
mpRouter.post("/consumer-lead-unlimited-pix", async (req: Request, res: Response) => {
  try {
    const { accessId, userId, userEmail, userName, documentType, document, cpf } = req.body as {
      accessId: number; userId: number; userEmail: string; userName: string; documentType?: PayerDocumentType; document?: string; cpf?: string;
    };
    const sessionUser = await getAuthUser(req);
    if (!sessionUser || sessionUser.id !== userId) return res.status(401).json({ error: "Entre na sua conta para gerar o PIX deste plano." });
    if (!accessId) return res.status(400).json({ error: "Dados inválidos" });
    const payerDocument = getPayerDocument(documentType, document, cpf);
    if (!payerDocument.valid) return res.status(400).json({ error: `${payerDocument.type} inválido. Confira os dígitos do pagador.` });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [access] = await db.select({ id: consumerLeadAccesses.id, amount: consumerLeadAccesses.amount, status: consumerLeadAccesses.status })
      .from(consumerLeadAccesses).where(and(eq(consumerLeadAccesses.id, accessId), eq(consumerLeadAccesses.userId, sessionUser.id))).limit(1);
    if (!access || access.status !== "pending_payment") return res.status(404).json({ error: "Plano B2C não disponível para pagamento" });
    const payment = new Payment(mp);
    const result = await payment.create({ body: {
      transaction_amount: Number(access.amount),
      description: "Plano B2C PF Ilimitado — 30 dias | RepMatch",
      payment_method_id: "pix",
      payer: { email: sessionUser.email || userEmail, first_name: getPayerName(sessionUser.name || userName).firstName, last_name: getPayerName(sessionUser.name || userName).lastName, identification: { type: payerDocument.type, number: payerDocument.number } },
      metadata: { type: "consumer_lead_unlimited", access_id: accessId, user_id: sessionUser.id },
    }});
    if (result.id) await db.update(consumerLeadAccesses).set({ mpPaymentId: String(result.id), adminNotes: "QR Code PIX emitido pelo Mercado Pago — aguardando confirmação do pagamento." }).where(eq(consumerLeadAccesses.id, accessId));
    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({ paymentId: result.id, status: result.status, qrCode: txInfo?.qr_code, qrCodeBase64: txInfo?.qr_code_base64, expiresAt: result.date_of_expiration });
  } catch (e: unknown) {
    console.error("[MP] consumer-lead-unlimited-pix error:", e);
    return res.status(500).json({ error: paymentErrorMessage(e) });
  }
});

// ─── Gerar PIX para o Plano Pesquisa Ilimitada ─────────────────────────────────
mpRouter.post("/market-search-unlimited-pix", async (req: Request, res: Response) => {
  try {
    const { accessId, userId, userEmail, userName, documentType, document, cpf } = req.body as { accessId: number; userId: number; userEmail: string; userName: string; documentType?: PayerDocumentType; document?: string; cpf?: string };
    if (!accessId || !userId) return res.status(400).json({ error: "Dados inválidos" });
    const sessionUser = await getAuthUser(req);
    if (!sessionUser || sessionUser.id !== userId) return res.status(401).json({ error: "Entre na sua conta para gerar o PIX deste plano." });
    const payerDocument = getPayerDocument(documentType, document, cpf);
    if (!payerDocument.valid) return res.status(400).json({ error: `${payerDocument.type} inválido. Confira os dígitos do pagador.` });
    const db = await getDb();
    if (!db) return res.status(500).json({ error: "Banco de dados indisponível" });
    const [access] = await db.select({ id: marketLeadAccesses.id, amount: marketLeadAccesses.amount, status: marketLeadAccesses.status })
      .from(marketLeadAccesses).where(and(eq(marketLeadAccesses.id, accessId), eq(marketLeadAccesses.userId, userId))).limit(1);
    if (!access || access.status !== "pending_payment") return res.status(404).json({ error: "Plano não disponível para pagamento" });
    const payment = new Payment(mp);
    const result = await payment.create({ body: {
      transaction_amount: Number(access.amount), description: "Plano Pesquisa Ilimitada — 30 dias | RepMatch", payment_method_id: "pix",
      payer: { email: sessionUser.email || userEmail, first_name: getPayerName(sessionUser.name || userName).firstName, last_name: getPayerName(sessionUser.name || userName).lastName, identification: { type: payerDocument.type, number: payerDocument.number } },
      metadata: { type: "market_search_unlimited", access_id: accessId, user_id: sessionUser.id },
    }});
    if (result.id) {
      await db.update(marketLeadAccesses).set({
        mpPaymentId: String(result.id),
        adminNotes: "QR Code PIX emitido pelo Mercado Pago — aguardando confirmação do pagamento.",
      }).where(eq(marketLeadAccesses.id, accessId));
    }
    const txInfo = result.point_of_interaction?.transaction_data;
    return res.json({ paymentId: result.id, status: result.status, qrCode: txInfo?.qr_code, qrCodeBase64: txInfo?.qr_code_base64, expiresAt: result.date_of_expiration });
  } catch (e: unknown) {
    console.error("[MP] market-search-unlimited-pix error:", e);
    return res.status(500).json({ error: paymentErrorMessage(e) });
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

        // ── Plano B2C PF mensal: ativação automática após pagamento ─────────
        if (meta?.type === "consumer_lead_unlimited") {
          const accessId = Number(meta.access_id);
          if (accessId) {
            const [access] = await db.select({ id: consumerLeadAccesses.id, status: consumerLeadAccesses.status, amount: consumerLeadAccesses.amount })
              .from(consumerLeadAccesses).where(eq(consumerLeadAccesses.id, accessId)).limit(1);
            if (access?.status === "pending_payment") {
              const startsAt = new Date();
              const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
              await db.update(consumerLeadAccesses).set({ status: "active", startsAt, expiresAt, mpPaymentId: String(result.id), adminNotes: "Ativado automaticamente pelo Mercado Pago por 30 dias." }).where(eq(consumerLeadAccesses.id, accessId));
              void notifyOwner({ title: `Plano B2C ativado automaticamente #${accessId}`, content: `Pagamento de R$ ${Number(access.amount).toFixed(2)} confirmado e plano ativado até ${expiresAt.toLocaleDateString("pt-BR")}.` }).catch((error) => console.error("[MP Webhook] consumer monthly notification error:", error));
            }
          }
        // ── Plano mensal de representantes: ativação automática ─────────────
        } else if (meta?.type === "representative_monthly") {
          const accessId = Number(meta.access_id);
          if (accessId) {
            const [access] = await db.select({ id: representativeMonthlyAccesses.id, status: representativeMonthlyAccesses.status, amount: representativeMonthlyAccesses.amount, unlockLimit: representativeMonthlyAccesses.unlockLimit })
              .from(representativeMonthlyAccesses).where(eq(representativeMonthlyAccesses.id, accessId)).limit(1);
            if (access?.status === "pending_payment") {
              const startsAt = new Date();
              const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
              await db.update(representativeMonthlyAccesses).set({ status: "active", startsAt, expiresAt, mpPaymentId: String(result.id), adminNotes: "Ativado automaticamente pelo Mercado Pago por 30 dias." }).where(eq(representativeMonthlyAccesses.id, accessId));
              void notifyOwner({ title: `Plano de representantes ativado #${accessId}`, content: `${access.unlockLimit} desbloqueios liberados automaticamente até ${expiresAt.toLocaleDateString("pt-BR")}.` }).catch((error) => console.error("[MP Webhook] representative monthly notification error:", error));
            }
          }
        // ── Pacote B2C PF: liberação automática ───────────────────────────────
        } else if (meta?.type === "consumer_lead_package") {
          const orderId = Number(meta.order_id);
          if (orderId) {
            const [order] = await db.select({ id: consumerLeadOrders.id, status: consumerLeadOrders.status, quantity: consumerLeadOrders.quantity, totalAmount: consumerLeadOrders.totalAmount })
              .from(consumerLeadOrders).where(eq(consumerLeadOrders.id, orderId)).limit(1);
            if (order?.status === "pending_payment") {
              await db.update(consumerLeadOrders).set({ status: "approved", mpPaymentId: String(result.id), adminNotes: "Liberado automaticamente após pagamento confirmado pelo Mercado Pago." }).where(eq(consumerLeadOrders.id, orderId));
              void notifyOwner({ title: `Pacote B2C liberado automaticamente #${orderId}`, content: `${order.quantity} créditos B2C liberados após pagamento de R$ ${Number(order.totalAmount).toFixed(2)}.` }).catch((error) => console.error("[MP Webhook] consumer order notification error:", error));
            }
          }
        // ── Plano Pesquisa Ilimitada B2B: ativação automática ────────────────
        } else if (meta?.type === "market_search_unlimited") {
          const accessId = Number(meta.access_id);
          if (accessId) {
            const [access] = await db.select({ id: marketLeadAccesses.id, status: marketLeadAccesses.status, amount: marketLeadAccesses.amount, selectionLimit: marketLeadAccesses.selectionLimit })
              .from(marketLeadAccesses).where(eq(marketLeadAccesses.id, accessId)).limit(1);
            if (access?.status === "pending_payment") {
              const startsAt = new Date();
              const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000);
              await db.update(marketLeadAccesses).set({ status: "active", startsAt, expiresAt, mpPaymentId: String(result.id), adminNotes: "Ativado automaticamente pelo Mercado Pago por 30 dias." }).where(eq(marketLeadAccesses.id, accessId));
              const entitlement = access.selectionLimit === 0 ? "pesquisa ilimitada" : `${access.selectionLimit} empresas selecionáveis`;
              void notifyOwner({ title: `Plano B2B ativado automaticamente #${accessId}`, content: `${entitlement} liberados até ${expiresAt.toLocaleDateString("pt-BR")}.` }).catch((error) => console.error("[MP Webhook] unlimited notification error:", error));
            }
          }
        // ── Pacote de leads: liberação automática ─────────────────────────────
        } else if (meta?.type === "lead_package") {
          const orderId = Number(meta.order_id);
          if (orderId) {
            const [leadOrder] = await db.select({ id: leadPackageOrders.id, status: leadPackageOrders.status, audience: leadPackageOrders.audience, quantity: leadPackageOrders.quantity, totalAmount: leadPackageOrders.totalAmount })
              .from(leadPackageOrders).where(eq(leadPackageOrders.id, orderId)).limit(1);
            if (leadOrder && leadOrder.status === "pending_payment") {
              await db.update(leadPackageOrders).set({
                status: "approved",
                mpPaymentId: String(result.id),
                adminNotes: "Liberado automaticamente após pagamento confirmado pelo Mercado Pago.",
              }).where(eq(leadPackageOrders.id, orderId));
              void notifyOwner({
                title: `Pacote ${leadOrder.audience.toUpperCase()} liberado #${orderId}`,
                content: `${leadOrder.quantity.toLocaleString("pt-BR")} créditos liberados automaticamente após pagamento de R$ ${Number(leadOrder.totalAmount).toFixed(2)}.`,
              }).catch((error) => console.error("[MP Webhook] lead order notification error:", error));
            }
          }
        // ── Desbloqueio em lote: liberação automática ─────────────────────────
        } else if (meta?.type === "unlock_batch") {
          const requestId = Number(meta.request_id);

          if (requestId) {
            const [unlockReq] = await db.select({ id: unlockRequests.id, status: unlockRequests.status, companyId: unlockRequests.companyId, totalAmount: unlockRequests.totalAmount })
              .from(unlockRequests).where(eq(unlockRequests.id, requestId)).limit(1);

            if (unlockReq && unlockReq.status === "pending_payment") {
              const items = await db.select({ id: unlockRequestItems.id, representativeId: unlockRequestItems.representativeId, priceUnit: unlockRequestItems.priceUnit })
                .from(unlockRequestItems)
                .where(eq(unlockRequestItems.unlockRequestId, requestId));

              await db.update(unlockRequests)
                .set({
                  status: "approved",
                  stripePaymentId: String(result.id),
                  adminNotes: "Contatos liberados automaticamente após pagamento confirmado pelo Mercado Pago.",
                })
                .where(eq(unlockRequests.id, requestId));
              for (const item of items) {
                const [alreadyUnlocked] = await db.select({ id: unlockedContacts.id }).from(unlockedContacts)
                  .where(and(eq(unlockedContacts.companyId, unlockReq.companyId), eq(unlockedContacts.representativeId, item.representativeId))).limit(1);
                if (!alreadyUnlocked) await db.insert(unlockedContacts).values({ companyId: unlockReq.companyId, representativeId: item.representativeId, pricePaid: item.priceUnit, stripePaymentId: String(result.id) });
              }

              void notifyOwner({
                title: `Contatos liberados automaticamente #${requestId}`,
                content: `${items.length} contato(s) liberados após pagamento de R$ ${Number(unlockReq.totalAmount).toFixed(2)}.`,
              }).catch((error) => console.error("[MP Webhook] owner notification error:", error));

              console.log(`[MP Webhook] payment approved for request #${requestId}; automatically released ${items.length} contact(s)`);
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
