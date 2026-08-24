import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canBuyBoardBoost, isBoostActive } from "./boost";

describe("board boost window", () => {
  it("is available after 3 days on the board", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    const fresh = new Date("2026-08-23T12:00:00.000Z").toISOString();
    const ready = new Date("2026-08-21T12:00:00.000Z").toISOString();
    assert.equal(canBuyBoardBoost(fresh, now), false);
    assert.equal(canBuyBoardBoost(ready, now), true);
  });

  it("treats a future boosted_until as active", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    assert.equal(isBoostActive("2026-08-25T12:00:00.000Z", now), true);
    assert.equal(isBoostActive("2026-08-23T12:00:00.000Z", now), false);
    assert.equal(isBoostActive(null, now), false);
  });
});
