import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { resolveRequestOrigin } from "@/lib/app-url";
import { safeInternalPath } from "@/lib/safe-path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const next = safeInternalPath(searchParams.get("next"), "/board");
  const siteUrl = resolveRequestOrigin(request);
  const redirectTo = `${siteUrl}/auth/callback`;
  const cookieStore = await cookies();
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data.url) {
    const message = error?.message ?? "Google sign-in failed";
    return NextResponse.redirect(
      `${siteUrl}/login?error=${encodeURIComponent(message)}`,
    );
  }

  const response = NextResponse.redirect(data.url);
  response.cookies.set("dozen_auth_next", next, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: siteUrl.startsWith("https://"),
    maxAge: 60 * 10,
  });
  const secure = siteUrl.startsWith("https://");
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, secure });
  });
  return response;
}
