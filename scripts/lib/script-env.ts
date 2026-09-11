import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Load `.env.local` into `process.env` (does not override existing vars). */
export function loadEnvLocal(cwd = process.cwd()) {
  try {
    const raw = readFileSync(resolve(cwd, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // optional
  }
}

export function previewBaseUrl() {
  return process.env.PREVIEW_BASE_URL?.trim() ?? "https://getdozen.dev";
}
