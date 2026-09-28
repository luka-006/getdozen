-- Retention-friendly product image columns for Supabase storage cleanup cron.
alter table public.requests
  add column if not exists product_image_url text,
  add column if not exists product_image_path text;

comment on column public.requests.product_image_path is
  'Object key in the product-logos bucket (user uploads only). Retention cron deletes via storage.remove([path]).';
comment on column public.requests.product_image_url is
  'Public display URL. Supabase storage for uploads; external URLs for seeded demo posts.';

-- Backfill display URLs from the earlier app_icon_url column.
update public.requests
set product_image_url = app_icon_url
where product_image_url is null
  and app_icon_url is not null;

-- Batch lookup for retention cleanup: expired/completed rows with stored objects.
create index if not exists requests_product_image_retention_idx
  on public.requests (status, expires_at)
  where product_image_path is not null;
