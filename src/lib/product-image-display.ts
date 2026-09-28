/** Prefer retention column; fall back to legacy seed/demo app_icon_url. */
export function resolveRequestProductImageUrl(row: {
  product_image_url?: string | null;
  app_icon_url?: string | null;
}): string | null {
  const url = row.product_image_url?.trim() || row.app_icon_url?.trim();
  return url || null;
}
