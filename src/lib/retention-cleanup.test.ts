import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ORPHAN_STORAGE_BATCH_SIZE,
  REQUEST_BATCH_SIZE,
  RETENTION_DAYS,
} from "./retention-cleanup";

describe("retention policy constants", () => {
  it("keeps a 90-day grace period for terminal posts", () => {
    assert.equal(RETENTION_DAYS, 90);
  });

  it("limits batch sizes for cron safety", () => {
    assert.ok(REQUEST_BATCH_SIZE > 0 && REQUEST_BATCH_SIZE <= 100);
    assert.ok(ORPHAN_STORAGE_BATCH_SIZE > 0 && ORPHAN_STORAGE_BATCH_SIZE <= 200);
  });

  it("computes cutoff 90 days before now", () => {
    const now = new Date("2026-09-28T12:00:00.000Z");
    const cutoff = new Date(now);
    cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
    assert.equal(cutoff.toISOString(), "2026-06-30T12:00:00.000Z");
  });
});
