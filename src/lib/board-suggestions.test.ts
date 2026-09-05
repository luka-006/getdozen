import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { suggestNextReviewPosts } from "./board-suggestions";
import type { RequestRow } from "./types";

function row(partial: Partial<RequestRow> & Pick<RequestRow, "id" | "user_id">): RequestRow {
  return {
    type: "feedback",
    app_name: "App",
    app_url: "https://preview.example/a",
    app_description: "Desc",
    question_count: 7,
    credit_cost: 14,
    testers_needed: 0,
    testers_filled: 0,
    status: "open",
    bounty_multiplier: 1,
    claimed_at: null,
    expires_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    focus_tag: null,
    opt_in_link: null,
    test_focus: null,
    test_start_date: null,
    ...partial,
  };
}

describe("suggestNextReviewPosts", () => {
  it("skips own posts and already reviewed", () => {
    const requests = [
      row({ id: "a", user_id: "maker" }),
      row({ id: "b", user_id: "maker" }),
      row({ id: "c", user_id: "other" }),
    ];
    const out = suggestNextReviewPosts(requests, {
      meId: "me",
      reviewedIds: new Set(["b"]),
      comboTakenIds: new Set(),
      excludeRequestId: "a",
      limit: 3,
    });
    assert.deepEqual(out.map((r) => r.id), ["c"]);
  });
});
