#!/usr/bin/env node
/**
 * Optional one-shot promo seed during Vercel build when SEED_JOHN_ON_DEPLOY=1.
 * Uses production Supabase env vars already on Vercel.
 */
import { spawnSync } from "node:child_process";

if (process.env.SEED_JOHN_ON_DEPLOY !== "1") {
  process.exit(0);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("maybe-seed-john-on-deploy: missing Supabase env vars");
  process.exit(1);
}

function run(label, args) {
  console.log(`\n[maybe-seed-john-on-deploy] ${label}`);
  const result = spawnSync("npx", ["tsx", ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("seed-preview-data", ["scripts/seed-preview-data.ts", "--force"]);
run("seed-john-profile", ["scripts/seed-john-profile.ts", "--force"]);
console.log("\n[maybe-seed-john-on-deploy] done");
