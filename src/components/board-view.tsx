"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { DayStrip } from "@/components/day-strip";
import { AppIcon } from "@/components/app-icon";
import { BoardFiltersMenu, type BoardFilters } from "@/components/board-filters-menu";
import { PLATFORMS, TESTER_DAYS, reviewEarnForQuestionCount } from "@/lib/constants";
import { PLATFORM_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/platform-labels";
import { PlatformIcon } from "@/components/platform-icon";
import { isBoostActive } from "@/lib/boost";
import { testerCubes } from "@/lib/tester-progress";
import { formatCredits, formatWaitLabel, waitHours } from "@/lib/utils";
import type { BoardSortId, BoardTrackId } from "@/lib/board-filters";
import type { Profile, RequestRow, TesterCommitment } from "@/lib/types";

type TrackId = BoardTrackId;

type OwnerProfile = Pick<
  Profile,
  | "id"
  | "display_name"
  | "avatar_url"
  | "is_pro"
  | "is_ramped"
  | "rating_avg"
  | "rating_count"
  | "reviews_given"
>;

type CommitmentRow = Pick<
  TesterCommitment,
  "request_id" | "opted_in_at" | "status" | "duration_days"
>;

const PLATFORM_LABEL = PLATFORM_LABELS;

function syncUrl(
  type: TrackId,
  filters: BoardFilters,
) {
  const params = new URLSearchParams();
  if (type !== "tester") params.set("type", type);
  if (filters.focus) params.set("focus", filters.focus);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.product) params.set("product", filters.product);
  if (filters.sort !== "default") params.set("sort", filters.sort);
  if (filters.boostedOnly) params.set("boosted", "1");
  const qs = params.toString();
  const next = qs ? `/board?${qs}` : "/board";
  window.history.replaceState(null, "", next);
}

type Props = {
  meId: string;
  requests: RequestRow[];
  profiles: OwnerProfile[];
  commitments: CommitmentRow[];
  initialType: TrackId;
  initialFocus?: string;
  initialPlatform?: string;
  initialProduct?: string;
  initialSort?: BoardSortId;
  initialBoosted?: boolean;
  reviewedRequestIds: string[];
  error?: string;
};

export function BoardView({
  meId,
  requests,
  profiles,
  commitments,
  initialType,
  initialFocus,
  initialPlatform,
  initialProduct,
  initialSort = "default",
  initialBoosted = false,
  reviewedRequestIds,
  error,
}: Props) {
  const [type, setType] = useState<TrackId>(initialType);
  const [filters, setFilters] = useState<BoardFilters>({
    focus: initialFocus,
    platform: initialPlatform,
    product: initialProduct,
    sort: initialSort,
    boostedOnly: initialBoosted,
  });

  const reviewedSet = useMemo(
    () => new Set(reviewedRequestIds),
    [reviewedRequestIds],
  );

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const myByRequest = useMemo(
    () => new Map(commitments.map((c) => [c.request_id, c])),
    [commitments],
  );

  const setTrack = useCallback(
    (next: TrackId) => {
      setType(next);
      syncUrl(next, filters);
    },
    [filters],
  );

  const setFiltersAndUrl = useCallback(
    (next: BoardFilters) => {
      setFilters(next);
      syncUrl(type, next);
    },
    [type],
  );

  const sorted = useMemo((): { active: RequestRow[]; done: RequestRow[] } => {
    if (type === "language") return { active: [], done: [] };

    let rows = requests.filter((r) => r.type === type);

    if (filters.focus) {
      rows = rows.filter((r) =>
        filters.focus === "Everything"
          ? r.focus_tag == null || r.focus_tag === "Everything"
          : r.focus_tag === filters.focus,
      );
    }

    if (
      filters.platform &&
      PLATFORMS.includes(filters.platform as (typeof PLATFORMS)[number])
    ) {
      rows = rows.filter((r) => r.platform === filters.platform);
    }

    if (filters.product === "app" || filters.product === "game") {
      rows = rows.filter((r) => (r.product_type ?? "app") === filters.product);
    }

    if (filters.boostedOnly) {
      rows = rows.filter((r) => isBoostActive(r.boosted_until));
    }

    const active: RequestRow[] = [];
    const done: RequestRow[] = [];
    for (const row of rows) {
      if (reviewedSet.has(row.id)) done.push(row);
      else active.push(row);
    }

    const sorter = (a: RequestRow, b: RequestRow) => {
      if (filters.sort === "newest") {
        return waitHours(a.created_at) - waitHours(b.created_at);
      }
      if (filters.sort === "oldest") {
        return waitHours(b.created_at) - waitHours(a.created_at);
      }
      if (filters.sort === "bounty") {
        const aBounty = Number(a.bounty_multiplier) || 1;
        const bBounty = Number(b.bounty_multiplier) || 1;
        if (aBounty !== bBounty) return bBounty - aBounty;
      }
      const aBoost = isBoostActive(a.boosted_until) ? 1 : 0;
      const bBoost = isBoostActive(b.boosted_until) ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      const aPro = profileMap.get(a.user_id)?.is_pro ? 1 : 0;
      const bPro = profileMap.get(b.user_id)?.is_pro ? 1 : 0;
      if (aPro !== bPro) return bPro - aPro;
      return waitHours(b.created_at) - waitHours(a.created_at);
    };

    active.sort(sorter);
    done.sort(sorter);

    return { active, done };
  }, [requests, type, filters, profileMap, reviewedSet]);

  const helpPeer = useMemo(() => {
    if (type === "language") return undefined;
    return sorted.active.find((r) => {
      if (r.user_id === meId) return false;
      if (reviewedSet.has(r.id)) return false;
      if (waitHours(r.created_at) >= 24) return false;
      const owner = profileMap.get(r.user_id);
      return owner && !owner.is_pro;
    });
  }, [sorted.active, meId, profileMap, type, reviewedSet]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <BoardHeader post={type !== "language"} />
      <TrackTabs active={type} onSelect={setTrack} />

      {error ? <p className="mt-4 text-[13px] text-flag">{error}</p> : null}

      {type === "language" ? (
        <div className="mt-10 max-w-[40rem] space-y-3 text-[15px] text-ink/75">
          <p>
            Language reviews are not open yet. This track is for store listing
            copy — title, description, and screenshots — checked by native
            speakers.
          </p>
          <p>
            Testers and Feedback are live. Switch tabs above to join a test or
            leave a review.
          </p>
        </div>
      ) : (
        <>
          {helpPeer ? (
            <Link href={`/requests/${helpPeer.id}`} className="board-row mt-6 block">
              <p className="text-[12px] uppercase tracking-[0.06em] text-ink/45">
                Help a peer
              </p>
              <p className="mt-1 font-medium">{helpPeer.app_name}</p>
              <p className="mt-0.5 text-[13px] text-ink/60">
                {formatWaitLabel(helpPeer.created_at)} · oldest open under 24h
              </p>
            </Link>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BoardFiltersMenu filters={filters} onChange={setFiltersAndUrl} />
            {sorted.done.length > 0 ? (
              <span className="text-[12px] text-ink/50">
                {sorted.done.length} reviewed by you
              </span>
            ) : null}
          </div>

          <div className="board-grid">
            {sorted.active.length === 0 && sorted.done.length === 0 ? (
              <p className="py-10 text-ink/70">Nothing waiting.</p>
            ) : (
              <>
                {sorted.active.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    owner={profileMap.get(request.user_id)}
                    type={type}
                    mine={myByRequest.get(request.id)}
                  />
                ))}
                {sorted.done.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    owner={profileMap.get(request.user_id)}
                    type={type}
                    mine={myByRequest.get(request.id)}
                    reviewed
                  />
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TrackTabs({
  active,
  onSelect,
}: {
  active: TrackId;
  onSelect: (id: TrackId) => void;
}) {
  const tabs: { id: TrackId; label: string; title?: string }[] = [
    { id: "tester", label: "Testers" },
    { id: "combo", label: "Dozen pack", title: "Testers + feedback pack" },
    { id: "feedback", label: "Feedback" },
  ];

  return (
    <div className="track-tabs mt-6">
      <div className="track-tabs-group" role="tablist" aria-label="Request tracks">
        {tabs.map(({ id, label, title }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              title={title}
              onClick={() => onSelect(id)}
              className={`track-tab${isActive ? " track-tab-active" : ""}`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <span
        className="track-tab track-tab-disabled"
        role="tab"
        aria-disabled="true"
        aria-label="Language — coming soon"
        title="Coming soon"
      >
        Language
        <span className="track-tab-soon">soon</span>
      </span>
    </div>
  );
}

function RequestCard({
  request,
  owner,
  type,
  mine,
  reviewed = false,
}: {
  request: RequestRow;
  owner?: OwnerProfile;
  type: TrackId;
  mine?: CommitmentRow;
  reviewed?: boolean;
}) {
  const wait = formatWaitLabel(request.created_at);
  const platformLabel = request.platform
    ? PLATFORM_LABEL[request.platform as keyof typeof PLATFORM_LABEL] ??
      request.platform
    : null;
  const duration =
    type === "feedback" ? null : request.duration_days ?? TESTER_DAYS;
  const payout =
    type === "feedback" || type === "combo"
      ? Number(request.bounty_multiplier) > 1
        ? formatCredits(
            reviewEarnForQuestionCount(request.question_count) *
              Number(request.bounty_multiplier),
          )
        : null
      : null;
  const cubes = duration
    ? mine
      ? testerCubes({
          durationDays: mine.duration_days ?? duration,
          optedInAt: mine.opted_in_at,
          status: mine.status,
        })
      : {
          total: duration,
          filled: 0,
          label: `0 of ${duration} days`,
        }
    : null;

  if (reviewed) {
    return (
      <div
        className="board-row board-row-reviewed"
        aria-disabled="true"
        title="You already reviewed this post"
      >
        <div className="grid grid-cols-[1fr_auto] items-start gap-4 opacity-55">
          <div className="flex min-w-0 gap-3">
            <AppIcon
              name={request.app_name}
              iconUrl={request.app_icon_url}
              className="mt-0.5 h-11 w-11 shrink-0 grayscale"
            />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{request.app_name}</span>
                <span className="text-[12px] text-ink/50">Reviewed</span>
              </div>
              <p className="truncate text-[13px] text-ink/65">
                {request.app_description}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/requests/${request.id}`} className="board-row">
      <div className="grid grid-cols-[1fr_auto] items-start gap-4">
        <div className="flex min-w-0 gap-3">
          <AppIcon
            name={request.app_name}
            iconUrl={request.app_icon_url}
            className="mt-0.5 h-11 w-11 shrink-0"
          />
          <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{request.app_name}</span>
            {request.product_type === "game" ? (
              <span className="rounded-[6px] bg-mist px-1.5 py-0.5 text-[11px] font-medium text-ink/70">
                {PRODUCT_TYPE_LABELS.game}
              </span>
            ) : null}
            {platformLabel ? (
              <span className="inline-flex items-center gap-1 text-[13px] text-ink/60">
                <PlatformIcon platform={request.platform ?? "web"} className="h-3.5 w-3.5" />
                {platformLabel}
              </span>
            ) : null}
            {request.focus_tag ? (
              <span className="text-[13px] text-ink/60">{request.focus_tag}</span>
            ) : null}
            {Number(request.bounty_multiplier) > 1 ? (
              <span className="rounded-[6px] bg-mist px-1.5 py-0.5 font-mono text-[12px] text-blue">
                {request.bounty_multiplier}×
              </span>
            ) : null}
            {payout ? (
              <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-[12px] text-ink">
                {payout}
              </span>
            ) : null}
            {isBoostActive(request.boosted_until) ? (
              <span className="text-[12px] text-blue">Boost</span>
            ) : owner?.is_pro ? (
              <span className="text-[12px] text-blue">Pro</span>
            ) : null}
          </div>
          <p className="truncate text-[13px] text-ink/65">
            {request.app_description}
          </p>
          <p className="text-[13px] text-ink/55">
            {owner?.display_name ?? "Maker"}
            {owner?.is_ramped ? " · Ramped" : ""}
            {owner && Number(owner.rating_count) > 0
              ? ` · ${Number(owner.rating_avg).toFixed(1)}★`
              : ""}
            {owner ? ` · ${owner.reviews_given ?? 0} reviews` : ""}
            {type === "feedback"
              ? ` · ${request.question_count}q`
              : type === "combo"
                ? ` · ${request.testers_filled}/${request.testers_needed} testers · ${request.question_count}q · ${duration}d`
                : ` · ${request.testers_filled}/${request.testers_needed} testers · ${duration}d`}
          </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[13px] text-ink/80">{wait}</p>
        </div>
      </div>
      {cubes ? (
        <div className="mt-3">
          <DayStrip total={cubes.total} filled={cubes.filled} label={cubes.label} />
        </div>
      ) : null}
    </Link>
  );
}

function BoardHeader({ post = true }: { post?: boolean }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">Live board</p>
        <h1 className="mt-2 font-display text-[34px] font-semibold leading-tight">
          Open feedback & tests
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink/65">
          Pick an app or game, leave structured feedback, or join a tester run.
        </p>
      </div>
      {post ? (
        <Link href="/requests/new" className="btn btn-primary">
          Post feedback
        </Link>
      ) : null}
    </div>
  );
}

