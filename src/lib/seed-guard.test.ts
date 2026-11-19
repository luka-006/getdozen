import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { assertSeedAllowed, seedBlockedReason } from "./seed-guard";

describe("seed guard", () => {
  it("blocks VERCEL_ENV=production and allows anything else", () => {
    const previous = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";
    assert.equal(seedBlockedReason(), "VERCEL_ENV=production");
    assert.throws(() => assertSeedAllowed("seed-preview-data"), /production/);
    process.env.VERCEL_ENV = "preview";
    assert.equal(seedBlockedReason(), null);
    assert.doesNotThrow(() => assertSeedAllowed("seed-preview-data"));
    delete process.env.VERCEL_ENV;
    assert.equal(seedBlockedReason(), null);
    if (previous === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous;
  });
});
