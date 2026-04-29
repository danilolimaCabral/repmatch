import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["representative", "company", "pending"]).default("pending").notNull(),
  emailVerified: boolean("emailVerified").default(false),
  resetToken: varchar("resetToken", { length: 100 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
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
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "premium", "elite"]).default("free").notNull(),
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
  minTierRequired: mysqlEnum("minTierRequired", ["free", "premium", "elite"]).default("free").notNull(),
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
