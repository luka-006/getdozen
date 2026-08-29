#!/usr/bin/env npx tsx
/**
 * Send a test support email via Resend to SUPPORT_TO / ADMIN_OWNER_EMAIL.
 * Usage: npx tsx scripts/test-support-email.ts
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

async function main() {
  const { sendSupportEmail } = await import("../src/lib/support-mail");
  const { supportInbox } = await import("../src/lib/resend-mail");

  const inbox = supportInbox();
  const stamp = new Date().toISOString();

  const result = await sendSupportEmail({
    subject: "Support pipeline test",
    message: `Automated test from scripts/test-support-email.ts at ${stamp}.`,
    email: "test@getdozen.dev",
    page: "/scripts/test-support-email",
  });

  console.log("Inbox:", inbox);
  console.log(result.ok ? "Support email sent OK" : `Failed: ${result.error}`);

  if (!result.ok) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
