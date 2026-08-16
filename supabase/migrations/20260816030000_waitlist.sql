create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
revoke all on table public.waitlist from public, anon, authenticated;
grant all on table public.waitlist to service_role;

-- Waitlist magic-link users get a profile, not a signup bonus.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_waitlist boolean;
begin
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  v_waitlist := coalesce(new.raw_user_meta_data->>'waitlist', '') = 'true';

  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    v_name,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  if not v_waitlist then
    perform public.ledger_insert(new.id, 1, 'signup_bonus', null, 'available', now() + interval '6 months', null);
  end if;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

update public.profiles
set is_admin = true
where email = 'lukakasalo96@gmail.com';
