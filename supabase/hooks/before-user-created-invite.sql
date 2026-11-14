-- NOT APPLIED. Do not run this from CI.
--
-- Dozen cannot fully block Supabase Auth sign-ups from the Next.js app.
-- The public signUp / signInWithOtp APIs talk to Supabase directly.
--
-- Option A (breaks the waitlist email code):
--   Dashboard → Authentication → Sign In / Providers → Email
--   Turn off "Allow new users to sign up".
--   The waitlist form calls signInWithOtp({ shouldCreateUser: true }), so this
--   toggle also stops a new visitor from receiving a confirmation code.
--
-- Option B (keeps the waitlist form, blocks everyone else):
--   Dashboard → Authentication → Hooks → Before user created
--   Point the hook at public.dozen_reject_unlisted_signup below.
--   The waitlist action writes public.waitlist BEFORE it asks Supabase to
--   create the auth user, so that email is allowed. Any other new email is
--   rejected. Invite links do not live in this database; they only unlock the
--   Next.js app. Add owner emails to the array in the function if they must
--   be able to create an account before joining the waitlist.
--
-- Review the function, then create it yourself in the Supabase SQL editor.

create or replace function public.dozen_reject_unlisted_signup(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  email text := lower(coalesce(event->'user'->>'email', ''));
  allowed_emails text[] := array[
    'lukakasalo96@gmail.com'
  ];
begin
  if email = '' then
    return jsonb_build_object(
      'error', jsonb_build_object('message', 'Signup requires an email', 'http_code', 400)
    );
  end if;

  if email = any (allowed_emails) then
    return '{}'::jsonb;
  end if;

  if exists (
    select 1 from public.waitlist
    where lower(waitlist.email) = email
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object(
      'message', 'Dozen is not open for new accounts yet',
      'http_code', 403
    )
  );
end;
$$;

revoke all on function public.dozen_reject_unlisted_signup(jsonb) from public, anon, authenticated;
