import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminStats,
  calculateMatchScore,
  createApplication,
  createCompany,
  createImportLog,
  createJob,
  createMessage,
  getApplicationsByJob,
  getApplicationsByRep,
  getCompanyById,
  getCompanyByUserId,
  getExistingApplication,
  getJobById,
  getMessagesByApplication,
  getRepresentativeByUserId,
  getTopMatchesForJob,
  isContactUnlocked,
  listImportLogs,
  listJobs,
  listRepresentatives,
  unlockContact,
  updateApplication,
  updateCompany,
  updateImportLog,
  updateJob,
  updateRepresentative,
  updateUserType,
  createRepresentative,
  promoteToAdmin,
  toggleUserActive,
  listAllUsers,
  getRepresentativePreview,
  listRepresentativesForCompany,
  listPublicJobs,
  listPendingPayments,
  activateRepPlan,
  createDirectMessage,
  getDirectMessages,
  getDirectChatConversations,
  markDirectMessagesRead,
  listRepresentativesWithFiscalId,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { cnpjRepresentatives, consentLogs, dataDeletionRequests, representatives, companies, managerCredits, managerUnlocks, unlockedContacts, directChatMessages } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";


/// ─── Helpers ──────────────────────────────────────────────────────────────────
const TIER_ORDER = { free: 0, bronze: 1, prata: 2, ouro: 3 } as const;

function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  // Brazilian phone: 10 digits (landline) or 11 digits (mobile with 9)
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  // Invalid phone — discard
  return null;
}

async function enrichCNPJ(cnpj: string): Promise<{ companyName?: string; segment?: string; phone?: string; region?: string; situation?: string } | null> {
  try {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return null;
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    return {
      companyName: (data.razao_social as string) ?? undefined,
      segment: (data.cnae_fiscal_descricao as string) ?? undefined,
      phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : undefined,
      region: (data.uf as string) ?? undefined,
      situation: (data.descricao_situacao_cadastral as string) ?? undefined,
    };
  } catch {
    return null;
  }
}
const RANK_ORDER = { bronze: 0, silver: 1, gold: 2, platinum: 3 } as const;

function tierAllowsRank(repTier: "free" | "bronze" | "prata" | "ouro", companyRank: "bronze" | "silver" | "gold" | "platinum"): boolean {
  if (repTier === "ouro") return true;
  if (repTier === "prata") return RANK_ORDER[companyRank] <= RANK_ORDER["gold"];
  if (repTier === "bronze") return RANK_ORDER[companyRank] <= RANK_ORDER["silver"];
  return RANK_ORDER[companyRank] <= RANK_ORDER["bronze"];
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie("rm_session", { path: "/", maxAge: -1 });
      return { success: true } as const;
    }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
        email: z.string().email("E-mail inválido"),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const { users } = await import("../drizzle/schema");
        await db!.update(users)
          .set({ name: input.name, email: input.email, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(8, "Nova senha deve ter ao menos 8 caracteres"),
      }))
      .mutation(async ({ ctx, input }) => {
        const bcrypt = await import("bcryptjs");
        const db = await getDb();
        const { users } = await import("../drizzle/schema");
        const [user] = await db!.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!user?.passwordHash) {
          throw new Error("Conta sem senha cadastrada. Use a opção de cadastrar senha.");
        }
        const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
        if (!valid) {
          throw new Error("Senha atual incorreta.");
        }
        const hash = await bcrypt.hash(input.newPassword, 12);
        await db!.update(users)
          .set({ passwordHash: hash, updatedAt: new Date() })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),

    deleteAccount: protectedProcedure
      .input(z.object({
        confirmPassword: z.string().min(1, "Senha de confirmação é obrigatória"),
      }))
      .mutation(async ({ ctx, input }) => {
        const bcrypt = await import("bcryptjs");
        const db = await getDb();
        const { users, representatives, companies, dataDeletionRequests } = await import("../drizzle/schema");
        const [user] = await db!.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
        if (!user?.passwordHash) {
          throw new Error("Conta sem senha cadastrada.");
        }
        const valid = await bcrypt.compare(input.confirmPassword, user.passwordHash);
        if (!valid) {
          throw new Error("Senha incorreta. Não foi possível confirmar a exclusão.");
        }
        // LGPD: anonymize user data instead of hard delete
        const anonymizedEmail = `deleted_${ctx.user.id}_${Date.now()}@deleted.invalid`;
        await db!.update(users).set({
          name: "Usuário Excluído",
          email: anonymizedEmail,
          passwordHash: null,
          emailVerified: false,
          emailVerificationToken: null,
          isActive: false,
          updatedAt: new Date(),
        }).where(eq(users.id, ctx.user.id));
        // Deactivate representative profile (companies table has no isActive)
        await db!.update(representatives).set({ isActive: false }).where(eq(representatives.userId, ctx.user.id));
        // Log deletion request for LGPD compliance
        await db!.insert(dataDeletionRequests).values({
          userId: ctx.user.id,
          reason: "Solicitação de exclusão pelo próprio usuário",
          status: "completed",
          processedAt: new Date(),
        });
        // Notify owner
        await notifyOwner({
          title: "🗑️ Conta excluída",
          content: `O usuário ${user.name} (${user.email}) solicitou e confirmou a exclusão da conta. Dados anonimizados conforme LGPD.`,
        }).catch(() => {});
        return { success: true };
      }),
  }),

  // ─── Onboarding ─────────────────────────────────────────────────────────────
  onboarding: router({
    setUserType: protectedProcedure
      .input(z.object({ userType: z.enum(["representative", "company", "manager"]) }))
      .mutation(async ({ ctx, input }) => {
        const type = input.userType === "manager" ? "company" : input.userType;
        await updateUserType(ctx.user.id, type as "representative" | "company");
        return { success: true };
      }),

    completeManagerProfile: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(2),
          cpf: z.string().optional(),
          phone: z.string().optional(),
          region: z.string().min(2),
          segment: z.string().min(2),
          teamSize: z.number().min(0).optional(),
          bio: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        const { managers, users } = await import("../drizzle/schema");
        // Check if manager profile already exists
        const existing = await db!.select().from(managers).where(eq(managers.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          await db!.update(managers).set({ ...input, updatedAt: new Date() }).where(eq(managers.userId, ctx.user.id));
        } else {
          await db!.insert(managers).values({ ...input, userId: ctx.user.id });
        }
        // Update user type to manager
        await db!.update(users).set({ userType: "manager" as any }).where(eq(users.id, ctx.user.id));
        await notifyOwner({
          title: "👤 Novo Gerente Comercial Cadastrado",
          content: `${input.fullName} (${input.region} • ${input.segment}) acabou de completar o cadastro como Gerente Comercial. Telefone: ${input.phone ?? "não informado"}.`,
        });
        return { success: true };
      }),

    completeRepProfile: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(2),
          phone: z.string().optional(),
          region: z.string().min(2),
          segment: z.string().min(2),
          experienceYears: z.number().min(0).max(50),
          bio: z.string().optional(),
          availability: z.enum(["imediata", "30dias", "60dias", "negociavel"]).optional(),
          workModel: z.enum(["exclusivo", "multiplas", "indifferente"]).optional(),
          additionalSegments: z.string().optional(),
          cities: z.string().optional(),
          linkedinUrl: z.string().url().optional().or(z.literal("")),
          cnpj: z.string().optional(),
          coreNumber: z.string().optional(),
          coreState: z.string().optional(),
          coreDocUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getRepresentativeByUserId(ctx.user.id);
        if (existing) {
          await updateRepresentative(existing.id, input);
          return { success: true };
        }
        const { cnpj, coreNumber, coreState, coreDocUrl, ...repData } = input;
        await createRepresentative({ ...repData, userId: ctx.user.id });
        // Update CNPJ and CORE fields if provided
        if (cnpj || coreNumber || coreDocUrl) {
          const db = await getDb();
          const { representatives: repsTable } = await import("../drizzle/schema");
          const newRep = await getRepresentativeByUserId(ctx.user.id);
          if (newRep) {
            await db!.update(repsTable).set({
              cnpj: cnpj ?? null,
              coreNumber: coreNumber ?? null,
              coreState: coreState ?? null,
              coreDocUrl: coreDocUrl ?? null,
            }).where(eq(repsTable.id, newRep.id));
          }
        }
        await updateUserType(ctx.user.id, "representative");
        // Notify owner of new representative registration
        await notifyOwner({
          title: "👤 Novo Representante Cadastrado",
          content: `${input.fullName} (${input.region} • ${input.segment}) acabou de completar o cadastro. Telefone: ${input.phone ?? "não informado"}. Plano: Pendente.`,
        });
        return { success: true };
      }),

    completeCompanyProfile: protectedProcedure
      .input(
        z.object({
          companyName: z.string().min(2),
          cnpj: z.string().optional(),
          segment: z.string().min(2),
          region: z.string().optional(),
          phone: z.string().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getCompanyByUserId(ctx.user.id);
        if (existing) {
          await updateCompany(existing.id, input);
          return { success: true };
        }
        await createCompany({ ...input, userId: ctx.user.id });
        await updateUserType(ctx.user.id, "company");
        // Notify owner of new company registration
        await notifyOwner({
          title: "🏢 Nova Empresa Cadastrada",
          content: `${input.companyName} (${input.segment} • ${input.region ?? "região não informada"}) acabou de completar o cadastro. CNPJ: ${input.cnpj ?? "não informado"}. Telefone: ${input.phone ?? "não informado"}.`,
        });
        return { success: true };
      }),
  }),

  // ─── Representatives ────────────────────────────────────────────────────────
  representatives: router({
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return (await getRepresentativeByUserId(ctx.user.id)) ?? null;
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          fullName: z.string().min(2).optional(),
          phone: z.string().optional(),
          region: z.string().optional(),
          segment: z.string().optional(),
          experienceYears: z.number().min(0).max(50).optional(),
          bio: z.string().optional(),
          availability: z.enum(["imediata", "30dias", "60dias", "negociavel"]).optional(),
          workModel: z.enum(["exclusivo", "multiplas", "indifferente"]).optional(),
          additionalSegments: z.string().optional(),
          cities: z.string().optional(),
          linkedinUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const rep = await getRepresentativeByUserId(ctx.user.id);
        if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil não encontrado" });
        await updateRepresentative(rep.id, input);
        return { success: true };
      }),

    preview: publicProcedure
      .input(z.object({ region: z.string().optional(), segment: z.string().optional(), kycApproved: z.boolean().optional(), coreActive: z.boolean().optional(), availability: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        // Get company subscription tier for plan-based gating
        let subscriptionTier: string | undefined;
        if (ctx.user) {
          const company = await getCompanyByUserId(ctx.user.id);
          subscriptionTier = company?.subscriptionTier ?? 'starter';
        }
        return getRepresentativePreview({ ...input, subscriptionTier });
      }),
    list: publicProcedure
      .input(z.object({ region: z.string().optional(), segment: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return listRepresentatives(input);
      }),
    listForCompany: protectedProcedure
      .input(
        z.object({
          region: z.string().optional(),
          segment: z.string().optional(),
          tier: z.enum(["free", "bronze", "prata", "ouro"]).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(20),
          kycApproved: z.boolean().optional(),
          coreActive: z.boolean().optional(),
          availability: z.string().optional(),
          sortBy: z.enum(["availability", "rating", "tier", "recent"]).optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const isAdmin = ctx.user.role === "admin";
        // Admin can bypass company profile requirement
        let companyId = 0;
        if (!isAdmin) {
          const company = await getCompanyByUserId(ctx.user.id);
          if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "Crie seu perfil de empresa primeiro" });
          companyId = company.id;
        }
        return listRepresentativesForCompany(companyId, { ...input, _isAdmin: isAdmin } as any);
      }),

    countAvailableNow: publicProcedure.query(async () => {
      const db = await getDb();
      const { sql: sqlFn } = await import("drizzle-orm");
      const result = await db!.select({ count: sqlFn<number>`count(*)` })
        .from(representatives)
        .where(eq(representatives.availability, "imediata"));
      return { count: Number(result[0]?.count ?? 0) };
    }),
  }),

  // ─── Companies ──────────────────────────────────────────────────────────────
  companies: router({
    myProfile: protectedProcedure.query(async ({ ctx }) => {
      return (await getCompanyByUserId(ctx.user.id)) ?? null;
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          companyName: z.string().min(2).optional(),
          cnpj: z.string().optional(),
          segment: z.string().optional(),
          region: z.string().optional(),
          phone: z.string().optional(),
          description: z.string().optional(),
          website: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
        await updateCompany(company.id, input);
        return { success: true };
      }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getCompanyById(input.id);
    }),

    // ─── BrasilAPI: consulta pública de CNPJ ─────────────────────────────────
    lookupCnpj: publicProcedure
      .input(z.object({ cnpj: z.string().min(11).max(18) }))
      .query(async ({ input }) => {
        const digits = input.cnpj.replace(/\D/g, "");
        if (digits.length !== 14) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "CNPJ deve ter 14 dígitos" });
        }
        try {
          const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
            signal: AbortSignal.timeout(10000),
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; RepMatch/1.0; +https://repmatch.com.br)",
              "Accept": "application/json",
            },
          });
          if (!res.ok) {
            if (res.status === 404) throw new TRPCError({ code: "NOT_FOUND", message: "CNPJ não encontrado na Receita Federal" });
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao consultar CNPJ" });
          }
          const data = await res.json() as Record<string, unknown>;
          // Map BrasilAPI fields to our model
          const cnaePrincipal = (data.cnae_fiscal_descricao as string) ?? "";
          const logradouro = [data.logradouro, data.numero, data.complemento].filter(Boolean).join(", ");
          const cidade = [data.municipio, data.uf].filter(Boolean).join(" - ");
          return {
            razaoSocial: (data.razao_social as string) ?? "",
            nomeFantasia: (data.nome_fantasia as string) ?? "",
            situacao: (data.descricao_situacao_cadastral as string) ?? "",
            cnae: cnaePrincipal,
            logradouro,
            cidade,
            cep: (data.cep as string) ?? "",
            telefone: (data.ddd_telefone_1 as string) ?? "",
            email: (data.email as string) ?? "",
            uf: (data.uf as string) ?? "",
            municipio: (data.municipio as string) ?? "",
            abertura: (data.data_inicio_atividade as string) ?? "",
            capitalSocial: (data.capital_social as number) ?? 0,
          };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha na consulta à BrasilAPI" });
        }
      }),
  }),

  // ─── Jobs ────────────────────────────────────────────────────────────────────
  jobs: router({
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3),
          description: z.string().optional(),
          commissionPercentage: z.number().min(0).max(100).optional(),
          region: z.string().optional(),
          segment: z.string().optional(),
          minTierRequired: z.enum(["bronze", "prata", "ouro"]).default("bronze"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Crie seu perfil de empresa primeiro" });

        const job = await createJob({
          ...input,
          companyId: company.id,
          commissionPercentage: input.commissionPercentage ? String(input.commissionPercentage) : undefined,
        });

        // Notify owner
        await notifyOwner({ title: "Nova Vaga Publicada", content: `${company.companyName} publicou: ${input.title}` });

        return job;
      }),

    preview: publicProcedure
      .input(z.object({ region: z.string().optional(), segment: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getRepresentativePreview(input);
      }),
    list: publicProcedure
      .input(
        z.object({
          region: z.string().optional(),
          segment: z.string().optional(),
          repTier: z.enum(["free", "bronze", "prata", "ouro"]).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return listJobs(input);
      }),

    listPublic: publicProcedure
      .input(
        z.object({
          region: z.string().optional(),
          segment: z.string().optional(),
          page: z.number().optional(),
          limit: z.number().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        return listPublicJobs(input ?? {});
      }),

    myJobs: protectedProcedure.query(async ({ ctx }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) return [];
      return listJobs({ companyId: company.id });
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getJobById(input.id);
    }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z.enum(["open", "closed", "paused"]).optional(),
          isFeatured: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new TRPCError({ code: "FORBIDDEN" });
        const job = await getJobById(input.id);
        if (!job || job.companyId !== company.id) throw new TRPCError({ code: "FORBIDDEN" });
        const { id, ...data } = input;
        await updateJob(id, data);
        return { success: true };
      }),

    topMatches: protectedProcedure.input(z.object({ jobId: z.number() })).query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) throw new TRPCError({ code: "FORBIDDEN" });
      const job = await getJobById(input.jobId);
      if (!job || job.companyId !== company.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getTopMatchesForJob(input.jobId);
    }),
  }),

  // ─── Applications ────────────────────────────────────────────────────────────
  candidaturas: router({
    submit: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const rep = await getRepresentativeByUserId(ctx.user.id);
        if (!rep) throw new TRPCError({ code: "NOT_FOUND", message: "Complete seu perfil de representante primeiro" });

        const existing = await getExistingApplication(input.jobId, rep.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Você já se candidatou a esta vaga" });

        const job = await getJobById(input.jobId);
        if (!job) throw new TRPCError({ code: "NOT_FOUND", message: "Vaga não encontrada" });

        // Check tier access — new visibility model: free < bronze < prata < ouro
        const tierRank = { free: 0, bronze: 1, prata: 2, ouro: 3 } as const;
        const repTierRank = tierRank[rep.subscriptionTier as keyof typeof tierRank] ?? 0;
        const jobMinRank = tierRank[job.minTierRequired as keyof typeof tierRank] ?? 0;
        if (repTierRank < jobMinRank) {
          const tierNames: Record<string, string> = { bronze: "Bronze (R$9,99)", prata: "Prata (R$19,90)", ouro: "Ouro (R$29,90)" };
          throw new TRPCError({ code: "FORBIDDEN", message: `Esta vaga requer plano ${tierNames[job.minTierRequired] ?? job.minTierRequired} ou superior` });
        }

        const matchScore = calculateMatchScore(rep, job);

        // LLM semantic analysis
        let llmScore = 0;
        let llmAnalysis = "";
        try {
          const llmResponse = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um especialista em recrutamento de representantes comerciais. Analise a compatibilidade entre o perfil do representante e a vaga. Retorne um JSON com: score (0-100) e analysis (string em português, máximo 200 caracteres).`,
              },
              {
                role: "user",
                content: `Vaga: ${job.title} - ${job.description ?? ""} - Região: ${job.region} - Segmento: ${job.segment}
Representante: ${rep.fullName} - Região: ${rep.region} - Segmento: ${rep.segment} - Experiência: ${rep.experienceYears} anos - Bio: ${rep.bio ?? ""}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "match_analysis",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    score: { type: "integer" },
                    analysis: { type: "string" },
                  },
                  required: ["score", "analysis"],
                  additionalProperties: false,
                },
              },
            },
          });
          const rawContent = llmResponse.choices[0]?.message?.content;
          const contentStr = typeof rawContent === 'string' ? rawContent : '{}';
          const parsed = JSON.parse(contentStr);
          llmScore = Math.min(100, Math.max(0, Number(parsed.score ?? 0)));
          llmAnalysis = parsed.analysis ?? "";
        } catch (e) {
          console.warn("LLM match failed, using base score only", e);
        }

        const totalScore = Math.round(matchScore * 0.6 + llmScore * 0.4);

        const application = await createApplication({
          jobId: input.jobId,
          representativeId: rep.id,
          matchScore,
          llmScore,
          totalScore,
          llmAnalysis,
        });

        // Notificar owner sobre nova candidatura
        try {
          const company = await getCompanyById(job.companyId);
          if (company) {
            const scoreTag = totalScore >= 70 ? " ⭐ Alto Score!" : "";
            await notifyOwner({
              title: `Nova Candidatura${scoreTag}`,
              content: `${rep.fullName} se candidatou à vaga "${job.title}" (${company.companyName}) com score ${totalScore}/100`,
            });
          }
        } catch (e) { /* notificação não crítica */ }

        return application;
      }),

    myApplications: protectedProcedure.query(async ({ ctx }) => {
      const rep = await getRepresentativeByUserId(ctx.user.id);
      if (!rep) return [];
      return getApplicationsByRep(rep.id);
    }),

    byJob: protectedProcedure.input(z.object({ jobId: z.number() })).query(async ({ ctx, input }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) throw new TRPCError({ code: "FORBIDDEN" });
      const job = await getJobById(input.jobId);
      if (!job || job.companyId !== company.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getApplicationsByJob(input.jobId);
    }),

    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["pending", "viewed", "accepted", "rejected", "hired"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateApplication(input.id, { status: input.status });

        // Notificar owner quando candidatura é aceita ou rejeitada
        if (input.status === "accepted" || input.status === "rejected" || input.status === "hired") {
          try {
            const db = await getDb();
            if (db) {
              const { applications } = await import('../drizzle/schema');
              const [app] = await db.select().from(applications).where(eq(applications.id, input.id)).limit(1);
              if (app) {
                const db2 = await getDb();
                const rep = db2 ? (await db2.select().from(representatives).where(eq(representatives.id, app.representativeId)).limit(1))[0] : null;
                const job = await getJobById(app.jobId);
                const statusLabel = input.status === "accepted" ? "aceita" : input.status === "hired" ? "contratado" : "rejeitada";
                await notifyOwner({
                  title: `Candidatura ${statusLabel}`,
                  content: `Candidatura de ${rep?.fullName ?? "Rep"} à vaga "${job?.title ?? "vaga"}" foi ${statusLabel} pela empresa.`,
                });
              }
            }
          } catch (e) { /* notificação não crítica */ }
        }

        return { success: true };
      }),
  }),

  // ─── Messages ────────────────────────────────────────────────────────────────
  messages: router({
    send: protectedProcedure
      .input(z.object({ applicationId: z.number(), content: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        return createMessage({ applicationId: input.applicationId, senderUserId: ctx.user.id, content: input.content });
      }),

    list: protectedProcedure.input(z.object({ applicationId: z.number() })).query(async ({ input }) => {
      return getMessagesByApplication(input.applicationId);
    }),
  }),

  // ─── Contacts ────────────────────────────────────────────────────────────────
  contacts: router({
    isUnlocked: protectedProcedure
      .input(z.object({ representativeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) return false;
        return isContactUnlocked(company.id, input.representativeId);
      }),

    unlock: protectedProcedure
      .input(z.object({ representativeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new TRPCError({ code: "NOT_FOUND" });
        const alreadyUnlocked = await isContactUnlocked(company.id, input.representativeId);
        if (alreadyUnlocked) return { success: true, alreadyUnlocked: true };
        // In production, Stripe payment would be triggered here
        await unlockContact({ companyId: company.id, representativeId: input.representativeId, pricePaid: "29.00" });

        // Notificar owner sobre desbloqueio de contato
        try {
          const db = await getDb();
          const rep = db ? (await db.select({ fullName: representatives.fullName }).from(representatives).where(eq(representatives.id, input.representativeId)).limit(1))[0] : null;
          await notifyOwner({
            title: "Contato Desbloqueado",
            content: `${company.companyName} desbloqueou o contato de ${rep?.fullName ?? "representante #" + input.representativeId} (R$ 29,00)`,
          });
        } catch (e) { /* notificação não crítica */ }

        return { success: true, alreadyUnlocked: false };
      }),

    // Promoção: 1 contato grátis por empresa
    freeUnlock: protectedProcedure
      .input(z.object({ representativeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new TRPCError({ code: "NOT_FOUND" });

        // Verificar se já usou o free unlock
        if (company.freeUnlockUsed) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Você já usou seu desbloqueio gratuito. Desbloqueie mais contatos por R$29 cada." });
        }

        // Verificar se já está desbloqueado
        const alreadyUnlocked = await isContactUnlocked(company.id, input.representativeId);
        if (alreadyUnlocked) return { success: true, alreadyUnlocked: true };

        // Desbloquear gratuitamente
        await unlockContact({ companyId: company.id, representativeId: input.representativeId, pricePaid: "0.00" });

        // Marcar que a promoção foi usada
        const db = await getDb();
        if (db) {
          await db.update(companies).set({ freeUnlockUsed: true }).where(eq(companies.id, company.id));
        }

        // Notificar owner
        try {
          const rep = db ? (await db.select({ fullName: representatives.fullName }).from(representatives).where(eq(representatives.id, input.representativeId)).limit(1))[0] : null;
          await notifyOwner({
            title: "🎁 Desbloqueio Gratuito Usado",
            content: `${company.companyName} usou o desbloqueio gratuito para ver o contato de ${rep?.fullName ?? "representante #" + input.representativeId}`,
          });
        } catch (e) { /* notificação não crítica */ }

        return { success: true, alreadyUnlocked: false, wasFree: true };
      }),

    // Verificar status da promoção para a empresa logada
    freeUnlockStatus: protectedProcedure.query(async ({ ctx }) => {
      const company = await getCompanyByUserId(ctx.user.id);
      if (!company) return { available: false, used: false };
      return { available: !company.freeUnlockUsed, used: company.freeUnlockUsed };
    }),
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────────
  admin: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return adminStats();
    }),

    importLogs: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listImportLogs();
    }),

    importData: protectedProcedure
      .input(
        z.object({
          records: z.array(
            z.object({
              type: z.enum(["representative", "company"]),
              fullName: z.string().optional(),
              companyName: z.string().optional(),
              phone: z.string().optional(),
              email: z.string().optional(),
              region: z.string().optional(),
              segment: z.string().optional(),
              cnpj: z.string().optional(),
              experienceYears: z.number().optional(),
            })
          ),
          filename: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

        const log = await createImportLog({
          filename: input.filename ?? "manual_import",
          totalRecords: input.records.length,
          status: "processing",
        });
        if (!log) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        let imported = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const record of input.records) {
          try {
            if (record.type === "representative" && record.fullName) {
              // Create a placeholder user for imported reps
              const repPhone = normalizePhone(record.phone);
              await createRepresentative({
                userId: 0, // placeholder for imported data without OAuth
                fullName: record.fullName,
                phone: repPhone ?? undefined,
                region: record.region,
                segment: record.segment,
                experienceYears: record.experienceYears ?? 0,
              });
              imported++;
            } else if (record.type === "company" && record.companyName) {
              // Enrich with CNPJ data from BrasilAPI
              let enriched: Awaited<ReturnType<typeof enrichCNPJ>> = null;
              if (record.cnpj) {
                enriched = await enrichCNPJ(record.cnpj);
              }
              const compPhone = normalizePhone(record.phone ?? enriched?.phone);
              await createCompany({
                userId: 0, // placeholder for imported data without OAuth
                companyName: enriched?.companyName ?? record.companyName,
                cnpj: record.cnpj,
                phone: compPhone ?? undefined,
                segment: record.segment ?? enriched?.segment,
                region: record.region ?? enriched?.region,
              });
              imported++;
            } else {
              failed++;
              errors.push(`Registro inválido: ${JSON.stringify(record)}`);
            }
          } catch (e) {
            failed++;
            errors.push(`Erro ao importar: ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        await updateImportLog(log.id, {
          importedRecords: imported,
          failedRecords: failed,
          status: failed === input.records.length ? "failed" : "completed",
          errorLog: errors.length > 0 ? errors.slice(0, 50).join("\n") : null,
          completedAt: new Date(),
        });

        return { imported, failed, logId: log.id };
      }),
    listUsers: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().default(""),
        roleFilter: z.string().default(""),
        userTypeFilter: z.string().default(""),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const { limit = 50, offset = 0, search = "", roleFilter = "", userTypeFilter = "" } = input ?? {};
        return listAllUsers(limit, offset, search, roleFilter, userTypeFilter);
      }),
    listEnrichedReps: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(100),
        offset: z.number().min(0).default(0),
        search: z.string().default(""),
        estado: z.string().default(""),
        situacao: z.string().default(""),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        return listRepresentativesWithFiscalId(input.limit, input.offset, input.search, input.estado, input.situacao);
      }),
    promoteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx }) => {
        // Promoção a admin desabilitada via painel — apenas via banco de dados diretamente
        void ctx;
        throw new TRPCError({ code: "FORBIDDEN", message: "Promoção a admin não permitida via painel." });
      }),
    toggleUserActive: protectedProcedure
      .input(z.object({ userId: z.number(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await toggleUserActive(input.userId, input.isActive);
        return { success: true };
      }),
    listPendingPayments: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listPendingPayments();
    }),
    activatePlan: protectedProcedure
      .input(z.object({ repId: z.number(), tier: z.enum(["bronze", "prata", "ouro"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await activateRepPlan(input.repId, input.tier);
        await notifyOwner({
          title: "Plano Ativado Manualmente",
          content: `Admin ativou plano ${input.tier} para representante #${input.repId}`,
        });
        return { success: true };
      }),

    // Admin: crescimento semanal de cadastros (últimas 8 semanas)
    weeklyGrowth: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql } = await import("drizzle-orm");
      const { users } = await import("../drizzle/schema");
      const rows = await db.select({
        week: sql<string>`DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')`,
        total: sql<number>`count(*)`,
        reps: sql<number>`SUM(CASE WHEN user_type = 'representative' THEN 1 ELSE 0 END)`,
        companies: sql<number>`SUM(CASE WHEN user_type = 'company' THEN 1 ELSE 0 END)`,
      })
        .from(users)
        .where(sql`created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)`)
        .groupBy(sql`DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')`)
        .orderBy(sql`1 ASC`);
      return rows.map(r => ({
        week: r.week,
        total: Number(r.total),
        reps: Number(r.reps),
        companies: Number(r.companies),
      }));
    }),

    // Admin: funil de conversão (visitante → cadastro → plano pago)
    conversionFunnel: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql } = await import("drizzle-orm");
      const { users } = await import("../drizzle/schema");
      const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [totalReps] = await db.select({ count: sql<number>`count(*)` }).from(representatives);
      const [paidReps] = await db.select({ count: sql<number>`count(*)` })
        .from(representatives)
        .where(sql`subscription_tier != 'free'`);
      const [totalCompanies] = await db.select({ count: sql<number>`count(*)` }).from(companies);
      const [paidCompanies] = await db.select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(sql`subscription_tier != 'starter'`);
      const total = Number(totalUsers?.count ?? 0);
      const reps = Number(totalReps?.count ?? 0);
      const paid = Number(paidReps?.count ?? 0) + Number(paidCompanies?.count ?? 0);
      const comps = Number(totalCompanies?.count ?? 0);
      return [
        { stage: "Cadastros", value: total, pct: 100 },
        { stage: "Reps Ativos", value: reps, pct: total > 0 ? Math.round(reps / total * 100) : 0 },
        { stage: "Empresas", value: comps, pct: total > 0 ? Math.round(comps / total * 100) : 0 },
        { stage: "Plano Pago", value: paid, pct: total > 0 ? Math.round(paid / total * 100) : 0 },
      ];
    }),

    // Admin: receita semanal via Stripe (últimas 8 semanas)
    weeklyRevenue: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });

      // Helper: gera 8 semanas com zeros
      const emptyWeeks = () => {
        const weeks: { week: string; revenue: number }[] = [];
        for (let i = 7; i >= 0; i--) {
          const d = new Date();
          const day = d.getDay();
          const diff = (day === 0 ? -6 : 1 - day) - i * 7;
          d.setDate(d.getDate() + diff);
          d.setHours(0, 0, 0, 0);
          weeks.push({ week: d.toISOString().split("T")[0], revenue: 0 });
        }
        return weeks;
      };

      try {
        const { MercadoPagoConfig, Payment } = await import("mercadopago");
        const mp = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
        const paymentClient = new Payment(mp);

        // Buscar pagamentos aprovados dos últimos 56 dias
        const since = new Date(Date.now() - 56 * 24 * 3600 * 1000).toISOString();
        const result = await paymentClient.search({
          options: {
            criteria: "desc",
            range: "date_created",
            begin_date: since,
            end_date: new Date().toISOString(),
            status: "approved",
            limit: 200,
          },
        });

        const weekMap: Record<string, number> = {};
        for (const p of (result.results ?? [])) {
          if (!p.date_approved) continue;
          const d = new Date(p.date_approved);
          const day = d.getDay();
          const diff = (day === 0 ? -6 : 1 - day);
          const monday = new Date(d);
          monday.setDate(d.getDate() + diff);
          monday.setHours(0, 0, 0, 0);
          const key = monday.toISOString().split("T")[0];
          weekMap[key] = (weekMap[key] ?? 0) + (p.transaction_amount ?? 0);
        }

        const weeks: { week: string; revenue: number }[] = [];
        for (let i = 7; i >= 0; i--) {
          const d = new Date();
          const day = d.getDay();
          const diff = (day === 0 ? -6 : 1 - day) - i * 7;
          d.setDate(d.getDate() + diff);
          d.setHours(0, 0, 0, 0);
          const key = d.toISOString().split("T")[0];
          weeks.push({ week: key, revenue: Math.round(weekMap[key] ?? 0) });
        }
        return weeks;
      } catch (e) {
        return emptyWeeks();
      }
    }),
    // Admin: diagnóstico de representantes (ver dados brutos)
    diagReps: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select({
        id: representatives.id,
        fullName: representatives.fullName,
        region: representatives.region,
        segment: representatives.segment,
        isActive: representatives.isActive,
        experienceYears: representatives.experienceYears,
        userId: representatives.userId,
      }).from(representatives).limit(20);
      return rows;
    }),
    // Admin: analytics de visitas (Umami)
    siteAnalytics: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(90).default(30) }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const endpoint = process.env.VITE_ANALYTICS_ENDPOINT;
        const websiteId = process.env.VITE_ANALYTICS_WEBSITE_ID;
        const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
        if (!endpoint || !websiteId) return { pageviews: 0, visitors: 0, visits: 0, bounceRate: 0, avgDuration: 0, dailyViews: [] as { date: string; pageviews: number; visitors: number }[] };
        const endAt = Date.now();
        const startAt = endAt - input.days * 24 * 3600 * 1000;
        try {
          const [statsRes, pvRes] = await Promise.all([
            fetch(`${endpoint}/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            }),
            fetch(`${endpoint}/api/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=day&timezone=America%2FSao_Paulo`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            }),
          ]);
          const stats = statsRes.ok ? await statsRes.json() : {};
          const pvData = pvRes.ok ? await pvRes.json() : { pageviews: [], sessions: [] };
          const dailyViews = (pvData.pageviews ?? []).map((p: { x: string; y: number }, i: number) => ({
            date: p.x,
            pageviews: p.y,
            visitors: pvData.sessions?.[i]?.y ?? 0,
          }));
          return {
            pageviews: stats.pageviews?.value ?? 0,
            visitors: stats.visitors?.value ?? 0,
            visits: stats.visits?.value ?? 0,
            bounceRate: stats.bounces?.value ? Math.round((stats.bounces.value / (stats.visits?.value || 1)) * 100) : 0,
            avgDuration: stats.totaltime?.value ? Math.round(stats.totaltime.value / (stats.visits?.value || 1)) : 0,
            dailyViews,
          };
        } catch {
          return { pageviews: 0, visitors: 0, visits: 0, bounceRate: 0, avgDuration: 0, dailyViews: [] as { date: string; pageviews: number; visitors: number }[] };
        }
      }),

    // Admin: corrigir dados dos representantes de teste
    fixTestReps: protectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql } = await import("drizzle-orm");
      await db.execute(sql`UPDATE representatives SET isActive = 1 WHERE userId = 0`);
      await db.execute(sql`UPDATE representatives SET region = 'Nacional (Todo Brasil)', segment = 'Tecnologia', experienceYears = 5 WHERE userId = 0 AND fullName = 'Carlos Silva'`);
      return { success: true };
    }),
  }),

  // ─── KYC / Verificação de Identidade + CORE ────────────────────────────────
  kyc: router({
    // Upload de documento + selfie para verificação
    submitDocuments: protectedProcedure
      .input(z.object({
        documentType: z.enum(["rg", "cnh", "passaporte"]),
        documentBase64: z.string(), // base64 do documento
        selfieBase64: z.string(),   // base64 da selfie
        coreNumber: z.string().optional(),
        coreState: z.string().length(2).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Find representative
        const rep = await db.select().from(representatives).where(eq(representatives.userId, ctx.user.id)).limit(1);
        if (!rep.length) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de representante não encontrado" });

        // Upload document image to S3
        const docBuffer = Buffer.from(input.documentBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const selfieBuffer = Buffer.from(input.selfieBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
        const docKey = `kyc/${ctx.user.id}/document_${Date.now()}.jpg`;
        const selfieKey = `kyc/${ctx.user.id}/selfie_${Date.now()}.jpg`;
        const { url: docUrl } = await storagePut(docKey, docBuffer, "image/jpeg");
        const { url: selfieUrl } = await storagePut(selfieKey, selfieBuffer, "image/jpeg");

        // ─── DeepFace Face Match (foto do documento vs selfie) ───────────────────────────
        let faceMatchScore: string | null = null;
        let faceMatchResult: "match" | "no_match" | "uncertain" | "error" = "error";
        try {
          const faceMatchRes = await fetch("http://localhost:5001/facematch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image1_b64: input.documentBase64,
              image2_b64: input.selfieBase64,
            }),
            signal: AbortSignal.timeout(30000),
          });
          if (faceMatchRes.ok) {
            const fm = await faceMatchRes.json() as { match: boolean; similarity: number; confidence: string; error?: string };
            faceMatchScore = fm.similarity != null ? fm.similarity.toFixed(4) : null;
            if (fm.error) {
              faceMatchResult = "error";
            } else if (fm.similarity >= 0.75) {
              faceMatchResult = "match";
            } else if (fm.similarity >= 0.50) {
              faceMatchResult = "uncertain";
            } else {
              faceMatchResult = "no_match";
            }
          }
        } catch (_fmErr) {
          faceMatchResult = "error";
        }

        // ─── LLM Vision: extração de dados do documento ──────────────────────────────────────────────
        let extractedName: string | null = null;
        let extractedCpf: string | null = null;
        let kycNotes: string | null = null;
        let autoApprove = false;
        try {
          const llmResult = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Você é um sistema de verificação de identidade KYC. Analise o documento e a selfie fornecidos e retorne um JSON com os campos: name (nome completo no documento), cpf (CPF no documento, sem pontuação), faceMatch (true/false se a selfie parece ser a mesma pessoa do documento), documentValid (true/false se o documento parece autêntico e legível), notes (observações em português). Seja conservador: em caso de dúvida, marque documentValid como false.`,
              },
              {
                role: "user",
                content: [
                  { type: "text", text: `Documento tipo: ${input.documentType}. Analise o documento e a selfie:` },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.documentBase64.replace(/^data:image\/\w+;base64,/, "")}` } },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${input.selfieBase64.replace(/^data:image\/\w+;base64,/, "")}` } },
                ],
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "kyc_result",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    cpf: { type: "string" },
                    faceMatch: { type: "boolean" },
                    documentValid: { type: "boolean" },
                    notes: { type: "string" },
                  },
                  required: ["name", "cpf", "faceMatch", "documentValid", "notes"],
                  additionalProperties: false,
                },
              },
            },
          });
          const parsed = JSON.parse(llmResult.choices[0].message.content as string);
          extractedName = parsed.name || null;
          extractedCpf = parsed.cpf || null;
          kycNotes = `IA: faceMatch=${parsed.faceMatch}, docValid=${parsed.documentValid}. ${parsed.notes}`;
          // Auto-approve: IA confirms face match AND document valid
          if (parsed.faceMatch === true && parsed.documentValid === true) {
            autoApprove = true;
          }
        } catch (e) {
          kycNotes = "Erro na análise automática. Requer revisão manual.";
        }

        // Determinar status automático: aprovado pela IA ou aguardando revisão manual
        const autoStatus: "approved" | "pending_review" = autoApprove ? "approved" : "pending_review";
        const reviewedAt = autoApprove ? new Date() : null;

        // Update representative record
        await db.update(representatives)
          .set({
            kycStatus: autoStatus,
            kycDocumentUrl: docUrl,
            kycSelfieUrl: selfieUrl,
            kycDocumentType: input.documentType,
            kycExtractedName: extractedName,
            kycExtractedCpf: extractedCpf,
            kycNotes: kycNotes,
            kycFaceMatchScore: faceMatchScore,
            kycFaceMatchResult: faceMatchResult,
            kycReviewedAt: reviewedAt,
            coreNumber: input.coreNumber || null,
            coreState: input.coreState || null,
          })
          .where(eq(representatives.userId, ctx.user.id));

        if (autoApprove) {
          // Auto-approved: notify the rep and admin
          await notifyOwner({
            title: "✅ KYC Aprovado Automaticamente",
            content: `Representante ${ctx.user.name} (ID ${ctx.user.id}) teve o KYC aprovado automaticamente pela IA. ${kycNotes}`,
          });
        } else {
          // Needs manual review
          await notifyOwner({
            title: "🔍 Nova solicitação de verificação KYC",
            content: `Representante ${ctx.user.name} (ID ${ctx.user.id}) enviou documentos para verificação manual. Notas da IA: ${kycNotes}`,
          });
        }

        return { success: true, status: autoStatus, autoApproved: autoApprove, notes: kycNotes };
      }),

    // Consultar status KYC do representante logado
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const rep = await db
        .select({
          kycStatus: representatives.kycStatus,
          kycDocumentType: representatives.kycDocumentType,
          kycExtractedName: representatives.kycExtractedName,
          kycNotes: representatives.kycNotes,
          kycReviewedAt: representatives.kycReviewedAt,
          coreNumber: representatives.coreNumber,
          coreState: representatives.coreState,
          coreStatus: representatives.coreStatus,
          coreValidUntil: representatives.coreValidUntil,
          coreCheckedAt: representatives.coreCheckedAt,
        })
        .from(representatives)
        .where(eq(representatives.userId, ctx.user.id))
        .limit(1);
      if (!rep.length) throw new TRPCError({ code: "NOT_FOUND" });
      return rep[0];
    }),

    // Consultar CORE pelo número de registro + estado
    lookupCore: protectedProcedure
      .input(z.object({
        coreNumber: z.string().min(1),
        coreState: z.string().length(2),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

        // Try CONFERE public consultation
        let coreStatus: "active" | "inactive" | "not_found" = "not_found";
        let coreValidUntil: string | null = null;
        let coreName: string | null = null;

        try {
          const response = await fetch(
            `https://www.confere.org.br/consultapublica?rdReg=on&txtConsulta=${encodeURIComponent(input.coreNumber)}`,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (compatible; RepMatch/1.0)",
                "Accept": "text/html",
              },
              signal: AbortSignal.timeout(8000),
            }
          );
          const html = await response.text();
          // Parse the response to find registration status
          if (html.toLowerCase().includes("ativo") || html.toLowerCase().includes("regular")) {
            coreStatus = "active";
            // Try to extract validity date
            const validMatch = html.match(/(\d{2}\/\d{2}\/\d{4})/g);
            if (validMatch && validMatch.length > 0) {
              coreValidUntil = validMatch[validMatch.length - 1];
            }
            // Try to extract name
            const nameMatch = html.match(/<td[^>]*>([A-Z\s]{5,60})<\/td>/i);
            if (nameMatch) coreName = nameMatch[1].trim();
          } else if (html.toLowerCase().includes("cancelado") || html.toLowerCase().includes("inativo") || html.toLowerCase().includes("suspenso")) {
            coreStatus = "inactive";
          }
        } catch (e) {
          // If CONFERE is down, mark as pending manual check
          coreStatus = "not_found";
        }

        // Update representative record
        await db.update(representatives)
          .set({
            coreNumber: input.coreNumber,
            coreState: input.coreState.toUpperCase(),
            coreStatus,
            coreValidUntil,
            coreCheckedAt: new Date(),
          })
          .where(eq(representatives.userId, ctx.user.id));

        return { coreStatus, coreValidUntil, coreName };
      }),

    // Admin: listar KYC pendentes
    listPendingKyc: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db
        .select({
          id: representatives.id,
          userId: representatives.userId,
          fullName: representatives.fullName,
          kycStatus: representatives.kycStatus,
          kycDocumentUrl: representatives.kycDocumentUrl,
          kycSelfieUrl: representatives.kycSelfieUrl,
          kycDocumentType: representatives.kycDocumentType,
          kycExtractedName: representatives.kycExtractedName,
          kycExtractedCpf: representatives.kycExtractedCpf,
          kycNotes: representatives.kycNotes,
          coreNumber: representatives.coreNumber,
          coreState: representatives.coreState,
          coreStatus: representatives.coreStatus,
          createdAt: representatives.createdAt,
        })
        .from(representatives)
        .where(eq(representatives.kycStatus, "pending_review"));
    }),

    // Admin: aprovar ou rejeitar KYC
    reviewKyc: protectedProcedure
      .input(z.object({
        representativeId: z.number(),
        decision: z.enum(["approved", "rejected"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.update(representatives)
          .set({
            kycStatus: input.decision,
            kycNotes: input.notes || null,
            kycReviewedAt: new Date(),
          })
          .where(eq(representatives.id, input.representativeId));
        await notifyOwner({
          title: `KYC ${input.decision === 'approved' ? 'Aprovado' : 'Rejeitado'}`,
          content: `Representante #${input.representativeId} teve KYC ${input.decision === 'approved' ? 'aprovado' : 'rejeitado'}${input.notes ? ': ' + input.notes : ''}`,
        });
        return { success: true };
      }),

    // Admin: listar todos os documentos com filtros
    listAllDocuments: protectedProcedure
      .input(z.object({
        status: z.enum(["all", "not_started", "pending_review", "approved", "rejected"]).default("all"),
        type: z.enum(["all", "kyc", "core", "cnpj"]).default("all"),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
        search: z.string().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { sql, like, and, or } = await import("drizzle-orm");
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 20;
        const offset = (page - 1) * limit;
        const conditions: ReturnType<typeof eq>[] = [];
        const status = input?.status ?? "all";
        if (status !== "all") {
          conditions.push(eq(representatives.kycStatus, status as "not_started" | "pending_review" | "approved" | "rejected"));
        }
        if (input?.search) {
          const q = `%${input.search}%`;
          conditions.push(or(
            like(representatives.fullName, q),
            like(representatives.coreNumber, q),
            like(representatives.cnpj, q),
          ) as ReturnType<typeof eq>);
        }
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const [rows, countRows] = await Promise.all([
          db.select({
            id: representatives.id,
            userId: representatives.userId,
            fullName: representatives.fullName,
            phone: representatives.phone,
            segment: representatives.segment,
            region: representatives.region,
            kycStatus: representatives.kycStatus,
            kycDocumentUrl: representatives.kycDocumentUrl,
            kycSelfieUrl: representatives.kycSelfieUrl,
            kycDocumentType: representatives.kycDocumentType,
            kycExtractedName: representatives.kycExtractedName,
            kycExtractedCpf: representatives.kycExtractedCpf,
            kycNotes: representatives.kycNotes,
            kycReviewedAt: representatives.kycReviewedAt,
            coreNumber: representatives.coreNumber,
            coreState: representatives.coreState,
            coreStatus: representatives.coreStatus,
            coreDocUrl: representatives.coreDocUrl,
            coreValidUntil: representatives.coreValidUntil,
            cnpj: representatives.cnpj,
            createdAt: representatives.createdAt,
          })
          .from(representatives)
          .where(where)
          .orderBy(representatives.createdAt)
          .limit(limit)
          .offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(representatives).where(where),
        ]);
        return {
          items: rows,
          total: Number(countRows[0]?.count ?? 0),
          page,
          limit,
          totalPages: Math.ceil(Number(countRows[0]?.count ?? 0) / limit),
        };
      }),

    // Admin: estatísticas de documentos
    documentStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql } = await import("drizzle-orm");
      const [kycStats, coreStats] = await Promise.all([
        db.select({ status: representatives.kycStatus, count: sql<number>`count(*)` })
          .from(representatives).groupBy(representatives.kycStatus),
        db.select({ status: representatives.coreStatus, count: sql<number>`count(*)` })
          .from(representatives).groupBy(representatives.coreStatus),
      ]);
      const kycMap = Object.fromEntries(kycStats.map(r => [r.status, Number(r.count)]));
      const coreMap = Object.fromEntries(coreStats.map(r => [r.status, Number(r.count)]));
      return {
        kyc: {
          not_started: kycMap['not_started'] ?? 0,
          pending_review: kycMap['pending_review'] ?? 0,
          approved: kycMap['approved'] ?? 0,
          rejected: kycMap['rejected'] ?? 0,
        },
        core: {
          not_checked: coreMap['not_checked'] ?? 0,
          active: coreMap['active'] ?? 0,
          inactive: coreMap['inactive'] ?? 0,
          not_found: coreMap['not_found'] ?? 0,
        },
      };
    }),

    // Admin: crescimento semanal de cadastros (últimas 8 semanas)
    weeklyGrowth: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql } = await import("drizzle-orm");
      const { users } = await import("../drizzle/schema");
      const rows = await db.select({
        week: sql<string>`DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')`,
        total: sql<number>`count(*)`,
        reps: sql<number>`SUM(CASE WHEN user_type = 'representative' THEN 1 ELSE 0 END)`,
        companies: sql<number>`SUM(CASE WHEN user_type = 'company' THEN 1 ELSE 0 END)`,
      })
        .from(users)
        .where(sql`created_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)`)
        .groupBy(sql`DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')`)
        .orderBy(sql`1 ASC`);
      return rows.map(r => ({
        week: r.week,
        total: Number(r.total),
        reps: Number(r.reps),
        companies: Number(r.companies),
      }));
    }),

    // Admin: funil de conversão (visitante → cadastro → plano pago)
    conversionFunnel: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { sql } = await import("drizzle-orm");
      const { users } = await import("../drizzle/schema");
      const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [totalReps] = await db.select({ count: sql<number>`count(*)` }).from(representatives);
      const [paidReps] = await db.select({ count: sql<number>`count(*)` })
        .from(representatives)
        .where(sql`subscription_tier != 'free'`);
      const [totalCompanies] = await db.select({ count: sql<number>`count(*)` }).from(companies);
      const [paidCompanies] = await db.select({ count: sql<number>`count(*)` })
        .from(companies)
        .where(sql`subscription_tier != 'starter'`);
      const total = Number(totalUsers?.count ?? 0);
      const reps = Number(totalReps?.count ?? 0);
      const paid = Number(paidReps?.count ?? 0) + Number(paidCompanies?.count ?? 0);
      const comps = Number(totalCompanies?.count ?? 0);
      return [
        { stage: "Cadastros", value: total, pct: 100 },
        { stage: "Reps Ativos", value: reps, pct: total > 0 ? Math.round(reps / total * 100) : 0 },
        { stage: "Empresas", value: comps, pct: total > 0 ? Math.round(comps / total * 100) : 0 },
        { stage: "Plano Pago", value: paid, pct: total > 0 ? Math.round(paid / total * 100) : 0 },
      ];
    }),

    // Admin: validar CORE manualmente
    reviewCore: protectedProcedure
      .input(z.object({
        representativeId: z.number(),
        coreStatus: z.enum(["active", "inactive", "not_found"]),
        coreValidUntil: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.update(representatives)
          .set({
            coreStatus: input.coreStatus,
            coreValidUntil: input.coreValidUntil ?? null,
            coreCheckedAt: new Date(),
          })
          .where(eq(representatives.id, input.representativeId));
        return { success: true };
      }),
  }),

  // ─── CNPJ Base Nacional ───────────────────────────────────────────────────────
  cnpjBase: router({
    search: publicProcedure
      .input(z.object({
        query: z.string().optional(),
        uf: z.string().optional(),
        cnae: z.string().optional(),
        porte: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const { sql, like, and, or } = await import("drizzle-orm");
        const page = input?.page ?? 1;
        const limit = input?.limit ?? 20;
        const offset = (page - 1) * limit;
        const conditions: ReturnType<typeof like>[] = [];
        if (input?.query) {
          const q = `%${input.query}%`;
          conditions.push(or(
            like(cnpjRepresentatives.razaoSocial, q),
            like(cnpjRepresentatives.nomeFantasia, q),
            like(cnpjRepresentatives.cnpj, q),
            like(cnpjRepresentatives.municipio, q),
          ) as ReturnType<typeof like>);
        }
        if (input?.uf) conditions.push(eq(cnpjRepresentatives.uf, input.uf) as ReturnType<typeof like>);
        if (input?.cnae) conditions.push(eq(cnpjRepresentatives.cnaePrincipal, input.cnae) as ReturnType<typeof like>);
        if (input?.porte) conditions.push(eq(cnpjRepresentatives.porte, input.porte) as ReturnType<typeof like>);
        const where = conditions.length > 0 ? and(...conditions) : undefined;
        const [rows, countRows] = await Promise.all([
          db.select().from(cnpjRepresentatives).where(where).limit(limit).offset(offset),
          db.select({ count: sql<number>`count(*)` }).from(cnpjRepresentatives).where(where),
        ]);
        return {
          items: rows,
          total: Number(countRows[0]?.count ?? 0),
          page,
          limit,
          totalPages: Math.ceil(Number(countRows[0]?.count ?? 0) / limit),
        };
      }),
    stats: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { sql } = await import("drizzle-orm");
      const [totalRows, byUf, byCnae, byPorte] = await Promise.all([
        db.select({ count: sql<number>`count(*)` }).from(cnpjRepresentatives),
        db.select({ uf: cnpjRepresentatives.uf, count: sql<number>`count(*)` }).from(cnpjRepresentatives).groupBy(cnpjRepresentatives.uf).orderBy(sql`count(*) desc`).limit(30),
        db.select({ cnae: cnpjRepresentatives.cnaePrincipal, descricao: cnpjRepresentatives.cnaeDescricao, count: sql<number>`count(*)` }).from(cnpjRepresentatives).groupBy(cnpjRepresentatives.cnaePrincipal, cnpjRepresentatives.cnaeDescricao).orderBy(sql`count(*) desc`),
        db.select({ porte: cnpjRepresentatives.porte, count: sql<number>`count(*)` }).from(cnpjRepresentatives).groupBy(cnpjRepresentatives.porte).orderBy(sql`count(*) desc`),
      ]);
      return {
        total: Number(totalRows[0]?.count ?? 0),
        byUf: byUf.map(r => ({ uf: r.uf, count: Number(r.count) })),
        byCnae: byCnae.map(r => ({ cnae: r.cnae, descricao: r.descricao, count: Number(r.count) })),
        byPorte: byPorte.map(r => ({ porte: r.porte, count: Number(r.count) })),
      };
    }),
  }),

  // ─── LGPD / Privacidade ─────────────────────────────────────────────────────
  lgpd: router({
    // Log de consentimento (chamado no onboarding e no cookie banner)
    logConsent: protectedProcedure
      .input(z.object({
        consentType: z.enum(["terms", "privacy", "analytics", "marketing"]),
        action: z.enum(["granted", "revoked"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const ip = (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
          || ctx.req.socket?.remoteAddress
          || null;
        const ua = (ctx.req.headers["user-agent"] as string)?.substring(0, 500) || null;
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        await db.insert(consentLogs).values({
          userId: ctx.user.id,
          consentType: input.consentType,
          action: input.action,
          ipAddress: ip,
          userAgent: ua,
        });
        return { success: true };
      }),

    // Solicitar exclusão de dados (direito ao esquecimento — LGPD Art. 18)
    requestDataDeletion: protectedProcedure
      .input(z.object({ reason: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        // Check if there's already a pending request
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
        const existing = await db
          .select()
          .from(dataDeletionRequests)
          .where(eq(dataDeletionRequests.userId, ctx.user.id))
          .limit(1);
        if (existing.length > 0 && existing[0].status === "pending") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Você já tem uma solicitação de exclusão em andamento." });
        }
        await db.insert(dataDeletionRequests).values({
          userId: ctx.user.id,
          reason: input.reason || null,
          status: "pending",
        });
        // Notify owner
        await notifyOwner({
          title: "Nova solicitação de exclusão de dados (LGPD)",
          content: `Usuário ID ${ctx.user.id} (${ctx.user.name}) solicitou exclusão de dados. Motivo: ${input.reason || "Não informado"}`,
        });
        return { success: true, message: "Solicitação registrada. Seus dados serão excluídos em até 15 dias úteis." };
      }),

    // Listar solicitações de exclusão (admin)
    listDeletionRequests: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      return db.select().from(dataDeletionRequests).orderBy(dataDeletionRequests.requestedAt);
    }),
  }),

  // ─── Manager Credits ────────────────────────────────────────────────────────
  manager: router({
    // Get current credit balance
    getCredits: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [row] = await db.select().from(managerCredits).where(eq(managerCredits.userId, ctx.user.id)).limit(1);
      if (!row) return { credits: 0, totalPurchased: 0, isUnlimited: false, unlimitedExpiresAt: null };
      // Check if unlimited plan has expired
      const isUnlimitedActive = row.isUnlimited && (!row.unlimitedExpiresAt || new Date(row.unlimitedExpiresAt) > new Date());
      return {
        credits: row.credits,
        totalPurchased: row.totalPurchased,
        isUnlimited: isUnlimitedActive,
        unlimitedExpiresAt: row.unlimitedExpiresAt,
      };
    }),

    // Check if a rep is already unlocked by this manager
    isRepUnlocked: protectedProcedure
      .input(z.object({ repId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { unlocked: false };
        const [row] = await db.select()
          .from(managerUnlocks)
          .where(and(eq(managerUnlocks.managerId, ctx.user.id), eq(managerUnlocks.representativeId, input.repId)))
          .limit(1);
        return { unlocked: !!row, unlockedAt: row?.unlockedAt ?? null };
      }),

    // Unlock a rep contact (consumes 1 credit)
    unlockRepContact: protectedProcedure
      .input(z.object({ repId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if already unlocked
        const [existing] = await db.select()
          .from(managerUnlocks)
          .where(and(eq(managerUnlocks.managerId, ctx.user.id), eq(managerUnlocks.representativeId, input.repId)))
          .limit(1);
        if (existing) return { success: true, alreadyUnlocked: true };

        // Check credits
        const [credits] = await db.select().from(managerCredits).where(eq(managerCredits.userId, ctx.user.id)).limit(1);
        const isUnlimitedActive = credits?.isUnlimited && (!credits.unlimitedExpiresAt || new Date(credits.unlimitedExpiresAt) > new Date());

        if (!credits || (!isUnlimitedActive && credits.credits < 1)) {
          throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Créditos insuficientes. Adquira um pacote para desbloquear contatos." });
        }

        // Consume 1 credit (unless unlimited)
        if (!isUnlimitedActive) {
          await db.update(managerCredits)
            .set({ credits: credits.credits - 1 })
            .where(eq(managerCredits.userId, ctx.user.id));
        }

        // Record unlock
        await db.insert(managerUnlocks).values({
          managerId: ctx.user.id,
          representativeId: input.repId,
          productKey: isUnlimitedActive ? "MANAGER_ILIMITADO" : "MANAGER_AVULSO",
        });

        // Get rep details to return
        const [rep] = await db.select().from(representatives).where(eq(representatives.id, input.repId)).limit(1);
        return { success: true, alreadyUnlocked: false, rep };
      }),

    // List all unlocked reps for this manager
    listUnlockedReps: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const unlocks = await db.select()
        .from(managerUnlocks)
        .where(eq(managerUnlocks.managerId, ctx.user.id));
      if (unlocks.length === 0) return [];
      const repIds = unlocks.map(u => u.representativeId);
      const reps = await db.select().from(representatives).where(inArray(representatives.id, repIds));
      return reps.map(r => ({
        ...r,
        unlockedAt: unlocks.find(u => u.representativeId === r.id)?.unlockedAt,
      }));
    }),
  }),

  // ─── Direct Chat (Company ↔ Representative) ─────────────────────────────────
  directChat: router({
    // Send a message (company or rep)
    sendMessage: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        representativeId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        // Verify unlock exists (company must have unlocked the rep)
        const [unlock] = await db.select().from(unlockedContacts)
          .where(and(eq(unlockedContacts.companyId, input.companyId), eq(unlockedContacts.representativeId, input.representativeId)))
          .limit(1);
        if (!unlock) throw new TRPCError({ code: "FORBIDDEN", message: "Contato não desbloqueado" });
        const msg = await createDirectMessage({
          companyId: input.companyId,
          representativeId: input.representativeId,
          senderUserId: ctx.user.id,
          content: input.content,
        });
        return msg;
      }),

    // Get messages for a conversation
    getMessages: protectedProcedure
      .input(z.object({
        companyId: z.number(),
        representativeId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return [];
        // Verify the user is part of this conversation
        const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
        const [rep] = await db.select().from(representatives).where(eq(representatives.id, input.representativeId)).limit(1);
        const isCompany = company?.userId === ctx.user.id;
        const isRep = rep?.userId === ctx.user.id;
        if (!isCompany && !isRep) throw new TRPCError({ code: "FORBIDDEN" });
        // Mark as read
        await markDirectMessagesRead(input.companyId, input.representativeId, isCompany);
        return getDirectMessages(input.companyId, input.representativeId);
      }),

    // List all conversations for the current user
    listConversations: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      // Determine user type
      const [company] = await db.select().from(companies).where(eq(companies.userId, ctx.user.id)).limit(1);
      if (company) return getDirectChatConversations(ctx.user.id, "company");
      const [rep] = await db.select().from(representatives).where(eq(representatives.userId, ctx.user.id)).limit(1);
      if (rep) return getDirectChatConversations(ctx.user.id, "representative");
      return [];
    }),
  }),

  // ─── Oportunidades de Representantes ───────────────────────────────────────────────────────────────────────
  opportunities: router({
    // Listar oportunidades do rep logado
    myList: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { repOpportunities } = await import("../drizzle/schema");
      const rep = await db.select().from(representatives).where(eq(representatives.userId, ctx.user.id)).limit(1);
      if (!rep.length) return [];
      return db.select().from(repOpportunities).where(eq(repOpportunities.representativeId, rep[0].id)).orderBy(repOpportunities.createdAt);
    }),

    // Criar oportunidade
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(3).max(150),
        description: z.string().optional(),
        region: z.string().optional(),
        segment: z.string().optional(),
        availability: z.enum(["imediata", "30dias", "60dias", "negociavel"]).optional(),
        workModel: z.enum(["exclusivo", "multiplas", "indifferente"]).optional(),
        expectedCommission: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { repOpportunities } = await import("../drizzle/schema");
        const rep = await db.select().from(representatives).where(eq(representatives.userId, ctx.user.id)).limit(1);
        if (!rep.length) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil de representante não encontrado" });
        await db.insert(repOpportunities).values({ ...input, representativeId: rep[0].id });
        return { success: true };
      }),

    // Atualizar status (pausar/fechar/reabrir)
    updateStatus: protectedProcedure
      .input(z.object({ id: z.number(), status: z.enum(["active", "paused", "closed"]) }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { repOpportunities } = await import("../drizzle/schema");
        const rep = await db.select().from(representatives).where(eq(representatives.userId, ctx.user.id)).limit(1);
        if (!rep.length) throw new TRPCError({ code: "NOT_FOUND" });
        await db.update(repOpportunities)
          .set({ status: input.status })
          .where(and(eq(repOpportunities.id, input.id), eq(repOpportunities.representativeId, rep[0].id)));
        return { success: true };
      }),

    // Deletar oportunidade
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const { repOpportunities } = await import("../drizzle/schema");
        const rep = await db.select().from(representatives).where(eq(representatives.userId, ctx.user.id)).limit(1);
        if (!rep.length) throw new TRPCError({ code: "NOT_FOUND" });
        await db.delete(repOpportunities)
          .where(and(eq(repOpportunities.id, input.id), eq(repOpportunities.representativeId, rep[0].id)));
        return { success: true };
      }),

    // Listar oportunidades públicas (para empresas e gerentes)
    listPublic: publicProcedure
      .input(z.object({
        region: z.string().optional(),
        segment: z.string().optional(),
        availability: z.enum(["imediata", "30dias", "60dias", "negociavel"]).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { items: [], total: 0 };
        const { repOpportunities } = await import("../drizzle/schema");
        const { sql, like, count } = await import("drizzle-orm");
        const offset = (input.page - 1) * input.limit;
        // Build where conditions
        const conditions = [eq(repOpportunities.status, "active")];
        if (input.region) conditions.push(like(repOpportunities.region, `%${input.region}%`));
        if (input.segment) conditions.push(like(repOpportunities.segment, `%${input.segment}%`));
        if (input.availability) conditions.push(eq(repOpportunities.availability, input.availability));
        const [items, [{ total }]] = await Promise.all([
          db.select({
            id: repOpportunities.id,
            title: repOpportunities.title,
            description: repOpportunities.description,
            region: repOpportunities.region,
            segment: repOpportunities.segment,
            availability: repOpportunities.availability,
            workModel: repOpportunities.workModel,
            expectedCommission: repOpportunities.expectedCommission,
            createdAt: repOpportunities.createdAt,
            repName: representatives.fullName,
            repExperienceYears: representatives.experienceYears,
            repTier: representatives.subscriptionTier,
            repKycStatus: representatives.kycStatus,
            repAvgRating: representatives.averageRating,
          })
            .from(repOpportunities)
            .leftJoin(representatives, eq(repOpportunities.representativeId, representatives.id))
            .where(and(...conditions))
            .orderBy(repOpportunities.createdAt)
            .limit(input.limit)
            .offset(offset),
          db.select({ total: count() }).from(repOpportunities).where(and(...conditions)),
        ]);
        return { items, total };
      }),
  }),

  // ─── Reviews (Empresa avalia representante) ───────────────────────────────
  reviews: router({
    // Empresa submete avaliação
    submit: protectedProcedure
      .input(z.object({
        representativeId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        const { repReviews, companies } = await import('../drizzle/schema');
        const [company] = await db.select({ companyName: companies.companyName })
          .from(companies)
          .where(eq(companies.userId, ctx.user.id))
          .limit(1);
        const [existing] = await db.select({ id: repReviews.id })
          .from(repReviews)
          .where(and(
            eq(repReviews.representativeId, input.representativeId),
            eq(repReviews.companyId, ctx.user.id),
          ))
          .limit(1);
        if (existing) throw new TRPCError({ code: 'CONFLICT', message: 'Você já avaliou este representante.' });
        await db.insert(repReviews).values({
          companyId: ctx.user.id,
          representativeId: input.representativeId,
          rating: input.rating,
          comment: input.comment ?? null,
          companyName: company?.companyName ?? 'Empresa',
        });
        return { success: true };
      }),

    // Buscar avaliações de um representante (pública)
    getByRep: publicProcedure
      .input(z.object({ representativeId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { reviews: [], avgRating: 0, total: 0 };
        const { repReviews } = await import('../drizzle/schema');
        const { avg, count, desc } = await import('drizzle-orm');
        const [reviews, [stats]] = await Promise.all([
          db.select()
            .from(repReviews)
            .where(eq(repReviews.representativeId, input.representativeId))
            .orderBy(desc(repReviews.createdAt))
            .limit(20),
          db.select({ avg: avg(repReviews.rating), total: count() })
            .from(repReviews)
            .where(eq(repReviews.representativeId, input.representativeId)),
        ]);
        return {
          reviews,
          avgRating: stats?.avg ? parseFloat(stats.avg) : 0,
          total: stats?.total ?? 0,
        };
      }),

    // Verificar se empresa já avaliou um rep
    hasReviewed: protectedProcedure
      .input(z.object({ representativeId: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) return { hasReviewed: false };
        const { repReviews } = await import('../drizzle/schema');
        const [existing] = await db.select({ id: repReviews.id })
          .from(repReviews)
          .where(and(
            eq(repReviews.representativeId, input.representativeId),
            eq(repReviews.companyId, ctx.user.id),
          ))
          .limit(1);
        return { hasReviewed: !!existing };
      }),
  }),

  // ─── Unlock Requests (Carrinho de desbloqueios via Pix ou Stripe) ───────────────
  unlockRequests: router({
    // Empresa cria um pedido de desbloqueio (carrinho)
    create: protectedProcedure
      .input(z.object({
        repIds: z.array(z.number()).min(1),
        paymentMethod: z.enum(["pix", "stripe"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { unlockRequests, unlockRequestItems, companies, representatives } = await import('../drizzle/schema');

        // Get company
        const [company] = await db.select({ id: companies.id })
          .from(companies).where(eq(companies.userId, ctx.user.id)).limit(1);
        if (!company) throw new Error("Empresa não encontrada");

        // Price: R$29 per rep
        const PRICE_PER_REP = 29;
        const totalAmount = input.repIds.length * PRICE_PER_REP;

        // Create the request - pass numeric string without currency symbol for MySQL decimal
        const [result] = await db.insert(unlockRequests).values({
          companyId: company.id,
          paymentMethod: input.paymentMethod,
          status: "pending_payment" as const,
          totalAmount: String(totalAmount),
        });
        const requestId = (result as any).insertId as number;

        // Fetch rep names
        const reps = await db.select({ id: representatives.id, fullName: representatives.fullName })
          .from(representatives).where(inArray(representatives.id, input.repIds));
        const repMap = Object.fromEntries(reps.map(r => [r.id, r.fullName]));

        // Insert items
        await db.insert(unlockRequestItems).values(
          input.repIds.map(repId => ({
            unlockRequestId: requestId,
            representativeId: repId,
            repName: repMap[repId] ?? "Representante",
            priceUnit: String(PRICE_PER_REP),
          }))
        );

        // Notify admin
        await notifyOwner({
          title: `🛒 Nova solicitação de desbloqueio (#${requestId})`,
          content: `Empresa ID ${company.id} solicitou desbloqueio de ${input.repIds.length} representante(s) via ${input.paymentMethod.toUpperCase()}. Total: R$${totalAmount}.`,
        });

        return { requestId, totalAmount };
      }),

    // Empresa faz upload do comprovante Pix
    uploadPixProof: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        fileBase64: z.string(),
        fileName: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { unlockRequests, companies } = await import('../drizzle/schema');

        // Verify ownership
        const [company] = await db.select({ id: companies.id })
          .from(companies).where(eq(companies.userId, ctx.user.id)).limit(1);
        if (!company) throw new Error("Empresa não encontrada");

        const [req] = await db.select()
          .from(unlockRequests)
          .where(and(eq(unlockRequests.id, input.requestId), eq(unlockRequests.companyId, company.id)))
          .limit(1);
        if (!req) throw new Error("Solicitação não encontrada");

        // Upload to storage
        const buffer = Buffer.from(input.fileBase64, "base64");
        const key = `pix-proofs/${company.id}/${input.requestId}-${Date.now()}-${input.fileName}`;
        const { url } = await storagePut(key, buffer, input.mimeType);

        // Update request
        await db.update(unlockRequests)
          .set({ pixProofUrl: url, pixProofKey: key, status: "pending_approval" })
          .where(eq(unlockRequests.id, input.requestId));

        // Notify admin
        await notifyOwner({
          title: `📸 Comprovante Pix enviado (#${input.requestId})`,
          content: `Empresa ID ${company.id} enviou comprovante Pix para solicitação #${input.requestId}. Acesse o painel admin para aprovar.`,
        });

        return { success: true, url };
      }),

    // Empresa lista suas solicitações
    myRequests: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const { unlockRequests, unlockRequestItems, companies } = await import('../drizzle/schema');

      const [company] = await db.select({ id: companies.id })
        .from(companies).where(eq(companies.userId, ctx.user.id)).limit(1);
      if (!company) return [];

      const requests = await db.select()
        .from(unlockRequests)
        .where(eq(unlockRequests.companyId, company.id))
        .orderBy(unlockRequests.createdAt);

      const items = requests.length > 0
        ? await db.select().from(unlockRequestItems)
            .where(inArray(unlockRequestItems.unlockRequestId, requests.map(r => r.id)))
        : [];

      return requests.map(r => ({
        ...r,
        items: items.filter(i => i.unlockRequestId === r.id),
      }));
    }),

    // Admin lista todas as solicitações pendentes
    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = await getDb();
      if (!db) return [];
      const { unlockRequests, unlockRequestItems, companies, users } = await import('../drizzle/schema');

      const requests = await db.select({
        id: unlockRequests.id,
        companyId: unlockRequests.companyId,
        paymentMethod: unlockRequests.paymentMethod,
        status: unlockRequests.status,
        totalAmount: unlockRequests.totalAmount,
        pixProofUrl: unlockRequests.pixProofUrl,
        adminNotes: unlockRequests.adminNotes,
        createdAt: unlockRequests.createdAt,
        updatedAt: unlockRequests.updatedAt,
        companyName: companies.companyName,
        companyEmail: users.email,
      })
        .from(unlockRequests)
        .leftJoin(companies, eq(unlockRequests.companyId, companies.id))
        .leftJoin(users, eq(companies.userId, users.id))
        .orderBy(unlockRequests.createdAt);

      const items = requests.length > 0
        ? await db.select().from(unlockRequestItems)
            .where(inArray(unlockRequestItems.unlockRequestId, requests.map(r => r.id)))
        : [];

      return requests.map(r => ({
        ...r,
        items: items.filter(i => i.unlockRequestId === r.id),
      }));
    }),

    // Admin aprova solicitação (desbloqueia todos os reps do pedido)
    approve: protectedProcedure
      .input(z.object({ requestId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { unlockRequests, unlockRequestItems, unlockedContacts } = await import('../drizzle/schema');

        const [req] = await db.select().from(unlockRequests)
          .where(eq(unlockRequests.id, input.requestId)).limit(1);
        if (!req) throw new Error("Solicitação não encontrada");

        const items = await db.select().from(unlockRequestItems)
          .where(eq(unlockRequestItems.unlockRequestId, input.requestId));

        // Unlock each rep
        for (const item of items) {
          const [existing] = await db.select({ id: unlockedContacts.id })
            .from(unlockedContacts)
            .where(and(
              eq(unlockedContacts.companyId, req.companyId),
              eq(unlockedContacts.representativeId, item.representativeId),
            )).limit(1);
          if (!existing) {
            await db.insert(unlockedContacts).values({
              companyId: req.companyId,
              representativeId: item.representativeId,
              pricePaid: item.priceUnit,
            });
          }
        }

        // Update request status
        await db.update(unlockRequests)
          .set({ status: "approved", adminNotes: input.notes ?? null, reviewedBy: ctx.user.id, reviewedAt: new Date() })
          .where(eq(unlockRequests.id, input.requestId));

        return { success: true, unlockedCount: items.length };
      }),

    // Admin rejeita solicitação
    reject: protectedProcedure
      .input(z.object({ requestId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new Error("Forbidden");
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { unlockRequests } = await import('../drizzle/schema');

        await db.update(unlockRequests)
          .set({ status: "rejected", adminNotes: input.notes ?? null, reviewedBy: ctx.user.id, reviewedAt: new Date() })
          .where(eq(unlockRequests.id, input.requestId));

        return { success: true };
      }),
  }),
});
export type AppRouter = typeof appRouter;
