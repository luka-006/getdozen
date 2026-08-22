import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CREDIT_PAYMENT_LINKS,
  PRO_PAYMENT_LINK,
  stripePaymentLinkUrl,
} from "./stripe-payment-links";

describe("stripePaymentLinkUrl", () => {
  it("attaches the signed-in profile so the webhook can fulfill", () => {
    const url = stripePaymentLinkUrl(CREDIT_PAYMENT_LINKS.credits_1, {
      profileId: "82b16889-909d-496b-afc8-a7580f4b64ad",
      email: "maker@getdozen.dev",
    });
    const parsed = new URL(url);
    assert.equal(parsed.origin, "https://buy.stripe.com");
    assert.equal(
      parsed.searchParams.get("client_reference_id"),
      "82b16889-909d-496b-afc8-a7580f4b64ad",
    );
    assert.equal(parsed.searchParams.get("prefilled_email"), "maker@getdozen.dev");
  });

  it("has a live link for every catalog pack and Pro", () => {
    assert.equal(Object.keys(CREDIT_PAYMENT_LINKS).length, 4);
    assert.match(PRO_PAYMENT_LINK, /^https:\/\/buy\.stripe\.com\//);
  });
});
