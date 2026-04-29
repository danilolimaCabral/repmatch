import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Application,
  Company,
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

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
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

export async function listAllUsers(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.createdAt).limit(limit);
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
  return db.select().from(representatives).where(and(...conditions)).orderBy(desc(representatives.averageRating));
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
  repTier?: "free" | "premium" | "elite";
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(jobs.status, "open")];
  if (filters?.companyId) conditions.push(eq(jobs.companyId, filters.companyId));
  if (filters?.region) conditions.push(eq(jobs.region, filters.region));
  if (filters?.segment) conditions.push(eq(jobs.segment, filters.segment));

  // Tier access control
  if (filters?.repTier === "free") {
    conditions.push(eq(jobs.minTierRequired, "free"));
  } else if (filters?.repTier === "premium") {
    conditions.push(or(eq(jobs.minTierRequired, "free"), eq(jobs.minTierRequired, "premium"))!);
  }
  // elite sees all

  return db.select().from(jobs).where(and(...conditions)).orderBy(desc(jobs.isFeatured), desc(jobs.createdAt));
}

export async function updateJob(id: number, data: Partial<InsertJob>) {
  const db = await getDb();
  if (!db) return;
  await db.update(jobs).set(data).where(eq(jobs.id, id));
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

export function calculateMatchScore(rep: Representative, job: Job): number {
  let score = 0;
  if (rep.region && job.region && rep.region === job.region) score += 40;
  if (rep.segment && job.segment && rep.segment === job.segment) score += 30;
  if ((rep.experienceYears ?? 0) >= 3) score += 20;
  if (rep.isActive) score += 10;
  return score;
}

export async function getTopMatchesForJob(jobId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const job = await getJobById(jobId);
  if (!job) return [];

  const reps = await db.select().from(representatives).where(eq(representatives.isActive, true));
  const scored = reps.map((rep) => ({ rep, score: calculateMatchScore(rep, job) }));
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
    .where(or(eq(representatives.subscriptionTier, "premium"), eq(representatives.subscriptionTier, "elite"))!);

  return {
    totalReps: Number(totalReps?.count ?? 0),
    totalCompanies: Number(totalCompanies?.count ?? 0),
    totalJobs: Number(totalJobs?.count ?? 0),
    totalApplications: Number(totalApplications?.count ?? 0),
    premiumReps: Number(premiumReps?.count ?? 0),
  };
}

// ─── Preview Inteligente ──────────────────────────────────────────────────────
export async function getRepresentativePreview(filters?: { region?: string; segment?: string; subscriptionTier?: string }) {
  const db = await getDb();
  if (!db) return { count: 0, previews: [], regions: [], segments: [] };
  const conditions = [eq(representatives.isActive, true)];
  if (filters?.region) conditions.push(eq(representatives.region, filters.region));
  if (filters?.segment) conditions.push(eq(representatives.segment, filters.segment));
  
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
    .limit(100);

  // Get all regions and segments for filter options
  const allActive = await db
    .select({ region: representatives.region, segment: representatives.segment })
    .from(representatives)
    .where(eq(representatives.isActive, true));
  
  const regions = Array.from(new Set(allActive.map(r => r.region).filter(Boolean))) as string[];
  const segments = Array.from(new Set(allActive.map(r => r.segment).filter(Boolean))) as string[];

  // Mask personal data: show only first name, city (from region), segment, experience
  // Plan-based gating: free=3, starter/pro/enterprise=5
  const previewLimit = filters?.subscriptionTier && filters.subscriptionTier !== 'free' ? 5 : 3;
  const previews = allReps.slice(0, previewLimit).map((rep, i) => {
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

  return { count: allReps.length, previews, regions, segments };
}
