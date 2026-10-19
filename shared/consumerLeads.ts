export const CONSUMER_LEAD_PACKAGE_QUANTITIES = [50, 100] as const;
export type ConsumerLeadPackageQuantity = (typeof CONSUMER_LEAD_PACKAGE_QUANTITIES)[number];

export const CONSUMER_LEAD_PACKAGE_PRICES: Record<ConsumerLeadPackageQuantity, number> = {
  50: 99,
  100: 199,
};

export const CONSUMER_LEAD_MONTHLY_PRICE = 599;
export const CONSUMER_LEAD_MONTHLY_SELECTION_LIMIT = 500;
export const CONSUMER_LEAD_MONTHLY_DURATION_DAYS = 30;
// Aliases temporários para não quebrar pedidos ou integrações já gravados.
export const CONSUMER_LEAD_UNLIMITED_MONTHLY_PRICE = CONSUMER_LEAD_MONTHLY_PRICE;
export const CONSUMER_LEAD_UNLIMITED_DURATION_DAYS = CONSUMER_LEAD_MONTHLY_DURATION_DAYS;

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
