# Posting guide

**Live on prod (use these URLs when posting):**

- **Vertical video:** https://getdozen.dev/marketing/dozen-launch-preview.mp4 (1080×1920, ~1MB)
- **Horizontal video:** https://getdozen.dev/marketing/dozen-launch-horizontal.mp4 (1920×1080, ~1.5MB)

**Repo files (for re-upload or editing):**

- `public/marketing/dozen-launch-*.mp4`
- `public/marketing/waitlist/*.png`
- **Copy:** `marketing/launch/social-posts.md`
- **One-page runbook:** `marketing/launch/LAUNCH-NOW.md`

## Suggested order

1. **X thread** — Post 1 with video attached, then replies 2–3 from `social-posts.md`
2. **LinkedIn** — Horizontal video; link `https://getdozen.dev`
3. **Waitlist email** — GitHub Action, prod `curl` (see `LAUNCH-NOW.md`), or `npx tsx scripts/send-waitlist-launch.ts`
4. **Product Hunt / HN** — Use drafts in `social-posts.md` when you have bandwidth

## Re-generate assets

```bash
npx tsx scripts/capture-marketing-mockups.ts
npx tsx scripts/generate-launch-video.ts --mock
```

For prod-accurate UI, use auth + live site:

```bash
npx tsx scripts/capture-waitlist-phones.ts
npx tsx scripts/generate-launch-video.ts
```
