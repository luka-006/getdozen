export type BoardTrackId = "tester" | "feedback" | "combo" | "language";

export type BoardSortId = "default" | "newest" | "oldest" | "bounty";

export function parseBoardTrack(value: string | null): BoardTrackId {
  if (value === "feedback") return "feedback";
  if (value === "combo") return "combo";
  if (value === "language") return "language";
  return "tester";
}

export function parseBoardSort(value: string | null): BoardSortId {
  if (value === "newest") return "newest";
  if (value === "oldest") return "oldest";
  if (value === "bounty") return "bounty";
  return "default";
}
