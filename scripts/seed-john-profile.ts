#!/usr/bin/env npx tsx
/**
 * Seed promo / marketing mock data for john@getdozen.dev only.
 *
 * Usage:  npx tsx scripts/seed-john-profile.ts
 * Reseed: npx tsx scripts/seed-john-profile.ts --force
 * Clear:  npx tsx scripts/seed-john-profile.ts --clear
 * Dry:    npx tsx scripts/seed-john-profile.ts --dry-run
 */
import { runSeedJohnPromo } from "../src/lib/seed-john-promo";
import { loadEnvLocal } from "./lib/script-env";

loadEnvLocal();

const clear = process.argv.includes("--clear");
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

runSeedJohnPromo({ clear, force, dryRun })
  .then((result) => {
    if (result.message) console.log(result.message);
    if (result.skipped) process.exitCode = 0;
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
