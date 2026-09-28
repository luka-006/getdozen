import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRequestProductImageUrl } from "./product-image-display";

describe("resolveRequestProductImageUrl", () => {
  it("prefers product_image_url", () => {
    assert.equal(
      resolveRequestProductImageUrl({
        product_image_url: "https://storage/new.webp",
        app_icon_url: "https://legacy/old.svg",
      }),
      "https://storage/new.webp",
    );
  });

  it("falls back to app_icon_url for seeded demo posts", () => {
    assert.equal(
      resolveRequestProductImageUrl({
        product_image_url: null,
        app_icon_url: "https://api.dicebear.com/9.x/identicon/svg?seed=x",
      }),
      "https://api.dicebear.com/9.x/identicon/svg?seed=x",
    );
  });
});
