import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) {
    stripe = new Stripe(key);
  }
  return stripe;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export {
  DOT_PACKS,
  CREDIT_PACKS,
  PRO_PRICE_ENV,
  PRO_PRICE_EUR,
  EUR_PER_DOT,
  EUR_PER_CREDIT,
  eurForDots,
  eurForCredits,
  getDotPack,
  getCreditPack,
  getStripePriceId,
  type DotPackId,
  type CreditPackId,
} from "@/lib/pricing";
