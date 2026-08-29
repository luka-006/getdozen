import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveCreditOffer, proAmountCents, resolveCreditOfferByAmount } from "./pricing";
import {
  fulfillmentFromCheckout,
  shouldActivateSubscription,
  type CheckoutLike,
} from "./stripe-fulfillment";

const PROFILE = "82b16889-909d-496b-afc8-a7580f4b64ad";

function session(over: Partial<CheckoutLike> = {}): CheckoutLike {
  return {
    id: "cs_live_abc",
    mode: "payment",
    payment_status: "paid",
    currency: "eur",
    amount_total: 100,
    client_reference_id: PROFILE,
    metadata: { pack_id: "credits_1", profile_id: PROFILE, credits: "1" },
    ...over,
  };
}

describe("resolveCreditOffer", () => {
  it("uses catalog prices, not a client credit count", () => {
    const offer = resolveCreditOffer("credits_15");
    assert.deepEqual(offer, {
      packId: "credits_15",
      credits: 15,
      amountCents: 1100,
    });
  });

  it("rejects unknown packs", () => {
    assert.equal(resolveCreditOffer("credits_999"), null);
    assert.equal(resolveCreditOffer(""), null);
    assert.equal(resolveCreditOffer("custom_0"), null);
    assert.equal(resolveCreditOffer("custom_501"), null);
    assert.equal(resolveCreditOffer("custom_1.5"), null);
  });

  it("accepts bounded custom packs at catalog rate", () => {
    assert.deepEqual(resolveCreditOffer("custom_7"), {
      packId: "custom_7",
      credits: 7,
      amountCents: 700,
    });
    assert.equal(resolveCreditOffer("custom_15")?.amountCents, 1100);
  });
});

describe("resolveCreditOfferByAmount", () => {
  it("maps catalog pack amounts without pack_id metadata", () => {
    assert.deepEqual(resolveCreditOfferByAmount(1100), {
      packId: "credits_15",
      credits: 15,
      amountCents: 1100,
    });
    assert.equal(resolveCreditOfferByAmount(999), null);
  });
});

describe("fulfillmentFromCheckout", () => {
  it("grants catalog credits from pack_id + paid amount", () => {
    const result = fulfillmentFromCheckout(
      session({
        amount_total: 1900,
        metadata: { pack_id: "credits_25", profile_id: PROFILE },
      }),
    );
    assert.deepEqual(result, {
      kind: "credits",
      profileId: PROFILE,
      credits: 25,
      sessionId: "cs_live_abc",
    });
  });

  it("ignores inflated metadata.credits", () => {
    const result = fulfillmentFromCheckout(
      session({
        amount_total: 100,
        metadata: {
          pack_id: "credits_1",
          profile_id: PROFILE,
          credits: "999",
        },
      }),
    );
    assert.equal(result.kind, "credits");
    if (result.kind === "credits") assert.equal(result.credits, 1);
  });

  it("skips when paid amount does not match the pack", () => {
    const result = fulfillmentFromCheckout(
      session({
        amount_total: 100,
        metadata: {
          pack_id: "credits_25",
          profile_id: PROFILE,
          credits: "25",
        },
      }),
    );
    assert.deepEqual(result, { kind: "skip", reason: "amount_mismatch" });
  });

  it("grants credits from paid amount when pack_id is missing (Payment Link)", () => {
    const result = fulfillmentFromCheckout(
      session({
        amount_total: 1100,
        metadata: { profile_id: PROFILE },
      }),
    );
    assert.deepEqual(result, {
      kind: "credits",
      profileId: PROFILE,
      credits: 15,
      sessionId: "cs_live_abc",
    });
  });

  it("skips unpaid, wrong currency, and missing pack", () => {
    assert.equal(
      fulfillmentFromCheckout(session({ payment_status: "unpaid" })).kind,
      "skip",
    );
    assert.equal(
      fulfillmentFromCheckout(session({ currency: "usd" })).kind,
      "skip",
    );
    assert.equal(
      fulfillmentFromCheckout(
        session({ metadata: { profile_id: PROFILE }, amount_total: 999 }),
      ).kind,
      "skip",
    );
  });

  it("skips when profile ids disagree or are not uuids", () => {
    assert.equal(
      fulfillmentFromCheckout(
        session({
          client_reference_id: "11111111-1111-4111-8111-111111111111",
        }),
      ).kind,
      "skip",
    );
    assert.equal(
      fulfillmentFromCheckout(
        session({
          client_reference_id: "not-a-uuid",
          metadata: { pack_id: "credits_1", profile_id: "not-a-uuid" },
        }),
      ).kind,
      "skip",
    );
  });

  it("skips non-checkout session ids", () => {
    assert.deepEqual(fulfillmentFromCheckout(session({ id: "pi_123" })), {
      kind: "skip",
      reason: "bad_session",
    });
  });

  it("grants Pro only for a paid matching subscription", () => {
    const result = fulfillmentFromCheckout(
      session({
        mode: "subscription",
        amount_total: proAmountCents(),
        subscription: "sub_123",
        customer: "cus_123",
        metadata: { kind: "pro", profile_id: PROFILE },
      }),
    );
    assert.deepEqual(result, {
      kind: "pro",
      profileId: PROFILE,
      subscriptionId: "sub_123",
      customerId: "cus_123",
      sessionId: "cs_live_abc",
    });
  });

  it("does not activate Pro from metadata alone", () => {
    const cheap = fulfillmentFromCheckout(
      session({
        mode: "subscription",
        amount_total: 100,
        subscription: "sub_123",
        customer: "cus_123",
        metadata: { kind: "pro", profile_id: PROFILE },
      }),
    );
    assert.deepEqual(cheap, { kind: "skip", reason: "amount_mismatch" });
  });

  it("grants a board boost only for a paid matching amount", () => {
    const result = fulfillmentFromCheckout(
      session({
        amount_total: 500,
        metadata: {
          kind: "boost",
          profile_id: PROFILE,
          request_id: PROFILE,
        },
      }),
    );
    assert.deepEqual(result, {
      kind: "boost",
      profileId: PROFILE,
      requestId: PROFILE,
      sessionId: "cs_live_abc",
    });
  });

  it("skips a cheap boost", () => {
    const result = fulfillmentFromCheckout(
      session({
        amount_total: 100,
        metadata: {
          kind: "boost",
          profile_id: PROFILE,
          request_id: PROFILE,
        },
      }),
    );
    assert.deepEqual(result, { kind: "skip", reason: "amount_mismatch" });
  });
});

describe("shouldActivateSubscription", () => {
  it("only treats active and trialing as paid Pro", () => {
    assert.equal(shouldActivateSubscription("active"), true);
    assert.equal(shouldActivateSubscription("trialing"), true);
    assert.equal(shouldActivateSubscription("past_due"), false);
    assert.equal(shouldActivateSubscription("canceled"), false);
    assert.equal(shouldActivateSubscription(null), false);
  });
});
