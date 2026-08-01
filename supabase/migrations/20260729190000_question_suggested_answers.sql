-- Suggested answer chips for reviewers (safe to read; unlike expected_answer).
alter table public.questions
  add column if not exists suggested_answers text[] not null default '{}';

revoke select on public.questions from authenticated, anon;
grant select (
  id, request_id, position, text, is_core, is_proof, suggested_answers
) on public.questions to authenticated;
