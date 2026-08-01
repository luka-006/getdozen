-- Dozen tracks expansion: play/testflight/language, bugs, language slots

-- Keep existing 'tester' as Play track in app code; add new enum values
do $$ begin
  alter type public.request_type add value if not exists 'play';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.request_type add value if not exists 'testflight';
exception when duplicate_object then null;
end $$;

do $$ begin
  alter type public.request_type add value if not exists 'language';
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists bugs_found integer not null default 0,
  add column if not exists has_reviewed_once boolean not null default false;

-- Backfill has_reviewed_once from reviews_given
update public.profiles
set has_reviewed_once = true
where reviews_given > 0 and has_reviewed_once = false;

alter table public.requests
  add column if not exists platform text,
  add column if not exists target_language text,
  add column if not exists duration_days integer;

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade,
  request_id uuid not null references public.requests(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  steps text not null,
  expected text not null,
  actual text not null,
  device text not null,
  os text not null,
  media_url text,
  status text not null default 'pending'
    check (status in ('pending', 'valid', 'invalid', 'duplicate')),
  duplicate_of uuid references public.bug_reports(id) on delete set null,
  auto_validate_at timestamptz not null,
  credits_awarded numeric(6,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists bug_reports_request_idx on public.bug_reports (request_id, status);
create index if not exists bug_reports_review_idx on public.bug_reports (review_id);

alter table public.bug_reports enable row level security;

drop policy if exists "bugs_select_related" on public.bug_reports;
create policy "bugs_select_related"
  on public.bug_reports for select
  to authenticated
  using (
    reporter_id = auth.uid()
    or exists (
      select 1 from public.requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

drop policy if exists "bugs_insert_own" on public.bug_reports;
create policy "bugs_insert_own"
  on public.bug_reports for insert
  to authenticated
  with check (reporter_id = auth.uid());

create table if not exists public.language_slots (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  target_language text not null,
  scope text not null check (scope in ('title', 'listing', 'listing_screens')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open'
    check (status in ('open', 'claimed', 'delivered', 'confirmed')),
  credit_cost numeric(6,2) not null,
  bounty_multiplier numeric(4,2) not null default 1,
  claimed_at timestamptz,
  auto_confirm_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists language_slots_board_idx
  on public.language_slots (status, created_at);

alter table public.language_slots enable row level security;

drop policy if exists "language_slots_select_auth" on public.language_slots;
create policy "language_slots_select_auth"
  on public.language_slots for select
  to authenticated
  using (true);

create table if not exists public.language_deliveries (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.language_slots(id) on delete cascade,
  corrections jsonb not null default '[]'::jsonb,
  search_terms text[] not null default '{}',
  title_suggestion text,
  subtitle_suggestion text,
  screenshot_fit_notes text,
  is_machine_translated boolean,
  copy_ready_block text not null,
  created_at timestamptz not null default now()
);

alter table public.language_deliveries enable row level security;

create table if not exists public.user_languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language text not null,
  level text not null check (level in ('native', 'fluent')),
  verified boolean not null default false,
  verified_at timestamptz,
  rating_avg numeric(4,2) not null default 0,
  unique (user_id, language)
);

alter table public.user_languages enable row level security;

drop policy if exists "user_languages_select_auth" on public.user_languages;
create policy "user_languages_select_auth"
  on public.user_languages for select
  to authenticated
  using (true);

drop policy if exists "user_languages_manage_own" on public.user_languages;
create policy "user_languages_manage_own"
  on public.user_languages for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

alter table public.tester_commitments
  add column if not exists platform text not null default 'android',
  add column if not exists duration_days integer not null default 14;

-- Protect new economy fields
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
