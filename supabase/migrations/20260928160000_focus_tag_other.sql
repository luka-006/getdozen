-- Add "Other" focus tag for posts that do not fit existing categories.

do $$ begin
  alter type public.focus_tag add value if not exists 'Other';
exception when duplicate_object then null;
end $$;
