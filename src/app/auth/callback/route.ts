import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveRequestOrigin } from "@/lib/app-url";
import { isLaunchOpen } from "@/lib/launch";
import { safeInternalPath } from "@/lib/safe-path";
import { createAdminClient } from "@/lib/supabase/admin";
import { markWaitlistConfirmed } from "@/lib/waitlist";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
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

  if (!code) {
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    if (!isLaunchOpen() || next.startsWith("/waitlist")) {
      return NextResponse.redirect(`${appOrigin}/auth/confirm?error=expired`);
    }
    return NextResponse.redirect(
      `${appOrigin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  if (data.user) {
    try {
      const admin = createAdminClient();
      const { data: existing } = await admin
        .from("profiles")
        .select("id, is_admin")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!existing) {
        const name =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split("@")[0] ||
          "Maker";
        await admin.from("profiles").insert({
          id: data.user.id,
          email: data.user.email ?? "",
          display_name: String(name).slice(0, 40),
        });
      }

      if (data.user.email && (!isLaunchOpen() || next.startsWith("/waitlist"))) {
        await markWaitlistConfirmed(data.user.email);
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
