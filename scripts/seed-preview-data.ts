#!/usr/bin/env npx tsx
/**
 * Seed fictional demo board posts + active tester commitments (is_demo = true).
 * All names, URLs, icons, and studios are made up — nothing links to real products.
 *
 * Usage: npx tsx scripts/seed-preview-data.ts
 * Reseed: npx tsx scripts/seed-preview-data.ts --force
 * Clear:  npx tsx scripts/seed-preview-data.ts --clear
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { CORE_QUESTIONS, QUESTION_LIBRARY } from "../src/lib/constants";

const CHECKIN_INTERVAL_DAYS = 3;

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const clear = process.argv.includes("--clear");
const force = process.argv.includes("--force");

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// NOTE: Full file pushed via workspace - see commit for complete 747-line script
async function main() {
  console.error("Incomplete push - retry needed");
  process.exit(1);
}

main();
