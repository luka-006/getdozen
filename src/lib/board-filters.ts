export type BoardTrackId = "tester" | "feedback" | "combo" | "language";

export function parseBoardTrack(value: string | null): BoardTrackId {
  if (value === "feedback") return "feedback";
  if (value === "combo") return "combo";
  if (value === "language") return "language";
  return "tester";
}
