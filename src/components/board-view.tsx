"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { DayStrip } from "@/components/day-strip";
import { AppIcon } from "@/components/app-icon";
import { PLATFORMS, TESTER_DAYS, FOCUS_TAGS, reviewEarnForQuestionCount } from "@/lib/constants";
import { PLATFORM_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/platform-labels";
import { PlatformIcon } from "@/components/platform-icon";
import { isBoostActive } from "@/lib/boost";
import { testerCubes } from "@/lib/tester-progress";
import { formatCredits, formatWaitLabel, waitHours } from "@/lib/utils";
import type { BoardTrackId } from "@/lib/board-filters";
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

const FOCUS_FILTER_TAGS = FOCUS_TAGS;

function filterChipClass(active: boolean) {
  return active ? "filter-chip filter-chip-active" : "filter-chip";
}

function syncUrl(type: TrackId, focus?: string, platform?: string) {
  const params = new URLSearchParams();
  if (type !== "tester") params.set("type", type);
  if (focus) params.set("focus", focus);
  if (platform) params.set("platform", platform);
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
  error,
}: Props) {
  const [type, setType] = useState<TrackId>(initialType);
  const [focus, setFocus] = useState<string | undefined>(initialFocus);
  const [platform, setPlatform] = useState<string | undefined>(initialPlatform);

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
      syncUrl(next, focus, platform);
    },
    [focus, platform],
  );

  const setFocusFilter = useCallback(
    (next?: string) => {
      setFocus(next);
      syncUrl(type, next, platform);
    },
    [type, platform],
  );

  const setPlatformFilter = useCallback(
    (next?: string) => {
      setPlatform(next);
      syncUrl(type, focus, next);
    },
    [type, focus],
  );

  const sorted = useMemo(() => {
    if (type === "language") return [];

    let rows = requests.filter((r) => r.type === type);

    if (focus) {
      rows = rows.filter((r) =>
        focus === "Everything"
          ? r.focus_tag == null || r.focus_tag === "Everything"
          : r.focus_tag === focus,
      );
    }

    if (
      platform &&
      PLATFORMS.includes(platform as (typeof PLATFORMS)[number])
    ) {
      rows = rows.filter((r) => r.platform === platform);
    }

    return [...rows].sort((a, b) => {
      const aBoost = isBoostActive(a.boosted_until) ? 1 : 0;
      const bBoost = isBoostActive(b.boosted_until) ? 1 : 0;
      if (aBoost !== bBoost) return bBoost - aBoost;
      const aPro = profileMap.get(a.user_id)?.is_pro ? 1 : 0;
      const bPro = profileMap.get(b.user_id)?.is_pro ? 1 : 0;
      if (aPro !== bPro) return bPro - aPro;
      return waitHours(b.created_at) - waitHours(a.created_at);
    });
  }, [requests, type, focus, platform, profileMap]);

  const helpPeer = useMemo(() => {
    if (type === "language") return undefined;
    return sorted.find((r) => {
      if (r.user_id === meId) return false;
      if (waitHours(r.created_at) >= 24) return false;
      const owner = profileMap.get(r.user_id);
      return owner && !owner.is_pro;
    });
  }, [sorted, meId, profileMap, type]);

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

          <div className="mt-6 flex flex-wrap gap-2 text-[13px]">
            <span className="text-ink/50">Focus:</span>
            <button
              type="button"
              onClick={() => setFocusFilter(undefined)}
              className={filterChipClass(!focus)}
            >
              All
            </button>
            {FOCUS_FILTER_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFocusFilter(tag)}
                className={filterChipClass(focus === tag)}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
            <span className="text-ink/50">Platform:</span>
            <button
              type="button"
              onClick={() => setPlatformFilter(undefined)}
              className={filterChipClass(!platform)}
            >
              All
            </button>
            {PLATFORMS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatformFilter(p)}
                className={`${filterChipClass(platform === p)} inline-flex items-center gap-1`}
              >
                <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                {PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>

          <div className="board-grid">
            {sorted.length === 0 ? (
              <p className="py-10 text-ink/70">Nothing waiting.</p>
            ) : (
              sorted.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  owner={profileMap.get(request.user_id)}
                  type={type}
                  mine={myByRequest.get(request.id)}
                />
              ))
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
}: {
  request: RequestRow;
  owner?: OwnerProfile;
  type: TrackId;
  mine?: CommitmentRow;
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

