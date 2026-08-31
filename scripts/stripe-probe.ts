import { readFileSync, writeFileSync } from "fs";
import Stripe from "stripe";
import { fulfillmentFromCheckout } from "../src/lib/stripe-fulfillment";

const env = readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
for (const rawLine of env.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const eq = line.indexOf("=");
  if (eq <= 0) continue;
  const name = line.slice(0, eq).trim();
  let val = line.slice(eq + 1).trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[name] = val;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  const out: string[] = [];
  if (!key) {
    writeFileSync("scripts/stripe-probe-out.txt", "NO_KEY");
    return;
  }

  const stripe = new Stripe(key);
  const sessions = await stripe.checkout.sessions.list({ limit: 10 });
  out.push(`sessions:${sessions.data.length}`);
  for (const s of sessions.data) {
    const decision = fulfillmentFromCheckout({
      id: s.id,
      mode: s.mode,
      payment_status: s.payment_status,
      currency: s.currency,
      amount_total: s.amount_total,
      client_reference_id: s.client_reference_id,
      metadata: s.metadata as Record<string, string>,
      subscription: s.subscription,
      customer: s.customer,
    });
    out.push(
      JSON.stringify({
        id: s.id,
        status: s.payment_status,
        mode: s.mode,
        amount: s.amount_total,
        client_ref: s.client_reference_id,
        metadata: s.metadata,
        fulfillment: decision,
        created: new Date(s.created * 1000).toISOString(),
      }),
    );
  }

  const wh = await stripe.webhookEndpoints.list({ limit: 10 });
  out.push(`webhooks:${wh.data.length}`);
  for (const w of wh.data) {
    out.push(`${w.url} | ${w.status} | ${(w.enabled_events || []).join(",")}`);
  }

  writeFileSync("scripts/stripe-probe-out.txt", out.join("\n"));
}

main().catch((err) => {
  writeFileSync("scripts/stripe-probe-out.txt", String(err));
  process.exit(1);
});
