# Dozen launch checklist

## Pre-launch (product)

- [x] `npm test` — 101 unit tests green
- [x] `npm run audit:prod` — 11/12 (legal env pending)
- [ ] `npm run qa:smoke` against prod (needs `.env.local` + `PREVIEW_LOGIN_EMAIL`)
- [ ] `npx tsx scripts/verify-cron.ts https://getdozen.dev`
- [ ] Legal env on Vercel: `LEGAL_OIB`, `LEGAL_OPERATOR_NAME`, `LEGAL_ADDRESS`
- [ ] Turnstile keys set (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`)
- [ ] Stripe live mode + webhook receiving events
- [ ] Resend outbound + inbound MX verified (or subdomain workaround per README)

## Marketing assets

- [ ] Waitlist phone PNGs: `npx tsx scripts/capture-waitlist-phones.ts`
- [x] Launch videos on prod (`dozen-launch-preview.mp4` + horizontal)
- [ ] Optional: `npx tsx scripts/capture-waitlist-preview.ts` (3D showcase frame)
- [x] Commit assets: `public/marketing/waitlist/*.png`, `marketing/dozen-launch-preview.mp4`

## Launch mode

- [ ] `LAUNCH_OPEN=true` on Vercel (currently live)
- [ ] Optional soft gate: `INVITE_CODES=dozen-early,...`
- [ ] Waitlist blast: `npx tsx scripts/send-waitlist-launch.ts --dry-run` then send

## Post launch

- [ ] Post social copy from `marketing/launch/social-posts.md`
- [ ] Monitor PostHog + support inbox (`MAIL_FORWARD_TO`)
- [ ] Watch cron logs after 08:00 UTC

## Env for capture scripts

Copy `.env.example` → `.env.local` and set at minimum:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PREVIEW_LOGIN_EMAIL=
PREVIEW_BASE_URL=https://getdozen.dev
RESEND_API_KEY=
```
