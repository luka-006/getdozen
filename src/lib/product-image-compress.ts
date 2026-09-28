/** Max edge length for uploaded product logos (client-side resize). */
export const PRODUCT_IMAGE_MAX_DIMENSION = 512;

/**
 * Resize and re-encode before upload to keep Supabase storage lean.
 * GIFs are left unchanged (animation). Falls back to the original when
 * compression fails or would grow the file.
 */
export async function compressProductImageForUpload(file: File): Promise<File> {
  if (file.type === "image/gif") {
    return file;
  }

  if (typeof createImageBitmap !== "function") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  const longest = Math.max(bitmap.width, bitmap.height);
  const scale =
    longest <= PRODUCT_IMAGE_MAX_DIMENSION
      ? 1
      : PRODUCT_IMAGE_MAX_DIMENSION / longest;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType =
    file.type === "image/png" || file.type === "image/webp"
      ? "image/webp"
      : "image/jpeg";
  const quality = outputType === "image/jpeg" ? 0.85 : 0.82;
  const ext = outputType === "image/jpeg" ? "jpg" : "webp";

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  if (!blob || blob.size >= file.size) {
    return file;
  }

  return new File([blob], `product.${ext}`, { type: outputType });
}
