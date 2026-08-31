import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checkinSlotIndex,
  isCheckinDueDay,
  testerCheckinEarnAmount,
  testerCompletionEarnAmount,
} from "./tester-checkin";

describe("tester check-in schedule", () => {
  it("expects check-ins every 3 days", () => {
    assert.equal(isCheckinDueDay(0), true);
    assert.equal(isCheckinDueDay(1), false);
    assert.equal(isCheckinDueDay(3), true);
    assert.equal(checkinSlotIndex(3), 1);
  });

  it("scales payout with priority multiplier", () => {
    assert.equal(testerCheckinEarnAmount(1, false), 1);
    assert.equal(testerCheckinEarnAmount(1.5, false), 1.5);
    assert.equal(testerCompletionEarnAmount(2, false), 4);
  });
});
