import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { profileDisplayNameFromUser } from "./profile-display-name";

describe("profileDisplayNameFromUser", () => {
  it("prefers full_name from user metadata", () => {
    assert.equal(
      profileDisplayNameFromUser({
        user_metadata: { full_name: "Alex Maker" },
        email: "alex@example.com",
      }),
      "Alex Maker",
    );
  });

  it("falls back to name, email local part, then Maker", () => {
    assert.equal(
      profileDisplayNameFromUser({
        user_metadata: { name: "Beta User" },
        email: "beta@example.com",
      }),
      "Beta User",
    );
    assert.equal(
      profileDisplayNameFromUser({
        user_metadata: {},
        email: "charlie@example.com",
      }),
      "charlie",
    );
    assert.equal(
      profileDisplayNameFromUser({
        user_metadata: {},
        email: null,
      }),
      "Maker",
    );
  });

  it("truncates long names to 40 characters", () => {
    const longName = "a".repeat(50);
    assert.equal(
      profileDisplayNameFromUser({
        user_metadata: { full_name: longName },
        email: "long@example.com",
      }).length,
      40,
    );
  });
});
