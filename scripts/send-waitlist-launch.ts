#!/usr/bin/env npx tsx
/**
 * Email confirmed waitlist subscribers that Dozen is live.
 *
 *   npx tsx scripts/send-waitlist-launch.ts --dry-run
 *   npx tsx scripts/send-waitlist-launch.ts
 *   npx tsx scripts/send-waitlist-launch.ts --to you@example.com
 *
 * On production (uses Vercel env + CRON_SECRET):
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     "https://getdozen.dev/api/cron/waitlist-launch?dry_run=1"
 */
import { loadEnvLocal } from "./lib/script-env";
import {
  sendWaitlistLaunchEmails,
} from "../src/lib/waitlist-launch";

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");
const singleTo = (() => {
  const eq = process.argv.find((a) => a.startsWith("--to="));
  if (eq) return eq.slice(5).trim();
  const i = process.argv.indexOf("--to");
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1].trim();
  return undefined;
})();

async function main() {
  if (!dryRun && !process.env.RESEND_API_KEY?.trim()) {
    console.error("RESEND_API_KEY required unless --dry-run.");
    process.exit(1);
  }

  try {
    const result = await sendWaitlistLaunchEmails({ dryRun, singleTo });
    if (result.recipients.length === 0) {
      console.log("No confirmed waitlist emails to send.");
      return;
    }

    console.log(
      `${result.dryRun ? "[dry-run] " : ""}Sending to ${result.recipients.length} recipient(s)`,
    );
    if (result.dryRun) {
      result.recipients.slice(0, 5).forEach((e) => console.log("  ", e));
      if (result.recipients.length > 5) {
        console.log(`  … and ${result.recipients.length - 5} more`);
      }
      return;
    }

    for (const email of result.recipients) {
      console.log("sent", email);
    }
    console.log(`Done: ${result.sent} sent, ${result.failed} failed`);
    if (result.failed > 0) {
      result.errors.forEach((e) => console.error(e));
      process.exit(1);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main();
