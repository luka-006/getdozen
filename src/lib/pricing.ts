export const CREDIT_PACKS = [
  { id: "credits_5", credits: 5, amountEur: 15, label: "5 credits" },
  { id: "credits_10", credits: 10, amountEur: 28, label: "10 credits" },
] as const;

export const PRO_PRICE_EUR = 12;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function getCreditPack(id: string) {
  return CREDIT_PACKS.find((pack) => pack.id === id) ?? null;
}
