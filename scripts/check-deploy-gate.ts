#!/usr/bin/env npx tsx
/**
 * Poll GitHub commit status until Vercel is not rate-limited.
 * Usage: npx tsx scripts/check-deploy-gate.ts [--wait]
 */
const REPO = "luka-006/getdozen";
const REF = process.env.DEPLOY_REF?.trim() || "master";

type StatusPayload = {
  state: string;
  statuses: { context: string; state: string; description: string }[];
};

async function fetchStatus(): Promise<StatusPayload> {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/commits/${REF}/status`,
    { headers: { Accept: "application/vnd.github+json" } },
  );
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  return res.json() as Promise<StatusPayload>;
}

function describe(payload: StatusPayload): {
  rateLimited: boolean;
  vercel: string;
} {
  const vercel = payload.statuses.find((s) => s.context === "Vercel");
  const desc = vercel?.description ?? "(no Vercel status)";
  const rateLimited = /rate limit/i.test(desc);
  return { rateLimited, vercel: desc };
}

async function main() {
  const wait = process.argv.includes("--wait");
  const intervalMs = Number(process.env.DEPLOY_POLL_MS ?? 300_000);

  for (;;) {
    const payload = await fetchStatus();
    const { rateLimited, vercel } = describe(payload);
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${REF} → ${payload.state}: ${vercel}`);

    if (!rateLimited) {
      console.log("\n✓ Rate limit clear. Redeploy now:");
      console.log("  Vercel dashboard → getdozen → Deployments → Redeploy master");
      console.log("  Then: npm run audit:prod");
      return;
    }

    if (!wait) {
      console.log("\nStill rate-limited. Re-run with --wait to poll every 5 min.");
      process.exit(1);
    }

    console.log(`  sleeping ${intervalMs / 1000}s…`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
