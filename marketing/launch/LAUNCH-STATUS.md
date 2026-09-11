# Launch status (2026-09-10)

## Done

| Item | Evidence |
|------|----------|
| App live | [getdozen.dev](https://getdozen.dev) — launch mode, Join CTA |
| Unit tests | `npm test` — 101/101 |
| Blog | 10 posts + `/guides` hub + tag index pages |
| SEO | Sitemap, JSON-LD, manifest, `llms.txt`, expanded metadata |
| Publishing tips | Common pitfalls panel on post forms |
| Waitlist PNGs | On prod: `/marketing/waitlist/*.png` |
| Launch video (vertical) | `marketing/dozen-launch-preview.mp4` (20s, 9:16) |
| Launch video (horizontal) | `marketing/dozen-launch-horizontal.mp4` (20s, 16:9, LinkedIn) |
| Social copy | `marketing/launch/social-posts.md` |
| Waitlist email script | `scripts/send-waitlist-launch.ts` |
| Public prod audit | `npm run audit:prod` — **9/11** (video + legal pending deploy/env) |
| Local asset verify | `npm run launch:verify-local` — 3/3 after `npm run dev` |
| Git bundle | `getdozen-launch.bundle` — 22 commits ahead of GitHub |

## Blocked (needs you)

| Item | Action |
|------|--------|
| **Push 22 commits** | `./scripts/push-launch.sh` or `./scripts/apply-launch-bundle.sh getdozen-launch.bundle` |
| **Legal identity on prod** | Set `LEGAL_OIB`, `LEGAL_OPERATOR_NAME`, `LEGAL_ADDRESS` on Vercel → redeploy |
| **Public launch videos** | Middleware fix in repo — MP4s return 307 on prod until deploy |
| **Waitlist blast** | `.env.local` + `npx tsx scripts/send-waitlist-launch.ts --dry-run` |
| **Prod smoke** | `PREVIEW_LOGIN_EMAIL` + Supabase keys → `npm run qa:smoke` |
| **Social posts** | Post from `social-posts.md` + attach `dozen-launch-preview.mp4` |
| **Search Console** | After push: submit `https://getdozen.dev/sitemap.xml` |

## After push — verify

```bash
npm run audit:prod    # target: 11/11
npm run launch:prep   # tests + audit + assets
```

## Quick post (copy now)

**X / LinkedIn:**

> Dozen is live — structured feedback and 14-day tester runs for indie apps and games.
>
> Post your work. Testers opt in, check in, earn Dots. Makers get real signal before launch.
>
> https://getdozen.dev

Attach `marketing/dozen-launch-preview.mp4` on X, Instagram, or TikTok.

Link `/guides` in your launch thread for SEO (Google Play, TestFlight, SaaS topics).
