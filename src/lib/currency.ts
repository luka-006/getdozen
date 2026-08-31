import { formatCredits } from "@/lib/utils";

/** Public currency name — change to "beads" / "bead" if you prefer that flavor. */
export const CURRENCY_UNIT = "dots";
export const CURRENCY_UNIT_SINGULAR = "dot";

export function currencyUnits(count: number | string): string {
  const n = Number(formatCredits(Number(count)));
  return Math.abs(n) === 1 ? CURRENCY_UNIT_SINGULAR : CURRENCY_UNIT;
}

/** e.g. "12 dots" or "1.5 dots" */
export function formatDots(value: number | string): string {
  const amount = formatCredits(Number(value));
  return `${amount} ${currencyUnits(amount)}`;
}

/** Shorter inline label, e.g. "+2 dots" */
export function formatDotsDelta(value: number | string): string {
  const n = Number(value);
  const prefix = n > 0 ? "+" : "";
  return `${prefix}${formatDots(Math.abs(n))}`;
}

/** Capitalized for buttons/titles: "Dots" */
export function currencyName(): string {
  return CURRENCY_UNIT.charAt(0).toUpperCase() + CURRENCY_UNIT.slice(1);
}

/** Stripe Checkout line item copy */
export function stripeDotsLineItem(count: number): {
  name: string;
  description: string;
} {
  const line = formatDots(count);
  return { name: `Dozen ${line}`, description: line };
}
