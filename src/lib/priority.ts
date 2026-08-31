/** Poster-chosen payout multiplier (also scales what they pay). */
export const PRIORITY_OPTIONS = [
  { value: 1, label: "1× Standard", hint: "Base cost & payout" },
  { value: 1.5, label: "1.5× Boost", hint: "50% more to helpers" },
  { value: 2, label: "2× Priority", hint: "Double payout" },
] as const;

export type PriorityMultiplier = (typeof PRIORITY_OPTIONS)[number]["value"];

const ALLOWED = new Set<number>(PRIORITY_OPTIONS.map((o) => o.value));

export function parsePriorityMultiplier(raw: unknown): PriorityMultiplier {
  const n = Number(raw);
  if (ALLOWED.has(n)) return n as PriorityMultiplier;
  return 1;
}

export function priorityCost(baseCredits: number, multiplier: number): number {
  return Number((baseCredits * multiplier).toFixed(2));
}

export function priorityPayout(baseCredits: number, multiplier: number): number {
  return Number((baseCredits * multiplier).toFixed(2));
}
