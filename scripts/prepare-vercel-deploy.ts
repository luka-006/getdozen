#!/usr/bin/env npx tsx
/**
 * Emit deploy file list for Vercel MCP. Keeps source + public assets only.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = process.argv[2] ?? path.join(root, ".vercel-deploy-payload.json");

const SKIP_PREFIXES = [
  "marketing/clips/",
  "marketing/mockups/",
  "marketing/launch/",
  "scripts/",
  ".vercel",
];

const SKIP_FILES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "marketing/launch/LAUNCH-STATUS.md",
  "marketing/launch/SYNC-COMMITS.md",
  "marketing/launch/launch-checklist.md",
  "marketing/launch/posting-guide.md",
  "marketing/launch/social-posts.md",
]);

const files = execSync("git ls-files", { cwd: root, encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean)
  .filter(
    (f) =>
      !SKIP_PREFIXES.some((p) => f.startsWith(p)) && !SKIP_FILES.has(f),
  );

const payload = files.map((file) => {
  const abs = path.join(root, file);
  const buf = fs.readFileSync(abs);
  const isBinary = buf.includes(0);
  return {
    file,
    data: isBinary ? buf.toString("base64") : buf.toString("utf8"),
    encoding: isBinary ? ("base64" as const) : ("utf-8" as const),
  };
});

fs.writeFileSync(
  out,
  JSON.stringify({
    target: "production",
    name: "getdozen",
    teamId: "team_t46pX2JDkwURerJPmRnCU7Cg",
    files: payload,
  }),
);
const mb = fs.statSync(out).size / (1024 * 1024);
console.log(`Wrote ${payload.length} files (${mb.toFixed(2)} MB) → ${out}`);
