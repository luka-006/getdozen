import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  adminConsolePath,
  isAdminConsoleInternalPath,
  isLegacyAdminPath,
} from "@/lib/admin-console-path";
import { isLaunchOpen } from "@/lib/launch";
import { isPublicSeoPath } from "@/lib/seo";

function isLegalPath(path: string): boolean {
  return (
    path === "/privacy" ||
    path === "/terms" ||
    path.startsWith("/terms/") ||
    path === "/cookies" ||
    path === "/legal" ||
    path === "/contact"
  );
}

function isPublicPath(path: string): boolean {
  const isAuthRoute =
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/auth");

  return (
    path === "/" ||
    isAuthRoute ||
    isLegalPath(path) ||
    path.startsWith("/api/cron") ||
    path.startsWith("/api/resend") ||
    path.startsWith("/api/stripe") ||
    path === "/wall" ||
    path === "/guides" ||
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path.startsWith("/profile/") ||
    isPublicSeoPath(path)
  );
}

function isWaitlistOpenPath(path: string): boolean {
  return (
    path === "/" ||
    isLegalPath(path) ||
    path === "/guides" ||
    path === "/blog" ||
    path.startsWith("/blog/") ||
    path.startsWith("/waitlist") ||
    path.startsWith("/auth") ||
    path === "/login" ||
    path.startsWith("/login/") ||
    path.startsWith("/api/cron") ||
    path.startsWith("/api/stripe") ||
    isPublicSeoPath(path)
  );
}

function middlewareNeedsAuth(path: string): boolean {
  if (!isLaunchOpen()) {
    if (path === "/signup" || path.startsWith("/auth/google")) {
      return false;
    }
    return !isWaitlistOpenPath(path);
  }

  if (path.startsWith("/login") || path.startsWith("/signup")) {
    return true;
  }

  return !isPublicPath(path);
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (isLegacyAdminPath(path) || isAdminConsoleInternalPath(path)) {
    return new NextResponse(null, { status: 404 });
  }

  const consolePath = adminConsolePath();
  if (
    consolePath &&
    consolePath !== "/__console_unconfigured__" &&
    (path === consolePath || path.startsWith(`${consolePath}/`))
  ) {
    const suffix = path.slice(consolePath.length);
    const url = request.nextUrl.clone();
    url.pathname = `/admin-console${suffix}`;
    return NextResponse.rewrite(url);
  }

  if (path === "/setup" && process.env.NODE_ENV === "production") {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  if (!isLaunchOpen()) {
    if (path === "/signup" || path.startsWith("/auth/google")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!middlewareNeedsAuth(path)) {
      return NextResponse.next({ request });
    }
  } else if (!middlewareNeedsAuth(path)) {
    return NextResponse.next({ request });
  }

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

  if (!isLaunchOpen()) {
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

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (path === "/login" || path === "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = "/board";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|apple-icon|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
