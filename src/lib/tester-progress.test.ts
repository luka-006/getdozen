import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampTesterDuration,
  testerCubes,
  testerJoinedLabel,
  testerStatusLabel,
} from "./tester-progress";

describe("clampTesterDuration", () => {
  it("falls back to 14 and clamps the posted length", () => {
    assert.equal(clampTesterDuration(null), 14);
    assert.equal(clampTesterDuration(20), 20);
    assert.equal(clampTesterDuration(3), 7);
    assert.equal(clampTesterDuration(90), 30);
  });
});

describe("testerCubes", () => {
  it("fills one cube per calendar day in, up to the posted length", () => {
    const optedInAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const cubes = testerCubes({
      durationDays: 20,
      optedInAt,
      status: "active",
    });
    assert.equal(cubes.total, 20);
    assert.equal(cubes.filled, 6);
    assert.equal(cubes.label, "6 of 20 days");
  });

  it("starts each tester's clock from their own join day", () => {
    const today = testerCubes({
      durationDays: 14,
      optedInAt: new Date().toISOString(),
      status: "active",
    });
    const threeDaysLater = testerCubes({
      durationDays: 14,
      optedInAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    });
    const threeDaysAgo = testerCubes({
      durationDays: 14,
      optedInAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
    });
    assert.equal(today.filled, 1);
    assert.equal(threeDaysLater.filled, 0);
    assert.equal(threeDaysAgo.filled, 4);
    assert.notEqual(today.filled, threeDaysAgo.filled);
  });

  it("fills every cube when the commitment is done", () => {
    const cubes = testerCubes({
      durationDays: 20,
      optedInAt: new Date().toISOString(),
      status: "completed",
    });
    assert.equal(cubes.filled, 20);
  });
});

describe("testerJoinedLabel", () => {
  it("prints the calendar day that tester joined", () => {
    const label = testerJoinedLabel("2026-08-22T10:00:00.000Z");
    assert.match(label, /^Joined \d{1,2} \w{3}$/);
  });
});

describe("testerStatusLabel", () => {
  it("uses short chips", () => {
    assert.equal(testerStatusLabel("active"), "Active");
    assert.equal(testerStatusLabel("completed"), "Done");
  });
});
