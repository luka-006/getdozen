#!/usr/bin/env npx tsx
/**
 * Pre-launch checklist runner — tests, audit, asset check.
 *   npx tsx scripts/launch-prep.ts
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();

function run(cmd: string, args: string[]) {
  console.log(`\n▶ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: false });
  return r.status === 0;
}

function file(path: string) {
  const ok = existsSync(resolve(root, path));
  console.log(`${ok ? "✓" : "✗"} ${path}`);
  return ok;
}

async function main() {
  console.log("Dozen launch prep\n");

  const assets = [
    "marketing/dozen-launch-preview.mp4",
    "marketing/dozen-launch-horizontal.mp4",
    "public/marketing/dozen-launch-preview.mp4",
    "public/marketing/dozen-launch-horizontal.mp4",
    "public/marketing/waitlist/board-testers.png",
    "public/marketing/waitlist/request-detail.png",
    "public/marketing/waitlist/review-form.png",
    "marketing/launch/social-posts.md",
  ];
  console.log("Assets:");
  const assetsOk = assets.every(file);

  const testsOk = run("npm", ["test"]);
  const auditOk = run("npx", ["tsx", "scripts/audit-prod-public.ts"]);

  const unpushed = spawnSync("git", ["log", "origin/master..HEAD", "--oneline"], {
    cwd: root,
    encoding: "utf8",
  });
  const ahead = (unpushed.stdout ?? "").trim().split("\n").filter(Boolean);
  if (ahead.length) {
    console.log(`\n⚠ ${ahead.length} commit(s) not on origin/master:`);
    ahead.forEach((line) => console.log(`  ${line}`));
    console.log("\n  Push: git push origin master");
  } else {
    console.log("\n✓ Branch matches origin/master");
  }

  console.log("\n--- Manual steps ---");
  console.log("1. Redeploy master on Vercel (legal defaults in src/lib/legal.ts → 12/12 audit)");
  console.log("   If rate-limited: see marketing/launch/DEPLOYMENTS.md");
  console.log("2. Post: marketing/launch/LAUNCH-NOW.md + video URLs on prod");
  console.log("3. Waitlist: npx tsx scripts/send-waitlist-launch.ts --dry-run");
  console.log("4. Smoke: npm run qa:smoke (needs .env.local)");

  if (!assetsOk || !testsOk || !auditOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
