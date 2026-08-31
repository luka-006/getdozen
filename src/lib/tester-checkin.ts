import {
  CHECKIN_EARN,
  CHECKIN_INTERVAL_DAYS,
  QUESTION_LIBRARY,
  TESTER_COMPLETION_EARN,
} from "@/lib/constants";
import { priorityPayout } from "@/lib/priority";
import { isLaunchBonusActive } from "@/lib/utils";

export { CHECKIN_INTERVAL_DAYS, CHECKIN_EARN, TESTER_COMPLETION_EARN };

/** Calendar day index since join (0 = first day). */
export function commitmentDayIndex(optedInAt: string, now = Date.now()): number {
  const start = new Date(optedInAt).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(0, Math.floor((now - start) / (24 * 60 * 60 * 1000)));
}

export function isCheckinDueDay(dayIndex: number): boolean {
  return dayIndex % CHECKIN_INTERVAL_DAYS === 0;
}

/** Which check-in slot this is (0 on day 0, 1 on day 3, …). */
export function checkinSlotIndex(dayIndex: number): number {
  return Math.floor(dayIndex / CHECKIN_INTERVAL_DAYS);
}

export function nextCheckinDayIndex(
  dayIndex: number,
  duration: number,
): number | null {
  if (isCheckinDueDay(dayIndex)) return dayIndex;
  let next =
    dayIndex + (CHECKIN_INTERVAL_DAYS - (dayIndex % CHECKIN_INTERVAL_DAYS));
  if (next >= duration) return null;
  return next;
}

export function canCheckInToday(opts: {
  optedInAt: string;
  durationDays: number;
  checkinDays: boolean[];
  status: string;
}): boolean {
  if (opts.status !== "active") return false;
  const duration = Math.max(1, opts.durationDays);
  const dayIndex = Math.min(duration - 1, commitmentDayIndex(opts.optedInAt));
  if (!isCheckinDueDay(dayIndex)) return false;
  const days = opts.checkinDays;
  return !days[dayIndex];
}

export function testerCheckinEarnAmount(
  bountyMultiplier = 1,
  launchBonus = isLaunchBonusActive(),
): number {
  let amount = priorityPayout(CHECKIN_EARN, bountyMultiplier);
  if (launchBonus) amount *= 2;
  return Number(amount.toFixed(2));
}

export function testerCompletionEarnAmount(
  bountyMultiplier = 1,
  launchBonus = isLaunchBonusActive(),
): number {
  let amount = priorityPayout(TESTER_COMPLETION_EARN, bountyMultiplier);
  if (launchBonus) amount *= 2;
  return Number(amount.toFixed(2));
}

/** Fallback when the request has no feedback questions (tester-only posts). */
export function fallbackCheckinPrompt(slotIndex: number): string {
  const pool = QUESTION_LIBRARY.flatMap((g) => g.questions);
  if (!pool.length) return "What did you notice in the app today?";
  return pool[slotIndex % pool.length] ?? pool[0]!;
}
