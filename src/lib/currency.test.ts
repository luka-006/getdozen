import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CURRENCY_UNIT,
  currencyName,
  currencyUnits,
  formatDots,
  formatDotsDelta,
} from "./currency";

describe("currency (Dots)", () => {
  it("uses dots as the public unit name", () => {
    assert.equal(CURRENCY_UNIT, "dots");
    assert.equal(currencyName(), "Dots");
  });

  it("pluralizes correctly", () => {
    assert.equal(formatDots(1), "1 Dot");
    assert.equal(formatDots(2), "2 Dots");
    assert.equal(formatDots(1.5), "1.5 Dots");
    assert.equal(currencyUnits(1), "Dot");
    assert.equal(currencyUnits(2), "Dots");
  });

  it("formats deltas", () => {
    assert.equal(formatDotsDelta(2), "+2 Dots");
  });
});
