# Deployment failures — what happened & how to avoid it

## Root cause (2026-09-11)

Three separate problems stacked on each other:

### 1. Vercel Hobby rate limit (current blocker)

**Symptom:** GitHub commit status shows  
`Deployment rate limited — retry in 24 hours.`

**Cause:** ~**52 production deployments in ~2 hours** (05:49–07:02 UTC). Hobby allows **100 deployments per rolling 24 hours** and **100 per hour**. Every `git push` to `master` triggers one build — including:

- Many small cloud-agent commits via GitHub MCP (one push per file batch)
- GitHub Actions `build-launch-assets` pushing video commits (each push → another deploy)
- Retries after build failures (each fix = another deploy)

**Fix:** Wait for the rolling window to clear (~24h from the burst). Then **one** redeploy of latest `master`. Do not push again until that deploy succeeds.

### 2. Real build failures (earlier today)

| Commit era | Failure | Cause |
|------------|---------|--------|
| Before `030e374` | Vercel build error | `favicon.ico` corrupted (45 bytes) — GitHub MCP UTF-8 push destroyed binary |
| `a76aa4e` | Build failed | Accidental `package.json` dependency downgrade in same push batch |
| GitHub Actions | Workflow failed | `npm ci` lockfile drift; fixed in `4ddbdba6` |

**Fix:** Never push binaries via GitHub MCP. Use git CLI or GitHub Actions for `.ico`, `.mp4`, `.png`. Batch text changes into **one commit per logical change**.

### 3. Accidental empty file (69937c6)

`scripts/audit-prod-public.ts` was pushed as **0 bytes** in a bad MCP batch. Restored in a follow-up commit.

---

## Rules going forward

1. **Batch commits** — one push per logical fix, not per file.
2. **No MCP push for binaries** — favicon, MP4, PNG.
3. **Wait for deploy** before pushing again during launch.
4. **Docs-only pushes** — `vercel.json` `ignoreCommand` skips builds when only `marketing/launch/` or README changes (saves quota).
5. **GitHub Actions** — workflow uses concurrency + only commits when video bytes actually change.
6. **Skip deploy in commit message** when you intentionally don't need a build: `[skip ci]` or `[ci skip]`.

---

## When rate limit clears

```bash
# From repo root, with git credentials:
git pull origin master
npm test && npm run build
git push origin master   # only if you have unpushed fixes

# Or: Vercel dashboard → getdozen → Deployments → Redeploy latest master
npm run audit:prod       # expect 12/12 after legal deploy (9587a2c+)
```

## Check deployment status

```bash
# GitHub commit status (no Vercel login needed)
curl -s "https://api.github.com/repos/luka-006/getdozen/commits/$(git rev-parse origin/master)/status" | jq '.state, .statuses[].description'
```
