# Dozen (getdozen.dev)

Credit-powered feedback and Google Play closed-test marketplace for indie developers.

**Production:** [https://getdozen.dev](https://getdozen.dev)

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase (Auth, Postgres, RLS)
- Stripe Checkout (credits, Pro, board boost)
- Resend (transactional email)
- Cloudflare Turnstile (bot checks)
- PostHog (product analytics)
- Vercel (hosting + daily cron)

## Local setup

1. Clone and `npm install`
2. Copy `.env.example` → `.env.local` and fill values (see below)
3. Apply Supabase migrations under `supabase/migrations/` (or link project: `npx supabase link`)
4. Enable **Email** + **Google** in Supabase Auth
5. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Required env vars

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/admin only |
| `CREDENTIALS_ENCRYPTION_KEY` | 32-byte secret for test credentials |
| `NEXT_PUBLIC_SITE_URL` | `https://getdozen.dev` |
| `CRON_SECRET` | Auth for `/api/cron` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Payments |
| `RESEND_API_KEY` / `RESEND_FROM` | Outbound from `hello@getdozen.dev` |
| `MAIL_FORWARD_TO` / `SUPPORT_TO` | Owner Gmail for support, bugs, inbound forwards |
| `RESEND_WEBHOOK_SECRET` | Verify `/api/resend/inbound` webhooks |

### Resend mail flow

1. **Outbound** (contact form, bugs, etc.): `hello@getdozen.dev` → your `MAIL_FORWARD_TO` inbox, with `Reply-To` set to the user.
2. **Inbound** (someone emails `hello@getdozen.dev`): Resend receives → webhook `POST /api/resend/inbound` → forwards to `MAIL_FORWARD_TO`.
3. **Reply from Gmail as hello@**: Gmail → Settings → Accounts → “Send mail as” → add `hello@getdozen.dev` via SMTP `smtp.resend.com`, username `resend`, password = `RESEND_API_KEY`.

### Resend inbound MX conflict

If Resend shows **“Conflicting MX records”** on `getdozen.dev`, your domain already has mail elsewhere (Google Workspace, etc.). Pick one:

1. **Subdomain (recommended):** Enable receiving on `mail.getdozen.dev` in Resend, point webhook alias there, and use `hello@mail.getdozen.dev` — or forward root `hello@` from your existing provider to Resend.
2. **Root domain:** Remove other MX records at your DNS host so only Resend’s `inbound-smtp…` MX remains (lowest priority number wins).

Until MX verifies, inbound mail to `hello@getdozen.dev` will not reach the webhook. Outbound (contact form, etc.) still works.
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` | Bot checks |
| `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST` | Analytics |

## Legal identity (you must fill — we cannot invent OIB)

Set these in Vercel before marketing paid features:

```
LEGAL_EMAIL=hello@getdozen.dev
LEGAL_OPERATOR_NAME=Your name or company d.o.o.
LEGAL_ADDRESS=Street, postal code, city, Croatia
LEGAL_OIB=12345678901
LEGAL_VAT_ID=HR12345678901   # if VAT registered, else leave empty
LEGAL_REGISTER=Trgovački sud … # if applicable
```

They render on [/legal](https://getdozen.dev/legal), Terms, Privacy, and checkout.

## Cron

Vercel runs `GET/POST /api/cron` daily at **08:00 UTC** (`vercel.json`).

Jobs: bounty escalation, tester slot refunds, auto-confirm reviews, credit expiry, void stale commitments, boost offer emails.

Verify locally or on prod:

```bash
npx tsx scripts/verify-cron.ts https://getdozen.dev
```

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run test` | Unit tests (`src/lib/*.test.ts`) |
| `npx tsx scripts/verify-cron.ts` | Ping cron endpoint |
| `npx tsx scripts/load-board.ts` | Simple board latency check |
| `npx tsx scripts/test-support-email.ts` | Send test support email via Resend |
| `npx tsx scripts/seed-preview-data.ts` | Demo board posts for preview video |
| `npx tsx scripts/seed-preview-data.ts --clear` | Remove demo posts |

## Supabase backup

- **Dashboard:** Project → Database → Backups (enable PITR on Pro plan)
- **Manual dump** (with linked CLI): `npx supabase db dump -f backup.sql`
- Store dumps off-repo; never commit secrets or full DB exports

## Soft launch

Set `INVITE_CODES=dozen-early,your-code` in Vercel to require a code at signup.

Set `LAUNCH_OPEN=false` to show waitlist only (admins still get in).

## Admin console

Configure `ADMIN_CONSOLE_PATH`, `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET`, `ADMIN_OWNER_EMAIL`. Direct URL only — not linked in nav.

## Deploy

Push to `master` on GitHub → Vercel auto-deploys `getdozen.dev`.
