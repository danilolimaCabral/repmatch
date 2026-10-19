import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  companies,
  representativeMonthlyAccesses,
  representativeMonthlyUnlocks,
  representatives,
  unlockedContacts,
  users,
} from "../drizzle/schema";
import { getMySqlInsertId } from "@shared/mysql";
import {
  REPRESENTATIVE_MONTHLY_DURATION_DAYS,
  REPRESENTATIVE_MONTHLY_PRICE,
  REPRESENTATIVE_MONTHLY_UNLOCK_LIMIT,
} from "@shared/representativeMonthly";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const pendingOrActiveStatuses = ["pending_payment", "pending_approval", "active"] as const;

async function companyForUser(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number) {
  const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.userId, userId)).limit(1);
  return company;
}

export const representativeMonthlyRouter = router({
  catalog: protectedProcedure.query(() => ({
    price: REPRESENTATIVE_MONTHLY_PRICE,
    unlockLimit: REPRESENTATIVE_MONTHLY_UNLOCK_LIMIT,
    durationDays: REPRESENTATIVE_MONTHLY_DURATION_DAYS,
  })),

  myAccess: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { access: null, used: 0, remaining: 0 };
    const company = await companyForUser(db, ctx.user.id);
    if (!company) return { access: null, used: 0, remaining: 0 };
    const [access] = await db.select().from(representativeMonthlyAccesses)
      .where(and(eq(representativeMonthlyAccesses.companyId, company.id), eq(representativeMonthlyAccesses.status, "active"), gte(representativeMonthlyAccesses.expiresAt, new Date())))
      .orderBy(desc(representativeMonthlyAccesses.expiresAt)).limit(1);
    if (!access) return { access: null, used: 0, remaining: 0 };
    const [usage] = await db.select({ total: count() }).from(representativeMonthlyUnlocks)
      .where(eq(representativeMonthlyUnlocks.representativeMonthlyAccessId, access.id));
    const used = Number(usage?.total ?? 0);
    return { access, used, remaining: Math.max(0, access.unlockLimit - used) };
  }),

  myRequest: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const company = await companyForUser(db, ctx.user.id);
    if (!company) return null;
    const [request] = await db.select().from(representativeMonthlyAccesses)
      .where(eq(representativeMonthlyAccesses.companyId, company.id)).orderBy(desc(representativeMonthlyAccesses.createdAt)).limit(1);
    return request ?? null;
  }),

  createAccess: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const company = await companyForUser(db, ctx.user.id);
    if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "Complete o perfil da empresa para contratar este plano." });
    const [existing] = await db.select().from(representativeMonthlyAccesses)
      .where(and(eq(representativeMonthlyAccesses.companyId, company.id), inArray(representativeMonthlyAccesses.status, pendingOrActiveStatuses)))
      .orderBy(desc(representativeMonthlyAccesses.createdAt)).limit(1);
    if (existing) return { accessId: existing.id, price: Number(existing.amount), unlockLimit: existing.unlockLimit, durationDays: REPRESENTATIVE_MONTHLY_DURATION_DAYS, existing: true };
    const [result] = await db.insert(representativeMonthlyAccesses).values({
      companyId: company.id,
      userId: ctx.user.id,
      amount: REPRESENTATIVE_MONTHLY_PRICE.toFixed(2),
      unlockLimit: REPRESENTATIVE_MONTHLY_UNLOCK_LIMIT,
      status: "pending_payment",
    });
    const accessId = getMySqlInsertId(result);
    if (!accessId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível criar a solicitação do plano de representantes." });
    return { accessId, price: REPRESENTATIVE_MONTHLY_PRICE, unlockLimit: REPRESENTATIVE_MONTHLY_UNLOCK_LIMIT, durationDays: REPRESENTATIVE_MONTHLY_DURATION_DAYS, existing: false };
  }),

  unlockRepresentative: protectedProcedure.input(z.object({ representativeId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT ${users.id} FROM ${users} WHERE ${users.id} = ${ctx.user.id} FOR UPDATE`);
      const [company] = await tx.select({ id: companies.id }).from(companies).where(eq(companies.userId, ctx.user.id)).limit(1);
      if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "Empresa não encontrada." });
      const [access] = await tx.select().from(representativeMonthlyAccesses)
        .where(and(eq(representativeMonthlyAccesses.companyId, company.id), eq(representativeMonthlyAccesses.status, "active"), gte(representativeMonthlyAccesses.expiresAt, new Date())))
        .orderBy(desc(representativeMonthlyAccesses.expiresAt)).limit(1);
      if (!access) throw new TRPCError({ code: "FORBIDDEN", message: "Assine o plano mensal de representantes para desbloquear por créditos." });
      const [representative] = await tx.select({ id: representatives.id }).from(representatives).where(eq(representatives.id, input.representativeId)).limit(1);
      if (!representative) throw new TRPCError({ code: "NOT_FOUND", message: "Representante não encontrado." });
      const [alreadyUnlocked] = await tx.select({ id: unlockedContacts.id }).from(unlockedContacts)
        .where(and(eq(unlockedContacts.companyId, company.id), eq(unlockedContacts.representativeId, input.representativeId))).limit(1);
      const [usage] = await tx.select({ total: count() }).from(representativeMonthlyUnlocks)
        .where(eq(representativeMonthlyUnlocks.representativeMonthlyAccessId, access.id));
      const used = Number(usage?.total ?? 0);
      if (alreadyUnlocked) return { success: true, alreadyUnlocked: true, used, remaining: Math.max(0, access.unlockLimit - used) };
      if (used >= access.unlockLimit) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Você já usou os 100 desbloqueios deste mês. Renove o plano ou compre contatos avulsos." });
      await tx.insert(unlockedContacts).values({ companyId: company.id, representativeId: input.representativeId, pricePaid: "0.00" });
      await tx.insert(representativeMonthlyUnlocks).values({ representativeMonthlyAccessId: access.id, companyId: company.id, representativeId: input.representativeId });
      return { success: true, alreadyUnlocked: false, used: used + 1, remaining: Math.max(0, access.unlockLimit - used - 1) };
    });
  }),

  adminList: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    const accesses = await db.select({
      id: representativeMonthlyAccesses.id, status: representativeMonthlyAccesses.status, amount: representativeMonthlyAccesses.amount,
      unlockLimit: representativeMonthlyAccesses.unlockLimit, mpPaymentId: representativeMonthlyAccesses.mpPaymentId,
      startsAt: representativeMonthlyAccesses.startsAt, expiresAt: representativeMonthlyAccesses.expiresAt,
      adminNotes: representativeMonthlyAccesses.adminNotes, createdAt: representativeMonthlyAccesses.createdAt,
      companyName: companies.companyName, buyerName: users.name, buyerEmail: users.email,
    }).from(representativeMonthlyAccesses)
      .leftJoin(companies, eq(representativeMonthlyAccesses.companyId, companies.id))
      .leftJoin(users, eq(representativeMonthlyAccesses.userId, users.id))
      .orderBy(desc(representativeMonthlyAccesses.createdAt));
    if (!accesses.length) return [];
    const usageRows = await db.select({ accessId: representativeMonthlyUnlocks.representativeMonthlyAccessId, total: count() })
      .from(representativeMonthlyUnlocks)
      .where(inArray(representativeMonthlyUnlocks.representativeMonthlyAccessId, accesses.map((access) => access.id)))
      .groupBy(representativeMonthlyUnlocks.representativeMonthlyAccessId);
    const usageByAccess = new Map(usageRows.map((row) => [row.accessId, Number(row.total)]));
    return accesses.map((access) => ({ ...access, used: usageByAccess.get(access.id) ?? 0 }));
  }),

  confirmPix: protectedProcedure.input(z.object({ accessId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select({ status: representativeMonthlyAccesses.status }).from(representativeMonthlyAccesses).where(eq(representativeMonthlyAccesses.id, input.accessId)).limit(1);
    if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Plano de representantes não encontrado." });
    if (access.status !== "pending_payment") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Este plano não está aguardando pagamento." });
    await db.update(representativeMonthlyAccesses).set({ status: "pending_approval", reviewedBy: ctx.user.id, reviewedAt: new Date(), adminNotes: "Pagamento confirmado — aguardando ativação administrativa." }).where(eq(representativeMonthlyAccesses.id, input.accessId));
    return { success: true };
  }),

  reviewAccess: protectedProcedure.input(z.object({ accessId: z.number().int().positive(), status: z.enum(["active", "rejected"]), notes: z.string().trim().max(1000).optional() })).mutation(async ({ ctx, input }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [access] = await db.select({ status: representativeMonthlyAccesses.status }).from(representativeMonthlyAccesses).where(eq(representativeMonthlyAccesses.id, input.accessId)).limit(1);
    if (!access) throw new TRPCError({ code: "NOT_FOUND", message: "Plano de representantes não encontrado." });
    if (input.status === "active" && access.status !== "pending_approval") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A ativação só é permitida após confirmação do pagamento." });
    const startsAt = input.status === "active" ? new Date() : null;
    const expiresAt = startsAt ? new Date(startsAt.getTime() + REPRESENTATIVE_MONTHLY_DURATION_DAYS * 24 * 60 * 60 * 1000) : null;
    await db.update(representativeMonthlyAccesses).set({ status: input.status, reviewedBy: ctx.user.id, reviewedAt: new Date(), startsAt, expiresAt, adminNotes: input.notes || null }).where(eq(representativeMonthlyAccesses.id, input.accessId));
    return { success: true, startsAt, expiresAt };
  }),
});
