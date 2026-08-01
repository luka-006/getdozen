/**
 * Same-origin relative path only — blocks //evil, https://, backslashes.
 */
export function safeInternalPath(
  raw: unknown,
  fallback = "/board",
): string {
  const value = String(raw ?? "").trim();
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (value.includes("\\")) return fallback;
  if (value.includes("%2f%2f") || value.includes("%2F%2F")) return fallback;
  // Block protocol-relative encodings and null bytes
  if (value.includes("\0") || /[\r\n]/.test(value)) return fallback;
  return value;
}
