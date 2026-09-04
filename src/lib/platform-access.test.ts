import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  betaAccessLinkRequired,
  isValidOptInUrl,
  normalizePlatform,
  playConsoleOptInRequired,
  showsBetaAccessField,
} from "./platform-access";

describe("platform-access", () => {
  it("requires Play Console opt-in only on Android", () => {
    assert.equal(playConsoleOptInRequired("android"), true);
    assert.equal(playConsoleOptInRequired("ios"), false);
    assert.equal(playConsoleOptInRequired("steam"), false);
    assert.equal(playConsoleOptInRequired("itch"), false);
    assert.equal(betaAccessLinkRequired("steam"), false);
  });

  it("shows beta access field for mobile and steam", () => {
    assert.equal(showsBetaAccessField("web"), false);
    assert.equal(showsBetaAccessField("itch"), false);
    assert.equal(showsBetaAccessField("ios"), true);
    assert.equal(showsBetaAccessField("steam"), true);
  });

  it("normalizes game platforms", () => {
    assert.equal(normalizePlatform("steam"), "steam");
    assert.equal(normalizePlatform("itch"), "itch");
    assert.equal(normalizePlatform("unknown"), "web");
  });

  it("validates opt-in URLs", () => {
    assert.equal(isValidOptInUrl("https://preview.example/playtest/foo"), true);
    assert.equal(isValidOptInUrl(""), false);
    assert.equal(isValidOptInUrl("not-a-url"), false);
  });
});
