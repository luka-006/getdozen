import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { resolveRequestOrigin } from "@/lib/app-url";
import { isLaunchOpen } from "@/lib/launch";
import { safeInternalPath } from "@/lib/safe-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { markWaitlistConfirmed } from "@/lib/waitlist";

const EMAIL_OTP_TYPES = new Set<string>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function asEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value || !EMAIL_OTP_TYPES.has(value)) return null;
  return value as EmailOtpType;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = asEmailOtpType(searchParams.get("type"));
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");
  const cookieStore = await cookies();
  const appOrigin = resolveRequestOrigin(request);
  let next = safeInternalPath(
    searchParams.get("next") ?? cookieStore.get("dozen_auth_next")?.value,
    isLaunchOpen() ? "/board" : "/waitlist/confirmed",
  );

  if (oauthError) {
    const description =
      oauthErrorDescription ?? oauthError ?? "Google sign-in was cancelled";
    return NextResponse.redirect(
      `${appOrigin}/login?error=${encodeURIComponent(description)}`,
    );
  }

  if (!code && !(tokenHash && otpType)) {
    if (!isLaunchOpen() || next.startsWith("/waitlist")) {
      return NextResponse.redirect(`${appOrigin}/auth/confirm?error=expired`);
    }
    return NextResponse.redirect(
      `${appOrigin}/login?error=${encodeURIComponent("Auth callback missing code")}`,
    );
  }

  const pendingCookies: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            pendingCookies.push({ name, value, options });
          });
        },
      },
    },
  );

  let user = null as Awaited<
    ReturnType<typeof supabase.auth.exchangeCodeForSession>
  >["data"]["user"];

  if (tokenHash && otpType) {
    let verified = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    // Older signup tokens sometimes verify only as type "email".
    if (verified.error && otpType === "signup") {
      verified = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "email",
      });
    }
    if (verified.error) {
      if (!isLaunchOpen() || next.startsWith("/waitlist")) {
        return NextResponse.redirect(`${appOrigin}/auth/confirm?error=expired`);
      }
      return NextResponse.redirect(
        `${appOrigin}/login?error=${encodeURIComponent(verified.error.message)}`,
      );
    }
    user = verified.data.user;
  } else if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      if (!isLaunchOpen() || next.startsWith("/waitlist")) {
        return NextResponse.redirect(`${appOrigin}/auth/confirm?error=expired`);
      }
      return NextResponse.redirect(
        `${appOrigin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
    user = data.user;
  }

  if (user) {
    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!existing) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Maker";
        await admin.from("profiles").insert({
          id: user.id,
          email: user.email ?? "",
          display_name: String(name).slice(0, 40),
        });
      }

      if (user.email && (!isLaunchOpen() || next.startsWith("/waitlist"))) {
        await markWaitlistConfirmed(user.email);
      }

      if (!isLaunchOpen() && !existing?.is_admin) {
        next = "/waitlist/confirmed";
        await supabase.auth.signOut();
      }
    } catch {
      // Non-fatal
    }
  }

  const redirectResponse = NextResponse.redirect(`${appOrigin}${next}`);
  redirectResponse.cookies.set("dozen_auth_next", "", {
    path: "/",
    maxAge: 0,
  });
  const secure = appOrigin.startsWith("https://");
  pendingCookies.forEach(({ name, value, options }) => {
    redirectResponse.cookies.set(name, value, { ...options, secure });
  });
  return redirectResponse;
}
