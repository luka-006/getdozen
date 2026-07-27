"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { canPurchaseCredits } from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getCreditPack,
  getStripe,
  PRO_PRICE_EUR,
  stripeConfigured,
} from "@/lib/stripe";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
  const packId = String(formData.get("pack_id") ?? "");
  const pack = getCreditPack(packId);

  if (!pack) {
    redirect(`/wallet?error=${encodeURIComponent("Unknown credit pack")}`);
  }

  const check = canPurchaseCredits(profile, pack.credits);
  if (!check.ok) {
    redirect(`/wallet?error=${encodeURIComponent(check.error)}`);
  }

  if (!stripeConfigured()) {
    redirect(`/wallet?error=${encodeURIComponent("Stripe not configured yet. Add STRIPE_SECRET_KEY to .env.local.")}`);
  }

  const stripe = getStripe()!;
  const customerId = await ensureStripeCustomer(profile as typeof profile & { stripe_customer_id?: string | null });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: profile.id,
    metadata: {
      kind: "credits",
      profile_id: profile.id,
      credits: String(pack.credits),
      pack_id: pack.id,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(pack.amountEur * 100),
          product_data: {
            name: `getdozen ${pack.label}`,
            description: `${pack.credits} credits for reviews and testers`,
          },
        },
      },
    ],
    success_url: `${siteUrl()}/wallet?message=${encodeURIComponent("Payment received. Credits appear after Stripe confirms.")}`,
    cancel_url: `${siteUrl()}/wallet?error=${encodeURIComponent("Checkout cancelled")}`,
  });

  if (!session.url) {
    redirect(`/wallet?error=${encodeURIComponent("Could not start checkout")}`);
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

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: profile.id,
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
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(PRO_PRICE_EUR * 100),
          recurring: { interval: "month" },
          product_data: {
            name: "getdozen Pro",
            description:
              "5 concurrent tester slots, board boost, 48-hour review guarantee, analytics",
          },
        },
      },
    ],
    success_url: `${siteUrl()}/wallet?message=${encodeURIComponent("Pro is activating. Refresh in a moment.")}`,
    cancel_url: `${siteUrl()}/wallet?error=${encodeURIComponent("Checkout cancelled")}`,
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

  const portal = await stripe.billingPortal.sessions.create({
    customer: data.stripe_customer_id,
    return_url: `${siteUrl()}/wallet`,
  });

  redirect(portal.url);
}
