-- Waitlist launch bonus and referral codes.
-- Repo migration only. Do not apply this against production from the app deploy.

create or replace function public.normalize_email_identity(raw text)
returns text
language plpgsql
immutable
set search_path = public
as $fn$
declare
  trimmed text := lower(trim(coalesce(raw, '')));
  local_part text;
  domain_part text;
  at_pos int;
begin
  at_pos := length(trimmed) - position('@' in reverse(trimmed)) + 1;
  if at_pos <= 1 or at_pos >= length(trimmed) or position('@' in trimmed) = 0 then
    return trimmed;
  end if;
  local_part := substring(trimmed from 1 for at_pos - 1);
  domain_part := substring(trimmed from at_pos + 1);
  if position('+' in local_part) > 0 then
    local_part := split_part(local_part, '+', 1);
  end if;
  if domain_part = 'googlemail.com' then
    domain_part := 'gmail.com';
  end if;
  if domain_part = 'gmail.com' then
    local_part := replace(local_part, '.', '');
  end if;
  return local_part || '@' || domain_part;
end;
$fn$;

alter table public.waitlist
  add column if not exists email_normalized text,
  add column if not exists referral_code text,
  add column if not exists referred_by_waitlist_id uuid,
  add column if not exists referred_by_user_id uuid,
  add column if not exists bonus_claimed_at timestamptz,
  add column if not exists bonus_user_id uuid;

alter table public.profiles
  add column if not exists referral_code text;

do $fk$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'waitlist_referred_by_waitlist_id_fkey'
  ) then
    alter table public.waitlist
      add constraint waitlist_referred_by_waitlist_id_fkey
      foreign key (referred_by_waitlist_id) references public.waitlist (id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'waitlist_referred_by_user_id_fkey'
  ) then
    alter table public.waitlist
      add constraint waitlist_referred_by_user_id_fkey
      foreign key (referred_by_user_id) references public.profiles (id) on delete set null;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'waitlist_bonus_user_id_fkey'
  ) then
    alter table public.waitlist
      add constraint waitlist_bonus_user_id_fkey
      foreign key (bonus_user_id) references public.profiles (id) on delete set null;
  end if;
end;
$fk$;

create table if not exists public.referral_code_registry (
  code text primary key,
  email_normalized text not null unique,
  created_at timestamptz not null default now(),
  constraint referral_code_registry_format check (code ~ '^[2-9a-hj-km-np-z]{8}$')
);

create table if not exists public.referral_payouts (
  referred_user_id uuid primary key references public.profiles (id) on delete cascade,
  referred_email_normalized text not null unique,
  referrer_waitlist_id uuid references public.waitlist (id) on delete set null,
  referrer_user_id uuid references public.profiles (id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.referral_code_registry enable row level security;
alter table public.referral_payouts enable row level security;
revoke all on table public.referral_code_registry from public, anon, authenticated;
revoke all on table public.referral_payouts from public, anon, authenticated;
grant all on table public.referral_code_registry to service_role;
grant all on table public.referral_payouts to service_role;

-- One waitlist bonus per account. A second account with the same email is
-- stopped by bonus_claimed_at, which survives profile deletion.
create unique index if not exists credit_ledger_waitlist_bonus_uidx
  on public.credit_ledger (user_id)
  where reason = 'waitlist_bonus';

-- One referral payout per referred account.
create unique index if not exists credit_ledger_referral_bonus_uidx
  on public.credit_ledger (ref_id)
  where reason = 'referral_bonus';

create or replace function public.make_referral_code()
returns text
language plpgsql
volatile
set search_path = public
as $fn$
declare
  alphabet constant text := '23456789abcdefghjkmnpqrstuvwxyz';
  candidate text;
  i int;
  n int;
begin
  for n in 1..8 loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(
        alphabet,
        1 + floor(random() * length(alphabet))::int,
        1
      );
    end loop;
    if not exists (
      select 1 from public.referral_code_registry where code = candidate
    ) and not exists (
      select 1 from public.waitlist where referral_code = candidate
    ) and not exists (
      select 1 from public.profiles where referral_code = candidate
    ) then
      return candidate;
    end if;
  end loop;
  raise exception 'Could not allocate a referral code';
end;
$fn$;

create or replace function public.assign_referral_code(p_email text)
returns text
language plpgsql
volatile
set search_path = public
as $fn$
declare
  v_norm text := public.normalize_email_identity(p_email);
  v_existing text;
  v_code text;
  attempt int;
begin
  if v_norm is null or v_norm = '' then
    v_norm := 'missing';
  end if;

  select code into v_existing
  from public.referral_code_registry
  where email_normalized = v_norm;
  if v_existing is not null then
    return v_existing;
  end if;

  for attempt in 1..8 loop
    begin
      v_code := public.make_referral_code();
      insert into public.referral_code_registry (code, email_normalized)
      values (v_code, v_norm);
      return v_code;
    exception when unique_violation then
      select code into v_existing
      from public.referral_code_registry
      where email_normalized = v_norm;
      if v_existing is not null then
        return v_existing;
      end if;
    end;
  end loop;
  raise exception 'Could not allocate a referral code';
end;
$fn$;

-- Separate key so a pre-existing duplicate row can still hold its own code
-- without stealing the canonical person's code.
create or replace function public.mint_referral_code(p_registry_key text)
returns text
language plpgsql
volatile
set search_path = public
as $fn$
declare
  v_existing text;
  v_code text;
  attempt int;
begin
  select code into v_existing
  from public.referral_code_registry
  where email_normalized = p_registry_key;
  if v_existing is not null then
    return v_existing;
  end if;

  for attempt in 1..8 loop
    begin
      v_code := public.make_referral_code();
      insert into public.referral_code_registry (code, email_normalized)
      values (v_code, p_registry_key);
      return v_code;
    exception when unique_violation then
      select code into v_existing
      from public.referral_code_registry
      where email_normalized = p_registry_key;
      if v_existing is not null then
        return v_existing;
      end if;
    end;
  end loop;
  raise exception 'Could not allocate a referral code';
end;
$fn$;

create or replace function public.waitlist_guard_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  new.email_normalized := public.normalize_email_identity(new.email);
  if tg_op = 'UPDATE'
     and old.email_normalized is null
     and exists (
       select 1 from public.waitlist
       where email_normalized = new.email_normalized
         and id <> old.id
     ) then
    new.email_normalized := null;
  end if;

  if tg_op = 'INSERT' then
    if new.referral_code is null then
      new.referral_code := public.assign_referral_code(new.email);
    end if;
    return new;
  end if;

  if old.referral_code is not null then
    new.referral_code := old.referral_code;
  elsif new.referral_code is null then
    new.referral_code := public.assign_referral_code(new.email);
  end if;

  -- Once a referrer is stored, a later write cannot point the row at
  -- someone else. Clearing a column to null is allowed so ON DELETE SET NULL
  -- can drop a deleted account without losing the claim.
  if old.referred_by_waitlist_id is not null or old.referred_by_user_id is not null then
    if not (
      old.referred_by_waitlist_id is not null
      and new.referred_by_waitlist_id is null
    ) then
      new.referred_by_waitlist_id := old.referred_by_waitlist_id;
    end if;
    if not (
      old.referred_by_user_id is not null
      and new.referred_by_user_id is null
    ) then
      new.referred_by_user_id := old.referred_by_user_id;
    end if;
  end if;

  if old.bonus_claimed_at is not null then
    new.bonus_claimed_at := old.bonus_claimed_at;
    if new.bonus_user_id is not null
       and new.bonus_user_id is distinct from old.bonus_user_id then
      new.bonus_user_id := old.bonus_user_id;
    end if;
  end if;

  return new;
end;
$fn$;

drop trigger if exists waitlist_guard_write on public.waitlist;
create trigger waitlist_guard_write
  before insert or update on public.waitlist
  for each row execute function public.waitlist_guard_write();

create or replace function public.profiles_assign_referral_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op = 'INSERT' then
    if new.referral_code is null then
      new.referral_code := public.assign_referral_code(new.email);
    end if;
    return new;
  end if;

  if old.referral_code is not null then
    new.referral_code := old.referral_code;
  elsif new.referral_code is null then
    new.referral_code := public.assign_referral_code(new.email);
  end if;
  return new;
end;
$fn$;

drop trigger if exists profiles_assign_referral_code on public.profiles;
create trigger profiles_assign_referral_code
  before insert or update on public.profiles
  for each row execute function public.profiles_assign_referral_code();

-- Canonical identity wins. Later rows that fold to the same person keep a
-- null email_normalized so the unique index can be created. Their original
-- email stays for delivery.
with ranked as (
  select
    id,
    public.normalize_email_identity(email) as norm,
    row_number() over (
      partition by public.normalize_email_identity(email)
      order by created_at, id
    ) as n
  from public.waitlist
)
update public.waitlist w
set email_normalized = case when r.n = 1 then r.norm else null end
from ranked r
where w.id = r.id;

create unique index if not exists waitlist_email_normalized_uidx
  on public.waitlist (email_normalized)
  where email_normalized is not null;

do $backfill$
declare
  r record;
  v_code text;
begin
  for r in
    select id, email
    from public.waitlist
    where referral_code is null and email_normalized is not null
    order by created_at, id
  loop
    v_code := public.assign_referral_code(r.email);
    update public.waitlist
    set referral_code = v_code
    where id = r.id and referral_code is null;
  end loop;

  for r in
    select id
    from public.waitlist
    where referral_code is null
    order by created_at, id
  loop
    v_code := public.mint_referral_code('dup:' || r.id::text);
    update public.waitlist
    set referral_code = v_code
    where id = r.id and referral_code is null;
  end loop;

  for r in
    select id, email
    from public.profiles
    where referral_code is null
    order by created_at, id
  loop
    v_code := public.assign_referral_code(r.email);
    if exists (
      select 1 from public.profiles
      where referral_code = v_code and id <> r.id
    ) then
      v_code := public.mint_referral_code('profile:' || r.id::text);
    end if;
    update public.profiles
    set referral_code = v_code
    where id = r.id and referral_code is null;
  end loop;
end;
$backfill$;

alter table public.waitlist
  drop constraint if exists waitlist_referral_code_format;
alter table public.waitlist
  add constraint waitlist_referral_code_format
  check (referral_code ~ '^[2-9a-hj-km-np-z]{8}$');

alter table public.profiles
  drop constraint if exists profiles_referral_code_format;
alter table public.profiles
  add constraint profiles_referral_code_format
  check (referral_code is null or referral_code ~ '^[2-9a-hj-km-np-z]{8}$');

create unique index if not exists waitlist_referral_code_uidx
  on public.waitlist (referral_code);

create unique index if not exists profiles_referral_code_uidx
  on public.profiles (referral_code);

alter table public.waitlist alter column referral_code set not null;
alter table public.profiles alter column referral_code set not null;

-- "On the waitlist" matches dozen_reject_unlisted_signup: a waitlist row whose
-- lower(email) equals the account email. The bonus also requires confirmed_at
-- and trims both sides. Referral payouts are a separate claim in this same
-- transaction. Amounts and the referral cap are passed in so env parsing stays
-- in the app. ledger_insert still applies the existing 6-month default expiry.
create or replace function public.pay_referral(
  p_referrer uuid,
  p_referred uuid,
  p_amount integer,
  p_max integer
) returns integer
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_count integer;
  v_paid timestamptz;
begin
  if p_referrer is null or p_referred is null or p_referrer = p_referred then
    return 0;
  end if;
  if p_amount is null or p_amount <= 0 or p_max is null or p_max <= 0 then
    return 0;
  end if;

  perform 1 from public.profiles where id = p_referrer for update;

  select paid_at into v_paid
  from public.referral_payouts
  where referred_user_id = p_referred
  for update;

  if v_paid is not null then
    return 0;
  end if;

  select count(*) into v_count
  from public.credit_ledger
  where user_id = p_referrer
    and reason = 'referral_bonus'
    and amount > 0;

  if v_count >= p_max then
    return 0;
  end if;

  perform public.ledger_insert(
    p_referrer,
    p_amount,
    'referral_bonus',
    p_referred,
    'available',
    null,
    null
  );

  update public.referral_payouts
  set paid_at = now(),
      referrer_user_id = p_referrer
  where referred_user_id = p_referred
    and paid_at is null;

  return 1;
exception when unique_violation then
  return 0;
end;
$fn$;

create or replace function public.resolve_referrer_profile(
  p_user_id uuid,
  p_waitlist_id uuid
) returns uuid
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_id uuid;
  v_email text;
begin
  if p_user_id is not null and exists (
    select 1 from public.profiles where id = p_user_id
  ) then
    return p_user_id;
  end if;

  if p_waitlist_id is null then
    return null;
  end if;

  select email into v_email from public.waitlist where id = p_waitlist_id;
  if v_email is null then
    return null;
  end if;

  select id into v_id
  from public.profiles
  where lower(trim(email)) = lower(trim(v_email))
     or public.normalize_email_identity(email) = public.normalize_email_identity(v_email)
  order by created_at
  limit 1;
  return v_id;
end;
$fn$;

create or replace function public.grant_launch_rewards(
  p_user_id uuid,
  p_waitlist_bonus integer,
  p_referral_bonus integer,
  p_referral_max integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_email text;
  v_claimed uuid;
  v_referrer_waitlist uuid;
  v_referrer_user uuid;
  v_referrer_profile uuid;
  v_friend_email text;
  v_paid integer := 0;
  v_waitlist_granted boolean := false;
  r record;
begin
  select email into v_email
  from public.profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;

  if p_waitlist_bonus is not null and p_waitlist_bonus > 0 then
    update public.waitlist
    set bonus_claimed_at = now(),
        bonus_user_id = p_user_id
    where lower(trim(email)) = lower(trim(v_email))
      and confirmed_at is not null
      and bonus_claimed_at is null
    returning id into v_claimed;

    if v_claimed is not null then
      begin
        perform public.ledger_insert(
          p_user_id,
          p_waitlist_bonus,
          'waitlist_bonus',
          null,
          'available',
          null,
          null
        );
        v_waitlist_granted := true;
      exception when unique_violation then
        v_waitlist_granted := false;
      end;
    end if;
  end if;

  select email, referred_by_waitlist_id, referred_by_user_id
  into v_friend_email, v_referrer_waitlist, v_referrer_user
  from public.waitlist
  where lower(trim(email)) = lower(trim(v_email))
  order by created_at
  limit 1;

  if v_referrer_waitlist is not null or v_referrer_user is not null then
    v_referrer_profile := public.resolve_referrer_profile(v_referrer_user, v_referrer_waitlist);

    insert into public.referral_payouts (
      referred_user_id,
      referred_email_normalized,
      referrer_waitlist_id,
      referrer_user_id
    ) values (
      p_user_id,
      public.normalize_email_identity(coalesce(v_friend_email, v_email)),
      v_referrer_waitlist,
      v_referrer_profile
    )
    on conflict (referred_user_id) do nothing;

    if v_referrer_profile is not null then
      v_paid := v_paid + public.pay_referral(
        v_referrer_profile,
        p_user_id,
        p_referral_bonus,
        p_referral_max
      );
    end if;
  end if;

  for r in
    select referred_user_id
    from public.referral_payouts
    where paid_at is null
      and referred_user_id <> p_user_id
      and (
        referrer_user_id = p_user_id
        or referrer_waitlist_id in (
          select id from public.waitlist
          where lower(trim(email)) = lower(trim(v_email))
             or public.normalize_email_identity(email) = public.normalize_email_identity(v_email)
        )
      )
    order by created_at
    for update
  loop
    update public.referral_payouts
    set referrer_user_id = p_user_id
    where referred_user_id = r.referred_user_id
      and referrer_user_id is null;

    v_paid := v_paid + public.pay_referral(
      p_user_id,
      r.referred_user_id,
      p_referral_bonus,
      p_referral_max
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'waitlist_granted', v_waitlist_granted,
    'referral_paid', v_paid
  );
end;
$fn$;

create or replace function public.attach_waitlist_referral(p_email text, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_joiner uuid;
  v_joiner_email text;
  v_code text := lower(trim(coalesce(p_code, '')));
  v_owner_email text;
  v_waitlist uuid;
  v_user uuid;
begin
  if v_code = '' or v_code !~ '^[2-9a-hj-km-np-z]{8}$' then
    return;
  end if;

  select id, email into v_joiner, v_joiner_email
  from public.waitlist
  where email_normalized = public.normalize_email_identity(p_email)
     or lower(trim(email)) = lower(trim(p_email))
  order by email_normalized nulls last, created_at
  limit 1;

  if v_joiner is null then
    return;
  end if;

  select email into v_owner_email from public.waitlist where referral_code = v_code limit 1;
  if v_owner_email is null then
    select email into v_owner_email from public.profiles where referral_code = v_code limit 1;
  end if;
  if v_owner_email is null then
    return;
  end if;

  if public.normalize_email_identity(v_owner_email) = public.normalize_email_identity(v_joiner_email) then
    return;
  end if;

  select id into v_waitlist
  from public.waitlist
  where referral_code = v_code
     or public.normalize_email_identity(email) = public.normalize_email_identity(v_owner_email)
  order by (referral_code = v_code) desc, created_at
  limit 1;

  select id into v_user
  from public.profiles
  where referral_code = v_code
     or public.normalize_email_identity(email) = public.normalize_email_identity(v_owner_email)
  order by (referral_code = v_code) desc, created_at
  limit 1;

  if v_waitlist is null and v_user is null then
    return;
  end if;

  -- Prefer the code owner. The identity lookup can see a different row.
  select id into v_waitlist from public.waitlist where referral_code = v_code limit 1;
  select id into v_user from public.profiles where referral_code = v_code limit 1;

  if v_waitlist is null and v_user is null then
    select id into v_waitlist
    from public.waitlist
    where public.normalize_email_identity(email) = public.normalize_email_identity(v_owner_email)
    order by created_at
    limit 1;
    select id into v_user
    from public.profiles
    where public.normalize_email_identity(email) = public.normalize_email_identity(v_owner_email)
    order by created_at
    limit 1;
  end if;

  update public.waitlist
  set referred_by_waitlist_id = v_waitlist,
      referred_by_user_id = v_user
  where id = v_joiner
    and referred_by_waitlist_id is null
    and referred_by_user_id is null
    and id is distinct from v_waitlist;
end;
$fn$;

create or replace function public.pending_referral_count(
  p_user_id uuid default null,
  p_waitlist_id uuid default null
) returns integer
language sql
stable
security definer
set search_path = public
as $fn$
  select count(distinct w.id)::integer
  from public.waitlist w
  where (
    (p_user_id is not null and w.referred_by_user_id = p_user_id)
    or (p_waitlist_id is not null and w.referred_by_waitlist_id = p_waitlist_id)
    or (
      p_user_id is not null
      and w.referred_by_waitlist_id in (
        select mine.id
        from public.waitlist mine
        where public.normalize_email_identity(mine.email) = public.normalize_email_identity(
          (select email from public.profiles where id = p_user_id)
        )
        or lower(trim(mine.email)) = lower(trim(
          (select email from public.profiles where id = p_user_id)
        ))
      )
    )
  )
  and not exists (
    select 1
    from public.referral_payouts pay
    join public.profiles friend on friend.id = pay.referred_user_id
    where pay.paid_at is not null
      and (
        public.normalize_email_identity(friend.email) = public.normalize_email_identity(w.email)
        or lower(trim(friend.email)) = lower(trim(w.email))
      )
  );
$fn$;

create or replace function public.protect_profile_economy()
returns trigger
language plpgsql
set search_path = public
as $fn$
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
      or new.referral_code is distinct from old.referral_code
    ) then
    raise exception 'Economy fields are server-managed';
  end if;
  return new;
end;
$fn$;

revoke all on function public.normalize_email_identity(text) from public, anon, authenticated;
revoke all on function public.make_referral_code() from public, anon, authenticated;
revoke all on function public.assign_referral_code(text) from public, anon, authenticated;
revoke all on function public.mint_referral_code(text) from public, anon, authenticated;
revoke all on function public.waitlist_guard_write() from public, anon, authenticated;
revoke all on function public.profiles_assign_referral_code() from public, anon, authenticated;
revoke all on function public.pay_referral(uuid, uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.resolve_referrer_profile(uuid, uuid) from public, anon, authenticated;
revoke all on function public.grant_launch_rewards(uuid, integer, integer, integer) from public, anon, authenticated;
revoke all on function public.attach_waitlist_referral(text, text) from public, anon, authenticated;
revoke all on function public.pending_referral_count(uuid, uuid) from public, anon, authenticated;

grant execute on function public.grant_launch_rewards(uuid, integer, integer, integer) to service_role;
grant execute on function public.attach_waitlist_referral(text, text) to service_role;
grant execute on function public.pending_referral_count(uuid, uuid) to service_role;
