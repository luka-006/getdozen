export const CREDIT_PACKS = [
  {
    id: "credits_1",
    credits: 1,
    amountEur: 1,
    label: "1 credit",
    priceEnv: "STRIPE_PRICE_CREDITS_1",
  },
  {
    id: "credits_5",
    credits: 5,
    amountEur: 5,
    label: "5 credits",
    priceEnv: "STRIPE_PRICE_CREDITS_5",
  },
  {
    id: "credits_15",
    credits: 15,
    amountEur: 11,
    label: "15 credits",
    priceEnv: "STRIPE_PRICE_CREDITS_15",
  },
  {
    id: "credits_25",
    credits: 25,
    amountEur: 19,
    label: "25 credits",
    priceEnv: "STRIPE_PRICE_CREDITS_25",
  },
] as const;

export const PRO_PRICE_EUR = 12;
export const PRO_PRICE_ENV = "STRIPE_PRICE_PRO_MONTHLY";
/** Base rate for custom amounts (packs may discount). */
export const EUR_PER_CREDIT = 1;

export type CreditPackId = (typeof CREDIT_PACKS)[number]["id"];

export function getCreditPack(id: string) {
  return CREDIT_PACKS.find((pack) => pack.id === id) ?? null;
}

export function getStripePriceId(envName: string) {
  const value = process.env[envName]?.trim();
  return value || null;
}

export function eurForCredits(credits: number) {
  const pack = CREDIT_PACKS.find((p) => p.credits === credits);
  if (pack) return pack.amountEur;
  return Math.round(credits * EUR_PER_CREDIT * 100) / 100;
}
