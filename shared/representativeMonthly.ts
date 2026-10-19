export const REPRESENTATIVE_MONTHLY_DURATION_DAYS = 30;

export const REPRESENTATIVE_MONTHLY_PLANS = [
  { unlockLimit: 20, price: 99, label: "Essencial" },
  { unlockLimit: 50, price: 299, label: "Profissional" },
  { unlockLimit: 100, price: 499, label: "Escala" },
] as const;

export type RepresentativeMonthlyUnlockLimit = (typeof REPRESENTATIVE_MONTHLY_PLANS)[number]["unlockLimit"];

export const REPRESENTATIVE_MONTHLY_PRICE = 499;
export const REPRESENTATIVE_MONTHLY_UNLOCK_LIMIT = 100;

export function getRepresentativeMonthlyPlan(unlockLimit: number) {
  return REPRESENTATIVE_MONTHLY_PLANS.find((plan) => plan.unlockLimit === unlockLimit);
}
