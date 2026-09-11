# Launch status (2026-09-11)

## Done

| Item | Evidence |
|------|----------|
| App live | [getdozen.dev](https://getdozen.dev) — launch mode, Join CTA |
| Deploy | Vercel build fixed (corrupted `favicon.ico` restored on `master`) |
| Unit tests | `npm test` — 101/101 |
| Blog | 10 posts + `/guides` hub + tag index pages |
| SEO | Sitemap, JSON-LD, manifest, `llms.txt`, expanded metadata |
| Publishing tips | Common pitfalls panel on post forms |
| Waitlist PNGs | On prod: `/marketing/waitlist/*.png` |
| Launch video scripts | `generate-launch-video.ts` restored; `npm run launch:assets` |
| Social copy | `marketing/launch/social-posts.md` |
| Waitlist email script | `scripts/send-waitlist-launch.ts` (`--to email` fixed) |
| Public prod audit | `npm run audit:prod` — **11/12** (legal env pending) |
| Launch videos on prod | Vertical 1.0MB + horizontal 1.5MB at `/marketing/dozen-launch-*.mp4` |
| CI asset build | `.github/workflows/build-launch-assets.yml` — regenerates MP4s on push |

## Blocked (needs you)

| Item | Action |
|------|--------|
| **Legal identity on prod** | Vercel → `LEGAL_OIB`, `LEGAL_OPERATOR_NAME`, `LEGAL_ADDRESS`, `LEGAL_BUSINESS_FORM` → redeploy |
| **Waitlist blast** | `.env.local` + `npx tsx scripts/send-waitlist-launch.ts --dry-run` then send |
| **Prod smoke** | `PREVIEW_LOGIN_EMAIL` + Supabase keys → `npm run qa:smoke` |
| **Social posts** | Post from `social-posts.md` + attach `dozen-launch-preview.mp4` |
| **Search Console** | Submit `https://getdozen.dev/sitemap.xml` |

## Verify

```bash
npm run audit:prod    # target: 12/12 after LEGAL_OIB set
npm run launch:prep   # tests + audit + assets
npx tsx scripts/verify-cron.ts https://getdozen.dev
```

## Quick post (copy now)

**X / LinkedIn:**

> Dozen is live — structured feedback and 14-day tester runs for indie apps and games.
>
> Post your work. Testers opt in, check in, earn Dots. Makers get real signal before launch.
>
> https://getdozen.dev

Attach `marketing/dozen-launch-preview.mp4` on X, Instagram, or TikTok.  
LinkedIn: use `dozen-launch-horizontal.mp4` (16:9).

Link `/guides` in your launch thread for SEO (Google Play, TestFlight, SaaS topics).
