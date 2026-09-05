-- Break RLS recursion: requests policies queried tester_commitments, whose policies
-- queried requests again (infinite recursion via PostgREST).

create or replace function public.user_owns_request(req_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requests
    where id = req_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.user_has_tester_commitment(req_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tester_commitments
    where request_id = req_id
      and tester_id = (select auth.uid())
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_admin
  );
$$;

create or replace function public.request_is_readable(req_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.requests
    where id = req_id
      and (
        status in ('open', 'in_progress', 'completed')
        or user_id = (select auth.uid())
      )
  );
$$;

revoke all on function public.user_owns_request(uuid) from public;
revoke all on function public.user_has_tester_commitment(uuid) from public;
revoke all on function public.current_user_is_admin() from public;
revoke all on function public.request_is_readable(uuid) from public;

grant execute on function public.user_owns_request(uuid) to authenticated;
grant execute on function public.user_has_tester_commitment(uuid) to authenticated;
grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.request_is_readable(uuid) to authenticated;

revoke execute on function public.user_owns_request(uuid) from anon;
revoke execute on function public.user_has_tester_commitment(uuid) from anon;
revoke execute on function public.current_user_is_admin() from anon;
revoke execute on function public.request_is_readable(uuid) from anon;

-- requests
drop policy if exists "requests_select_open_or_own" on public.requests;
create policy "requests_select_open_or_own"
  on public.requests for select to authenticated
  using (
    status in ('open', 'in_progress', 'completed')
    or user_id = (select auth.uid())
    or public.current_user_is_admin()
  );

drop policy if exists "requests_select_tester_commitment" on public.requests;
create policy "requests_select_tester_commitment"
  on public.requests for select to authenticated
  using (public.user_has_tester_commitment(id));

drop policy if exists "requests_update_own" on public.requests;
create policy "requests_update_own"
  on public.requests for update to authenticated
  using (
    user_id = (select auth.uid())
    or public.current_user_is_admin()
  );

-- questions
drop policy if exists "questions_select" on public.questions;
create policy "questions_select"
  on public.questions for select to authenticated
  using (public.request_is_readable(request_id));

drop policy if exists "questions_insert_own_request" on public.questions;
create policy "questions_insert_own_request"
  on public.questions for insert to authenticated
  with check (public.user_owns_request(request_id));

-- reviews
drop policy if exists "reviews_select_involved" on public.reviews;
create policy "reviews_select_involved"
  on public.reviews for select to authenticated
  using (
    reviewer_id = (select auth.uid())
    or public.user_owns_request(request_id)
    or public.current_user_is_admin()
  );

drop policy if exists "reviews_update_involved" on public.reviews;
create policy "reviews_update_involved"
  on public.reviews for update to authenticated
  using (
    reviewer_id = (select auth.uid())
    or public.user_owns_request(request_id)
    or public.current_user_is_admin()
  );

-- tester commitments
drop policy if exists "commitments_select_involved" on public.tester_commitments;
create policy "commitments_select_involved"
  on public.tester_commitments for select to authenticated
  using (
    tester_id = (select auth.uid())
    or public.user_owns_request(request_id)
  );

drop policy if exists "commitments_update_involved" on public.tester_commitments;
create policy "commitments_update_involved"
  on public.tester_commitments for update to authenticated
  using (
    tester_id = (select auth.uid())
    or public.user_owns_request(request_id)
  );

-- checkins
drop policy if exists "checkins_select_involved" on public.checkins;
create policy "checkins_select_involved"
  on public.checkins for select to authenticated
  using (
    exists (
      select 1
      from public.tester_commitments c
      where c.id = commitment_id
        and (
          c.tester_id = (select auth.uid())
          or public.user_owns_request(c.request_id)
        )
    )
  );

-- bug reports
drop policy if exists "bugs_select_related" on public.bug_reports;
create policy "bugs_select_related"
  on public.bug_reports for select to authenticated
  using (
    reporter_id = (select auth.uid())
    or public.user_owns_request(request_id)
  );
