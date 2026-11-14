import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { adminConsolePath } from "@/lib/admin-console-path";
import { isLaunchOpen, waitlistMode } from "@/lib/launch";
import {
  guardLoginRedirect,
  launchSessionRedirect,
} from "@/lib/middleware-auth";
import {
  INVITE_COOKIE,
  INVITE_COOKIE_MAX_AGE,
  evaluateRequest,
  inviteCodeMatches,
  inviteCookieSecret,
  isAllowlistedAdminEmail,
  isWaitlistAllowlisted,
  normalizeLockPath,
  signInviteCookie,
  verifyInviteCookie,
  type LockHeaders,
} from "@/lib/waitlist-lock";

function lockHeaders(request: NextRequest): LockHeaders {
  return {
    middlewareSubrequest: request.headers.get("x-middleware-subrequest"),
    nextAction: request.headers.get("next-action"),
    rsc: request.headers.get("rsc"),
    prefetch:
      request.headers.get("next-router-prefetch") ??
      request.headers.get("next-router-segment-prefetch"),
  };
}

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
}

function notFoundResponse(): NextResponse {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Not found</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#0b1f3a;font-family:ui-sans-serif,system-ui,sans-serif}main{max-width:28rem;padding:2rem;text-align:center}p{color:rgba(11,31,58,.7)}a{color:#1e4fd8}</style></head><body><main><p>404</p><h1>Not found</h1><p>That page does not exist or was removed.</p><p><a href="/">Home</a></p></main></body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

function continueWith(request: NextRequest, path: string) {
  request.headers.delete("x-middleware-subrequest");
  request.headers.set("x-dozen-pathname", path);
  return NextResponse.next({ request });
}

async function emailIsAllowlistedAdmin(request: NextRequest): Promise<boolean> {
  try {
    let supabaseResponse = continueWith(request, normalizeLockPath(request.nextUrl.pathname));
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
            supabaseResponse = continueWith(
              request,
              normalizeLockPath(request.nextUrl.pathname),
            );
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
    return isAllowlistedAdminEmail(user?.email);
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = normalizeLockPath(request.nextUrl.pathname);
  const method = request.method.toUpperCase();
  const launchOpen = isLaunchOpen();

  let unlocked = false;
  if (!launchOpen) {
    unlocked = await verifyInviteCookie(
      request.cookies.get(INVITE_COOKIE)?.value,
      inviteCookieSecret(),
    );
    if (
      !unlocked &&
      !isWaitlistAllowlisted(path, method) &&
      hasSupabaseSessionCookie(request)
    ) {
      unlocked = await emailIsAllowlistedAdmin(request);
    }
  }

  const decision = evaluateRequest({
    launchOpen,
    pathname: request.nextUrl.pathname,
    method,
    headers: lockHeaders(request),
    unlocked,
    production: process.env.NODE_ENV === "production",
    adminConsolePath: normalizeLockPath(adminConsolePath()),
  });

  if (decision.kind === "not-found") return notFoundResponse();

  if (decision.kind === "invite") {
    if (!inviteCodeMatches(decision.code) || !inviteCookieSecret()) {
      return notFoundResponse();
    }
    const token = await signInviteCookie(inviteCookieSecret()!);
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set(INVITE_COOKIE, token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: INVITE_COOKIE_MAX_AGE,
    });
    return response;
  }

  if (decision.kind === "redirect") {
    return NextResponse.redirect(new URL(decision.pathname, request.url));
  }

  if (decision.kind === "rewrite") {
    const url = request.nextUrl.clone();
    url.pathname = decision.pathname;
    return NextResponse.rewrite(url);
  }

  if (decision.kind === "next") return continueWith(request, path);

  let supabaseResponse = continueWith(request, path);
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
          supabaseResponse = continueWith(request, path);
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

  if (waitlistMode() && !unlocked) {
    return notFoundResponse();
  }

  const redirect = guardLoginRedirect(
    path,
    launchSessionRedirect(path, Boolean(user)),
  );
  if (redirect) {
    const url = request.nextUrl.clone();
    url.pathname = redirect.pathname;
    if (redirect.next !== undefined) {
      url.searchParams.set("next", redirect.next);
    } else {
      url.searchParams.delete("next");
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/:path*"],
};
