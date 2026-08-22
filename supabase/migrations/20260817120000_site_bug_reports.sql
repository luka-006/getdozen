create table if not exists public.site_bug_reports (
  id uuid primary key default gen_random_uuid(),
  summary text not null,
  details text not null,
  email text,
  page text not null default '/',
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists site_bug_reports_created_idx
  on public.site_bug_reports (created_at desc);

create index if not exists site_bug_reports_user_id_idx
  on public.site_bug_reports (user_id);

alter table public.site_bug_reports enable row level security;

revoke all on table public.site_bug_reports from public, anon, authenticated;
grant all on table public.site_bug_reports to service_role;
