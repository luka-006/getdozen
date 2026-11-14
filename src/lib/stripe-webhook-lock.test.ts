import assert from "node:assert/strict";
import { describe, it } from "node:test";
import Stripe from "stripe";
import { POST } from "../app/api/stripe/webhook/route";

const payload = JSON.stringify({
  id: "evt_lock_test",
  object: "event",
  type: "unknown.dozen.lock",
  data: { object: {} },
});

function signedRequest(body: string, secret: string, signature?: string) {
  const header =
    signature ??
    Stripe.webhooks.generateTestHeaderString({ payload: body, secret });
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body,
    headers: { "stripe-signature": header, "content-type": "application/json" },
  });
}

describe("stripe webhook signature", () => {
  const previousSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const previousKey = process.env.STRIPE_SECRET_KEY;

  it("fails closed when the webhook secret is unset", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const response = await POST(signedRequest(payload, "whsec_unused"));
    assert.equal(response.status, 401);
    assert.equal(await response.text(), "");
  });

  it("rejects a missing, invalid, or tampered signature", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_lock_test_secret";
    const missing = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        body: payload,
      }),
    );
    assert.equal(missing.status, 400);

    const invalid = await POST(
      signedRequest(payload, "whsec_lock_test_secret", "t=1,v1=deadbeef"),
    );
    assert.equal(invalid.status, 400);

    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_lock_test_secret",
    });
    const tampered = await POST(
      signedRequest(`${payload} `, "whsec_lock_test_secret", signature),
    );
    assert.equal(tampered.status, 400);
  });

  it("accepts a valid signature and reaches fulfillment", async () => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_lock_test_secret";
    process.env.STRIPE_SECRET_KEY = "sk_test_lock_placeholder";
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    await assert.rejects(
      () => POST(signedRequest(payload, "whsec_lock_test_secret")),
      /Supabase admin credentials/,
    );
  });

  it("restores stripe env", () => {
    if (previousSecret === undefined) delete process.env.STRIPE_WEBHOOK_SECRET;
    else process.env.STRIPE_WEBHOOK_SECRET = previousSecret;
    if (previousKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previousKey;
  });
});
