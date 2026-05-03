import {
  boolean,
  char,
  date,
  datetime,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerificationToken: varchar("emailVerificationToken", { length: 128 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["representative", "company", "manager", "pending"]).default("pending").notNull(),
  cpf: varchar("cpf", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Representatives
export const representatives = mysqlTable("representatives", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  region: varchar("region", { length: 100 }),
  segment: varchar("segment", { length: 100 }),
  experienceYears: int("experienceYears").default(0),
  bio: text("bio"),
  availability: mysqlEnum("availability", ["imediata", "30dias", "60dias", "negociavel"]).default("negociavel"),
  workModel: mysqlEnum("workModel", ["exclusivo", "multiplas", "indifferente"]).default("multiplas"),
  portfolioSize: varchar("portfolioSize", { length: 50 }),
  linkedinUrl: varchar("linkedinUrl", { length: 300 }),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  cities: text("cities"),
  additionalSegments: text("additionalSegments"),
  highlightedAt: timestamp("highlightedAt"),
  // KYC — Verificação de Identidade
  kycStatus: mysqlEnum("kycStatus", ["not_started", "pending_review", "approved", "rejected"]).default("not_started").notNull(),
  kycDocumentUrl: varchar("kycDocumentUrl", { length: 500 }),
  kycSelfieUrl: varchar("kycSelfieUrl", { length: 500 }),
  kycDocumentType: mysqlEnum("kycDocumentType", ["rg", "cnh", "passaporte"]),
  kycExtractedName: varchar("kycExtractedName", { length: 200 }),
  kycExtractedCpf: varchar("kycExtractedCpf", { length: 20 }),
  kycNotes: text("kycNotes"),
  kycFaceMatchScore: decimal("kycFaceMatchScore", { precision: 5, scale: 4 }),
  kycFaceMatchResult: mysqlEnum("kycFaceMatchResult", ["match", "no_match", "uncertain", "error"]),
  kycReviewedAt: timestamp("kycReviewedAt"),
  // CORE — Conselho Regional dos Representantes Comerciais
  cnpj: varchar("cnpj", { length: 20 }),
  coreNumber: varchar("coreNumber", { length: 30 }),
  coreState: varchar("coreState", { length: 2 }),
  coreStatus: mysqlEnum("coreStatus", ["not_checked", "active", "inactive", "not_found"]).default("not_checked").notNull(),
  coreDocUrl: varchar("coreDocUrl", { length: 500 }),
  coreValidUntil: varchar("coreValidUntil", { length: 20 }),
  coreCheckedAt: timestamp("coreCheckedAt"),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "bronze", "prata", "ouro"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  responseRate: decimal("responseRate", { precision: 5, scale: 2 }).default("0"),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = typeof representatives.$inferInsert;

// Companies
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 100 }).notNull(),
  cnpj: varchar("cnpj", { length: 20 }),
  segment: varchar("segment", { length: 100 }),
  region: varchar("region", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  website: varchar("website", { length: 200 }),
  description: text("description"),
  subscriptionTier: mysqlEnum("subscriptionTier", ["starter", "pro", "enterprise"]).default("starter").notNull(),
  dynamicRank: mysqlEnum("dynamicRank", ["bronze", "silver", "gold", "platinum"]).default("bronze").notNull(),
  rankScore: decimal("rankScore", { precision: 6, scale: 2 }).default("0"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }),
  cnpjValidated: boolean("cnpjValidated").default(false),
  cnpjStatus: varchar("cnpjStatus", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// Jobs
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  commissionPercentage: decimal("commissionPercentage", { precision: 5, scale: 2 }),
  region: varchar("region", { length: 100 }),
  segment: varchar("segment", { length: 100 }),
  isFeatured: boolean("isFeatured").default(false),
  status: mysqlEnum("status", ["open", "closed", "paused"]).default("open").notNull(),
  minTierRequired: mysqlEnum("minTierRequired", ["free", "bronze", "prata", "ouro"]).default("free").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

// Applications
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  representativeId: int("representativeId").notNull(),
  matchScore: int("matchScore").default(0),
  llmScore: int("llmScore").default(0),
  totalScore: int("totalScore").default(0),
  llmAnalysis: text("llmAnalysis"),
  status: mysqlEnum("status", ["pending", "viewed", "accepted", "rejected", "hired"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

// Messages
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  applicationId: int("applicationId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Unlocked Contacts
export const unlockedContacts = mysqlTable("unlocked_contacts", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  representativeId: int("representativeId").notNull(),
  pricePaid: decimal("pricePaid", { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 100 }),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UnlockedContact = typeof unlockedContacts.$inferSelect;
export type InsertUnlockedContact = typeof unlockedContacts.$inferInsert;

// Import Logs
export const importLogs = mysqlTable("import_logs", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 200 }),
  totalRecords: int("totalRecords").default(0),
  importedRecords: int("importedRecords").default(0),
  failedRecords: int("failedRecords").default(0),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorLog: text("errorLog"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type ImportLog = typeof importLogs.$inferSelect;
export type InsertImportLog = typeof importLogs.$inferInsert;

// LGPD Consent Logs
export const consentLogs = mysqlTable("consent_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  consentType: mysqlEnum("consentType", ["terms", "privacy", "analytics", "marketing"]).notNull(),
  action: mysqlEnum("action", ["granted", "revoked"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConsentLog = typeof consentLogs.$inferSelect;
export type InsertConsentLog = typeof consentLogs.$inferInsert;

// LGPD Data Deletion Requests (Direito ao Esquecimento)
export const dataDeletionRequests = mysqlTable("data_deletion_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  reason: text("reason"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "rejected"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  processedAt: timestamp("processedAt"),
  processedBy: int("processedBy"),
  notes: text("notes"),
});

export type DataDeletionRequest = typeof dataDeletionRequests.$inferSelect;
export type InsertDataDeletionRequest = typeof dataDeletionRequests.$inferInsert;

// Password Reset Tokens
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ─── CNPJ Representatives (Base Nacional da Receita Federal) ─────────────────
export const cnpjRepresentatives = mysqlTable("cnpj_representatives", {
  id: int("id").autoincrement().primaryKey(),
  cnpj: varchar("cnpj", { length: 20 }).notNull().unique(),
  razaoSocial: varchar("razao_social", { length: 255 }),
  nomeFantasia: varchar("nome_fantasia", { length: 255 }),
  porte: varchar("porte", { length: 50 }),
  isMei: tinyint("is_mei").default(0),
  cnaePrincipal: varchar("cnae_principal", { length: 10 }),
  cnaeDescricao: varchar("cnae_descricao", { length: 255 }),
  uf: char("uf", { length: 2 }),
  municipio: varchar("municipio", { length: 100 }),
  cep: varchar("cep", { length: 10 }),
  logradouro: varchar("logradouro", { length: 255 }),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  dataAbertura: date("data_abertura"),
  dataSituacao: date("data_situacao"),
  cnpjUpdatedAt: datetime("cnpj_updated_at"),
  createdAt: datetime("created_at"),
});
export type CnpjRepresentative = typeof cnpjRepresentatives.$inferSelect;

// ─── Direct Chat (empresa ↔ representante após desbloqueio) ──────────────────
export const directChatMessages = mysqlTable("direct_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  representativeId: int("representativeId").notNull(),
  senderUserId: int("senderUserId").notNull(),
  content: text("content").notNull(),
  isReadByCompany: boolean("isReadByCompany").default(false).notNull(),
  isReadByRep: boolean("isReadByRep").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DirectChatMessage = typeof directChatMessages.$inferSelect;
export type InsertDirectChatMessage = typeof directChatMessages.$inferInsert;

// ─── Managers (Gerentes Comerciais) ─────────────────────────────────────────
export const managers = mysqlTable("managers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fullName: varchar("fullName", { length: 100 }).notNull(),
  cpf: varchar("cpf", { length: 20 }),
  phone: varchar("phone", { length: 20 }),
  region: varchar("region", { length: 100 }),
  segment: varchar("segment", { length: 100 }),
  teamSize: int("teamSize").default(0),
  bio: text("bio"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Manager = typeof managers.$inferSelect;
export type InsertManager = typeof managers.$inferInsert;

// ─── Rep Opportunities (Representante publica sua disponibilidade) ────────────
export const repOpportunities = mysqlTable("rep_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  representativeId: int("representativeId").notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description"),
  region: varchar("region", { length: 100 }),
  segment: varchar("segment", { length: 100 }),
  availability: mysqlEnum("availability", ["imediata", "30dias", "60dias", "negociavel"]).default("imediata"),
  workModel: mysqlEnum("workModel", ["exclusivo", "multiplas", "indifferente"]).default("multiplas"),
  expectedCommission: varchar("expectedCommission", { length: 50 }),
  status: mysqlEnum("status", ["active", "paused", "closed"]).default("active").notNull(),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RepOpportunity = typeof repOpportunities.$inferSelect;
export type InsertRepOpportunity = typeof repOpportunities.$inferInsert;

// ─── Manager Credits (créditos para desbloquear contatos de reps) ──────────────
export const managerCredits = mysqlTable("manager_credits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  credits: int("credits").default(0).notNull(),
  totalPurchased: int("totalPurchased").default(0).notNull(),
  isUnlimited: boolean("isUnlimited").default(false).notNull(),
  unlimitedExpiresAt: timestamp("unlimitedExpiresAt"),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ManagerCredits = typeof managerCredits.$inferSelect;
export type InsertManagerCredits = typeof managerCredits.$inferInsert;

// ─── Manager Unlocks (contatos desbloqueados pelo gerente) ────────────────────
export const managerUnlocks = mysqlTable("manager_unlocks", {
  id: int("id").autoincrement().primaryKey(),
  managerId: int("managerId").notNull(),
  representativeId: int("representativeId").notNull(),
  stripePaymentId: varchar("stripePaymentId", { length: 100 }),
  productKey: varchar("productKey", { length: 50 }),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});
export type ManagerUnlock = typeof managerUnlocks.$inferSelect;
export type InsertManagerUnlock = typeof managerUnlocks.$inferInsert;

// ─── Rep Reviews (Empresa avalia representante após contratação) ──────────────
export const repReviews = mysqlTable("rep_reviews", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  representativeId: int("representativeId").notNull(),
  rating: int("rating").notNull(), // 1-5
  comment: text("comment"),
  companyName: varchar("companyName", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RepReview = typeof repReviews.$inferSelect;
export type InsertRepReview = typeof repReviews.$inferInsert;
