export const LEAD_PACKAGE_QUANTITIES = [1000, 2000] as const;
export type LeadPackageQuantity = (typeof LEAD_PACKAGE_QUANTITIES)[number];

export function isLeadPackageQuantity(value: number): value is LeadPackageQuantity {
  return (LEAD_PACKAGE_QUANTITIES as readonly number[]).includes(value);
}

/** O valor configurado pelo admin representa o pacote de 2.000 empresas. */
export function getLeadPackagePrice(basePriceForTwoThousand: number, quantity: LeadPackageQuantity) {
  return Number((basePriceForTwoThousand * quantity / 2000).toFixed(2));
}
