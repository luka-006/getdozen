import type { BoardSortId } from "@/lib/board-filters";
import { isBoostActive } from "@/lib/boost";
import { waitHours } from "@/lib/utils";

export type BoardSortRow = {
  bounty_multiplier: number | string;
  created_at: string;
  user_id: string;
  boosted_until?: string | null;
};

function bountyRank(row: BoardSortRow) {
  const n = Number(row.bounty_multiplier);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** Older posts rank higher (longer wait). Exact timestamps, not hour buckets. */
function longerWaitFirst(a: BoardSortRow, b: BoardSortRow) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function boostThenProThenWait(
  a: BoardSortRow,
  b: BoardSortRow,
  isPro: (userId: string) => boolean,
) {
  const aBoost = isBoostActive(a.boosted_until) ? 1 : 0;
  const bBoost = isBoostActive(b.boosted_until) ? 1 : 0;
  if (aBoost !== bBoost) return bBoost - aBoost;
  const aPro = isPro(a.user_id) ? 1 : 0;
  const bPro = isPro(b.user_id) ? 1 : 0;
  if (aPro !== bPro) return bPro - aPro;
  return longerWaitFirst(a, b);
}

/**
 * Default order: higher bounty, then longer wait.
 * Pro is only a tie-break when bounty and created_at match — it is a real
 * profile signal and must not bury an older post at the same bounty.
 * Explicit newest / oldest / bounty sorts stay independent of that default.
 */
export function compareBoardRows(
  a: BoardSortRow,
  b: BoardSortRow,
  sort: BoardSortId,
  isPro: (userId: string) => boolean,
) {
  if (sort === "newest") {
    return waitHours(a.created_at) - waitHours(b.created_at);
  }
  if (sort === "oldest") {
    return waitHours(b.created_at) - waitHours(a.created_at);
  }

  const byBounty = bountyRank(b) - bountyRank(a);
  if (sort === "bounty") {
    if (byBounty !== 0) return byBounty;
    return boostThenProThenWait(a, b, isPro);
  }

  if (byBounty !== 0) return byBounty;
  const byWait = longerWaitFirst(a, b);
  if (byWait !== 0) return byWait;
  const aPro = isPro(a.user_id) ? 1 : 0;
  const bPro = isPro(b.user_id) ? 1 : 0;
  return bPro - aPro;
}
