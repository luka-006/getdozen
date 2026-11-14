import { resolveAppUrl } from "@/lib/app-url";

export function waitlistJoinLine(dots: number): string {
  return `Join the waitlist, get ${dots} Dots when we open.`;
}

export function inviteFriendsLine(dots: number): string {
  return `Invite friends, +${dots} Dots each.`;
}

export function pendingFriendsLine(count: number): string {
  return `${count} friends joined, pending until launch`;
}

export function referralShareUrl(code: string, origin?: string): string {
  const base = (origin ?? resolveAppUrl()).replace(/\/$/, "");
  return `${base}/?ref=${encodeURIComponent(code)}`;
}
