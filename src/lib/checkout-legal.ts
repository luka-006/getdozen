import { SITE_ORIGIN } from "@/lib/app-url";
import { LEGAL_PATHS } from "@/lib/legal";

export const PAYMENT_TERMS_PATH = LEGAL_PATHS.paymentTerms;
export const PAYMENT_TERMS_URL = `${SITE_ORIGIN}${PAYMENT_TERMS_PATH}`;
export const TERMS_URL = `${SITE_ORIGIN}${LEGAL_PATHS.terms}`;

/** Hosted Checkout — custom_text may be stripped by older Stripe account settings. */
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
    custom_text: {
      terms_of_service_acceptance: {
        message: `I agree to the [Payment terms](${PAYMENT_TERMS_URL}) and [Terms of use](${TERMS_URL})`,
      },
    },
  };
}
