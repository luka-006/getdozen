import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isStoredProductImageUrl,
  productImagePathFromPublicUrl,
  resolveProductImagePath,
} from "./product-image-storage";

describe("product image storage helpers", () => {
  it("parses a Supabase public object URL", () => {
    const url =
      "https://abc.supabase.co/storage/v1/object/public/product-logos/user-1/logo.webp";
    assert.equal(
      productImagePathFromPublicUrl(url),
      "user-1/logo.webp",
    );
  });

  it("ignores external placeholder URLs", () => {
    assert.equal(
      isStoredProductImageUrl(
        "https://api.dicebear.com/9.x/identicon/svg?seed=MyApp",
      ),
      false,
    );
    assert.equal(
      isStoredProductImageUrl(
        "https://abc.supabase.co/storage/v1/object/public/product-logos/u/x.png",
      ),
      true,
    );
  });

  it("prefers product_image_path over URL parsing", () => {
    assert.equal(
      resolveProductImagePath({
        product_image_path: "user/a.webp",
        product_image_url: "https://example.com/other.png",
      }),
      "user/a.webp",
    );
  });

  it("falls back to parsing product_image_url", () => {
    const url =
      "https://abc.supabase.co/storage/v1/object/public/product-logos/u/b.jpg";
    assert.equal(
      resolveProductImagePath({
        product_image_path: null,
        product_image_url: url,
      }),
      "u/b.jpg",
    );
  });
});
