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
} from "./db";
import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { consentLogs, dataDeletionRequests, representatives } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";

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
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("rm_session", { path: "/", maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Onboarding ─────────────────────────────────────────────────────────────
  onboarding: router({
    setUserType: protectedProcedure
      .input(z.object({ userType: z.enum(["representative", "company"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserType(ctx.user.id, input.userType);
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
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await getRepresentativeByUserId(ctx.user.id);
        if (existing) {
          await updateRepresentative(existing.id, input);
          return { success: true };
        }
        await createRepresentative({ ...input, userId: ctx.user.id });
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
      .input(z.object({ region: z.string().optional(), segment: z.string().optional(), kycApproved: z.boolean().optional(), coreActive: z.boolean().optional() }).optional())
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
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const company = await getCompanyByUserId(ctx.user.id);
        if (!company) throw new TRPCError({ code: "FORBIDDEN", message: "Crie seu perfil de empresa primeiro" });
        return listRepresentativesForCompany(company.id, input);
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

        // Notify company if high score
        if (totalScore >= 70) {
          const company = await getCompanyById(job.companyId);
          if (company) {
            await notifyOwner({
              title: "Candidato de Alto Score!",
              content: `${rep.fullName} se candidatou à vaga "${job.title}" com score ${totalScore}/100`,
            });
          }
        }

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
        return { success: true, alreadyUnlocked: false };
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
    listUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return listAllUsers(100);
    }),
    promoteUser: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await promoteToAdmin(input.userId);
        return { success: true };
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

        // Use LLM Vision to extract data from document and compare with selfie
        let extractedName: string | null = null;
        let extractedCpf: string | null = null;
        let kycNotes: string | null = null;

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
        } catch (e) {
          kycNotes = "Erro na análise automática. Requer revisão manual.";
        }

        // Update representative record
        await db.update(representatives)
          .set({
            kycStatus: "pending_review",
            kycDocumentUrl: docUrl,
            kycSelfieUrl: selfieUrl,
            kycDocumentType: input.documentType,
            kycExtractedName: extractedName,
            kycExtractedCpf: extractedCpf,
            kycNotes: kycNotes,
            coreNumber: input.coreNumber || null,
            coreState: input.coreState || null,
          })
          .where(eq(representatives.userId, ctx.user.id));

        // Notify admin
        await notifyOwner({
          title: "Nova solicitação de verificação KYC",
          content: `Representante ${ctx.user.name} (ID ${ctx.user.id}) enviou documentos para verificação. Notas da IA: ${kycNotes}`,
        });

        return { success: true, status: "pending_review", notes: kycNotes };
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
        return { success: true };
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
});
export type AppRouter = typeof appRouter;
