# Launch status (2026-09-11)

## Done

| Item | Evidence |
|------|----------|
| App live | [getdozen.dev](https://getdozen.dev) — launch mode, Join CTA |
| Unit tests | `npm test` — **102/102** (includes legal defaults) |
| Blog | 10 posts + `/guides` hub + tag index pages |
| SEO | Sitemap, JSON-LD, manifest, `llms.txt`, expanded metadata |
| Publishing tips | Common pitfalls panel on post forms |
| Waitlist PNGs | On prod: `/marketing/waitlist/*.png` |
| Launch videos on prod | Vertical 1.0MB + horizontal 1.5MB at `/marketing/dozen-launch-*.mp4` |
| CI asset build | `.github/workflows/build-launch-assets.yml` |
| Legal fix in code | Commit `9587a2c` — operator defaults in `src/lib/legal.ts` (no env required) |
| Social copy | `marketing/launch/social-posts.md`, `LAUNCH-NOW.md` |
| Waitlist email script | `scripts/send-waitlist-launch.ts` |

## Blocked

| Item | Blocker | Action |
|------|---------|--------|
| **Legal identity on prod** | **Vercel deployment rate limit** — commits `9587a2c`+ failed with "retry in 24 hours". Prod still on `eb86644`. | Vercel dashboard → **Deployments** → when limit clears, redeploy `9587a2c` (or push from local). Optional: set `LEGAL_*` env via `./scripts/set-legal-vercel.sh`. |
| **Waitlist blast** | No `.env.local` in cloud agent | Run locally with Supabase + Resend keys |
| **Prod smoke / cron** | Missing `CRON_SECRET`, `PREVIEW_LOGIN_EMAIL` | Run locally with `.env.local` |
| **Social posts** | Requires your X/LinkedIn login | Copy from `LAUNCH-NOW.md` |
| **Search Console** | Manual | Submit `https://getdozen.dev/sitemap.xml` |

## Prod audit

```bash
npm run audit:prod    # currently 11/12 — legal placeholder until deploy lands
```

Last run: 11/12 — legal placeholder (deploy pending, not missing env).

## Quick post (copy now)

Videos are live on prod — you can post before the legal deploy lands.

**X** — attach https://getdozen.dev/marketing/dozen-launch-preview.mp4

> Dozen is live — structured feedback and 14-day tester runs for indie apps and games.
>
> Post your work. Testers opt in, check in, earn Dots. Makers get real signal before launch.
>
> https://getdozen.dev

**LinkedIn** — attach https://getdozen.dev/marketing/dozen-launch-horizontal.mp4

Full thread + replies: `marketing/launch/LAUNCH-NOW.md`
