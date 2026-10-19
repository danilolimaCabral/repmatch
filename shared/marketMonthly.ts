export const MARKET_MONTHLY_DURATION_DAYS = 30;

export const MARKET_MONTHLY_PLANS = [
  { selectionLimit: 100, price: 99, label: "Essencial", description: "Até 100 empresas salvas por mês" },
  { selectionLimit: 250, price: 299, label: "Profissional", description: "Até 250 empresas salvas por mês" },
  { selectionLimit: 0, price: 499, label: "Ilimitado", description: "Pesquisa e exportação sem limite por 30 dias" },
] as const;

export type MarketMonthlySelectionLimit = (typeof MARKET_MONTHLY_PLANS)[number]["selectionLimit"];

export function getMarketMonthlyPlan(selectionLimit: number) {
  return MARKET_MONTHLY_PLANS.find((plan) => plan.selectionLimit === selectionLimit);
}
