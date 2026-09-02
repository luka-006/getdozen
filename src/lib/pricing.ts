/** @deprecated use dots — legacy Stripe pack ids still resolve. */
const LEGACY_DOT_PACK_IDS: Record<string, string> = {
  credits_1: "dots_1",
  credits_5: "dots_5",
  credits_15: "dots_15",
  credits_25: "dots_25",
};

export function normalizeDotPackId(packId: string): string {
  return LEGACY_DOT_PACK_IDS[packId] ?? packId;
}

export const DOT_PACKS = [
  {
    id: "dots_1",
    dots: 1,
    amountEur: 1,
    label: "1 Dot",
    priceEnv: "STRIPE_PRICE_DOTS_1",
    legacyPriceEnv: "STRIPE_PRICE_CREDITS_1",
  },
  {
    id: "dots_5",
    dots: 5,
    amountEur: 5,
    label: "5 Dots",
    priceEnv: "STRIPE_PRICE_DOTS_5",
    legacyPriceEnv: "STRIPE_PRICE_CREDITS_5",
  },
  {
    id: "dots_15",
    dots: 15,
    amountEur: 11,
    label: "15 Dots",
    priceEnv: "STRIPE_PRICE_DOTS_15",
    legacyPriceEnv: "STRIPE_PRICE_CREDITS_15",
  },
  {
    id: "dots_25",
    dots: 25,
    amountEur: 19,
    label: "25 Dots",
    priceEnv: "STRIPE_PRICE_DOTS_25",
    legacyPriceEnv: "STRIPE_PRICE_CREDITS_25",
  },
] as const;

/** @deprecated alias — use DOT_PACKS */
export const CREDIT_PACKS = DOT_PACKS.map((pack) => ({
  ...pack,
  credits: pack.dots,
}));

export const PRO_PRICE_EUR = 12;
export const PRO_PRICE_ENV = "STRIPE_PRICE_PRO_MONTHLY";
/** Base rate for custom amounts (packs may discount). */
export const EUR_PER_DOT = 1;
/** @deprecated use EUR_PER_DOT */
export const EUR_PER_CREDIT = EUR_PER_DOT;
export const BOOST_PRICE_EUR = 5;

export type DotPackId = (typeof DOT_PACKS)[number]["id"];
/** @deprecated use DotPackId */
export type CreditPackId = DotPackId;

export function getDotPack(id: string) {
  const normalized = normalizeDotPackId(id);
  return DOT_PACKS.find((pack) => pack.id === normalized) ?? null;
}

/** @deprecated use getDotPack */
export const getCreditPack = getDotPack;

export function getStripePriceId(envName: string, legacyEnvName?: string) {
  const value = process.env[envName]?.trim();
  if (value) return value;
  if (legacyEnvName) {
    const legacy = process.env[legacyEnvName]?.trim();
    if (legacy) return legacy;
  }
  return null;
}

export function eurForDots(dots: number) {
  const pack = DOT_PACKS.find((p) => p.dots === dots);
  if (pack) return pack.amountEur;
  return Math.round(dots * EUR_PER_DOT * 100) / 100;
}

/** @deprecated use eurForDots */
export const eurForCredits = eurForDots;

export type DotOffer = {
  packId: string;
  dots: number;
  amountCents: number;
};

/** @deprecated use DotOffer */
export type CreditOffer = DotOffer & { credits: number };

const CUSTOM_PACK = /^custom_(\d+)$/;
const MAX_CUSTOM_DOTS = 500;

/** Server-only catalog lookup. Never trust a client-supplied dot count. */
export function resolveDotOffer(packId: string): DotOffer | null {
  const named = getDotPack(packId);
  if (named) {
    return {
      packId: named.id,
      dots: named.dots,
      amountCents: Math.round(named.amountEur * 100),
    };
  }

  const custom = normalizeDotPackId(packId).match(CUSTOM_PACK);
  if (!custom) return null;
  const dots = Number(custom[1]);
  if (!Number.isInteger(dots) || dots < 1 || dots > MAX_CUSTOM_DOTS) {
    return null;
  }
  return {
    packId: `custom_${dots}`,
    dots,
    amountCents: Math.round(eurForDots(dots) * 100),
  };
}

/** @deprecated use resolveDotOffer */
export function resolveCreditOffer(packId: string): CreditOffer | null {
  const offer = resolveDotOffer(packId);
  if (!offer) return null;
  return { ...offer, credits: offer.dots };
}

/**
 * Resolve a named dot pack from a paid Checkout amount (Payment Links omit pack_id).
 * Only matches fixed catalog packs — custom amounts need metadata.
 */
export function resolveDotOfferByAmount(amountCents: number): DotOffer | null {
  if (!Number.isInteger(amountCents) || amountCents <= 0) return null;
  for (const pack of DOT_PACKS) {
    const cents = Math.round(pack.amountEur * 100);
    if (cents === amountCents) {
      return {
        packId: pack.id,
        dots: pack.dots,
        amountCents: cents,
      };
    }
  }
  return null;
}

/** @deprecated use resolveDotOfferByAmount */
export const resolveCreditOfferByAmount = resolveDotOfferByAmount;

export function proAmountCents() {
  return Math.round(PRO_PRICE_EUR * 100);
}

export function boostAmountCents() {
  return Math.round(BOOST_PRICE_EUR * 100);
}
