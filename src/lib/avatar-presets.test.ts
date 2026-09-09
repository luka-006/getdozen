import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AVATAR_PRESETS,
  activeAvatarPresetId,
  avatarPresetById,
  defaultAvatarUrlForUser,
  isAvatarPresetUrl,
  isOAuthAvatarUrl,
  resolveAvatarUrl,
} from "./avatar-presets";

describe("avatar presets", () => {
  it("has 12 unique presets", () => {
    assert.equal(AVATAR_PRESETS.length, 12);
    const urls = new Set(AVATAR_PRESETS.map((p) => p.url));
    assert.equal(urls.size, 12);
  });

  it("picks a stable default per user id", () => {
    const a = defaultAvatarUrlForUser("user-a");
    const b = defaultAvatarUrlForUser("user-b");
    assert.ok(isAvatarPresetUrl(a));
    assert.ok(isAvatarPresetUrl(b));
    assert.equal(defaultAvatarUrlForUser("user-a"), a);
  });

  it("resolves stored preset urls", () => {
    const preset = AVATAR_PRESETS[3]!;
    assert.equal(
      resolveAvatarUrl({
        name: "Test",
        avatarUrl: preset.url,
        userId: "x",
      }),
      preset.url,
    );
  });

  it("falls back to user default when url is missing", () => {
    assert.equal(
      resolveAvatarUrl({ name: "Test", avatarUrl: null, userId: "abc-123" }),
      defaultAvatarUrlForUser("abc-123"),
    );
  });

  it("maps active preset from url or default", () => {
    const preset = avatarPresetById("coral")!;
    assert.equal(activeAvatarPresetId(preset.url, "any"), "coral");
    assert.equal(
      activeAvatarPresetId(null, "stable-user-id"),
      activeAvatarPresetId(defaultAvatarUrlForUser("stable-user-id"), "stable-user-id"),
    );
  });

  it("detects OAuth avatar hosts", () => {
    assert.ok(
      isOAuthAvatarUrl("https://lh3.googleusercontent.com/a/photo.jpg"),
    );
    assert.ok(
      isOAuthAvatarUrl("https://avatars.githubusercontent.com/u/1?v=4"),
    );
    assert.equal(isOAuthAvatarUrl(AVATAR_PRESETS[0]!.url), false);
  });

  it("returns no active preset for OAuth photos", () => {
    assert.equal(
      activeAvatarPresetId(
        "https://lh3.googleusercontent.com/a/photo.jpg",
        "user-123",
      ),
      null,
    );
  });
});
