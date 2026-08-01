-- Demo flag (admin/seed only). Never trust user-controlled app_name.
alter table public.requests
  add column if not exists is_demo boolean not null default false;

-- Peer reviews: no direct client writes — server action uses service role after interaction check.
drop policy if exists "profile_reviews_insert_own" on public.profile_reviews;
drop policy if exists "profile_reviews_update_own" on public.profile_reviews;
drop policy if exists "profile_reviews_delete_own" on public.profile_reviews;

revoke insert, update, delete on public.profile_reviews from authenticated;
