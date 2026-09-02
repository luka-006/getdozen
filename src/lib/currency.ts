import { formatCredits } from "@/lib/utils";

/** Internal unit id (Stripe metadata, form fields). Display via currencyUnits/formatDots. */
export const CURRENCY_UNIT = "dots";
export const CURRENCY_UNIT_SINGULAR = "Dot";
export const CURRENCY_UNIT_PLURAL = "Dots";

export function currencyUnits(count: number | string): string {
  const n = Number(formatCredits(Number(count)));
  return Math.abs(n) === 1 ? CURRENCY_UNIT_SINGULAR : CURRENCY_UNIT_PLURAL;
}

/** e.g. "12 Dots" or "1.5 Dots" */
export function formatDots(value: number | string): string {
  const amount = formatCredits(Number(value));
  return `${amount} ${currencyUnits(amount)}`;
}

/** Shorter inline label, e.g. "+2 Dots" */
export function formatDotsDelta(value: number | string): string {
  const n = Number(value);
  const prefix = n > 0 ? "+" : "";
  return `${prefix}${formatDots(Math.abs(n))}`;
}

/** For buttons/titles: "Dots" */
export function currencyName(): string {
  return CURRENCY_UNIT_PLURAL;
}

/** Stripe Checkout line item copy */
export function stripeDotsLineItem(count: number): {
  name: string;
  description: string;
} {
  const line = formatDots(count);
  return { name: `Dozen ${line}`, description: line };
}
