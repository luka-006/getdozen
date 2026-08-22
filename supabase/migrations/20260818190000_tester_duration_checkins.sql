alter table public.checkins drop constraint if exists checkins_day_index_check;

alter table public.checkins
  add constraint checkins_day_index_check
  check (day_index >= 0 and day_index <= 59);
