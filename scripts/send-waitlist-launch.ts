#!/usr/bin/env npx tsx
/**
 * Email confirmed waitlist subscribers that Dozen is live.
 *
 *   npx tsx scripts/send-waitlist-launch.ts --dry-run
 *   npx tsx scripts/send-waitlist-launch.ts
 *   npx tsx scripts/send-waitlist-launch.ts --to you@example.com
 */
import { createClient } from "@supabase/supabase-js";
import { loadEnvLocal } from "./lib/script-env";

loadEnvLocal();

const dryRun = process.argv.includes("--dry-run");
const singleTo = (() => {
  const eq = process.argv.find((a) => a.startsWith("--to="));
  if (eq) return eq.slice(5).trim();
  const i = process.argv.indexOf("--to");
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1].trim();
  return undefined;
})();

const SITE = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "https://getdozen.dev";

function launchEmailHtml() {
  return `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0b1f3a;max-width:520px">
  <p>Hi —</p>
  <p><strong>Dozen is open.</strong> Test apps and indie games, earn Dots for quality feedback, and post your own work for structured reviews from real testers.</p>
  <p style="margin:24px 0">
    <a href="${SITE}/signup" style="display:inline-block;background:#1e4fd8;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600">Create your account</a>
  </p>
  <p>Or browse the board first: <a href="${SITE}/board">${SITE}/board</a></p>
  <p style="color:#64748b;font-size:14px;margin-top:32px">You joined the waitlist at getdozen.dev. If you no longer want updates, reply to this email.</p>
</body></html>`;
}

function launchEmailText() {
  return `Dozen is open.

Test apps and indie games, earn Dots for quality feedback, and post your own work for structured reviews from real testers.

Create your account: ${SITE}/signup
Browse the board: ${SITE}/board

You joined the waitlist at getdozen.dev. Reply to this email if you no longer want updates.`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (!url || !serviceKey) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }
  if (!resendKey && !dryRun) {
    console.error("RESEND_API_KEY required unless --dry-run.");
    process.exit(1);
  }

  let recipients: string[] = [];
  if (singleTo) {
    recipients = [singleTo];
  } else {
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin
      .from("waitlist")
      .select("email")
      .not("confirmed_at", "is", null)
      .order("confirmed_at", { ascending: true });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    recipients = (data ?? []).map((r) => r.email as string);
  }

  if (recipients.length === 0) {
    console.log("No confirmed waitlist emails to send.");
    return;
  }

  console.log(`${dryRun ? "[dry-run] " : ""}Sending to ${recipients.length} recipient(s)`);
  if (dryRun) {
    recipients.slice(0, 5).forEach((e) => console.log("  ", e));
    if (recipients.length > 5) console.log(`  … and ${recipients.length - 5} more`);
    return;
  }

  const { sendResendEmail } = await import("../src/lib/resend-mail");
  const subject = "Dozen is open — test apps, earn Dots, get feedback";
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    const result = await sendResendEmail({
      to,
      subject,
      text: launchEmailText(),
      html: launchEmailHtml(),
    });
    if (result.ok) {
      sent++;
      console.log("sent", to);
    } else {
      failed++;
      console.error("failed", to, result.error);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Done: ${sent} sent, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
