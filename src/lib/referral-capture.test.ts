import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REFERRAL_COOKIE_MAX_AGE,
  resolveReferralCapture,
} from "./referral-capture";
import { referralShareUrl } from "./referral-copy";
import { SITE_ORIGIN } from "./app-url";

const CODE = "abcdefgh";

describe("resolveReferralCapture", () => {
  it("captures a ref from the query when no cookie exists", () => {
    const captured = resolveReferralCapture({ query: CODE, cookie: null });
    assert.equal(captured.code, CODE);
    assert.equal(captured.setCookie, true);
  });

  it("keeps the first-touch cookie when a later ref arrives", () => {
    const captured = resolveReferralCapture({
      query: "zzzzzzzz",
      cookie: CODE,
    });
    assert.equal(captured.code, CODE);
    assert.equal(captured.setCookie, false);
  });

  it("ignores a code that is not the alphabet", () => {
    const captured = resolveReferralCapture({ query: "OOOOOOOO", cookie: null });
    assert.equal(captured.code, null);
    assert.equal(captured.setCookie, false);
  });

  it("stores the cookie for about 30 days", () => {
    assert.equal(REFERRAL_COOKIE_MAX_AGE, 60 * 60 * 24 * 30);
  });
});

describe("referralShareUrl", () => {
  it("builds the share link from the app origin", () => {
    assert.equal(
      referralShareUrl(CODE, SITE_ORIGIN),
      `${SITE_ORIGIN}/?ref=${CODE}`,
    );
  });
});
