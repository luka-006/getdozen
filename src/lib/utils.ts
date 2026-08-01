import { clsx, type ClassValue } from "clsx";
import { differenceInHours, formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCredits(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatWait(createdAt: string | Date): string {
  return formatDistanceToNowStrict(new Date(createdAt), { addSuffix: false });
}

/** Compact visceral wait label, e.g. "waiting 11h". */
export function formatWaitLabel(createdAt: string | Date): string {
  const hours = waitHours(createdAt);
  if (hours < 1) return "waiting <1h";
  if (hours < 48) return `waiting ${hours}h`;
  const days = Math.floor(hours / 24);
  return `waiting ${days}d`;
}

const UI_CONCRETE =
  /\b(button|screen|menu|page|tab|form|field|icon|list|modal|nav|sidebar|header|footer|link|toggle|dropdown|input|card|banner|toast|dialog|settings|dashboard|checkout|signup|sign[\s-]?up|login|onboarding|pricing|cta|avatar|search|filter|notification)\b/i;

/** Soft anti-slop: core Q1 should mention a concrete UI element. */
export function mentionsConcreteUi(answer: string): boolean {
  const text = answer.trim();
  if (!text) return false;
  if (UI_CONCRETE.test(text)) return true;
  if (/["“][^"”]{2,40}["”]/.test(text)) return true;
  return false;
}

export function waitHours(createdAt: string | Date): number {
  return Math.max(0, differenceInHours(new Date(), new Date(createdAt)));
}

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function answersTooSimilar(a: string, b: string): boolean {
  const left = normalizeAnswer(a);
  const right = normalizeAnswer(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const shorter = left.length < right.length ? left : right;
  const longer = left.length < right.length ? right : left;
  return longer.includes(shorter) && shorter.length / longer.length > 0.85;
}

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function isLaunchBonusActive(): boolean {
  const started = process.env.NEXT_PUBLIC_LAUNCH_STARTED_AT;
  if (!started) return true;
  const start = new Date(started).getTime();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - start < fourteenDays;
}
