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
| Legal identity on prod | `/legal` shows Kasalo Digital + OIB — audit **12/12** |
| Social copy | `marketing/launch/social-posts.md`, `LAUNCH-NOW.md` |
| Waitlist email script | `scripts/send-waitlist-launch.ts` |

## Blocked (needs you)

| Item | Action |
|------|--------|
| **Waitlist blast** | `.env.local` + `npx tsx scripts/send-waitlist-launch.ts --dry-run` |
| **Prod smoke / cron** | `CRON_SECRET`, `PREVIEW_LOGIN_EMAIL` in `.env.local` |
| **Social posts** | Post from `LAUNCH-NOW.md` (X/LinkedIn login required) |
| **Search Console** | Submit `https://getdozen.dev/sitemap.xml` |

## Prod audit

```bash
npm run audit:prod    # 12/12
```

Last run: **12/12** — all public checks passing.

## Quick post (copy now)

Prod is launch-ready — post now.

**X** — attach https://getdozen.dev/marketing/dozen-launch-preview.mp4

> Dozen is live — structured feedback and 14-day tester runs for indie apps and games.
>
> Post your work. Testers opt in, check in, earn Dots. Makers get real signal before launch.
>
> https://getdozen.dev

**LinkedIn** — attach https://getdozen.dev/marketing/dozen-launch-horizontal.mp4

Full thread + replies: `marketing/launch/LAUNCH-NOW.md`
