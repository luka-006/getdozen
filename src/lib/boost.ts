import { BOOST_HOURS, BOOST_WAIT_DAYS } from "@/lib/constants";

export function boostWaitMs() {
  return BOOST_WAIT_DAYS * 24 * 60 * 60 * 1000;
}

export function isBoostActive(boostedUntil?: string | null, now = new Date()) {
  if (!boostedUntil) return false;
  return new Date(boostedUntil).getTime() > now.getTime();
}

export function canBuyBoardBoost(createdAt: string, now = new Date()) {
  return now.getTime() - new Date(createdAt).getTime() >= boostWaitMs();
}

export function boostedUntilFrom(from = new Date()) {
  return new Date(from.getTime() + BOOST_HOURS * 60 * 60 * 1000).toISOString();
}
