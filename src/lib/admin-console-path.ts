/** Edge-safe admin console path helpers (no Node crypto). */

export function adminConsolePath(): string {
  const raw = process.env.ADMIN_CONSOLE_PATH?.trim();
  if (raw && raw.startsWith("/") && !raw.includes("..")) {
    return raw.replace(/\/+$/, "") || raw;
  }
  if (process.env.NODE_ENV === "production") {
    return "/__console_unconfigured__";
  }
  return "/dev-console";
}

export function isAdminConsoleInternalPath(pathname: string): boolean {
  return (
    pathname === "/admin-console" || pathname.startsWith("/admin-console/")
  );
}

export function isLegacyAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}
