# Posting guide

Assets ready in this repo:

- **Video (Reels/TikTok/X):** `marketing/dozen-launch-preview.mp4` (1080×1920, 20s)
- **Video (LinkedIn/desktop):** `marketing/dozen-launch-horizontal.mp4` (1920×1080, 20s)
- **Waitlist PNGs:** `public/marketing/waitlist/*.png`
- **Copy:** `marketing/launch/social-posts.md`

## Suggested order

1. **X thread** — Post 1 with video attached, then replies 2–3 from `social-posts.md`
2. **LinkedIn** — Same video or a horizontal cut; link `https://getdozen.dev`
3. **Waitlist email** — `npx tsx scripts/send-waitlist-launch.ts --dry-run` then send
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
