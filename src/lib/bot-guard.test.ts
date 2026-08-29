import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TURNSTILE_DUMMY,
  TURNSTILE_SITEVERIFY,
  checkBotGuard,
  honeypotTripped,
  verifyTurnstile,
} from "./bot-guard";

describe("honeypotTripped", () => {
  it("ignores an empty bait field", () => {
    const form = new FormData();
    form.set("company_url", "  ");
    assert.equal(honeypotTripped(form), false);
  });

  it("flags bots that fill the hidden field", () => {
    const form = new FormData();
    form.set("company_url", "https://spam.test");
    assert.equal(honeypotTripped(form), true);
  });
});

describe("checkBotGuard", () => {
  it("rejects honeypot fills before calling Turnstile", async () => {
    const form = new FormData();
    form.set("company_url", "bot");
    form.set("cf-turnstile-response", TURNSTILE_DUMMY.token);
    const result = await checkBotGuard(form);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /try again/i);
    }
  });

  it("rejects a missing token when a secret is configured", async () => {
    const previous = process.env.TURNSTILE_SECRET_KEY;
    process.env.TURNSTILE_SECRET_KEY = TURNSTILE_DUMMY.passSecret;
    try {
      const form = new FormData();
      const result = await checkBotGuard(form);
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.match(result.error, /bot check/i);
      }
    } finally {
      if (previous === undefined) delete process.env.TURNSTILE_SECRET_KEY;
      else process.env.TURNSTILE_SECRET_KEY = previous;
    }
  });

  it("allows the request when Turnstile is not configured", async () => {
    const previousKey = process.env.TURNSTILE_SECRET_KEY;
    const previousSecret = process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SECRET;
    try {
      const form = new FormData();
      const result = await checkBotGuard(form);
      assert.equal(result.ok, true);
    } finally {
      if (previousKey === undefined) delete process.env.TURNSTILE_SECRET_KEY;
      else process.env.TURNSTILE_SECRET_KEY = previousKey;
      if (previousSecret === undefined) delete process.env.TURNSTILE_SECRET;
      else process.env.TURNSTILE_SECRET = previousSecret;
    }
  });
});

describe("verifyTurnstile live dummy keys", () => {
  it("accepts Cloudflare's always-pass dummy token", async () => {
    const result = await verifyTurnstile(TURNSTILE_DUMMY.token, {
      secret: TURNSTILE_DUMMY.passSecret,
    });
    assert.equal(result.ok, true);
  });

  it("rejects Cloudflare's always-fail dummy secret", async () => {
    const result = await verifyTurnstile(TURNSTILE_DUMMY.token, {
      secret: TURNSTILE_DUMMY.failSecret,
    });
    assert.equal(result.ok, false);
  });

  it("rejects oversized tokens without calling siteverify", async () => {
    const result = await verifyTurnstile("x".repeat(2049), {
      secret: TURNSTILE_DUMMY.passSecret,
    });
    assert.equal(result.ok, false);
  });

  it("posts to the official siteverify endpoint", () => {
    assert.equal(
      TURNSTILE_SITEVERIFY,
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
  });
});
