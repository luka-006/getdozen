-- Games as a product type + Gameplay focus for game feedback posts.

alter table public.requests
  add column if not exists product_type text not null default 'app';

do $$ begin
  alter type public.focus_tag add value if not exists 'Gameplay';
exception when duplicate_object then null;
end $$;
