import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  detectProductImageMime,
  productImageExtension,
  validateProductImage,
} from "./product-image";

function pngBuffer(): Uint8Array {
  return Uint8Array.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
}

function jpegBuffer(): Uint8Array {
  return Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
}

describe("product image validation", () => {
  it("maps allowed mime types to extensions", () => {
    assert.equal(productImageExtension("image/png"), "png");
    assert.equal(productImageExtension("image/jpeg"), "jpg");
    assert.equal(productImageExtension("text/plain"), null);
  });

  it("detects png and jpeg signatures", () => {
    assert.equal(detectProductImageMime(pngBuffer()), "image/png");
    assert.equal(detectProductImageMime(jpegBuffer()), "image/jpeg");
    assert.equal(detectProductImageMime(Uint8Array.from([0, 1, 2, 3])), null);
  });

  it("accepts a valid png under the size limit", () => {
    const file = { size: 1024, type: "image/png" };
    assert.equal(validateProductImage(file, pngBuffer()), null);
  });

  it("rejects oversize files", () => {
    const file = { size: PRODUCT_IMAGE_MAX_BYTES + 1, type: "image/png" };
    assert.match(
      validateProductImage(file, pngBuffer()) ?? "",
      /2 MB/i,
    );
  });

  it("rejects mismatched mime and bytes", () => {
    const file = { size: 1024, type: "image/jpeg" };
    assert.match(
      validateProductImage(file, pngBuffer()) ?? "",
      /supported image/i,
    );
  });

  it("rejects unsupported mime types", () => {
    const file = { size: 1024, type: "application/pdf" };
    assert.match(
      validateProductImage(file, Uint8Array.from([0x25, 0x50, 0x44, 0x46])) ??
        "",
      /JPEG, PNG, WebP, or GIF/i,
    );
  });
});
