export const LEAD_PACKAGE_QUANTITIES = [1000, 2000] as const;
export type LeadPackageQuantity = (typeof LEAD_PACKAGE_QUANTITIES)[number];
export type LeadPackageAudience = "b2b" | "b2c";

export const DEFAULT_LEAD_PACKAGE_PRICES: Record<LeadPackageAudience, Record<LeadPackageQuantity, number>> = {
  b2b: { 1000: 99, 2000: 179 },
  b2c: { 1000: 79, 2000: 149 },
};

export function isLeadPackageQuantity(value: number): value is LeadPackageQuantity {
  return (LEAD_PACKAGE_QUANTITIES as readonly number[]).includes(value);
}

/** O admin configura o pacote de 2.000; o valor padrão de 1.000 preserva a tabela comercial. */
export function getLeadPackagePrice(audience: LeadPackageAudience, basePriceForTwoThousand: number, quantity: LeadPackageQuantity) {
  const defaultTwoThousand = DEFAULT_LEAD_PACKAGE_PRICES[audience][2000];
  if (basePriceForTwoThousand === defaultTwoThousand) return DEFAULT_LEAD_PACKAGE_PRICES[audience][quantity];
  return Number((basePriceForTwoThousand * quantity / 2000).toFixed(2));
}
