# getdozen

Two credit-powered marketplaces for indie developers: structured app feedback, and 14-day Google Play closed-test commitments.

Brand: **getdozen.app**

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Supabase Auth (email + Google), Postgres, RLS
- Server-side credit ledger (append-only; no client balance writes)
- Stripe (credits + Pro) — coming next

## Setup

1. Create a Supabase project and run `supabase/migrations/20260726120000_initial.sql`.
2. Enable Email and Google providers in Authentication.
3. Copy `.env.example` to `.env.local` and fill values.
4. `npm install` then `npm run dev`.

## Cron

`POST /api/cron` with header `x-cron-secret: $CRON_SECRET` runs bounty escalation, auto-confirm, credit expiry, and voided tester commitments.
