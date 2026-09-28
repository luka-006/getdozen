import type { SupabaseClient } from "@supabase/supabase-js";
import {
  PRODUCT_IMAGE_BUCKET,
  productImageExtension,
  validateProductImage,
} from "@/lib/product-image";

export async function uploadProductImageFromForm(
  formData: FormData,
  supabase: SupabaseClient,
  userId: string,
): Promise<{ url: string | null } | { error: string }> {
  const raw = formData.get("product_image");
  if (!raw || !(raw instanceof File) || raw.size === 0) {
    return { url: null };
  }

  const buffer = new Uint8Array(await raw.arrayBuffer());
  const validationError = validateProductImage(raw, buffer);
  if (validationError) {
    return { error: validationError };
  }

  const ext = productImageExtension(raw.type);
  if (!ext) {
    return { error: "Use JPEG, PNG, WebP, or GIF" };
  }

  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, buffer, {
      contentType: raw.type,
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
