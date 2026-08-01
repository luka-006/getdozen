export const DESCRIPTION_EXAMPLES = [
  "Habit tracker for night-shift workers",
  "Split bills with roommates, no bank link",
  "Offline maps for hiking clubs",
  "Kids chore chart that pays allowance",
  "Local sports pickup games",
  "Voice notes that become tasks",
  "Shared grocery list for flatmates",
  "Simple invoice tool for freelancers",
] as const;

export const TESTER_COUNT_OPTIONS = [12, 14, 16, 20, 24, 30, 50, 100] as const;

export function randomDescriptionExample() {
  const i = Math.floor(Math.random() * DESCRIPTION_EXAMPLES.length);
  return DESCRIPTION_EXAMPLES[i]!;
}
