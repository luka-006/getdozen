-- Peer reviews on profiles (reputation from real interactions).
create table if not exists public.profile_reviews (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles (id) on delete cascade,
  to_user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 8 and 280),
  rating smallint check (rating is null or (rating between 1 and 5)),
  created_at timestamptz not null default now(),
  constraint profile_reviews_no_self check (from_user_id <> to_user_id),
  constraint profile_reviews_unique_pair unique (from_user_id, to_user_id)
);

create index if not exists profile_reviews_to_user_idx
  on public.profile_reviews (to_user_id, created_at desc);

alter table public.profile_reviews enable row level security;

drop policy if exists "profile_reviews_select" on public.profile_reviews;
create policy "profile_reviews_select"
  on public.profile_reviews for select
  to authenticated, anon
  using (true);

drop policy if exists "profile_reviews_insert_own" on public.profile_reviews;
create policy "profile_reviews_insert_own"
  on public.profile_reviews for insert
  to authenticated
  with check (from_user_id = auth.uid());

drop policy if exists "profile_reviews_update_own" on public.profile_reviews;
create policy "profile_reviews_update_own"
  on public.profile_reviews for update
  to authenticated
  using (from_user_id = auth.uid())
  with check (from_user_id = auth.uid());

drop policy if exists "profile_reviews_delete_own" on public.profile_reviews;
create policy "profile_reviews_delete_own"
  on public.profile_reviews for delete
  to authenticated
  using (from_user_id = auth.uid());

grant select on public.profile_reviews to anon, authenticated;
grant insert, update, delete on public.profile_reviews to authenticated;
