import {
  differenceInCalendarDays,
  formatDistanceStrict,
  formatDistanceToNowStrict,
} from "date-fns";
import type { CreditLedgerEntry } from "@/lib/types";

const REASON_LABELS: Record<string, string> = {
  stripe_purchase: "Bought Dots",
  receive_review: "Feedback post",
  recruit_testers: "Tester post",
  combo_request: "Combo pack",
  review_pending: "Review submitted",
  review_confirmed: "Review confirmed",
  tester_checkin: "Tester check-in",
  tester_completed: "Tester finished",
  first_review_gift: "Welcome gift",
  unused_tester_refund: "Unused slot refund",
  bug_report_award: "Bug report",
  review_bug_award: "Bug in review",
  admin_refund: "Refund",
  admin_credit: "Adjustment",
  admin_debit: "Adjustment",
  signup_bonus: "Signup bonus",
  board_boost: "Board boost",
};

export function ledgerReasonLabel(reason: string): string {
  const base = reason.split(":")[0] ?? reason;
  return REASON_LABELS[base] ?? base.replaceAll("_", " ");
}

export function ledgerWhen(iso: string): string {
  const date = new Date(iso);
  if (differenceInCalendarDays(new Date(), date) < 7) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function ledgerStatusHint(entry: CreditLedgerEntry): string | null {
  if (entry.status === "pending") {
    if (entry.available_at) {
      const when = new Date(entry.available_at);
      if (when > new Date()) {
        return `Pending · in ${formatDistanceStrict(when, new Date())}`;
      }
    }
    return "Pending";
  }
  if (entry.status === "voided") return "Voided";
  if (entry.status === "expired") return "Expired";
  if (entry.expires_at && entry.status === "available") {
    const exp = new Date(entry.expires_at);
    const days = differenceInCalendarDays(exp, new Date());
    if (days >= 0 && days <= 60) {
      return `Expires ${exp.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    }
  }
  return null;
}

export function ledgerRowMeta(entry: CreditLedgerEntry): {
  label: string;
  when: string;
  hint: string | null;
} {
  return {
    label: ledgerReasonLabel(entry.reason),
    when: ledgerWhen(entry.created_at),
    hint: ledgerStatusHint(entry),
  };
}
