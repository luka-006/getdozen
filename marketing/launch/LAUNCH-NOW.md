# Launch now — Dozen (getdozen.dev)

**Status:** **12/12 prod checks** — app, videos, and legal identity live on getdozen.dev.

## Before you post (optional)

### Verify prod

```bash
npm run launch:execute       # tests + audit + assets + optional waitlist/cron/smoke
npm run launch:prep          # tests + audit + assets
npm run audit:prod           # 12/12
```

---

## Post launch (copy-paste ready)

### Video URLs (attach or link)

- **Vertical (X, TikTok, Reels):** https://getdozen.dev/marketing/dozen-launch-preview.mp4  
- **Horizontal (LinkedIn):** https://getdozen.dev/marketing/dozen-launch-horizontal.mp4  

Or download from `public/marketing/` in the repo.

### X thread

**Post 1** — attach vertical video

```
Dozen is live — a feedback loop for indie makers.

→ Post your app or game
→ 12 testers opt in for a 14-day run
→ Structured reviews, not "looks cool bro"

Test others. Earn Dots. Ship with proof.

https://getdozen.dev
```

**Post 2** (reply)

```
How it works:

1. Post a tester run or feedback request (apps + games)
2. Real testers opt in — check-ins every few days
3. Reviews are structured. Quality earns Dots.
4. Makers confirm → testers get paid in one credit currency

Built because friends nod along and Twitter is a mailing list.
```

**Post 3** (reply)

```
Shipping on Play Console closed test, TestFlight, Steam, or itch?

https://getdozen.dev/signup

Guides: https://getdozen.dev/guides
```

### LinkedIn

Attach horizontal video, then:

```
I shipped Dozen — a marketplace for structured app and game feedback.

Indie makers need more than "looks great!" from friends. They need:
• 12 committed testers (not 200 email addresses)
• 14-day runs with check-ins
• Reviews that answer real questions
• A credit system that rewards quality, not volume

Testers earn Dots. Makers get signal before launch.

Live now: https://getdozen.dev

If you're building mobile apps, web tools, or indie games — I'd love your feedback on the product itself.
```

---

## Waitlist email blast

**Option A — Production API** (after deploy; uses Vercel env + `CRON_SECRET`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://getdozen.dev/api/cron/waitlist-launch?dry_run=1"

curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://getdozen.dev/api/cron/waitlist-launch?dry_run=0"
```

**Option B — GitHub Actions** ([workflow](https://github.com/luka-006/getdozen/actions/workflows/send-waitlist-launch.yml); sign into GitHub; needs repo secrets):

Run with `dry_run: true`, then `dry_run: false`.

**Option C — local** (`.env.local` with Supabase + Resend):

```bash
npx tsx scripts/send-waitlist-launch.ts --dry-run
npx tsx scripts/send-waitlist-launch.ts --to you@example.com   # test one
npx tsx scripts/send-waitlist-launch.ts                        # full list
```

---

## After posting

- [ ] Submit sitemap: https://getdozen.dev/sitemap.xml (Google Search Console)
- [ ] `npx tsx scripts/verify-cron.ts https://getdozen.dev` (needs `CRON_SECRET` in env)
- [ ] `npm run qa:smoke` (needs `PREVIEW_LOGIN_EMAIL` + Supabase in `.env.local`)
- [ ] Monitor PostHog + `MAIL_FORWARD_TO` inbox

Full drafts: `marketing/launch/social-posts.md` (Product Hunt, HN).
