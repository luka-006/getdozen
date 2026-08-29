-- Track which suggested-answer chips reviewers clicked (for owner analytics).
alter table public.reviews
  add column if not exists chip_clicks jsonb not null default '{}'::jsonb;

comment on column public.reviews.chip_clicks is
  'Map of question_id -> array of chip labels clicked during review.';
