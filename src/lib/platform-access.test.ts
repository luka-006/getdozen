import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  betaAccessLinkRequired,
  isValidOptInUrl,
  playConsoleOptInRequired,
  showsBetaAccessField,
} from "./platform-access";

describe("platform-access", () => {
  it("requires Play Console opt-in only on Android", () => {
    assert.equal(playConsoleOptInRequired("android"), true);
    assert.equal(playConsoleOptInRequired("ios"), false);
    assert.equal(playConsoleOptInRequired("web"), false);
    assert.equal(betaAccessLinkRequired("ios"), false);
  });

  it("shows beta access field for mobile only", () => {
    assert.equal(showsBetaAccessField("web"), false);
    assert.equal(showsBetaAccessField("ios"), true);
    assert.equal(showsBetaAccessField("android"), true);
  });

  it("validates opt-in URLs", () => {
    assert.equal(isValidOptInUrl("https://play.google.com/apps/testing/foo"), true);
    assert.equal(isValidOptInUrl(""), false);
    assert.equal(isValidOptInUrl("not-a-url"), false);
  });
});
