import type { RequestRow } from "@/lib/types";
import { waitHours } from "@/lib/utils";

export function suggestNextReviewPosts(
  requests: RequestRow[],
  opts: {
    meId: string;
    reviewedIds: Set<string>;
    comboTakenIds: Set<string>;
    excludeRequestId?: string;
    limit?: number;
  },
): RequestRow[] {
  const limit = opts.limit ?? 3;

  const eligible = requests.filter((r) => {
    if (r.id === opts.excludeRequestId) return false;
    if (r.user_id === opts.meId) return false;
    if (opts.reviewedIds.has(r.id)) return false;
    if (r.status !== "open") return false;
    if (r.type !== "feedback" && r.type !== "combo") return false;
    if (r.type === "combo" && opts.comboTakenIds.has(r.id)) return false;
    return true;
  });

  eligible.sort((a, b) => {
    const aWait = waitHours(a.created_at);
    const bWait = waitHours(b.created_at);
    if (aWait >= 24 && bWait < 24) return -1;
    if (bWait >= 24 && aWait < 24) return 1;
    return bWait - aWait;
  });

  return eligible.slice(0, limit);
}
