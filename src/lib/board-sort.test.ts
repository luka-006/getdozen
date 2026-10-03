import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareBoardRows, type BoardSortRow } from "./board-sort";

function row(partial: Partial<BoardSortRow> & Pick<BoardSortRow, "user_id" | "created_at">): BoardSortRow {
  return {
    bounty_multiplier: 1,
    boosted_until: null,
    ...partial,
  };
}

const none = () => false;

describe("compareBoardRows default", () => {
  it("ranks 2× above 1.5× above 1×", () => {
    const rows = [
      row({ user_id: "a", created_at: "2026-01-01T00:00:00.000Z", bounty_multiplier: 1 }),
      row({ user_id: "b", created_at: "2026-01-03T00:00:00.000Z", bounty_multiplier: 2 }),
      row({ user_id: "c", created_at: "2026-01-02T00:00:00.000Z", bounty_multiplier: 1.5 }),
    ];
    rows.sort((a, b) => compareBoardRows(a, b, "default", none));
    assert.deepEqual(
      rows.map((r) => r.bounty_multiplier),
      [2, 1.5, 1],
    );
  });

  it("ranks the longer wait first when bounty matches", () => {
    const older = row({
      user_id: "old",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 1.5,
    });
    const newer = row({
      user_id: "new",
      created_at: "2026-01-02T00:00:00.000Z",
      bounty_multiplier: 1.5,
    });
    assert.ok(compareBoardRows(older, newer, "default", none) < 0);
    assert.ok(compareBoardRows(newer, older, "default", none) > 0);
  });

  it("does not let Pro outrank a longer wait at the same bounty", () => {
    const older = row({
      user_id: "old",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 2,
    });
    const newerPro = row({
      user_id: "pro",
      created_at: "2026-01-04T00:00:00.000Z",
      bounty_multiplier: 2,
    });
    const isPro = (id: string) => id === "pro";
    assert.ok(compareBoardRows(older, newerPro, "default", isPro) < 0);
  });

  it("uses Pro only when bounty and created_at match", () => {
    const plain = row({
      user_id: "plain",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 1,
    });
    const pro = row({
      user_id: "pro",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 1,
    });
    const isPro = (id: string) => id === "pro";
    assert.ok(compareBoardRows(pro, plain, "default", isPro) < 0);
  });
});

describe("compareBoardRows explicit sorts", () => {
  it("newest ignores bounty", () => {
    const highOld = row({
      user_id: "a",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 2,
    });
    const lowNew = row({
      user_id: "b",
      created_at: "2026-03-01T00:00:00.000Z",
      bounty_multiplier: 1,
    });
    assert.ok(compareBoardRows(lowNew, highOld, "newest", none) < 0);
  });

  it("oldest ignores bounty", () => {
    const highNew = row({
      user_id: "a",
      created_at: "2026-03-01T00:00:00.000Z",
      bounty_multiplier: 2,
    });
    const lowOld = row({
      user_id: "b",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 1,
    });
    assert.ok(compareBoardRows(lowOld, highNew, "oldest", none) < 0);
  });

  it("highest bounty still prefers an active boost when multipliers match", () => {
    const boosted = row({
      user_id: "a",
      created_at: "2026-03-01T00:00:00.000Z",
      bounty_multiplier: 1.5,
      boosted_until: "2099-01-01T00:00:00.000Z",
    });
    const waiting = row({
      user_id: "b",
      created_at: "2026-01-01T00:00:00.000Z",
      bounty_multiplier: 1.5,
    });
    assert.ok(compareBoardRows(boosted, waiting, "bounty", none) < 0);
    assert.ok(compareBoardRows(waiting, boosted, "default", none) < 0);
  });
});
