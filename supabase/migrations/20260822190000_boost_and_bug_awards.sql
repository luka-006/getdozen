-- Board boost (€5 / 48h) plus bug-report credit awards.

alter table public.requests
  add column if not exists boosted_until timestamptz,
  add column if not exists boost_offer_sent_at timestamptz;

alter table public.site_bug_reports
  add column if not exists awarded_at timestamptz,
  add column if not exists awarded_credits numeric(10,2);

create index if not exists requests_boost_offer_idx
  on public.requests (created_at)
  where status = 'open' and boost_offer_sent_at is null;

create index if not exists requests_boosted_until_idx
  on public.requests (boosted_until)
  where boosted_until is not null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'stripe_session_grants_kind_check'
      and conrelid = 'public.stripe_session_grants'::regclass
  ) then
    alter table public.stripe_session_grants
      drop constraint stripe_session_grants_kind_check;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stripe_session_grants_kind_check'
      and conrelid = 'public.stripe_session_grants'::regclass
  ) then
    alter table public.stripe_session_grants
      add constraint stripe_session_grants_kind_check
      check (kind in ('credits', 'pro', 'boost'));
  end if;
end $$;

create or replace function public.credit_cost_for_questions(p_count integer)
returns numeric
language sql
immutable
set search_path = public
as $$
  select greatest(0, p_count)::numeric;
$$;

create or replace function public.protect_request_boost()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'role', current_setting('role', true), '')
     in ('service_role', 'postgres') then
    return new;
  end if;
  if new.boosted_until is distinct from old.boosted_until
    or new.boost_offer_sent_at is distinct from old.boost_offer_sent_at then
    raise exception 'Boost fields are server-managed';
  end if;
  return new;
end;
$$;

drop trigger if exists requests_protect_boost on public.requests;
create trigger requests_protect_boost
  before update on public.requests
  for each row execute function public.protect_request_boost();
