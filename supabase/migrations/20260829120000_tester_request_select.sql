-- Let testers read requests they joined, including expired/cancelled posts.
create policy "requests_select_tester_commitment"
  on public.requests for select to authenticated
  using (
    exists (
      select 1
      from public.tester_commitments c
      where c.request_id = id
        and c.tester_id = auth.uid()
    )
  );
