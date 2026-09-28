export const PRODUCT_IMAGE_BUCKET = "product-logos";
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const PRODUCT_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Magic-byte sniffing — MIME from the browser is not trusted alone. */
const SIGNATURES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
];

export function productImageExtension(mimeType: string): string | null {
  return EXTENSION_BY_MIME[mimeType] ?? null;
}

export function detectProductImageMime(buffer: Uint8Array): string | null {
  for (const sig of SIGNATURES) {
    if (sig.bytes.every((byte, i) => buffer[i] === byte)) {
      if (sig.mime === "image/webp") {
        const webpTag = [0x57, 0x45, 0x42, 0x50];
        if (!webpTag.every((byte, i) => buffer[8 + i] === byte)) continue;
      }
      return sig.mime;
    }
  }
  return null;
}

export function validateProductImage(
  file: Pick<File, "size" | "type">,
  buffer: Uint8Array,
): string | null {
  if (file.size <= 0) {
    return "Pick an image file";
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return "Image must be 2 MB or smaller";
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return "Use JPEG, PNG, WebP, or GIF";
  }

  const detected = detectProductImageMime(buffer);
  if (!detected || detected !== file.type) {
    return "That file does not look like a supported image";
  }

  return null;
}
