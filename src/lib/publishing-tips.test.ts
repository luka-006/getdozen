import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { publishingTipsFor } from "./publishing-tips";

describe("publishingTipsFor", () => {
  it("returns Android-specific tips", () => {
    const tips = publishingTipsFor("android", "app");
    assert.ok(tips.some((t) => t.id === "android-opt-in-link"));
    assert.ok(tips.some((t) => t.id === "universal-job"));
  });

  it("returns iOS-specific tips", () => {
    const tips = publishingTipsFor("ios", "app");
    assert.ok(tips.some((t) => t.id === "ios-build-expiry"));
  });

  it("returns web SaaS tips", () => {
    const tips = publishingTipsFor("web", "app");
    assert.ok(tips.some((t) => t.id === "web-onboarding"));
  });

  it("returns steam tips for games", () => {
    const tips = publishingTipsFor("steam", "game");
    assert.ok(tips.some((t) => t.id === "steam-playtest-vs-store"));
  });
});
