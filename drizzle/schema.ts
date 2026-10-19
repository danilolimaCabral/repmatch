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
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
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
  cpf: varchar("cpf", { length: 14 }),
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
  // CNPJA enrichment fields
  email: varchar("email", { length: 255 }),
  nomeFantasia: varchar("nomeFantasia", { length: 255 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  situacaoCadastral: varchar("situacaoCadastral", { length: 50 }),
  dataAbertura: varchar("dataAbertura", { length: 20 }),
  naturezaJuridica: varchar("naturezaJuridica", { length: 200 }),
  porte: varchar("porte", { length: 50 }),
  capitalSocial: varchar("capitalSocial", { length: 30 }),
  simplesNacional: boolean("simplesNacional").default(false),
  mei: boolean("mei").default(false),
  cnaeDescricao: varchar("cnaeDescricao", { length: 300 }),
  socios: text("socios"),
  cnpjaRawJson: text("cnpjaRawJson"),
  cnpjaUpdatedAt: timestamp("cnpjaUpdatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdIdx: index("rep_userId_idx").on(t.userId),
  kycStatusIdx: index("rep_kycStatus_idx").on(t.kycStatus),
  regionSegmentIdx: index("rep_region_segment_idx").on(t.region, t.segment),
}));

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
  freeUnlockUsed: boolean("freeUnlockUsed").default(false).notNull(),
  logoUrl: varchar("logoUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userIdIdx: index("company_userId_idx").on(t.userId),
}));

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
}, (t) => ({
  companyIdIdx: index("job_companyId_idx").on(t.companyId),
  statusIdx: index("job_status_idx").on(t.status),
  regionSegmentIdx: index("job_region_segment_idx").on(t.region, t.segment),
}));

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
  contactUnlocked: tinyint("contactUnlocked").default(0).notNull(),
  mpPaymentId: varchar("mpPaymentId", { length: 100 }),
  applicationFee: int("applicationFee").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  jobIdIdx: index("app_jobId_idx").on(t.jobId),
  repIdIdx: index("app_repId_idx").on(t.representativeId),
}));

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
}, (t) => ({
  applicationIdIdx: index("msg_applicationId_idx").on(t.applicationId),
}));

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
}, (t) => ({
  companyRepIdx: index("dchat_company_rep_idx").on(t.companyId, t.representativeId),
  senderIdx: index("dchat_sender_idx").on(t.senderUserId),
}));
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

// ─── Configurações comerciais da plataforma ───────────────────────────────────
export const platformSettings = mysqlTable("platform_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: varchar("value", { length: 100 }).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type InsertPlatformSetting = typeof platformSettings.$inferInsert;

// ─── Catálogo comercial de empresas B2B/B2C importadas ───────────────────────
// Não armazena pessoas, históricos internos ou observações do CRM de origem.
export const marketLeads = mysqlTable("market_leads", {
  id: int("id").autoincrement().primaryKey(),
  sourceProject: varchar("source_project", { length: 80 }).notNull(),
  sourceOrgId: int("source_org_id").notNull(),
  sourceRecordId: int("source_record_id").notNull(),
  cnpj: varchar("cnpj", { length: 14 }).notNull().unique(),
  razaoSocial: varchar("razao_social", { length: 255 }).notNull(),
  nomeFantasia: varchar("nome_fantasia", { length: 255 }),
  cnae: varchar("cnae", { length: 20 }),
  cnaeDescricao: varchar("cnae_descricao", { length: 255 }),
  segmento: varchar("segmento", { length: 150 }),
  audience: mysqlEnum("audience", ["b2b", "b2c", "both"]).notNull(),
  situacaoCadastral: varchar("situacao_cadastral", { length: 50 }).notNull(),
  porte: varchar("porte", { length: 60 }),
  dataAbertura: varchar("data_abertura", { length: 20 }),
  cidade: varchar("cidade", { length: 120 }),
  estado: char("estado", { length: 2 }),
  cep: varchar("cep", { length: 10 }),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  site: varchar("site", { length: 255 }),
  instagram: varchar("instagram", { length: 255 }),
  available: boolean("available").default(true).notNull(),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  sourceUpdatedAt: timestamp("source_updated_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  audienceStateIdx: index("market_leads_audience_state_idx").on(t.audience, t.estado, t.available),
  segmentIdx: index("market_leads_segment_idx").on(t.segmento),
  sourceRecordIdx: index("market_leads_source_record_idx").on(t.sourceProject, t.sourceOrgId, t.sourceRecordId),
}));
export type MarketLead = typeof marketLeads.$inferSelect;
export type InsertMarketLead = typeof marketLeads.$inferInsert;

// ─── Acessos mensais ao catálogo comercial ────────────────────────────────────
export const marketLeadAccesses = mysqlTable("market_lead_accesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  plan: mysqlEnum("plan", ["unlimited_monthly"]).default("unlimited_monthly").notNull(),
  status: mysqlEnum("status", ["pending_payment", "pending_approval", "active", "rejected", "expired", "cancelled"]).default("pending_payment").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  // Zero representa a faixa ilimitada; as demais faixas usam o saldo de empresas salvas.
  selectionLimit: int("selection_limit").default(0).notNull(),
  mpPaymentId: varchar("mp_payment_id", { length: 100 }),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userStatusExpiryIdx: index("market_access_user_status_expiry_idx").on(t.userId, t.status, t.expiresAt),
  statusCreatedIdx: index("market_access_status_created_idx").on(t.status, t.createdAt),
}));
export type MarketLeadAccess = typeof marketLeadAccesses.$inferSelect;
export type InsertMarketLeadAccess = typeof marketLeadAccesses.$inferInsert;

// ─── Pacotes de leads B2B e B2C (entrega manual após PIX confirmado) ─────────
export const leadPackageOrders = mysqlTable("lead_package_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  audience: mysqlEnum("audience", ["b2b", "b2c"]).notNull(),
  quantity: int("quantity").default(2000).notNull(),
  segment: varchar("segment", { length: 120 }),
  region: varchar("region", { length: 120 }),
  notes: text("notes"),
  legalConsent: boolean("legalConsent").default(false).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["pix"]).default("pix").notNull(),
  status: mysqlEnum("status", ["pending_payment", "pending_approval", "approved", "rejected", "delivered", "cancelled"]).default("pending_payment").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  mpPaymentId: varchar("mpPaymentId", { length: 100 }),
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userCreatedIdx: index("lead_order_user_created_idx").on(t.userId, t.createdAt),
  statusCreatedIdx: index("lead_order_status_created_idx").on(t.status, t.createdAt),
}));
export type LeadPackageOrder = typeof leadPackageOrders.$inferSelect;
export type InsertLeadPackageOrder = typeof leadPackageOrders.$inferInsert;

// ─── Leads escolhidos dentro dos pacotes adquiridos ───────────────────────────
export const savedMarketLeads = mysqlTable("saved_market_leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  leadPackageOrderId: int("lead_package_order_id"),
  marketLeadAccessId: int("market_lead_access_id"),
  marketLeadId: int("market_lead_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userCreatedIdx: index("saved_market_leads_user_created_idx").on(t.userId, t.createdAt),
  orderIdx: index("saved_market_leads_order_idx").on(t.leadPackageOrderId),
  accessIdx: index("saved_market_leads_access_idx").on(t.marketLeadAccessId),
  userLeadUnique: uniqueIndex("saved_market_leads_user_lead_unique").on(t.userId, t.marketLeadId),
}));
export type SavedMarketLead = typeof savedMarketLeads.$inferSelect;
export type InsertSavedMarketLead = typeof savedMarketLeads.$inferInsert;

// ─── Base B2C de pessoas físicas com consentimento declarado ──────────────────
// Esta base é isolada do catálogo empresarial: armazena somente nome, telefone e
// e-mail. Campos de operação/origem (vendedor, observações, propostas etc.) não
// fazem parte deste schema e jamais são disponibilizados ao comprador.
export const consumerLeadImportBatches = mysqlTable("consumer_lead_import_batches", {
  id: int("id").autoincrement().primaryKey(),
  sourceLabel: varchar("source_label", { length: 120 }).notNull(),
  fileSha256: char("file_sha256", { length: 64 }).notNull().unique(),
  consentAttested: boolean("consent_attested").default(false).notNull(),
  consentPolicyVersion: varchar("consent_policy_version", { length: 60 }).notNull(),
  totalRows: int("total_rows").default(0).notNull(),
  acceptedRows: int("accepted_rows").default(0).notNull(),
  duplicateRows: int("duplicate_rows").default(0).notNull(),
  rejectedRows: int("rejected_rows").default(0).notNull(),
  importedBy: int("imported_by"),
  status: mysqlEnum("status", ["processing", "completed", "failed"]).default("processing").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export type ConsumerLeadImportBatch = typeof consumerLeadImportBatches.$inferSelect;

export const consumerLeads = mysqlTable("consumer_leads", {
  id: int("id").autoincrement().primaryKey(),
  importBatchId: int("import_batch_id").notNull(),
  fullName: varchar("full_name", { length: 700 }).notNull(),
  phone: varchar("phone", { length: 120 }),
  email: varchar("email", { length: 400 }),
  phoneHash: char("phone_hash", { length: 64 }),
  emailHash: char("email_hash", { length: 64 }),
  contactKey: char("contact_key", { length: 64 }).notNull(),
  consentStatus: mysqlEnum("consent_status", ["declared", "revoked"]).default("declared").notNull(),
  available: boolean("available").default(true).notNull(),
  consentDeclaredAt: timestamp("consent_declared_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  contactKeyUnique: uniqueIndex("consumer_leads_contact_key_unique").on(t.contactKey),
  phoneUnique: uniqueIndex("consumer_leads_phone_hash_unique").on(t.phoneHash),
  emailUnique: uniqueIndex("consumer_leads_email_hash_unique").on(t.emailHash),
  availableConsentIdx: index("consumer_leads_available_consent_idx").on(t.available, t.consentStatus),
  batchIdx: index("consumer_leads_batch_idx").on(t.importBatchId),
}));
export type ConsumerLead = typeof consumerLeads.$inferSelect;

// ─── Pedidos de pacotes B2C PF: 50 ou 100 contatos ───────────────────────────
export const consumerLeadOrders = mysqlTable("consumer_lead_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  quantity: int("quantity").notNull(),
  legalConsent: boolean("legal_consent").default(false).notNull(),
  paymentMethod: mysqlEnum("payment_method", ["pix"]).default("pix").notNull(),
  status: mysqlEnum("status", ["pending_payment", "pending_approval", "approved", "rejected", "delivered", "cancelled"]).default("pending_payment").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  mpPaymentId: varchar("mp_payment_id", { length: 100 }),
  adminNotes: text("admin_notes"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userCreatedIdx: index("consumer_lead_order_user_created_idx").on(t.userId, t.createdAt),
  statusCreatedIdx: index("consumer_lead_order_status_created_idx").on(t.status, t.createdAt),
}));
export type ConsumerLeadOrder = typeof consumerLeadOrders.$inferSelect;

// ─── Plano mensal B2C PF (franquia de contatos selecionáveis) ──────────────────
export const consumerLeadAccesses = mysqlTable("consumer_lead_accesses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  legalConsent: boolean("legal_consent").notNull().default(false),
  status: mysqlEnum("status", ["pending_payment", "pending_approval", "active", "rejected", "expired", "cancelled"]).default("pending_payment").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  selectionLimit: int("selection_limit").default(500).notNull(),
  mpPaymentId: varchar("mp_payment_id", { length: 100 }),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  userStatusExpiryIdx: index("consumer_lead_access_user_status_expiry_idx").on(t.userId, t.status, t.expiresAt),
  statusCreatedIdx: index("consumer_lead_access_status_created_idx").on(t.status, t.createdAt),
}));
export type ConsumerLeadAccess = typeof consumerLeadAccesses.$inferSelect;

// ─── Contatos PF escolhidos pelo comprador ─────────────────────────────────────
export const savedConsumerLeads = mysqlTable("saved_consumer_leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  consumerLeadOrderId: int("consumer_lead_order_id"),
  consumerLeadAccessId: int("consumer_lead_access_id"),
  consumerLeadId: int("consumer_lead_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  userCreatedIdx: index("saved_consumer_leads_user_created_idx").on(t.userId, t.createdAt),
  orderIdx: index("saved_consumer_leads_order_idx").on(t.consumerLeadOrderId),
  accessIdx: index("saved_consumer_leads_access_idx").on(t.consumerLeadAccessId),
  userLeadUnique: uniqueIndex("saved_consumer_leads_user_lead_unique").on(t.userId, t.consumerLeadId),
}));
export type SavedConsumerLead = typeof savedConsumerLeads.$inferSelect;

// ─── Plano mensal de desbloqueio de representantes ─────────────────────────────
export const representativeMonthlyAccesses = mysqlTable("representative_monthly_accesses", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("company_id").notNull(),
  userId: int("user_id").notNull(),
  status: mysqlEnum("status", ["pending_payment", "pending_approval", "active", "rejected", "expired", "cancelled"]).default("pending_payment").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  unlockLimit: int("unlock_limit").default(100).notNull(),
  mpPaymentId: varchar("mp_payment_id", { length: 100 }),
  reviewedBy: int("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  startsAt: timestamp("starts_at"),
  expiresAt: timestamp("expires_at"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (t) => ({
  companyStatusExpiryIdx: index("rep_monthly_access_company_status_expiry_idx").on(t.companyId, t.status, t.expiresAt),
  userStatusExpiryIdx: index("rep_monthly_access_user_status_expiry_idx").on(t.userId, t.status, t.expiresAt),
  statusCreatedIdx: index("rep_monthly_access_status_created_idx").on(t.status, t.createdAt),
}));
export type RepresentativeMonthlyAccess = typeof representativeMonthlyAccesses.$inferSelect;

export const representativeMonthlyUnlocks = mysqlTable("representative_monthly_unlocks", {
  id: int("id").autoincrement().primaryKey(),
  representativeMonthlyAccessId: int("representative_monthly_access_id").notNull(),
  companyId: int("company_id").notNull(),
  representativeId: int("representative_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  accessCreatedIdx: index("rep_monthly_unlock_access_created_idx").on(t.representativeMonthlyAccessId, t.createdAt),
  accessRepUnique: uniqueIndex("rep_monthly_unlock_access_rep_unique").on(t.representativeMonthlyAccessId, t.representativeId),
}));
export type RepresentativeMonthlyUnlock = typeof representativeMonthlyUnlocks.$inferSelect;

// ─── Unlock Requests (Carrinho de desbloqueios via Pix ou Stripe) ───────────────
export const unlockRequests = mysqlTable("unlock_requests", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  // Método de pagamento
  paymentMethod: mysqlEnum("paymentMethod", ["pix", "stripe"]).default("pix").notNull(),
  // Status do pedido
  status: mysqlEnum("status", ["pending_payment", "pending_approval", "approved", "rejected", "cancelled"]).default("pending_payment").notNull(),
  // Valor total
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).notNull(),
  // Comprovante Pix (URL do arquivo enviado)
  pixProofUrl: varchar("pixProofUrl", { length: 500 }),
  pixProofKey: varchar("pixProofKey", { length: 200 }),
  // Stripe
  stripePaymentId: varchar("stripePaymentId", { length: 100 }),
  // Notas do admin ao aprovar/rejeitar
  adminNotes: text("adminNotes"),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("reviewedAt"),
  // Quantidade de CNPJs inativos que foram pulados na validação CNPJA
  inactiveCount: int("inactiveCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UnlockRequest = typeof unlockRequests.$inferSelect;
export type InsertUnlockRequest = typeof unlockRequests.$inferInsert;

// Itens do carrinho de desbloqueio
export const unlockRequestItems = mysqlTable("unlock_request_items", {
  id: int("id").autoincrement().primaryKey(),
  unlockRequestId: int("unlockRequestId").notNull(),
  representativeId: int("representativeId").notNull(),
  repName: varchar("repName", { length: 100 }),
  priceUnit: decimal("priceUnit", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UnlockRequestItem = typeof unlockRequestItems.$inferSelect;
export type InsertUnlockRequestItem = typeof unlockRequestItems.$inferInsert;

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

// ─── Page Views (rastreamento de visitas ao site) ─────────────────────────────
export const pageViews = mysqlTable("page_views", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  path: varchar("path", { length: 500 }).notNull(),
  referrer: varchar("referrer", { length: 500 }),
  userAgent: varchar("userAgent", { length: 500 }),
  country: varchar("country", { length: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  sessionIdx: index("pv_session_idx").on(t.sessionId),
  createdAtIdx: index("pv_createdAt_idx").on(t.createdAt),
}));
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = typeof pageViews.$inferInsert;

// ─── Interesse de compra de contatos (funil empresa → representante) ──────────
export const representativePurchaseClicks = mysqlTable("representative_purchase_clicks", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  representativeId: int("representativeId").notNull(),
  source: varchar("source", { length: 40 }).default("search").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  repCreatedIdx: index("rpc_rep_created_idx").on(t.representativeId, t.createdAt),
  companyCreatedIdx: index("rpc_company_created_idx").on(t.companyId, t.createdAt),
  createdAtIdx: index("rpc_created_idx").on(t.createdAt),
}));
export type RepresentativePurchaseClick = typeof representativePurchaseClicks.$inferSelect;
export type InsertRepresentativePurchaseClick = typeof representativePurchaseClicks.$inferInsert;

// ─── Blog Reactions (reações nos artigos do blog) ────────────────────────────
export const blogReactions = mysqlTable("blog_reactions", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull(),
  reaction: mysqlEnum("reaction", ["like", "love", "rocket", "bulb"]).notNull(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => ({
  slugReactionIdx: index("br_slug_reaction_idx").on(t.slug, t.reaction),
  sessionSlugIdx: index("br_session_slug_idx").on(t.sessionId, t.slug),
}));
export type BlogReaction = typeof blogReactions.$inferSelect;
export type InsertBlogReaction = typeof blogReactions.$inferInsert;
