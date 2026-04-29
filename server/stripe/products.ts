/**
 * RepMatch — Stripe Products & Prices
 * All amounts in BRL (centavos)
 */

export const STRIPE_PRODUCTS = {
  // ─── Representante Plans ───────────────────────────────────────────────────
  REP_PREMIUM: {
    name: "RepMatch Premium — Representante",
    description: "Acesso a vagas Gold, perfil em destaque e análise de match por IA",
    priceAmount: 1900, // R$ 19,00
    currency: "brl",
    interval: "month" as const,
    tier: "premium" as const,
    userType: "representative" as const,
  },
  REP_ELITE: {
    name: "RepMatch Elite — Representante",
    description: "Acesso a TODAS as vagas incluindo Platinum, prioridade nas candidaturas",
    priceAmount: 4900, // R$ 49,00
    currency: "brl",
    interval: "month" as const,
    tier: "elite" as const,
    userType: "representative" as const,
  },
  // ─── Empresa Plans ─────────────────────────────────────────────────────────
  COMPANY_STARTER: {
    name: "RepMatch Starter — Empresa",
    description: "3 vagas ativas, acesso a reps Free, ranking Bronze",
    priceAmount: 9900, // R$ 99,00
    currency: "brl",
    interval: "month" as const,
    tier: "starter" as const,
    userType: "company" as const,
  },
  COMPANY_PRO: {
    name: "RepMatch Pro — Empresa",
    description: "10 vagas ativas, acesso a reps Premium, ranking Gold, match por IA",
    priceAmount: 29900, // R$ 299,00
    currency: "brl",
    interval: "month" as const,
    tier: "pro" as const,
    userType: "company" as const,
  },
  COMPANY_ENTERPRISE: {
    name: "RepMatch Enterprise — Empresa",
    description: "Vagas ilimitadas, acesso a reps Elite, ranking Platinum, gerente dedicado",
    priceAmount: 99900, // R$ 999,00
    currency: "brl",
    interval: "month" as const,
    tier: "enterprise" as const,
    userType: "company" as const,
  },
  // ─── One-time charges ──────────────────────────────────────────────────────
  UNLOCK_CONTACT: {
    name: "Contato Desbloqueado",
    description: "Desbloqueie o contato completo de um representante",
    priceAmount: 2900, // R$ 29,00
    currency: "brl",
    interval: null,
    tier: null,
    userType: "company" as const,
  },
  FEATURED_JOB: {
    name: "Vaga em Destaque",
    description: "Destaque sua vaga por 30 dias para atrair mais candidatos",
    priceAmount: 4900, // R$ 49,00
    currency: "brl",
    interval: null,
    tier: null,
    userType: "company" as const,
  },
} as const;

export type ProductKey = keyof typeof STRIPE_PRODUCTS;
