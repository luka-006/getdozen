#!/usr/bin/env npx tsx
/**
 * Verify launch assets on a running dev server (no secrets).
 *   npm run dev -- -p 4317
 *   npx tsx scripts/verify-local-launch.ts
 */
const BASE = process.env.LOCAL_BASE_URL?.trim() ?? "http://127.0.0.1:4317";

async function check(path: string, expect = 200) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const ok = res.status === expect;
  console.log(`${ok ? "✓" : "✗"} ${res.status} ${path}`);
  return ok;
}

async function main() {
  const checks = [
    await check("/marketing/dozen-launch-preview.mp4"),
    await check("/marketing/dozen-launch-horizontal.mp4"),
    await check("/marketing/waitlist/board-testers.png"),
  ];
  const passed = checks.filter(Boolean).length;
  console.log(`\n${passed}/${checks.length} local asset checks passed`);
  if (passed !== checks.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
