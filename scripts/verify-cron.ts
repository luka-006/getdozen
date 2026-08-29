#!/usr/bin/env npx tsx
/**
 * Hit /api/cron with CRON_SECRET from .env.local (or env).
 * Usage: npx tsx scripts/verify-cron.ts [baseUrl]
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
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

loadEnvLocal();

const base = process.argv[2]?.trim() || process.env.NEXT_PUBLIC_SITE_URL || "https://getdozen.dev";
const secret = process.env.CRON_SECRET?.trim();

if (!secret) {
  console.error("CRON_SECRET missing. Set it in .env.local or the environment.");
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/api/cron`;

async function main() {
  const started = Date.now();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-cron-secret": secret!,
      Accept: "application/json",
    },
  });

  const body = await res.text();
  console.log(`POST ${url}`);
  console.log(`Status: ${res.status} (${Date.now() - started}ms)`);
  console.log(body || "(empty body)");

  if (!res.ok) process.exit(1);
  console.log("Cron OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
