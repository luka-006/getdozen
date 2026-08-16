create or replace function public.credit_cost_for_questions(p_count integer)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case
    when p_count <= 15 then 1::numeric
    when p_count <= 25 then 1.5::numeric
    else 2::numeric
  end;
$$;

create or replace function public.is_launch_bonus_active()
returns boolean
language sql
stable
set search_path = public
as $$
  select coalesce(
    (current_setting('app.launch_started_at', true))::timestamptz,
    (select min(created_at) from public.profiles)
  ) > now() - interval '14 days'
    or (
      current_setting('app.launch_started_at', true) is null
      and exists (
        select 1 from public.profiles p
        where p.created_at > now() - interval '14 days'
      )
    );
$$;
