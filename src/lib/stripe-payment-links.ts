export const CREDIT_PAYMENT_LINKS: Record<string, string> = {
  credits_1: "https://buy.stripe.com/dRm3cxfFxb4HdwV2RfdIA01",
  credits_5: "https://buy.stripe.com/8x29AV50T1u7gJ7ezXdIA02",
  credits_15: "https://buy.stripe.com/cNi5kFctl4GjakJgI5dIA03",
  credits_25: "https://buy.stripe.com/aFa9AVfFx4Gj50p0J7dIA04",
};

export const PRO_PAYMENT_LINK =
  "https://buy.stripe.com/14AbJ350T5KnboN63rdIA05";

export function stripePaymentLinkUrl(
  base: string,
  opts: { profileId: string; email: string },
) {
  const url = new URL(base);
  url.searchParams.set("client_reference_id", opts.profileId);
  url.searchParams.set("prefilled_email", opts.email);
  return url.toString();
}
