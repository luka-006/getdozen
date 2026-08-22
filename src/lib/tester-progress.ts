import { differenceInCalendarDays } from "date-fns";
import {
  MAX_TESTER_DAYS,
  MIN_TESTER_DAYS,
  TESTER_DAYS,
} from "@/lib/constants";

export function clampTesterDuration(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return TESTER_DAYS;
  return Math.min(MAX_TESTER_DAYS, Math.max(MIN_TESTER_DAYS, Math.round(n)));
}

/** One cube per calendar day since this tester joined, up to the posted length. */
export function testerCubes(opts: {
  durationDays: unknown;
  optedInAt: string;
  status: string;
}): { total: number; filled: number; label: string } {
  const total = clampTesterDuration(opts.durationDays);
  if (opts.status === "completed") {
    return { total, filled: total, label: `${total} of ${total} days` };
  }

  const start = new Date(opts.optedInAt);
  if (!Number.isFinite(start.getTime())) {
    return { total, filled: 0, label: `0 of ${total} days` };
  }

  const elapsed = differenceInCalendarDays(new Date(), start);
  const filled = Math.min(total, Math.max(0, elapsed + 1));
  return { total, filled, label: `${filled} of ${total} days` };
}

export function testerJoinedLabel(optedInAt: string) {
  const start = new Date(optedInAt);
  if (!Number.isFinite(start.getTime())) return "Join date unknown";
  return `Joined ${start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

export function testerStatusLabel(status: string) {
  if (status === "active") return "Active";
  if (status === "completed") return "Done";
  if (status === "voided") return "Voided";
  if (status === "cancelled") return "Cancelled";
  return status;
}
