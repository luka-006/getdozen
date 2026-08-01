import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { appendLedger } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function alreadyProcessed(eventId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  return Boolean(data);
}

async function markProcessed(eventId: string, type: string) {
  const admin = createAdminClient();
  await admin.from("stripe_events").insert({ id: eventId, type });
}

async function grantCredits(profileId: string, credits: number, sessionId: string) {
  await appendLedger({
    userId: profileId,
    amount: credits,
    reason: "stripe_purchase",
    refId: null,
    status: "available",
  });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("purchased_credits")
    .eq("id", profileId)
    .single();

  await admin
    .from("profiles")
    .update({
      purchased_credits: Number(profile?.purchased_credits ?? 0) + credits,
    })
    .eq("id", profileId);

  // Store session id in ledger reason uniqueness via stripe_events only.
  void sessionId;
}

async function activatePro(profileId: string, subscriptionId: string, customerId: string) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      is_pro: true,
      stripe_subscription_id: subscriptionId,
      stripe_customer_id: customerId,
    })
    .eq("id", profileId);
}

async function deactivatePro(subscriptionId: string) {
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ is_pro: false, stripe_subscription_id: null })
    .eq("stripe_subscription_id", subscriptionId);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (await alreadyProcessed(event.id)) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const profileId =
          session.metadata?.profile_id || session.client_reference_id || "";
        if (!profileId) break;

        // Only grant when Stripe confirms payment (skip unpaid async methods).
        if (
          session.mode === "payment" &&
          session.payment_status !== "paid"
        ) {
          break;
        }

        if (session.metadata?.kind === "credits") {
          if (session.payment_status !== "paid") break;
          const credits = Number(session.metadata.credits ?? 0);
          if (credits > 0) {
            await grantCredits(profileId, credits, session.id);
          }
        }

        if (session.metadata?.kind === "pro" || session.mode === "subscription") {
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          if (subscriptionId && customerId) {
            await activatePro(profileId, subscriptionId, customerId);
          }
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const profileId = sub.metadata?.profile_id;
        if (!profileId) break;
        const active = ["active", "trialing"].includes(sub.status);
        const admin = createAdminClient();
        await admin
          .from("profiles")
          .update({
            is_pro: active,
            stripe_subscription_id: active ? sub.id : null,
          })
          .eq("id", profileId);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await deactivatePro(sub.id);
        break;
      }
      default:
        break;
    }

    await markProcessed(event.id, event.type);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
