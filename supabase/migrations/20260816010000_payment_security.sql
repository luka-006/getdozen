-- Lock economy RPCs to service_role. CREATE OR REPLACE had restored PUBLIC EXECUTE.
revoke all on function public.ledger_insert(uuid, numeric, text, uuid, public.ledger_status, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.spend_credits(uuid, numeric, text, uuid) from public, anon, authenticated;
revoke all on function public.recompute_balances(uuid) from public, anon, authenticated;
revoke all on function public.release_pending_credits(uuid) from public, anon, authenticated;
revoke all on function public.escalate_bounties() from public, anon, authenticated;
revoke all on function public.auto_confirm_reviews() from public, anon, authenticated;
revoke all on function public.expire_credits() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

grant execute on function public.ledger_insert(uuid, numeric, text, uuid, public.ledger_status, timestamptz, timestamptz) to service_role;
grant execute on function public.spend_credits(uuid, numeric, text, uuid) to service_role;
grant execute on function public.recompute_balances(uuid) to service_role;
grant execute on function public.release_pending_credits(uuid) to service_role;
grant execute on function public.escalate_bounties() to service_role;
grant execute on function public.auto_confirm_reviews() to service_role;
grant execute on function public.expire_credits() to service_role;

-- Clients may only edit display fields. Economy/billing columns stay server-managed.
revoke update on table public.profiles from authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;

create table if not exists public.stripe_session_grants (
  session_id text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('credits', 'pro')),
  credits numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.stripe_session_grants enable row level security;
revoke all on table public.stripe_session_grants from public, anon, authenticated;
grant all on table public.stripe_session_grants to service_role;

revoke all on table public.stripe_events from public, anon, authenticated;
grant all on table public.stripe_events to service_role;

create or replace function public.protect_profile_economy()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and current_user in ('authenticated', 'anon')
    and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
    and (
      new.credits is distinct from old.credits
      or new.credits_pending is distinct from old.credits_pending
      or new.reviews_given is distinct from old.reviews_given
      or new.bugs_found is distinct from old.bugs_found
      or new.has_reviewed_once is distinct from old.has_reviewed_once
      or new.rating_avg is distinct from old.rating_avg
      or new.rating_count is distinct from old.rating_count
      or new.is_ramped is distinct from old.is_ramped
      or new.is_pro is distinct from old.is_pro
      or new.is_admin is distinct from old.is_admin
      or new.is_banned is distinct from old.is_banned
      or new.purchased_credits is distinct from old.purchased_credits
      or new.daily_review_count is distinct from old.daily_review_count
      or new.daily_review_date is distinct from old.daily_review_date
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    ) then
    raise exception 'Economy fields are server-managed';
  end if;
  return new;
end;
$$;
