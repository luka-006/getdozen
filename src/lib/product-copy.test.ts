import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  openProductLabel,
  productLabel,
  requestTrackEyebrow,
} from "./product-copy";
import { randomDescriptionExample } from "./placeholders";

describe("product copy", () => {
  it("labels apps and games", () => {
    assert.equal(productLabel("app"), "App");
    assert.equal(productLabel("game"), "Game");
    assert.equal(openProductLabel("game"), "Open game");
    assert.equal(openProductLabel("app"), "Open app");
  });

  it("labels request tracks", () => {
    assert.equal(requestTrackEyebrow("feedback"), "Feedback request");
    assert.equal(requestTrackEyebrow("tester"), "Tester request");
    assert.equal(requestTrackEyebrow("combo"), "Dozen pack");
  });
});

describe("description placeholders", () => {
  it("returns game-flavoured examples for games", () => {
    const sample = randomDescriptionExample("game");
    assert.match(
      sample.toLowerCase(),
      /game|roguelite|puzzle|racer|deckbuilder|tactics|multiplayer|mystery|tavern|sim/,
    );
  });

  it("returns app-flavoured examples for apps", () => {
    const sample = randomDescriptionExample("app");
    assert.doesNotMatch(sample.toLowerCase(), /roguelite|deckbuilder/);
  });
});
