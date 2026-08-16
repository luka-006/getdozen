import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isLaunchOpen } from "@/lib/launch";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth");
  const isLegal =
    path === "/privacy" ||
    path === "/terms" ||
    path === "/cookies" ||
    path === "/legal";
  const isPublic =
    path === "/" ||
    isAuthRoute ||
    isLegal ||
    path.startsWith("/api/cron") ||
    path.startsWith("/api/stripe") ||
    path === "/wall" ||
    path === "/pricing" ||
    path.startsWith("/profile/");

  if (path === "/setup" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  if (!isLaunchOpen()) {
    const waitlistOpen =
      path === "/" ||
      isLegal ||
      path.startsWith("/waitlist") ||
      path.startsWith("/auth") ||
      path === "/login" ||
      path.startsWith("/login/") ||
      path.startsWith("/api/cron") ||
      path.startsWith("/api/stripe");

    if (path === "/signup" || path.startsWith("/auth/google")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!waitlistOpen) {
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.is_admin) {
          return supabaseResponse;
        }
      }
      return NextResponse.redirect(new URL("/", request.url));
    }

    return supabaseResponse;
  }

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (user && (path === "/login" || path === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/board";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
