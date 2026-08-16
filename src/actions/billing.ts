"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canPurchaseCredits } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  getStripePriceId,
  PRO_PRICE_ENV,
  PRO_PRICE_EUR,
  stripeConfigured,
} from "@/lib/stripe";
import { resolveCreditOffer } from "@/lib/pricing";
import { resolveAppUrlFromHeaders } from "@/lib/app-url";
import { safeInternalPath } from "@/lib/safe-path";

function checkoutIntegrationId(flow: string) {
  const suffix = Array.from({ length: 8 }, () =>
    String.fromCharCode(97 + Math.floor(Math.random() * 26)),
  ).join("");
  return `dozen_${flow}_${suffix}`;
}

async function siteUrl() {
  return resolveAppUrlFromHeaders();
}

async function ensureStripeCustomer(profile: {
  id: string;
  email: string;
  display_name: string;
  stripe_customer_id?: string | null;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe not configured");

  if (profile.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email: profile.email,
    name: profile.display_name,
    metadata: { profile_id: profile.id },
  });

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", profile.id);

  return customer.id;
}

export async function purchaseCreditPack(formData: FormData) {
  const profile = await requireProfile();
  const offer = resolveCreditOffer(String(formData.get("pack_id") ?? ""));

  if (!offer) {
    redirect(`/wallet?error=${encodeURIComponent("Unknown credit pack")}`);
  }

  const check = canPurchaseCredits(profile, offer.credits);
  if (!check.ok) {
    redirect(`/wallet?error=${encodeURIComponent(check.error)}`);
  }

  if (!stripeConfigured()) {
    redirect(`/wallet?error=${encodeURIComponent("Stripe not configured yet. Add STRIPE_SECRET_KEY to .env.local.")}`);
  }

  const stripe = getStripe()!;
  const customerId = await ensureStripeCustomer(profile as typeof profile & { stripe_customer_id?: string | null });
  const baseUrl = await siteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: profile.id,
    integration_identifier: checkoutIntegrationId("credits"),
    metadata: {
      kind: "credits",
      profile_id: profile.id,
      pack_id: offer.packId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: offer.amountCents,
          product_data: {
            name: `Dozen ${offer.credits} credit${offer.credits === 1 ? "" : "s"}`,
            description: `${offer.credits} credits`,
          },
        },
      },
    ],
    success_url: `${baseUrl}/wallet?message=${encodeURIComponent("Checkout finished. Credits land after Stripe confirms.")}`,
    cancel_url: `${baseUrl}/wallet?error=${encodeURIComponent("Checkout cancelled")}`,
  });

  if (!session.url) {
    redirect(`/wallet?error=${encodeURIComponent("Could not start checkout")}`);
  }

  redirect(session.url);
}

export async function purchaseCreditsAmount(formData: FormData) {
  const profile = await requireProfile();
  const returnTo = safeInternalPath(formData.get("return_to"), "/wallet");
  const credits = Math.ceil(Number(formData.get("credits") ?? 0));

  if (!Number.isFinite(credits) || credits < 1 || credits > 500) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Pick a valid credit amount")}`);
  }

  const check = canPurchaseCredits(profile, credits);
  if (!check.ok) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(check.error)}`);
  }

  if (!stripeConfigured()) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Stripe not configured yet")}`);
  }

  const stripe = getStripe()!;
  const customerId = await ensureStripeCustomer(
    profile as typeof profile & { stripe_customer_id?: string | null },
  );

  const offer = resolveCreditOffer(`custom_${credits}`);
  if (!offer) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Pick a valid credit amount")}`);
  }
  const baseUrl = await siteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: profile.id,
    integration_identifier: checkoutIntegrationId("credits_custom"),
    metadata: {
      kind: "credits",
      profile_id: profile.id,
      pack_id: offer.packId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: offer.amountCents,
          product_data: {
            name: `Dozen ${offer.credits} credit${offer.credits === 1 ? "" : "s"}`,
            description: `${offer.credits} credits`,
          },
        },
      },
    ],
    success_url: `${baseUrl}/wallet?message=${encodeURIComponent("Checkout finished. Credits land after Stripe confirms.")}`,
    cancel_url: `${baseUrl}${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Checkout cancelled")}`,
  });

  if (!session.url) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent("Could not start checkout")}`);
  }

  redirect(session.url);
}

export async function startProSubscription() {
  const profile = await requireProfile();

  if (profile.is_pro) {
    redirect(`/wallet?message=${encodeURIComponent("You already have Pro")}`);
  }

  if (!stripeConfigured()) {
    redirect(`/wallet?error=${encodeURIComponent("Stripe not configured yet. Add STRIPE_SECRET_KEY to .env.local.")}`);
  }

  const stripe = getStripe()!;
  const customerId = await ensureStripeCustomer(profile as typeof profile & { stripe_customer_id?: string | null });

  const proPriceId = getStripePriceId(PRO_PRICE_ENV);
  const baseUrl = await siteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: profile.id,
    integration_identifier: checkoutIntegrationId("pro"),
    metadata: {
      kind: "pro",
      profile_id: profile.id,
    },
    subscription_data: {
      metadata: {
        profile_id: profile.id,
      },
    },
    line_items: [
      proPriceId
        ? { quantity: 1, price: proPriceId }
        : {
            quantity: 1,
            price_data: {
              currency: "eur",
              unit_amount: Math.round(PRO_PRICE_EUR * 100),
              recurring: { interval: "month" },
              product_data: {
                name: "Dozen Pro",
                description:
                  "5 concurrent tester slots, board boost, 48-hour review guarantee",
              },
            },
          },
    ],
    success_url: `${baseUrl}/wallet?message=${encodeURIComponent("Pro is activating. Refresh in a moment.")}`,
    cancel_url: `${baseUrl}/wallet?error=${encodeURIComponent("Checkout cancelled")}`,
  });

  if (!session.url) {
    redirect(`/wallet?error=${encodeURIComponent("Could not start checkout")}`);
  }

  redirect(session.url);
}

export async function openBillingPortal() {
  const profile = await requireProfile();
  if (!stripeConfigured()) {
    redirect(`/wallet?error=${encodeURIComponent("Stripe not configured")}`);
  }

  const stripe = getStripe()!;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", profile.id)
    .single();

  if (!data?.stripe_customer_id) {
    redirect(`/wallet?error=${encodeURIComponent("No billing customer yet")}`);
  }

  const baseUrl = await siteUrl();
  const portal = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${baseUrl}/wallet`,
  });

  redirect(portal.url);
}
