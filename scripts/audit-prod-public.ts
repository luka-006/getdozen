#!/usr/bin/env npx tsx
/**
 * Public production audit — no secrets required.
 *   npx tsx scripts/audit-prod-public.ts
 *   PROD_BASE_URL=https://getdozen.dev npx tsx scripts/audit-prod-public.ts
 */
const BASE = process.env.PROD_BASE_URL?.trim() ?? "https://getdozen.dev";

type Check = { name: string; ok: boolean; detail: string };

async function head(path: string, expect = 200, strict = false) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const ok = strict
    ? res.status === expect
    : res.status === expect ||
      (expect === 200 && res.status >= 200 && res.status < 400);
  return { ok, detail: `${res.status} ${url}` };
}

/** Reject placeholder/corrupt uploads (GitHub MCP once wrote 68-byte stubs). */
async function assetMinBytes(path: string, minBytes: number, label: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const len = Number(res.headers.get("content-length") ?? 0);
  const ok = res.status === 200 && len >= minBytes;
  const detail = ok
    ? `${res.status} ${len} bytes ${url}`
    : `${res.status} ${len} bytes (need ≥${minBytes}) ${url}`;
  return { ok, detail, name: label };
}

async function bodyIncludes(path: string, needle: string) {
  const url = `${BASE}${path}`;
  const res = await fetch(url);
  const text = await res.text();
  const ok = res.ok && text.includes(needle);
  return { ok, detail: ok ? `found "${needle}"` : `missing "${needle}" on ${url}` };
}

async function main() {
  const checks: Check[] = [];

  for (const [path, label, expect] of [
    ["/", "homepage", 200],
    ["/pricing", "pricing", 200],
    ["/blog", "blog", 200],
    ["/signup", "signup", 200],
    ["/login", "login", 200],
    ["/legal", "legal", 200],
    ["/marketing/waitlist/board-testers.png", "waitlist asset", 200],
  ] as const) {
    const r = await head(path, expect, path.endsWith(".mp4"));
    checks.push({ name: label, ok: r.ok, detail: r.detail });
  }

  for (const [path, label, minBytes] of [
    ["/marketing/dozen-launch-preview.mp4", "launch video (vertical)", 500_000],
    [
      "/marketing/dozen-launch-horizontal.mp4",
      "launch video (horizontal)",
      500_000,
    ],
  ] as const) {
    const r = await assetMinBytes(path, minBytes, label);
    checks.push({ name: r.name, ok: r.ok, detail: r.detail });
  }

  const board = await head("/board", 307, true);
  checks.push({
    name: "board auth gate",
    ok: board.ok,
    detail: board.detail,
  });

  const legal = await bodyIncludes(
    "/legal",
    "Operator identity is published",
  );
  checks.push({
    name: "legal identity (warn if placeholder)",
    ok: !legal.ok,
    detail: legal.ok
      ? "placeholder still shown — set LEGAL_OIB on Vercel"
      : "operator line present",
  });

  const launch = await bodyIncludes("/", "Join");
  checks.push({
    name: "launch mode homepage",
    ok: launch.ok,
    detail: launch.detail,
  });

  let failed = 0;
  for (const c of checks) {
    const mark = c.ok ? "✓" : "✗";
    console.log(`${mark} ${c.name}: ${c.detail}`);
    if (!c.ok) failed++;
  }

  console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
