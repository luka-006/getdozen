import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { appendLedger } from "@/lib/credits";
import { getStripe } from "@/lib/stripe";
import {
  fulfillmentFromCheckout,
  shouldActivateSubscription,
} from "@/lib/stripe-fulfillment";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function claimEvent(eventId: string, type: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("stripe_events").insert({ id: eventId, type });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(error.message);
}

async function releaseEvent(eventId: string) {
  const admin = createAdminClient();
  await admin.from("stripe_events").delete().eq("id", eventId);
}

async function claimSessionGrant(params: {
  sessionId: string;
  profileId: string;
  kind: "credits" | "pro";
  credits: number | null;
}) {
  const admin = createAdminClient();
  const { error } = await admin.from("stripe_session_grants").insert({
    session_id: params.sessionId,
    profile_id: params.profileId,
    kind: params.kind,
    credits: params.credits,
  });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(error.message);
}

async function grantCredits(profileId: string, credits: number) {
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
}

async function activatePro(
  profileId: string,
  subscriptionId: string,
  customerId: string,
) {
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

async function fulfillCheckout(session: Stripe.Checkout.Session) {
  const decision = fulfillmentFromCheckout({
    id: session.id,
    mode: session.mode,
    payment_status: session.payment_status,
    currency: session.currency,
    amount_total: session.amount_total,
    client_reference_id: session.client_reference_id,
    metadata: session.metadata,
    subscription: session.subscription,
    customer: session.customer,
  });

  if (decision.kind === "skip") return;

  const claimed = await claimSessionGrant({
    sessionId: decision.sessionId,
    profileId: decision.profileId,
    kind: decision.kind,
    credits: decision.kind === "credits" ? decision.credits : null,
  });
  if (!claimed) return;

  if (decision.kind === "credits") {
    await grantCredits(decision.profileId, decision.credits);
    return;
  }

  await activatePro(
    decision.profileId,
    decision.subscriptionId,
    decision.customerId,
  );
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

  const claimed = await claimEvent(event.id, event.type);
  if (!claimed) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        await fulfillCheckout(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const profileId = sub.metadata?.profile_id;
        if (profileId && shouldActivateSubscription(sub.status)) {
          const customerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer;
          if (typeof customerId === "string") {
            await activatePro(profileId, sub.id, customerId);
          }
        } else if (profileId) {
          await deactivatePro(sub.id);
        }
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
  } catch (err) {
    await releaseEvent(event.id);
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
