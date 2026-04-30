/**
 * RepMatch — Stripe Products & Prices
 * All amounts in BRL (centavos)
 *
 * MODELO DE VISIBILIDADE DO REPRESENTANTE:
 * - Free:   aparece no fim da lista, sem badge
 * - Bronze: R$9,99/mês  — aparece na lista normal
 * - Prata:  R$19,90/mês — aparece em destaque (badge Prata)
 * - Ouro:   R$29,90/mês — aparece primeiro, badge Ouro, card destacado
 */
export const STRIPE_PRODUCTS = {
  // ─── Representante Plans (Visibilidade) ────────────────────────────────────
  REP_BRONZE: {
    name: "RepMatch Bronze — Representante",
    description: "Apareça na lista de representantes para empresas. Perfil visível com badge Bronze.",
    priceAmount: 999,   // R$ 9,99
    currency: "brl",
    interval: "month" as const,
    tier: "bronze" as const,
    userType: "representative" as const,
  },
  REP_PRATA: {
    name: "RepMatch Prata — Representante",
    description: "Perfil em destaque com badge Prata. Aparece antes dos Bronze na busca das empresas.",
    priceAmount: 1990,  // R$ 19,90
    currency: "brl",
    interval: "month" as const,
    tier: "prata" as const,
    userType: "representative" as const,
  },
  REP_OURO: {
    name: "RepMatch Ouro — Representante",
    description: "Máxima visibilidade: aparece primeiro na busca, card destacado em verde, badge Ouro.",
    priceAmount: 2990,  // R$ 29,90
    currency: "brl",
    interval: "month" as const,
    tier: "ouro" as const,
    userType: "representative" as const,
  },
  // ─── Empresa Plans ─────────────────────────────────────────────────────────
  COMPANY_STARTER: {
    name: "RepMatch Starter — Empresa",
    description: "3 vagas ativas, acesso a reps Bronze+, desbloqueio de até 5 contatos/mês",
    priceAmount: 4900, // R$ 49,00
    currency: "brl",
    interval: "month" as const,
    tier: "starter" as const,
    userType: "company" as const,
  },
  COMPANY_PRO: {
    name: "RepMatch Pro — Empresa",
    description: "10 vagas ativas, acesso a todos os reps, match por IA, 15 desbloqueos/mês",
    priceAmount: 14900, // R$ 149,00
    currency: "brl",
    interval: "month" as const,
    tier: "pro" as const,
    userType: "company" as const,
  },
  COMPANY_ENTERPRISE: {
    name: "RepMatch Enterprise — Empresa",
    description: "Vagas ilimitadas, reps Ouro em destaque, desbloqueos ilimitados, gerente dedicado",
    priceAmount: 39900, // R$ 399,00
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
