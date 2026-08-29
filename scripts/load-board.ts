#!/usr/bin/env npx tsx
/**
 * Simple board load check — fetches /board N times and reports timings.
 * Usage: npx tsx scripts/load-board.ts [baseUrl] [runs=10]
 */
export {};

const base = process.argv[2]?.trim() || "https://getdozen.dev";
const runs = Math.min(50, Math.max(1, Number(process.argv[3] ?? 10)));
const url = `${base.replace(/\/$/, "")}/board`;

const times: number[] = [];

async function main() {
  for (let i = 0; i < runs; i += 1) {
    const start = Date.now();
    const res = await fetch(url, { redirect: "manual" });
    times.push(Date.now() - start);
    if (res.status !== 200 && res.status !== 307 && res.status !== 302) {
      console.warn(`Run ${i + 1}: unexpected status ${res.status}`);
    }
  }

  times.sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / times.length);
  const p50 = times[Math.floor(times.length * 0.5)] ?? 0;
  const p95 = times[Math.floor(times.length * 0.95)] ?? times.at(-1) ?? 0;

  console.log(`GET ${url} × ${runs}`);
  console.log(
    `avg ${avg}ms · p50 ${p50}ms · p95 ${p95}ms · min ${times[0]}ms · max ${times.at(-1)}ms`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
