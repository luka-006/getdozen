alter table public.tester_commitments
  add column if not exists final_notes text,
  add column if not exists experience_rating smallint
    check (
      experience_rating is null
      or (experience_rating >= 1 and experience_rating <= 5)
    );
