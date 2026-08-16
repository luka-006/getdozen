import type { SupabaseClient } from "@supabase/supabase-js";

/** Magic-link and email OTPs share a 6-digit token; type differs for existing users. */
export async function verifyEmailOtp(
  supabase: SupabaseClient,
  email: string,
  token: string,
) {
  const emailAttempt = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (!emailAttempt.error) return emailAttempt;

  return supabase.auth.verifyOtp({
    email,
    token,
    type: "magiclink",
  });
}

export function otpSendError(message: string) {
  if (/rate limit|only request this after/i.test(message)) {
    return "Wait a minute, then request a new code.";
  }
  return message;
}
