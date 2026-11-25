-- Additive early-access flag. Apply after
-- 20261114193000_waitlist_bonus_and_referrals.sql.
-- Does not edit that migration. Setting the flag does not send an invite;
-- invites stay on the manual /invite/<code> flow.

alter table public.waitlist
  add column if not exists early_access_requested boolean not null default false,
  add column if not exists early_access_requested_at timestamptz;

comment on column public.waitlist.early_access_requested is
  'The visitor asked to be considered for a manual early invite. Not a grant of access.';
comment on column public.waitlist.early_access_requested_at is
  'When early_access_requested was first set. Left unchanged on repeat requests.';
