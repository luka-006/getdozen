-- Stripe + public wall support

alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique;

create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

-- Public read for shipped wall (anon + authenticated)
drop policy if exists "shipped_select_all" on public.shipped_apps;
drop policy if exists "shipped_select_public" on public.shipped_apps;
create policy "shipped_select_public"
  on public.shipped_apps for select
  to anon, authenticated
  using (true);

grant select on public.shipped_apps to anon;

-- Public profile read for names on the wall
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  to anon, authenticated
  using (not is_banned or id = auth.uid());

grant select on public.profiles to anon;

-- Allow service_role / SECURITY DEFINER paths to update economy + billing fields
create or replace function public.protect_profile_economy()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
    and current_user in ('authenticated', 'anon')
    and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role'
    and (
      new.credits is distinct from old.credits
      or new.credits_pending is distinct from old.credits_pending
      or new.reviews_given is distinct from old.reviews_given
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
