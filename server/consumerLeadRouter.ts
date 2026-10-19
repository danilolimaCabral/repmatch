import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { consumerLeadAccesses, consumerLeadOrders, consumerLeads, savedConsumerLeads, users } from "../drizzle/schema";
import { getMySqlInsertId } from "@shared/mysql";
import {
  CONSUMER_LEAD_MONTHLY_DURATION_DAYS,
  CONSUMER_LEAD_MONTHLY_PLANS,
  CONSUMER_LEAD_MONTHLY_SELECTION_LIMITS,
  CONSUMER_LEAD_PACKAGE_PRICES,
  getConsumerLeadMonthlyPlan,
  getConsumerLeadPackagePrice,
} from "@shared/consumerLeads";
import { decryptConsumerLeadValue } from "./consumerLeadCrypto";

const releasedStatuses = ["approved", "delivered"] as const;
const activeConsumerScope = and(eq(consumerLeads.available, true), eq(consumerLeads.consentStatus, "declared"));
const paginationInput = z.object({
  offset: z.number().int().min(0).max(100_000).default(0),
  limit: z.number().int().min(1).max(100).default(50),
});
const monthlySelectionLimitInput = z.union([
  z.literal(CONSUMER_LEAD_MONTHLY_SELECTION_LIMITS[0]),
  z.literal(CONSUMER_LEAD_MONTHLY_SELECTION_LIMITS[1]),
  z.literal(CONSUMER_LEAD_MONTHLY_SELECTION_LIMITS[2]),
]);

function consumerLeadCatalogRows(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, offset: number, limit: number) {
  return db.select({
    id: consumerLeads.id,
    hasPhone: sql<boolean>`${consumerLeads.phone} IS NOT NULL AND ${consumerLeads.phone} <> ''`,
    hasEmail: sql<boolean>`${consumerLeads.email} IS NOT NULL AND ${consumerLeads.email} <> ''`,
  }).from(consumerLeads).where(activeConsumerScope).orderBy(asc(consumerLeads.id)).limit(limit).offset(offset);
}

async function selectedIds(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, leadIds: number[]) {
  if (!leadIds.length) return [];
  const rows = await db.select({ consumerLeadId: savedConsumerLeads.consumerLeadId }).from(savedConsumerLeads)
    .where(and(eq(savedConsumerLeads.userId, userId), inArray(savedConsumerLeads.consumerLeadId, leadIds)));
  return rows.map((row) => row.consumerLeadId);
}

export const consumerLeadPackagesRouter = router({
  catalog: publicProcedure.query(async () => {
    const fallback = {
      available: 0,
      withPhone: 0,
      withEmail: 0,
      packages: Object.entries(CONSUMER_LEAD_PACKAGE_PRICES).map(([quantity, price]) => ({ quantity: Number(quantity), price })),
      monthlyPlans: CONSUMER_LEAD_MONTHLY_PLANS.map((plan) => ({ ...plan, durationDays: CONSUMER_LEAD_MONTHLY_DURATION_DAYS })),
    };
    const db = await getDb();
    if (!db) return fallback;
    const [summary] = await db.select({
      available: count(),
      withPhone: sql<number>`SUM(CASE WHEN ${consumerLeads.phone} IS NOT NULL AND ${consumerLeads.phone} <> '' THEN 1 ELSE 0 END)`,
      withEmail: sql<number>`SUM(CASE WHEN ${consumerLeads.email} IS NOT NULL AND ${consumerLeads.email} <> '' THEN 1 ELSE 0 END)`,
    }).from(consumerLeads).where(activeConsumerScope);
    return {
      ...fallback,
      available: Number(summary?.available ?? 0),
      withPhone: Number(summary?.withPhone ?? 0),
      withEmail: Number(summary?.withEmail ?? 0),
    };
  }),

  createOrder: protectedProcedure
    .input(z.object({ quantity: z.union([z.literal(50), z.literal(100)]), legalConsent: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const price = getConsumerLeadPackagePrice(input.quantity);
      const [existing] = await db.select({ id: consumerLeadOrders.id, totalAmount: consumerLeadOrders.totalAmount })
        .from(consumerLeadOrders)
        .where(and(eq(consumerLeadOrders.userId, ctx.user.id), eq(consumerLeadOrders.quantity, input.quantity), eq(consumerLeadOrders.status, "pending_payment")))
        .orderBy(desc(consumerLeadOrders.createdAt)).limit(1);
      if (existing) return { orderId: existing.id, price: Number(existing.totalAmount), quantity: input.quantity, existing: true };
      const [result] = await db.insert(consumerLeadOrders).values({
        userId: ctx.user.id,
        quantity: input.quantity,
        legalConsent: true,
        paymentMethod: "pix",
        status: "pending_payment",
        totalAmount: price.toFixed(2),
      });
      const orderId = getMySqlInsertId(result);
      if (!orderId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar o pedido B2C." });
      return { orderId, price, quantity: input.quantity, existing: false };
    }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(consumerLeadOrders).where(eq(consumerLeadOrders.userId, ctx.user.id)).orderBy(desc(consumerLeadOrders.createdAt));
  }),

  getLeadCredits: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, used: 0, remaining: 0 };
    const [orderTotals] = await db.select({ total: sql<number>`COALESCE(SUM(${consumerLeadOrders.quantity}), 0)` })
      .from(consumerLeadOrders)
      .where(and(eq(consumerLeadOrders.userId, ctx.user.id), inArray(consumerLeadOrders.status, releasedStatuses)));
    const [savedTotals] = await db.select({ total: count() }).from(savedConsumerLeads)
      .where(and(eq(savedConsumerLeads.userId, ctx.user.id), isNotNull(savedConsumerLeads.consumerLeadOrderId)));
    const total = Number(orderTotals?.total ?? 0);
    const used = Number(savedTotals?.total ?? 0);
    return { total, used, remaining: Math.max(0, total - used) };
  }),

  searchReleasedPackage: protectedProcedure.input(paginationInput.extend({ orderId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [order] = await db.select().from(consumerLeadOrders)
        .where(and(eq(consumerLeadOrders.id, input.orderId), eq(consumerLeadOrders.userId, ctx.user.id))).limit(1);
      if (!order || (order.status !== "approved" && order.status !== "delivered")) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Este pacote B2C ainda não foi liberado." });
      }
      const [totalResult, rows] = await Promise.all([
        db.select({ total: count() }).from(consumerLeads).where(activeConsumerScope),
        consumerLeadCatalogRows(db, input.offset, input.limit),
      ]);
      return {
        orderId: order.id,
        quantity: order.quantity,
        total: Number(totalResult[0]?.total ?? 0),
        offset: input.offset,
        hasMore: input.offset + rows.length < Number(totalResult[0]?.total ?? 0),
        savedLeadIds: await selectedIds(db, ctx.user.id, rows.map((row) => row.id)),
        rows,
      };
    }),

  saveLeadFromPackage: protectedProcedure
    .input(z.object({ orderId: z.number().int().positive(), consumerLeadId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT ${users.id} FROM ${users} WHERE ${users.id} = ${ctx.user.id} FOR UPDATE`);
        const [order] = await tx.select().from(consumerLeadOrders)
          .where(and(eq(consumerLeadOrders.id, input.orderId), eq(consumerLeadOrders.userId, ctx.user.id))).limit(1);
        if (!order || (order.status !== "approved" && order.status !== "delivered")) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Este pacote B2C ainda não foi liberado." });
        }
        const [lead] = await tx.select({ id: consumerLeads.id }).from(consumerLeads)
          .where(and(eq(consumerLeads.id, input.consumerLeadId), eq(consumerLeads.available, true), eq(consumerLeads.consentStatus, "declared"))).limit(1);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Este contato não está mais disponível." });
        const [alreadySaved] = await tx.select({ id: savedConsumerLeads.id }).from(savedConsumerLeads)
          .where(and(eq(savedConsumerLeads.userId, ctx.user.id), eq(savedConsumerLeads.consumerLeadId, lead.id))).limit(1);
        if (!alreadySaved) {
          const [orderTotals] = await tx.select({ total: sql<number>`COALESCE(SUM(${consumerLeadOrders.quantity}), 0)` })
            .from(consumerLeadOrders)
            .where(and(eq(consumerLeadOrders.userId, ctx.user.id), inArray(consumerLeadOrders.status, releasedStatuses)));
          const [savedTotals] = await tx.select({ total: count() }).from(savedConsumerLeads)
            .where(and(eq(savedConsumerLeads.userId, ctx.user.id), isNotNull(savedConsumerLeads.consumerLeadOrderId)));
          if (Number(savedTotals?.total ?? 0) >= Number(orderTotals?.total ?? 0)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Você usou todos os créditos B2C. Contrate outro pacote para continuar." });
          }
          await tx.insert(savedConsumerLeads).values({ userId: ctx.user.id, consumerLeadOrderId: order.id, consumerLeadId: lead.id });
        }
        const [orderTotals] = await tx.select({ total: sql<number>`COALESCE(SUM(${consumerLeadOrders.quantity}), 0)` })
          .from(consumerLeadOrders)
          .where(and(eq(consumerLeadOrders.userId, ctx.user.id), inArray(consumerLeadOrders.status, releasedStatuses)));
        const [savedTotals] = await tx.select({ total: count() }).from(savedConsumerLeads)
          .where(and(eq(savedConsumerLeads.userId, ctx.user.id), isNotNull(savedConsumerLeads.consumerLeadOrderId)));
        const total = Number(orderTotals?.total ?? 0);
        const used = Number(savedTotals?.total ?? 0);
        return { success: true, alreadySaved: !!alreadySaved, total, used, remaining: Math.max(0, total - used) };
      });
    }),

  createUnlimitedAccess: protectedProcedure.input(z.object({
    selectionLimit: monthlySelectionLimitInput,
    legalConsent: z.literal(true),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const plan = getConsumerLeadMonthlyPlan(input.selectionLimit);
    const [existing] = await db.select({
      id: consumerLeadAccesses.id,
      amount: consumerLeadAccesses.amount,
      selectionLimit: consumerLeadAccesses.selectionLimit,
    }).from(consumerLeadAccesses)
      .where(and(eq(consumerLeadAccesses.userId, ctx.user.id), inArray(consumerLeadAccesses.status, ["pending_payment", "pending_approval", "active"])))
      .orderBy(desc(consumerLeadAccesses.createdAt)).limit(1);
    // A pending or active access preserves the tier already recorded for checkout and usage.
    if (existing) return {
      accessId: existing.id,
      price: Number(existing.amount),
      selectionLimit: existing.selectionLimit,
      durationDays: CONSUMER_LEAD_MONTHLY_DURATION_DAYS,
      existing: true,
    };
    const [result] = await db.insert(consumerLeadAccesses).values({
      userId: ctx.user.id,
      legalConsent: true,
      amount: plan.price.toFixed(2),
      selectionLimit: plan.selectionLimit,
      status: "pending_payment",
    });
    const accessId = getMySqlInsertId(result);
    if (!accessId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a solicitação do plano B2C." });
    return {
      accessId,
      price: plan.price,
      selectionLimit: plan.selectionLimit,
      durationDays: CONSUMER_LEAD_MONTHLY_DURATION_DAYS,
      existing: false,
    };
  }),

  myUnlimitedAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [access] = await db.select().from(consumerLeadAccesses)
      .where(and(eq(consumerLeadAccesses.userId, ctx.user.id), eq(consumerLeadAccesses.status, "active"), gte(consumerLeadAccesses.expiresAt, new Date())))
      .orderBy(desc(consumerLeadAccesses.expiresAt)).limit(1);
    return access ?? null;
  }),

  myUnlimitedRequest: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [request] = await db.select().from(consumerLeadAccesses)
      .where(eq(consumerLeadAccesses.userId, ctx.user.id)).orderBy(desc(consumerLeadAccesses.createdAt)).limit(1);
    return request ?? null;
  }),

  searchUnlimited: protectedProcedure.input(paginationInput).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select({ id: consumerLeadAccesses.id, selectionLimit: consumerLeadAccesses.selectionLimit }).from(consumerLeadAccesses)
      .where(and(eq(consumerLeadAccesses.userId, ctx.user.id), eq(consumerLeadAccesses.status, "active"), gte(consumerLeadAccesses.expiresAt, new Date())))
      .orderBy(desc(consumerLeadAccesses.expiresAt)).limit(1);
    if (!access) throw new TRPCError({ code: "FORBIDDEN", message: "Assine um plano B2C mensal para pesquisar a base." });
    const [totalResult, rows] = await Promise.all([
      db.select({ total: count() }).from(consumerLeads).where(activeConsumerScope),
      consumerLeadCatalogRows(db, input.offset, input.limit),
    ]);
    const [savedTotal] = await db.select({ total: count() }).from(savedConsumerLeads)
      .where(eq(savedConsumerLeads.consumerLeadAccessId, access.id));
    const used = Number(savedTotal?.total ?? 0);
    return {
      accessId: access.id,
      selectionLimit: access.selectionLimit,
      used,
      remaining: Math.max(0, access.selectionLimit - used),
      total: Number(totalResult[0]?.total ?? 0),
      offset: input.offset,
      hasMore: input.offset + rows.length < Number(totalResult[0]?.total ?? 0),
      savedLeadIds: await selectedIds(db, ctx.user.id, rows.map((row) => row.id)),
      rows,
    };
  }),

  saveLeadFromUnlimited: protectedProcedure.input(z.object({ consumerLeadId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.transaction(async (tx) => {
        await tx.execute(sql`SELECT ${users.id} FROM ${users} WHERE ${users.id} = ${ctx.user.id} FOR UPDATE`);
        const [access] = await tx.select().from(consumerLeadAccesses)
          .where(and(eq(consumerLeadAccesses.userId, ctx.user.id), eq(consumerLeadAccesses.status, "active"), gte(consumerLeadAccesses.expiresAt, new Date())))
          .orderBy(desc(consumerLeadAccesses.expiresAt)).limit(1);
        if (!access) throw new TRPCError({ code: "FORBIDDEN", message: "Seu plano mensal B2C não está ativo." });
        const [lead] = await tx.select({ id: consumerLeads.id }).from(consumerLeads)
          .where(and(eq(consumerLeads.id, input.consumerLeadId), eq(consumerLeads.available, true), eq(consumerLeads.consentStatus, "declared"))).limit(1);
        if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Este contato não está mais disponível." });
        const [alreadySaved] = await tx.select({ id: savedConsumerLeads.id }).from(savedConsumerLeads)
          .where(and(eq(savedConsumerLeads.userId, ctx.user.id), eq(savedConsumerLeads.consumerLeadId, lead.id))).limit(1);
        const [savedTotal] = await tx.select({ total: count() }).from(savedConsumerLeads)
          .where(eq(savedConsumerLeads.consumerLeadAccessId, access.id));
        const used = Number(savedTotal?.total ?? 0);
        const selectionLimit = Number(access.selectionLimit);
        if (!alreadySaved && used >= selectionLimit) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `Você usou os ${selectionLimit} contatos do seu plano mensal. Renove o plano para continuar.` });
        }
        if (!alreadySaved) await tx.insert(savedConsumerLeads).values({ userId: ctx.user.id, consumerLeadAccessId: access.id, consumerLeadId: lead.id });
        const nextUsed = used + (alreadySaved ? 0 : 1);
        return { success: true, alreadySaved: !!alreadySaved, selectionLimit, used: nextUsed, remaining: Math.max(0, selectionLimit - nextUsed) };
      });
    }),

  mySavedLeads: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select({
      savedId: savedConsumerLeads.id,
      savedAt: savedConsumerLeads.createdAt,
      id: consumerLeads.id,
      fullName: consumerLeads.fullName,
      phone: consumerLeads.phone,
      email: consumerLeads.email,
    }).from(savedConsumerLeads).innerJoin(consumerLeads, eq(savedConsumerLeads.consumerLeadId, consumerLeads.id))
      .where(and(eq(savedConsumerLeads.userId, ctx.user.id), eq(consumerLeads.available, true), eq(consumerLeads.consentStatus, "declared"))).orderBy(desc(savedConsumerLeads.createdAt));
    return rows.map((row) => ({ ...row, fullName: decryptConsumerLeadValue(row.fullName) ?? "", phone: decryptConsumerLeadValue(row.phone), email: decryptConsumerLeadValue(row.email) }));
  }),

  downloadSavedLeads: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select({ fullName: consumerLeads.fullName, phone: consumerLeads.phone, email: consumerLeads.email })
      .from(savedConsumerLeads).innerJoin(consumerLeads, eq(savedConsumerLeads.consumerLeadId, consumerLeads.id))
      .where(and(eq(savedConsumerLeads.userId, ctx.user.id), eq(consumerLeads.available, true), eq(consumerLeads.consentStatus, "declared"))).orderBy(desc(savedConsumerLeads.createdAt));
    return { rows: rows.map((row) => ({ fullName: decryptConsumerLeadValue(row.fullName) ?? "", phone: decryptConsumerLeadValue(row.phone), email: decryptConsumerLeadValue(row.email) })) };
  }),

  adminPreview: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return { total: 0, withPhone: 0, withEmail: 0 };
    const [summary] = await db.select({
      total: count(),
      withPhone: sql<number>`SUM(CASE WHEN ${consumerLeads.phone} IS NOT NULL AND ${consumerLeads.phone} <> '' THEN 1 ELSE 0 END)`,
      withEmail: sql<number>`SUM(CASE WHEN ${consumerLeads.email} IS NOT NULL AND ${consumerLeads.email} <> '' THEN 1 ELSE 0 END)`,
    }).from(consumerLeads).where(activeConsumerScope);
    return { total: Number(summary?.total ?? 0), withPhone: Number(summary?.withPhone ?? 0), withEmail: Number(summary?.withEmail ?? 0) };
  }),

  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: consumerLeadOrders.id,
      quantity: consumerLeadOrders.quantity,
      legalConsent: consumerLeadOrders.legalConsent,
      status: consumerLeadOrders.status,
      totalAmount: consumerLeadOrders.totalAmount,
      mpPaymentId: consumerLeadOrders.mpPaymentId,
      adminNotes: consumerLeadOrders.adminNotes,
      createdAt: consumerLeadOrders.createdAt,
      buyerName: users.name,
      buyerEmail: users.email,
    }).from(consumerLeadOrders).leftJoin(users, eq(consumerLeadOrders.userId, users.id)).orderBy(desc(consumerLeadOrders.createdAt));
  }),

  review: protectedProcedure.input(z.object({
    orderId: z.number().int().positive(),
    status: z.enum(["approved", "rejected", "delivered"]),
    notes: z.string().trim().max(1000).optional(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [order] = await db.select({ status: consumerLeadOrders.status }).from(consumerLeadOrders).where(eq(consumerLeadOrders.id, input.orderId)).limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido B2C não encontrado." });
    if (input.status === "approved" && order.status !== "pending_approval") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A aprovação só é permitida após confirmação do PIX." });
    if (input.status === "delivered" && order.status !== "approved") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "O pedido precisa ser aprovado antes da entrega." });
    await db.update(consumerLeadOrders).set({
      status: input.status,
      adminNotes: input.notes || null,
      reviewedBy: ctx.user.id,
      reviewedAt: new Date(),
      deliveredAt: input.status === "delivered" ? new Date() : null,
    }).where(eq(consumerLeadOrders.id, input.orderId));
    return { success: true };
  }),

  confirmPix: protectedProcedure.input(z.object({ orderId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [order] = await db.select({ status: consumerLeadOrders.status }).from(consumerLeadOrders).where(eq(consumerLeadOrders.id, input.orderId)).limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Pedido B2C não encontrado." });
    if (order.status !== "pending_payment") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este pedido não está aguardando PIX." });
    await db.update(consumerLeadOrders).set({
      status: "pending_approval",
      reviewedBy: ctx.user.id,
      reviewedAt: new Date(),
      adminNotes: "PIX confirmado manualmente pelo administrador — aguardando liberação da base B2C.",
    }).where(eq(consumerLeadOrders.id, input.orderId));
    return { success: true };
  }),

  adminUnlimitedAccesses: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    return db.select({
      id: consumerLeadAccesses.id,
      status: consumerLeadAccesses.status,
      amount: consumerLeadAccesses.amount,
      mpPaymentId: consumerLeadAccesses.mpPaymentId,
      startsAt: consumerLeadAccesses.startsAt,
      expiresAt: consumerLeadAccesses.expiresAt,
      adminNotes: consumerLeadAccesses.adminNotes,
      createdAt: consumerLeadAccesses.createdAt,
      buyerName: users.name,
      buyerEmail: users.email,
    }).from(consumerLeadAccesses).leftJoin(users, eq(consumerLeadAccesses.userId, users.id)).orderBy(desc(consumerLeadAccesses.createdAt));
  }),

  reviewUnlimitedAccess: protectedProcedure.input(z.object({
    accessId: z.number().int().positive(),
    status: z.enum(["active", "rejected"]),
    notes: z.string().trim().max(1000).optional(),
  })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select({ status: consumerLeadAccesses.status }).from(consumerLeadAccesses).where(eq(consumerLeadAccesses.id, input.accessId)).limit(1);
    if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Plano B2C não encontrado." });
    if (input.status === "active" && access.status !== "pending_approval") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A ativação só é permitida após confirmação do PIX." });
    const startsAt = input.status === "active" ? new Date() : null;
    const expiresAt = startsAt ? new Date(startsAt.getTime() + CONSUMER_LEAD_MONTHLY_DURATION_DAYS * 24 * 60 * 60 * 1000) : null;
    await db.update(consumerLeadAccesses).set({ status: input.status, reviewedBy: ctx.user.id, reviewedAt: new Date(), startsAt, expiresAt, adminNotes: input.notes || null }).where(eq(consumerLeadAccesses.id, input.accessId));
    return { success: true, startsAt, expiresAt };
  }),

  confirmUnlimitedPix: protectedProcedure.input(z.object({ accessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select({ status: consumerLeadAccesses.status }).from(consumerLeadAccesses).where(eq(consumerLeadAccesses.id, input.accessId)).limit(1);
    if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Plano B2C não encontrado." });
    if (access.status !== "pending_payment") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este plano não está aguardando PIX." });
    await db.update(consumerLeadAccesses).set({
      status: "pending_approval",
      reviewedBy: ctx.user.id,
      reviewedAt: new Date(),
      adminNotes: "PIX confirmado manualmente pelo administrador — aguardando ativação por 30 dias.",
    }).where(eq(consumerLeadAccesses.id, input.accessId));
    return { success: true };
  }),
});
