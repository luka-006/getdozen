import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { waitlistMode } from "@/lib/launch";
import { createClient } from "@/lib/supabase/server";
import {
  INVITE_COOKIE,
  inviteCookieSecret,
  isAllowlistedAdminEmail,
  verifyInviteCookie,
} from "@/lib/waitlist-lock";

function hasSupabaseSessionCookie(
  all: { name: string }[],
): boolean {
  return all.some(
    (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
  );
}

/** Invite cookie or ADMIN_EMAILS / ADMIN_OWNER_EMAIL. A session alone is not enough. */
export async function hasWaitlistBypass(): Promise<boolean> {
  const jar = await cookies();
  if (await verifyInviteCookie(jar.get(INVITE_COOKIE)?.value, inviteCookieSecret())) {
    return true;
  }
  if (!hasSupabaseSessionCookie(jar.getAll())) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return isAllowlistedAdminEmail(user?.email);
  } catch {
    return false;
  }
}

/** Server components and server actions. No-op while the product is open. */
export async function assertProductAccess() {
  if (!waitlistMode()) return;
  if (await hasWaitlistBypass()) return;
  notFound();
}

/** Route handlers. Deny by default while the product is locked. */
export async function waitlistApiGuard(): Promise<NextResponse | null> {
  if (!waitlistMode()) return null;
  if (await hasWaitlistBypass()) return null;
  return new NextResponse(null, {
    status: 404,
    headers: {
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}
