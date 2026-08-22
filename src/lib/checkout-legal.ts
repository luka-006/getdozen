import { SITE_ORIGIN } from "@/lib/app-url";

export const PAYMENT_TERMS_PATH = "/terms/payment";
export const PAYMENT_TERMS_URL = `${SITE_ORIGIN}${PAYMENT_TERMS_PATH}`;

/** Hosted Checkout only — no custom_text (Managed Payments rejects it). */
export function stripeCheckoutLegal() {
  return {
    branding_settings: {
      display_name: "Dozen",
    },
    managed_payments: {
      enabled: false as const,
    },
    consent_collection: {
      terms_of_service: "required" as const,
    },
  };
}
