#!/usr/bin/env npx tsx
/**
 * Seed fictional demo board posts + active tester commitments (is_demo = true).
 *
 * Usage: npx tsx scripts/seed-preview-data.ts
 * Reseed: npx tsx scripts/seed-preview-data.ts --force
 * Clear:  npx tsx scripts/seed-preview-data.ts --clear
 */
import { runSeedPreview } from "../src/lib/seed-preview-data";
import { loadEnvLocal } from "./lib/script-env";

loadEnvLocal();

const clear = process.argv.includes("--clear");
const force = process.argv.includes("--force");

runSeedPreview({ clear, force })
  .then((result) => {
    if (result.message) console.log(result.message);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
