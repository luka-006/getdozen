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
  CREDIT_PACKS,
  PRO_PRICE_ENV,
  PRO_PRICE_EUR,
  EUR_PER_CREDIT,
  eurForCredits,
  getCreditPack,
  getStripePriceId,
  type CreditPackId,
} from "@/lib/pricing";
