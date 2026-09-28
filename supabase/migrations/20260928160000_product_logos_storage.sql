-- Public bucket for optional product logos on request posts.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-logos',
  'product-logos',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_logos_public_read" on storage.objects;
create policy "product_logos_public_read"
on storage.objects for select
using (bucket_id = 'product-logos');

drop policy if exists "product_logos_insert_own" on storage.objects;
create policy "product_logos_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "product_logos_update_own" on storage.objects;
create policy "product_logos_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "product_logos_delete_own" on storage.objects;
create policy "product_logos_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-logos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
