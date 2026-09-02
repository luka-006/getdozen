import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ledgerReasonLabel, ledgerRowMeta } from "./ledger-labels";

describe("ledgerReasonLabel", () => {
  it("maps known reasons to plain labels", () => {
    assert.equal(ledgerReasonLabel("stripe_purchase"), "Bought Dots");
    assert.equal(ledgerReasonLabel("tester_checkin"), "Tester check-in");
  });

  it("handles admin notes", () => {
    assert.equal(ledgerReasonLabel("admin_credit:launch fix"), "Adjustment");
  });
});

describe("ledgerRowMeta", () => {
  it("shows pending hint when not yet available", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const meta = ledgerRowMeta({
      id: "1",
      user_id: "u",
      amount: 3,
      reason: "review_pending",
      ref_id: null,
      status: "pending",
      expires_at: null,
      available_at: future,
      created_at: new Date().toISOString(),
    });
    assert.equal(meta.label, "Review submitted");
    assert.equal(meta.hint?.startsWith("Pending"), true);
  });
});
