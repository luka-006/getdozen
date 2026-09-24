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

export type OtpSendError = {
  message: string;
  waitSeconds: number | null;
};

/** Parse Supabase rate-limit copy into a live countdown when possible. */
export function otpSendError(message: string): OtpSendError {
  const secondsMatch = message.match(
    /(?:after|wait)\s+(\d+)\s*(?:second|sec)/i,
  );
  const minutesMatch = message.match(
    /(?:after|wait)\s+(\d+)\s*(?:minute|min)/i,
  );

  let waitSeconds: number | null = null;
  if (secondsMatch) waitSeconds = Number(secondsMatch[1]);
  else if (minutesMatch) waitSeconds = Number(minutesMatch[1]) * 60;
  else if (/wait\s+a\s+minute|for\s+a\s+minute/i.test(message)) {
    waitSeconds = 60;
  } else if (/rate limit|only request this after/i.test(message)) {
    waitSeconds = 60;
  }

  if (waitSeconds != null && waitSeconds > 0) {
    return {
      message: `Wait ${waitSeconds} seconds, then try again.`,
      waitSeconds,
    };
  }

  return { message, waitSeconds: null };
}
