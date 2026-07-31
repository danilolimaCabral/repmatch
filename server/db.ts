import { and, desc, eq, gte, or, sql, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql2Promise from "mysql2/promise";
import {
  Application,
  Company,
  CnpjRepresentative,
  ImportLog,
  InsertApplication,
  InsertCompany,
  InsertImportLog,
  InsertJob,
  InsertRepresentative,
  InsertUnlockedContact,
  InsertUser,
  Job,
  Message,
  Representative,
  UnlockedContact,
  applications,
  cnpjRepresentatives,
  companies,
  importLogs,
  jobs,
  messages,
  representatives,
  unlockedContacts,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Raw mysql2/promise connection for complex UNION queries
let _rawConn: mysql2Promise.Connection | null = null;
async function getRawConn(): Promise<mysql2Promise.Connection> {
  if (!_rawConn || (_rawConn as any).connection?.stream?.destroyed) {
    _rawConn = await mysql2Promise.createConnection(process.env.DATABASE_URL!);
  }
  return _rawConn;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function promoteToAdmin(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: "admin" }).where(eq(users.id, userId));
}
export async function toggleUserActive(userId: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isActive }).where(eq(users.id, userId));
}

export async function listAllUsers(
  limit = 50,
  offset = 0,
  search = "",
  roleFilter = "",
  userTypeFilter = ""
) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  const { not, like, and, or, eq, count, sql } = await import("drizzle-orm");
  const conditions: any[] = [
    not(like(users.email, "%@import.repmatch.com")),
  ];
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }
  if (roleFilter === "admin" || roleFilter === "user") {
    conditions.push(eq(users.role, roleFilter as "admin" | "user"));
  }
  if (userTypeFilter && ["representative", "company", "manager", "pending"].includes(userTypeFilter)) {
    conditions.push(eq(users.userType, userTypeFilter as "representative" | "company" | "manager" | "pending"));
  }
  const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
  const [totalResult] = await db
    .select({ count: count() })
    .from(users)
    .where(whereClause);
  const rows = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

  // Enrich with profileStatus by checking representatives/companies tables
  const userIds = rows.map((u) => u.id);
  let repMap: Record<number, Representative | null> = {};
  let compMap: Record<number, Company | null> = {};
  if (userIds.length > 0) {
    const { inArray } = await import("drizzle-orm");
    const repRows = await db.select().from(representatives).where(inArray(representatives.userId, userIds));
    const compRows = await db.select().from(companies).where(inArray(companies.userId, userIds));
    for (const r of repRows) repMap[r.userId] = r;
    for (const c of compRows) compMap[c.userId] = c;
  }

  const enriched = rows.map((u) => {
    let profileStatus: "pending" | "incomplete" | "complete" = "pending";
    if (u.userType === "representative") {
      const rep = repMap[u.id];
      if (!rep) {
        profileStatus = "pending";
      } else if (!rep.fullName || !rep.segment || !rep.region) {
        profileStatus = "incomplete";
      } else {
        profileStatus = "complete";
      }
    } else if (u.userType === "company") {
      const comp = compMap[u.id];
      if (!comp) {
        profileStatus = "pending";
      } else if (!comp.companyName || !comp.segment || !comp.region) {
        profileStatus = "incomplete";
      } else {
        profileStatus = "complete";
      }
    } else if (u.userType === "manager") {
      profileStatus = "complete";
    }
    return { ...u, profileStatus };
  });

  return { users: enriched, total: Number(totalResult?.count ?? 0) };
}

export async function listRepresentativesWithFiscalId(limit = 100, offset = 0, search = "", estado = "", situacao = "") {
  const db = await getDb();
  if (!db) return { reps: [], total: 0 };
  const { or: orOp, like: likeOp, and: andOp } = await import("drizzle-orm");
  const conditions: any[] = [];
  if (search) {
    conditions.push(
      orOp(
        likeOp(representatives.fullName, `%${search}%`),
        likeOp(representatives.cnpj, `%${search}%`),
        likeOp(representatives.email, `%${search}%`),
        likeOp(representatives.phone, `%${search}%`),
      )
    );
  }
  if (estado) conditions.push(eq(representatives.estado, estado));
  if (situacao) conditions.push(eq(representatives.situacaoCadastral, situacao));
  let query = db
    .select({
      id: representatives.id,
      fullName: representatives.fullName,
      nomeFantasia: representatives.nomeFantasia,
      cnpj: representatives.cnpj,
      cpf: representatives.cpf,
      phone: representatives.phone,
      email: representatives.email,
      region: representatives.region,
      segment: representatives.segment,
      cidade: representatives.cidade,
      estado: representatives.estado,
      cep: representatives.cep,
      situacaoCadastral: representatives.situacaoCadastral,
      dataAbertura: representatives.dataAbertura,
      naturezaJuridica: representatives.naturezaJuridica,
      porte: representatives.porte,
      capitalSocial: representatives.capitalSocial,
      simplesNacional: representatives.simplesNacional,
      mei: representatives.mei,
      cnaeDescricao: representatives.cnaeDescricao,
      socios: representatives.socios,
      kycStatus: representatives.kycStatus,
      subscriptionTier: representatives.subscriptionTier,
      createdAt: representatives.createdAt,
    })
    .from(representatives)
    .$dynamic();
  if (conditions.length > 0) {
    query = query.where(conditions.length === 1 ? conditions[0] : andOp(...conditions));
  }
  const reps = await query.orderBy(representatives.fullName).limit(limit).offset(offset);
  // Count total matching records
  const { count: countFn } = await import("drizzle-orm");
  let countQuery = db.select({ total: countFn() }).from(representatives).$dynamic();
  if (conditions.length > 0) {
    countQuery = countQuery.where(conditions.length === 1 ? conditions[0] : andOp(...conditions));
  }
  const [{ total }] = await countQuery;
  return { reps, total: Number(total) };
}

export async function listPendingPayments() {
  const db = await getDb();
  if (!db) return [];
  // Returns representatives with free tier joined with their user info
  const rows = await db
    .select({
      repId: representatives.id,
      userId: representatives.userId,
      fullName: representatives.fullName,
      phone: representatives.phone,
      region: representatives.region,
      segment: representatives.segment,
      subscriptionTier: representatives.subscriptionTier,
      createdAt: representatives.createdAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(representatives)
    .leftJoin(users, eq(representatives.userId, users.id))
    .where(eq(representatives.subscriptionTier, "free"))
    .orderBy(desc(representatives.createdAt))
    .limit(200);
  return rows;
}

export async function activateRepPlan(repId: number, tier: "bronze" | "prata" | "ouro"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(representatives).set({ subscriptionTier: tier }).where(eq(representatives.id, repId));
}

export async function updateUserType(userId: number, userType: "representative" | "company" | "pending") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ userType }).where(eq(users.id, userId));
}

// ─── Representatives ──────────────────────────────────────────────────────────

export async function getRepresentativeByUserId(userId: number): Promise<Representative | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(representatives).where(eq(representatives.userId, userId)).limit(1);
  return result[0];
}

export async function createRepresentative(data: InsertRepresentative): Promise<Representative | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(representatives).values(data);
  return getRepresentativeByUserId(data.userId);
}

export async function updateRepresentative(id: number, data: Partial<InsertRepresentative>) {
  const db = await getDb();
  if (!db) return;
  await db.update(representatives).set(data).where(eq(representatives.id, id));
}

export async function listRepresentatives(filters?: { region?: string; segment?: string; tier?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(representatives.isActive, true)];
  if (filters?.region) conditions.push(eq(representatives.region, filters.region));
  if (filters?.segment) conditions.push(eq(representatives.segment, filters.segment));
  if (filters?.tier) conditions.push(eq(representatives.subscriptionTier, filters.tier as "free" | "bronze" | "prata" | "ouro"));

  // Sort: Ouro first, then Prata, Bronze, Free — then by rating within each tier
  const tierOrder = sql<number>`CASE ${representatives.subscriptionTier}
    WHEN 'ouro' THEN 1
    WHEN 'prata' THEN 2
    WHEN 'bronze' THEN 3
    ELSE 4
  END`;
  return db.select().from(representatives).where(and(...conditions)).orderBy(tierOrder, desc(representatives.averageRating));
}

// ─── Companies ────────────────────────────────────────────────────────────────

export async function getCompanyByUserId(userId: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.userId, userId)).limit(1);
  return result[0];
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
  return result[0];
}

export async function createCompany(data: InsertCompany): Promise<Company | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(companies).values(data);
  return getCompanyByUserId(data.userId);
}

export async function updateCompany(id: number, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) return;
  await db.update(companies).set(data).where(eq(companies.id, id));
}

export async function recalculateCompanyRank(companyId: number) {
  const db = await getDb();
  if (!db) return;

  // Count filled jobs
  const filledJobs = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(and(eq(applications.status, "hired")));

  const totalHired = Number(filledJobs[0]?.count ?? 0);

  // Calculate rank score (simplified)
  let rankScore = Math.min(totalHired * 5, 100);
  let dynamicRank: "bronze" | "silver" | "gold" | "platinum" = "bronze";
  if (rankScore >= 75) dynamicRank = "platinum";
  else if (rankScore >= 50) dynamicRank = "gold";
  else if (rankScore >= 25) dynamicRank = "silver";

  await db.update(companies).set({ rankScore: String(rankScore), dynamicRank }).where(eq(companies.id, companyId));
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function createJob(data: InsertJob): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(jobs).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (!insertId) return undefined;
  const rows = await db.select().from(jobs).where(eq(jobs.id, insertId)).limit(1);
  return rows[0];
}

export async function getJobById(id: number): Promise<Job | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return result[0];
}

export async function listJobs(filters?: {
  companyId?: number;
  region?: string;
  segment?: string;
  status?: string;
  repTier?: "free" | "bronze" | "prata" | "ouro";
}) {
  const db = await getDb();
  if (!db) return [];

  // When querying by companyId (company dashboard), show all statuses.
  // When querying for rep feed (no companyId), only show open jobs.
  const conditions: SQL[] = [];
  if (!filters?.companyId) conditions.push(eq(jobs.status, "open"));
  if (filters?.companyId) conditions.push(eq(jobs.companyId, filters.companyId));
  if (filters?.region) conditions.push(eq(jobs.region, filters.region));
  if (filters?.segment) conditions.push(eq(jobs.segment, filters.segment));
  if (filters?.status) conditions.push(eq(jobs.status, filters.status as "open" | "closed" | "paused"));

  // Tier access control — free only sees free jobs, bronze sees free+bronze, prata sees free+bronze+prata, ouro sees all
  if (filters?.repTier === "free") {
    conditions.push(eq(jobs.minTierRequired, "free"));
  } else if (filters?.repTier === "bronze") {
    conditions.push(or(eq(jobs.minTierRequired, "free"), eq(jobs.minTierRequired, "bronze"))!);
  } else if (filters?.repTier === "prata") {
    conditions.push(or(eq(jobs.minTierRequired, "free"), eq(jobs.minTierRequired, "bronze"), eq(jobs.minTierRequired, "prata"))!);
  }
  // ouro sees all

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(jobs).where(whereClause).orderBy(desc(jobs.isFeatured), desc(jobs.createdAt));
}

export async function updateJob(id: number, data: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set(data).where(eq(jobs.id, id));
}

export async function listPublicJobs(filters?: {
  region?: string;
  segment?: string;
  page?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return { jobs: [], total: 0 };
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 12;
  const offset = (page - 1) * limit;
  const conditions: SQL[] = [eq(jobs.status, "open")];
  if (filters?.region) conditions.push(eq(jobs.region, filters.region));
  if (filters?.segment) conditions.push(eq(jobs.segment, filters.segment));
  const whereClause = and(...conditions);
  const rows = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      commissionPercentage: jobs.commissionPercentage,
      region: jobs.region,
      segment: jobs.segment,
      isFeatured: jobs.isFeatured,
      minTierRequired: jobs.minTierRequired,
      createdAt: jobs.createdAt,
      companyId: jobs.companyId,
      companyName: companies.companyName,
      companyRank: companies.dynamicRank,
    })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(whereClause)
    .orderBy(desc(jobs.isFeatured), desc(jobs.createdAt))
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(whereClause);
  return { jobs: rows, total: Number(count) };
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function createApplication(data: InsertApplication): Promise<Application | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(applications).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (!insertId) return undefined;
  const rows = await db.select().from(applications).where(eq(applications.id, insertId)).limit(1);
  return rows[0];
}

export async function getApplicationsByJob(jobId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ application: applications, rep: representatives })
    .from(applications)
    .innerJoin(representatives, eq(applications.representativeId, representatives.id))
    .where(eq(applications.jobId, jobId))
    .orderBy(desc(applications.totalScore));
}

export async function getApplicationsByRep(representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ application: applications, job: jobs })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.representativeId, representativeId))
    .orderBy(desc(applications.createdAt));
}

export async function updateApplication(id: number, data: Partial<InsertApplication>) {
  const db = await getDb();
  if (!db) return;
  await db.update(applications).set(data).where(eq(applications.id, id));
}

export async function getExistingApplication(jobId: number, representativeId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(applications)
    .where(and(eq(applications.jobId, jobId), eq(applications.representativeId, representativeId)))
    .limit(1);
  return result[0];
}

// ─── Match Algorithm ──────────────────────────────────────────────────────────

export interface MatchBreakdown {
  score: number;
  criteria: {
    region: { points: number; max: number; match: boolean };
    segment: { points: number; max: number; match: boolean };
    experience: { points: number; max: number; years: number };
    active: { points: number; max: number; isActive: boolean };
    kyc: { points: number; max: number; approved: boolean };
    core: { points: number; max: number; active: boolean };
  };
  strengths: string[];
  revenueEstimate: string | null;
  cnaeDescricao: string | null;
}

export function calculateMatchScore(rep: Representative, job: Job): number {
  let score = 0;
  if (rep.region && job.region && rep.region === job.region) score += 40;
  if (rep.segment && job.segment && rep.segment === job.segment) score += 30;
  if ((rep.experienceYears ?? 0) >= 3) score += 20;
  if (rep.isActive) score += 5;
  if (rep.kycStatus === "approved") score += 3;
  if (rep.coreStatus === "active") score += 2;
  return score;
}

export function calculateMatchBreakdown(
  rep: Representative,
  job: Job,
  cnpjData?: CnpjRepresentative | null
): MatchBreakdown {
  const regionMatch = !!(rep.region && job.region && rep.region === job.region);
  const segmentMatch = !!(rep.segment && job.segment && rep.segment === job.segment);
  const expYears = rep.experienceYears ?? 0;
  const kycApproved = rep.kycStatus === "approved";
  const coreActive = rep.coreStatus === "active";

  const regionPts = regionMatch ? 40 : 0;
  const segmentPts = segmentMatch ? 30 : 0;
  const expPts = expYears >= 3 ? 20 : expYears >= 1 ? 10 : 0;
  const activePts = rep.isActive ? 5 : 0;
  const kycPts = kycApproved ? 3 : 0;
  const corePts = coreActive ? 2 : 0;
  const score = regionPts + segmentPts + expPts + activePts + kycPts + corePts;

  const strengths: string[] = [];
  if (regionMatch) strengths.push(`Atua na região correta (${rep.region})`);
  if (segmentMatch) strengths.push(`Especialista em ${rep.segment}`);
  if (expYears >= 10) strengths.push(`${expYears} anos de experiência (sênior)`);
  else if (expYears >= 5) strengths.push(`${expYears} anos de experiência (pleno)`);
  else if (expYears >= 1) strengths.push(`${expYears} anos de experiência`);
  if (kycApproved) strengths.push("Identidade verificada (KYC ✓)");
  if (coreActive) strengths.push("Registro CORE ativo");
  if (rep.availability === "imediata") strengths.push("Disponibilidade imediata");
  if (rep.workModel === "exclusivo") strengths.push("Disponível para exclusividade");
  if (rep.portfolioSize) strengths.push(`Carteira: ${rep.portfolioSize} clientes`);
  if (cnpjData?.municipio && cnpjData?.uf) strengths.push(`Base em ${cnpjData.municipio}/${cnpjData.uf}`);

  // Estimativa de faturamento
  let revenueEstimate: string | null = null;
  if (cnpjData) {
    const porte = (cnpjData.porte ?? "").toLowerCase();
    const isMei = Number(cnpjData.isMei) === 1;
    if (isMei) revenueEstimate = "Até R$ 81 mil/ano (MEI)";
    else if (porte.includes("micro")) revenueEstimate = "R$ 81 mil – R$ 360 mil/ano";
    else if (porte.includes("pequen")) revenueEstimate = "R$ 360 mil – R$ 4,8 mi/ano";
    else if (porte.includes("médi") || porte.includes("medi")) revenueEstimate = "R$ 4,8 mi – R$ 300 mi/ano";
    else if (porte.includes("grande")) revenueEstimate = "Acima de R$ 300 mi/ano";
  }

  return {
    score,
    criteria: {
      region: { points: regionPts, max: 40, match: regionMatch },
      segment: { points: segmentPts, max: 30, match: segmentMatch },
      experience: { points: expPts, max: 20, years: expYears },
      active: { points: activePts, max: 5, isActive: rep.isActive },
      kyc: { points: kycPts, max: 3, approved: kycApproved },
      core: { points: corePts, max: 2, active: coreActive },
    },
    strengths,
    revenueEstimate,
    cnaeDescricao: cnpjData?.cnaeDescricao ?? null,
  };
}

export async function getTopMatchesForJob(jobId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const job = await getJobById(jobId);
  if (!job) return [];

  const reps = await db.select().from(representatives).where(eq(representatives.isActive, true));

  // Fetch CNPJ enrichment data for reps that have a CNPJ
  const cnpjList = reps.map(r => r.cnpj).filter(Boolean) as string[];
  const cnpjDataMap = new Map<string, CnpjRepresentative>();
  if (cnpjList.length > 0) {
    try {
      const cnpjRows = await db.select().from(cnpjRepresentatives).where(
        sql`cnpj IN (${sql.join(cnpjList.map(c => sql`${c}`), sql`, `)})`
      );
      for (const row of cnpjRows) cnpjDataMap.set(row.cnpj, row);
    } catch (_) { /* ignore if table not yet populated */ }
  }

  const scored = reps.map((rep) => {
    const cnpjData = rep.cnpj ? (cnpjDataMap.get(rep.cnpj) ?? null) : null;
    const breakdown = calculateMatchBreakdown(rep, job, cnpjData);
    return { rep, score: breakdown.score, breakdown };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ─── Unlocked Contacts ────────────────────────────────────────────────────────

export async function isContactUnlocked(companyId: number, representativeId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db
    .select()
    .from(unlockedContacts)
    .where(and(eq(unlockedContacts.companyId, companyId), eq(unlockedContacts.representativeId, representativeId)))
    .limit(1);
  return result.length > 0;
}

export async function unlockContact(data: InsertUnlockedContact): Promise<UnlockedContact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(unlockedContacts).values(data);
  const result = await db
    .select()
    .from(unlockedContacts)
    .where(and(eq(unlockedContacts.companyId, data.companyId), eq(unlockedContacts.representativeId, data.representativeId)))
    .limit(1);
  return result[0];
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function createMessage(data: { applicationId: number; senderUserId: number; content: string }): Promise<Message | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(messages).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (!insertId) return undefined;
  const rows = await db.select().from(messages).where(eq(messages.id, insertId)).limit(1);
  return rows[0];
}

export async function getMessagesByApplication(applicationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.applicationId, applicationId)).orderBy(messages.createdAt);
}

// ─── Import Logs ──────────────────────────────────────────────────────────────

export async function createImportLog(data: InsertImportLog): Promise<ImportLog | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(importLogs).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (!insertId) return undefined;
  const rows = await db.select().from(importLogs).where(eq(importLogs.id, insertId)).limit(1);
  return rows[0];
}

export async function updateImportLog(id: number, data: Partial<InsertImportLog>) {
  const db = await getDb();
  if (!db) return;
  await db.update(importLogs).set(data).where(eq(importLogs.id, id));
}

export async function listImportLogs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importLogs).orderBy(desc(importLogs.createdAt)).limit(20);
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalReps] = await db.select({ count: sql<number>`count(*)` }).from(representatives);
  const [totalCompanies] = await db.select({ count: sql<number>`count(*)` }).from(companies);
  const [totalJobs] = await db.select({ count: sql<number>`count(*)` }).from(jobs);
  const [totalApplications] = await db.select({ count: sql<number>`count(*)` }).from(applications);
  const [premiumReps] = await db
    .select({ count: sql<number>`count(*)` })
    .from(representatives)
    .where(or(eq(representatives.subscriptionTier, "bronze"), eq(representatives.subscriptionTier, "prata"), eq(representatives.subscriptionTier, "ouro"))!);

  // Rank distribution for companies
  const rankRows = await db
    .select({ rank: companies.dynamicRank, count: sql<number>`count(*)` })
    .from(companies)
    .groupBy(companies.dynamicRank);
  const rankDistribution: Record<string, number> = {};
  for (const row of rankRows) {
    if (row.rank) rankDistribution[row.rank] = Number(row.count);
  }

  // Tier distribution for representatives
  const tierRows = await db
    .select({ tier: representatives.subscriptionTier, count: sql<number>`count(*)` })
    .from(representatives)
    .groupBy(representatives.subscriptionTier);
  const tierDistribution: Record<string, number> = {};
  for (const row of tierRows) {
    if (row.tier) tierDistribution[row.tier] = Number(row.count);
  }

  // Recent jobs
  const recentJobs = await db
    .select({ id: jobs.id, title: jobs.title, status: jobs.status, segment: jobs.segment, region: jobs.region, createdAt: jobs.createdAt })
    .from(jobs)
    .orderBy(desc(jobs.createdAt))
    .limit(10);

  return {
    totalReps: Number(totalReps?.count ?? 0),
    totalCompanies: Number(totalCompanies?.count ?? 0),
    totalJobs: Number(totalJobs?.count ?? 0),
    totalApplications: Number(totalApplications?.count ?? 0),
    premiumReps: Number(premiumReps?.count ?? 0),
    rankDistribution,
    tierDistribution,
    recentJobs,
  };
}

// ─── Preview Inteligente ──────────────────────────────────────────────────────
export async function getRepresentativePreview(filters?: { region?: string; segment?: string; subscriptionTier?: string; kycApproved?: boolean; coreActive?: boolean; availability?: string }) {
  const db = await getDb();
  if (!db) return { count: 0, previews: [], regions: [], segments: [] };
  const conditions = [eq(representatives.isActive, true)];
  if (filters?.region) conditions.push(eq(representatives.region, filters.region));
  if (filters?.segment) conditions.push(eq(representatives.segment, filters.segment));
  if (filters?.kycApproved) conditions.push(eq(representatives.kycStatus, 'approved'));
  if (filters?.coreActive) conditions.push(eq(representatives.coreStatus, 'active'));
  if (filters?.availability) conditions.push(eq(representatives.availability, filters.availability as "imediata" | "30dias" | "60dias" | "negociavel"));
  
  // COUNT real com filtros aplicados
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(representatives)
    .where(and(...conditions));
  const totalCount = Number(countResult?.count ?? 0);

  // Busca apenas os primeiros registros para preview (máx 5)
  const previewLimit = filters?.subscriptionTier && filters.subscriptionTier !== 'free' ? 5 : 3;
  const allReps = await db
    .select({
      id: representatives.id,
      fullName: representatives.fullName,
      region: representatives.region,
      segment: representatives.segment,
      experienceYears: representatives.experienceYears,
      subscriptionTier: representatives.subscriptionTier,
      averageRating: representatives.averageRating,
    })
    .from(representatives)
    .where(and(...conditions))
    .orderBy(desc(representatives.averageRating))
    .limit(previewLimit);

  // Get all regions and segments for filter options
  const allActive = await db
    .select({ region: representatives.region, segment: representatives.segment })
    .from(representatives)
    .where(eq(representatives.isActive, true));
  
  const regions = Array.from(new Set(allActive.map(r => r.region).filter(Boolean))) as string[];
  const segments = Array.from(new Set(allActive.map(r => r.segment).filter(Boolean))) as string[];

  // Mask personal data
  const previews = allReps.map((rep) => {
    const firstName = rep.fullName?.split(" ")[0] ?? "Rep";
    const maskedName = `${firstName} ${rep.fullName?.split(" ").slice(1).map(() => "●").join("") ?? "●●●"}`;
    return {
      id: rep.id,
      maskedName,
      region: rep.region ?? "Brasil",
      segment: rep.segment ?? "Geral",
      experienceYears: rep.experienceYears ?? 0,
      subscriptionTier: rep.subscriptionTier,
      averageRating: rep.averageRating,
    };
  });

  return { count: totalCount, previews, regions, segments };
}

// ─── Representatives for Company (full listing with unlock awareness) ─────────
// ─── Data Masking Helpers ────────────────────────────────────────────────────

/**
 * Masks sensitive contact data for non-admin, non-unlocked views.
 * Before unlock: show full name, segment, experience years, CORE status only.
 * After unlock: show everything (phone, email, linkedin, bio, city, CNPJ).
 */
export function maskRepresentativeData<T extends {
  fullName?: string | null;
  phone?: string | null;
  email?: string | null;
  linkedinUrl?: string | null;
  bio?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cnpj?: string | null;
  nomeFantasia?: string | null;
  region?: string | null;
}>(rep: T, isUnlocked: boolean, isAdmin: boolean): T {
  if (isAdmin || isUnlocked) return rep; // Full data after unlock/admin

  // Before unlock: only name, segment, experience years, availability, CORE status visible
  // Hide region, city, contact details, bio, CNPJ
  return {
    ...rep,
    phone: null,
    email: null,
    linkedinUrl: null,
    bio: null,
    cidade: null,
    estado: null,
    cnpj: null,
    nomeFantasia: null,
    region: null,
  };
}

export async function listRepresentativesForCompany(
  companyId: number,
  filters?: {
    region?: string;
    segment?: string;
    tier?: string;
    page?: number;
    limit?: number;
    kycApproved?: boolean;
    coreActive?: boolean;
    availability?: string;
    sortBy?: "availability" | "rating" | "tier" | "recent";
  }
) {
  const db = await getDb();
  if (!db) return { reps: [], total: 0, unlockedIds: [] };

  const page = Number(filters?.page ?? 1) || 1;
  const limit = Number(filters?.limit ?? 20) || 20;
  const offset = (page - 1) * limit;

  // Map UF to region name for cnpj_representatives
  const ufToRegion: Record<string, string> = {
    SP: 'São Paulo - Capital', RJ: 'Rio de Janeiro', MG: 'Minas Gerais', RS: 'Rio Grande do Sul',
    PR: 'Paraná', SC: 'Santa Catarina', BA: 'Bahia', GO: 'Goiás', PE: 'Pernambuco',
    CE: 'Ceará', PA: 'Pará', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', ES: 'Espírito Santo',
    AM: 'Amazonas', RN: 'Rio Grande do Norte', PB: 'Paraíba', AL: 'Alagoas', PI: 'Piauí',
    MA: 'Maranhão', SE: 'Sergipe', TO: 'Tocantins', RO: 'Rondônia', AC: 'Acre',
    AP: 'Amapá', RR: 'Roraima', DF: 'Distrito Federal',
  };

  // Build WHERE clauses for the UNION query
  // For representatives table (manual)
  const repWhereParts: string[] = ['r.isActive = 1'];
  const repParams: any[] = [];
  if (filters?.region) { repWhereParts.push('r.region = ?'); repParams.push(filters.region); }
  if (filters?.segment) { repWhereParts.push('r.segment = ?'); repParams.push(filters.segment); }
  if (filters?.tier) { repWhereParts.push('r.subscriptionTier = ?'); repParams.push(filters.tier); }
  if (filters?.kycApproved) repWhereParts.push("r.kycStatus = 'approved'");
  if (filters?.coreActive) repWhereParts.push("r.coreStatus = 'active'");
  if (filters?.availability) { repWhereParts.push('r.availability = ?'); repParams.push(filters.availability); }

  // For cnpj_representatives table (imported base) — only show if no tier/kyc/core/availability filter
  // since those fields don't exist in cnpj_representatives
  const includeCnpj = !filters?.tier && !filters?.kycApproved && !filters?.coreActive && !filters?.availability;
  const cnpjWhereParts: string[] = [];
  const cnpjParams: any[] = [];
  if (filters?.region) {
    // Find UFs that map to this region
    const ufs = Object.entries(ufToRegion).filter(([, v]) => v === filters.region).map(([k]) => k);
    if (ufs.length > 0) {
      cnpjWhereParts.push(`c.uf IN (${ufs.map(() => '?').join(',')})`);
      cnpjParams.push(...ufs);
    } else {
      // No matching UF for this region — skip cnpj table
      cnpjWhereParts.push('1=0');
    }
  }
  if (filters?.segment) {
    // Map segment to CNAE keywords
    const segmentToCnae: Record<string, string> = {
      'Alimentos e Bebidas': '%aliment%',
      'Farmacêutico': '%farmac%',
      'Cosméticos e Higiene': '%cosmet%',
      'Tecnologia': '%tecnolog%',
      'Construção Civil': '%constru%',
      'Têxtil e Moda': '%textil%',
      'Automotivo': '%autom%',
      'Agronegócio': '%agro%',
      'Saúde e Médico': '%saude%',
      'Eletroeletrônicos': '%eletro%',
      'Móveis e Decoração': '%moveis%',
    };
    const cnaePattern = segmentToCnae[filters.segment];
    if (cnaePattern) {
      cnpjWhereParts.push('c.cnae_descricao LIKE ?');
      cnpjParams.push(cnaePattern);
    } else {
      cnpjWhereParts.push('1=0'); // Unknown segment — skip cnpj
    }
  }

  const repWhere = repWhereParts.join(' AND ');
  const cnpjWhere = cnpjWhereParts.length > 0 ? cnpjWhereParts.join(' AND ') : '1=1';

  // Sort order
  const sortBy = filters?.sortBy ?? 'tier';
  let orderSql = 'ORDER BY source_priority ASC, tier_order ASC, avg_rating DESC';
  if (sortBy === 'availability') orderSql = 'ORDER BY avail_order ASC, source_priority ASC, tier_order ASC';
  else if (sortBy === 'rating') orderSql = 'ORDER BY avg_rating DESC, source_priority ASC, tier_order ASC';
  else if (sortBy === 'recent') orderSql = 'ORDER BY created_at DESC, source_priority ASC';

  // Build UNION query
  const repQuery = `
    SELECT
      r.id AS id,
      'rep' AS source,
      0 AS source_priority,
      r.fullName AS fullName,
      r.phone AS phone,
      r.region AS region,
      r.segment AS segment,
      r.experienceYears AS experienceYears,
      r.bio AS bio,
      r.subscriptionTier AS subscriptionTier,
      CAST(r.averageRating AS DECIMAL(3,2)) AS avg_rating,
      CAST(r.responseRate AS DECIMAL(5,2)) AS responseRate,
      r.availability AS availability,
      r.workModel AS workModel,
      r.portfolioSize AS portfolioSize,
      r.linkedinUrl AS linkedinUrl,
      r.avatarUrl AS avatarUrl,
      r.cities AS cities,
      r.additionalSegments AS additionalSegments,
      r.highlightedAt AS highlightedAt,
      r.createdAt AS created_at,
      r.email AS email,
      r.cidade AS cidade,
      r.estado AS estado,
      r.situacaoCadastral AS situacaoCadastral,
      r.cnpj AS cnpj,
      r.nomeFantasia AS nomeFantasia,
      r.kycStatus AS kycStatus,
      r.coreStatus AS coreStatus,
      CASE r.subscriptionTier WHEN 'ouro' THEN 1 WHEN 'prata' THEN 2 WHEN 'bronze' THEN 3 ELSE 4 END AS tier_order,
      CASE r.availability WHEN 'imediata' THEN 1 WHEN '30dias' THEN 2 WHEN '60dias' THEN 3 WHEN 'negociavel' THEN 4 ELSE 5 END AS avail_order
    FROM representatives r
    WHERE ${repWhere}
  `;

  const cnpjQueryBase = `
    SELECT
      (c.id + 100000) AS id,
      'cnpj' AS source,
      1 AS source_priority,
      COALESCE(c.nome_fantasia, c.razao_social) AS fullName,
      c.telefone AS phone,
      CASE c.uf
        WHEN 'SP' THEN 'São Paulo - Capital'
        WHEN 'RJ' THEN 'Rio de Janeiro'
        WHEN 'MG' THEN 'Minas Gerais'
        WHEN 'RS' THEN 'Rio Grande do Sul'
        WHEN 'PR' THEN 'Paraná'
        WHEN 'SC' THEN 'Santa Catarina'
        WHEN 'BA' THEN 'Bahia'
        WHEN 'GO' THEN 'Goiás'
        WHEN 'PE' THEN 'Pernambuco'
        WHEN 'CE' THEN 'Ceará'
        WHEN 'PA' THEN 'Pará'
        WHEN 'MT' THEN 'Mato Grosso'
        WHEN 'MS' THEN 'Mato Grosso do Sul'
        WHEN 'ES' THEN 'Espírito Santo'
        WHEN 'AM' THEN 'Amazonas'
        WHEN 'RN' THEN 'Rio Grande do Norte'
        WHEN 'PB' THEN 'Paraíba'
        WHEN 'AL' THEN 'Alagoas'
        WHEN 'PI' THEN 'Piauí'
        WHEN 'MA' THEN 'Maranhão'
        WHEN 'SE' THEN 'Sergipe'
        WHEN 'TO' THEN 'Tocantins'
        WHEN 'RO' THEN 'Rondônia'
        WHEN 'AC' THEN 'Acre'
        WHEN 'AP' THEN 'Amapá'
        WHEN 'RR' THEN 'Roraima'
        WHEN 'DF' THEN 'Distrito Federal'
        ELSE c.uf
      END AS region,
      CASE
        WHEN c.cnae_descricao LIKE '%aliment%' OR c.cnae_descricao LIKE '%bebid%' THEN 'Alimentos e Bebidas'
        WHEN c.cnae_descricao LIKE '%farmac%' OR c.cnae_descricao LIKE '%medicam%' THEN 'Farmacêutico'
        WHEN c.cnae_descricao LIKE '%cosmet%' OR c.cnae_descricao LIKE '%higiene%' OR c.cnae_descricao LIKE '%perfum%' THEN 'Cosméticos e Higiene'
        WHEN c.cnae_descricao LIKE '%tecnolog%' OR c.cnae_descricao LIKE '%software%' OR c.cnae_descricao LIKE '%inform%' THEN 'Tecnologia'
        WHEN c.cnae_descricao LIKE '%constru%' OR c.cnae_descricao LIKE '%material%' THEN 'Construção Civil'
        WHEN c.cnae_descricao LIKE '%textil%' OR c.cnae_descricao LIKE '%vestu%' OR c.cnae_descricao LIKE '%confec%' THEN 'Têxtil e Moda'
        WHEN c.cnae_descricao LIKE '%autom%' OR c.cnae_descricao LIKE '%veicul%' OR c.cnae_descricao LIKE '%auto%' THEN 'Automotivo'
        WHEN c.cnae_descricao LIKE '%agro%' OR c.cnae_descricao LIKE '%agricul%' OR c.cnae_descricao LIKE '%pecuar%' THEN 'Agronegócio'
        WHEN c.cnae_descricao LIKE '%saude%' OR c.cnae_descricao LIKE '%medic%' OR c.cnae_descricao LIKE '%hospital%' THEN 'Saúde e Médico'
        WHEN c.cnae_descricao LIKE '%eletro%' OR c.cnae_descricao LIKE '%eletr%' THEN 'Eletroeletrônicos'
        WHEN c.cnae_descricao LIKE '%movel%' OR c.cnae_descricao LIKE '%decor%' THEN 'Móveis e Decoração'
        ELSE 'Outros'
      END AS segment,
      5 AS experienceYears,
      NULL AS bio,
      'free' AS subscriptionTier,
      0.00 AS avg_rating,
      0.00 AS responseRate,
      'negociavel' AS availability,
      'multiplas' AS workModel,
      NULL AS portfolioSize,
      NULL AS linkedinUrl,
      NULL AS avatarUrl,
      NULL AS cities,
      NULL AS additionalSegments,
      NULL AS highlightedAt,
      c.created_at AS created_at,
      c.email AS email,
      c.municipio AS cidade,
      c.uf AS estado,
      'Ativa' AS situacaoCadastral,
      c.cnpj AS cnpj,
      COALESCE(c.nome_fantasia, c.razao_social) AS nomeFantasia,
      'not_started' AS kycStatus,
      'not_checked' AS coreStatus,
      4 AS tier_order,
      5 AS avail_order
    FROM cnpj_representatives c
    WHERE ${cnpjWhere}
  `;

  const allParams = [...repParams, ...(includeCnpj ? cnpjParams : [])];
  const unionQuery = includeCnpj
    ? `(${repQuery}) UNION ALL (${cnpjQueryBase})`
    : repQuery;

  // Use raw mysql2/promise connection for complex UNION queries
  const conn = await getRawConn();

  // Count total
  const countSql = `SELECT COUNT(*) as total FROM (${unionQuery}) AS combined`;
  const [countRows] = await conn.execute(countSql, allParams) as any;
  let total = Number((countRows as any[])?.[0]?.total ?? 0);
  let isFallback = false;

  // Fallback: if segment filter returns 0 results, show all segments with a fallback flag
  let finalUnionQuery = unionQuery;
  let finalAllParams = allParams;
  if (total === 0 && filters?.segment) {
    isFallback = true;
    // Rebuild WHERE without segment filter
    const repWhereNoSeg: string[] = ['r.isActive = 1'];
    const repParamsNoSeg: any[] = [];
    if (filters?.region) { repWhereNoSeg.push('r.region = ?'); repParamsNoSeg.push(filters.region); }
    if (filters?.tier) { repWhereNoSeg.push('r.subscriptionTier = ?'); repParamsNoSeg.push(filters.tier); }
    if (filters?.kycApproved) repWhereNoSeg.push("r.kycStatus = 'approved'");
    if (filters?.coreActive) repWhereNoSeg.push("r.coreStatus = 'active'");
    if (filters?.availability) { repWhereNoSeg.push('r.availability = ?'); repParamsNoSeg.push(filters.availability); }
    const repQueryNoSeg = repQuery.replace(`WHERE ${repWhere}`, `WHERE ${repWhereNoSeg.join(' AND ')}`);
    // For cnpj table fallback: keep region filter but drop segment
    const cnpjWhereNoSeg = cnpjWhereParts.filter(p => !p.includes('cnae_descricao')).join(' AND ') || '1=1';
    const cnpjParamsNoSeg = filters?.region
      ? cnpjParams.filter((_: any, i: number) => i < Object.entries(ufToRegion).filter(([,v]) => v === filters.region).length)
      : [];
    const cnpjQueryNoSeg = cnpjQueryBase.replace(`WHERE ${cnpjWhere}`, `WHERE ${cnpjWhereNoSeg}`);
    finalUnionQuery = includeCnpj
      ? `(${repQueryNoSeg}) UNION ALL (${cnpjQueryNoSeg})`
      : repQueryNoSeg;
    finalAllParams = includeCnpj ? [...repParamsNoSeg, ...cnpjParamsNoSeg] : repParamsNoSeg;
    const [countFallback] = await conn.execute(`SELECT COUNT(*) as total FROM (${finalUnionQuery}) AS combined`, finalAllParams) as any;
    total = Number((countFallback as any[])?.[0]?.total ?? 0);
  }

  // Fetch page
  const safeLimitVal = Math.max(1, Math.min(50, parseInt(String(limit), 10) || 20));
  const safeOffsetVal = Math.max(0, parseInt(String(offset), 10) || 0);
  console.log('[listRepresentativesForCompany] page:', page, 'limit:', limit, 'offset:', offset, 'safeLimit:', safeLimitVal, 'safeOffset:', safeOffsetVal, 'params count:', finalAllParams.length);
  const pageSql = `SELECT * FROM (${finalUnionQuery}) AS combined ${orderSql} LIMIT ${safeLimitVal} OFFSET ${safeOffsetVal}`;
  const [rows] = await conn.execute(pageSql, finalAllParams) as any;

  // Get unlocked contact IDs for this company
  const unlocked = await db
    .select({ representativeId: unlockedContacts.representativeId })
    .from(unlockedContacts)
    .where(eq(unlockedContacts.companyId, companyId));
  const unlockedIds = unlocked.map((u) => u.representativeId);

  // Normalize rows to expected shape
  const isAdmin = (filters as any)?._isAdmin === true;
  const maskedReps = (rows as any[]).map((row: any) => {
    const rep = {
      id: Number(row.id),
      fullName: row.fullName ?? '',
      phone: row.phone ?? null,
      region: row.region ?? null,
      segment: row.segment ?? 'Outros',
      experienceYears: Number(row.experienceYears ?? 0),
      bio: row.bio ?? null,
      subscriptionTier: row.subscriptionTier ?? 'free',
      averageRating: String(row.avg_rating ?? '0.00'),
      responseRate: String(row.responseRate ?? '0.00'),
      availability: row.availability ?? 'negociavel',
      workModel: row.workModel ?? 'multiplas',
      portfolioSize: row.portfolioSize ?? null,
      linkedinUrl: row.linkedinUrl ?? null,
      avatarUrl: row.avatarUrl ?? null,
      cities: row.cities ?? null,
      additionalSegments: row.additionalSegments ?? null,
      highlightedAt: row.highlightedAt ?? null,
      createdAt: row.created_at ?? null,
      email: row.email ?? null,
      cidade: row.cidade ?? null,
      estado: row.estado ?? null,
      situacaoCadastral: row.situacaoCadastral ?? null,
      cnpj: row.cnpj ?? null,
      nomeFantasia: row.nomeFantasia ?? null,
      kycStatus: row.kycStatus ?? 'not_started',
      coreStatus: row.coreStatus ?? 'not_checked',
    };
    const isUnlocked = unlockedIds.includes(rep.id);
    return maskRepresentativeData(rep, isUnlocked, isAdmin);
  });

  return { reps: maskedReps, total, unlockedIds, isFallback };
}

// ─── Direct Chat (Company ↔ Representative) ───────────────────────────────────

export async function createDirectMessage(data: {
  companyId: number;
  representativeId: number;
  senderUserId: number;
  content: string;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const { directChatMessages } = await import("../drizzle/schema");
  const result = await db.insert(directChatMessages).values(data);
  const insertId = (result as unknown as [{ insertId: number }])[0]?.insertId;
  if (!insertId) return undefined;
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(directChatMessages).where(eq(directChatMessages.id, insertId)).limit(1);
  return rows[0];
}

export async function getDirectMessages(companyId: number, representativeId: number) {
  const db = await getDb();
  if (!db) return [];
  const { directChatMessages } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  return db
    .select()
    .from(directChatMessages)
    .where(and(eq(directChatMessages.companyId, companyId), eq(directChatMessages.representativeId, representativeId)))
    .orderBy(directChatMessages.createdAt);
}

export async function markDirectMessagesRead(companyId: number, representativeId: number, readerIsCompany: boolean) {
  const db = await getDb();
  if (!db) return;
  const { directChatMessages } = await import("../drizzle/schema");
  const { and, eq } = await import("drizzle-orm");
  if (readerIsCompany) {
    await db.update(directChatMessages)
      .set({ isReadByCompany: true })
      .where(and(eq(directChatMessages.companyId, companyId), eq(directChatMessages.representativeId, representativeId)));
  } else {
    await db.update(directChatMessages)
      .set({ isReadByRep: true })
      .where(and(eq(directChatMessages.companyId, companyId), eq(directChatMessages.representativeId, representativeId)));
  }
}

export async function getDirectChatConversations(userId: number, userType: "company" | "representative") {
  const db = await getDb();
  if (!db) return [];
  const { directChatMessages, companies, representatives } = await import("../drizzle/schema");
  const { eq, desc, sql } = await import("drizzle-orm");

  if (userType === "company") {
    const company = await db.select().from(companies).where(eq(companies.userId, userId)).limit(1);
    if (!company[0]) return [];
    const companyId = company[0].id;
    // Get distinct representative IDs that have messages with this company
    const rows = await db
      .select({
        representativeId: directChatMessages.representativeId,
        lastMessage: sql<string>`MAX(${directChatMessages.content})`,
        lastAt: sql<Date>`MAX(${directChatMessages.createdAt})`,
        unread: sql<number>`SUM(CASE WHEN ${directChatMessages.isReadByCompany} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(directChatMessages)
      .where(eq(directChatMessages.companyId, companyId))
      .groupBy(directChatMessages.representativeId)
      .orderBy(desc(sql`MAX(${directChatMessages.createdAt})`));
    // Enrich with rep names
    const repIds = rows.map(r => r.representativeId);
    if (!repIds.length) return [];
    const { inArray } = await import("drizzle-orm");
    const reps = await db.select({ id: representatives.id, fullName: representatives.fullName }).from(representatives).where(inArray(representatives.id, repIds));
    return rows.map(r => ({
      ...r,
      companyId,
      repName: reps.find(rep => rep.id === r.representativeId)?.fullName ?? "Representante",
    }));
  } else {
    const rep = await db.select().from(representatives).where(eq(representatives.userId, userId)).limit(1);
    if (!rep[0]) return [];
    const repId = rep[0].id;
    const rows = await db
      .select({
        companyId: directChatMessages.companyId,
        lastMessage: sql<string>`MAX(${directChatMessages.content})`,
        lastAt: sql<Date>`MAX(${directChatMessages.createdAt})`,
        unread: sql<number>`SUM(CASE WHEN ${directChatMessages.isReadByRep} = 0 THEN 1 ELSE 0 END)`,
      })
      .from(directChatMessages)
      .where(eq(directChatMessages.representativeId, repId))
      .groupBy(directChatMessages.companyId)
      .orderBy(desc(sql`MAX(${directChatMessages.createdAt})`));
    const companyIds = rows.map(r => r.companyId);
    if (!companyIds.length) return [];
    const { inArray } = await import("drizzle-orm");
    const companiesList = await db.select({ id: companies.id, companyName: companies.companyName }).from(companies).where(inArray(companies.id, companyIds));
    return rows.map(r => ({
      ...r,
      representativeId: repId,
      companyName: companiesList.find(c => c.id === r.companyId)?.companyName ?? "Empresa",
    }));
  }
}
