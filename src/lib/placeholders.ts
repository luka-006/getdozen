import type { ProductType } from "@/lib/constants";

export const DESCRIPTION_EXAMPLES = [
  "Habit tracker for night-shift workers",
  "Split bills with roommates, no bank link",
  "Offline maps for hiking clubs",
  "Kids chore chart that pays allowance",
  "Voice notes that become tasks",
  "Shared grocery list for flatmates",
  "Simple invoice tool for freelancers",
  "Budget app that rounds up spare change",
] as const;

export const GAME_DESCRIPTION_EXAMPLES = [
  "Cozy roguelite about delivering parcels through asteroid lanes",
  "Puzzle game about routing signal packets with a friend",
  "Management sim about running a fantasy tavern",
  "Arcade time-trial racer with daily ghost challenges",
  "Deckbuilder set in a dying space station",
  "Local multiplayer party game for 2–4 players",
  "Narrative mystery on a small fishing island",
  "Turn-based tactics with permadeath mercenaries",
] as const;

export const TESTER_COUNT_OPTIONS = [12, 14, 16, 20, 24, 30, 50, 100] as const;

export function randomDescriptionExample(productType: ProductType = "app") {
  const pool =
    productType === "game" ? GAME_DESCRIPTION_EXAMPLES : DESCRIPTION_EXAMPLES;
  const i = Math.floor(Math.random() * pool.length);
  return pool[i]!;
}
