export const CONSUMER_LEAD_PACKAGE_QUANTITIES = [50, 100] as const;
export type ConsumerLeadPackageQuantity = (typeof CONSUMER_LEAD_PACKAGE_QUANTITIES)[number];

export const CONSUMER_LEAD_PACKAGE_PRICES: Record<ConsumerLeadPackageQuantity, number> = {
  50: 99,
  100: 199,
};

export const CONSUMER_LEAD_MONTHLY_DURATION_DAYS = 30;

/** Faixas mensais B2C: preço e limite são resolvidos somente por esta fonte. */
export const CONSUMER_LEAD_MONTHLY_PLANS = [
  { name: "Essencial", selectionLimit: 100, price: 99 },
  { name: "Profissional", selectionLimit: 250, price: 299 },
  { name: "Escala", selectionLimit: 500, price: 499 },
] as const;

export const CONSUMER_LEAD_MONTHLY_SELECTION_LIMITS = [100, 250, 500] as const;
export type ConsumerLeadMonthlySelectionLimit = (typeof CONSUMER_LEAD_MONTHLY_SELECTION_LIMITS)[number];
export type ConsumerLeadMonthlyPlan = (typeof CONSUMER_LEAD_MONTHLY_PLANS)[number];

export function getConsumerLeadMonthlyPlan(selectionLimit: ConsumerLeadMonthlySelectionLimit): ConsumerLeadMonthlyPlan {
  const plan = CONSUMER_LEAD_MONTHLY_PLANS.find((item) => item.selectionLimit === selectionLimit);
  if (!plan) throw new Error("Faixa mensal B2C inválida.");
  return plan;
}

export function isConsumerLeadPackageQuantity(value: number): value is ConsumerLeadPackageQuantity {
  return (CONSUMER_LEAD_PACKAGE_QUANTITIES as readonly number[]).includes(value);
}

export function getConsumerLeadPackagePrice(quantity: ConsumerLeadPackageQuantity) {
  return CONSUMER_LEAD_PACKAGE_PRICES[quantity];
}

export function formatBrazilianConsumerPhone(raw: string | null | undefined) {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  if (digits.startsWith("0") && (digits.length === 11 || digits.length === 12)) digits = digits.slice(1);
  return digits.length === 10 || digits.length === 11 ? `+55${digits}` : null;
}

export function isValidConsumerEmail(raw: string | null | undefined) {
  const email = (raw ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
