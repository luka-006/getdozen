import Link from "next/link";
import { TrackTabs } from "@/components/track-tabs";
import { DayStrip } from "@/components/day-strip";
import { PLATFORMS, TESTER_DAYS, reviewEarnForQuestionCount } from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { testerCubes } from "@/lib/tester-progress";
import { formatCredits, formatWaitLabel, waitHours } from "@/lib/utils";
import { isBoostActive } from "@/lib/boost";
import type { Profile, RequestRow } from "@/lib/types";

type Props = {
  searchParams: Promise<{
    type?: string;
    error?: string;
    platform?: string;
    focus?: string;
  }>;
};

const PLATFORM_LABEL: Record<string, string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

function boardBase(type: string) {
  if (type === "feedback") return "/board?type=feedback";
  if (type === "combo") return "/board?type=combo";
  return "/board";
}

function withParam(base: string, key: string, value?: string) {
  if (!value) return base;
  return `${base}${base.includes("?") ? "&" : "?"}${key}=${value}`;
}

function filterChipClass(active: boolean) {
  return active ? "filter-chip filter-chip-active" : "filter-chip";
}

export default async function BoardPage({ searchParams }: Props) {
  const me = await requireProfile();
  const params = await searchParams;
  const type =
    params.type === "feedback"
      ? "feedback"
      : params.type === "combo"
        ? "combo"
        : params.type === "language"
          ? "language"
          : "tester";

  try {
    const admin = createAdminClient();
    await admin.rpc("escalate_bounties");
  } catch {
    // Board still renders if cron/admin is unavailable.
  }

  if (type === "language") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <BoardHeader post={false} />
        <TrackTabs active="language" />
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
      </div>
    );
  }

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("type", type)
    .eq("status", "open")
    .order("created_at", { ascending: true });

  let rows = (requests ?? []) as RequestRow[];
  if (params.focus) {
    rows = rows.filter((r) =>
      params.focus === "Everything"
        ? r.focus_tag == null || r.focus_tag === "Everything"
        : r.focus_tag === params.focus,
    );
  }
  if (params.platform && PLATFORMS.includes(params.platform as (typeof PLATFORMS)[number])) {
    rows = rows.filter((r) => r.platform === params.platform);
  }

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, is_pro, is_ramped, rating_avg, rating_count, reviews_given",
        )
        .in("id", userIds)
    : {
        data: [] as Pick<
          Profile,
          | "id"
          | "display_name"
          | "avatar_url"
          | "is_pro"
          | "is_ramped"
          | "rating_avg"
          | "rating_count"
          | "reviews_given"
        >[],
      };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: myCommitments } =
    type === "feedback"
      ? { data: [] }
      : await supabase
          .from("tester_commitments")
          .select("request_id, opted_in_at, status, duration_days")
          .eq("tester_id", me.id);

  const myByRequest = new Map(
    (myCommitments ?? []).map((c) => [c.request_id, c]),
  );

  const sorted = [...rows].sort((a, b) => {
    const aBoost = isBoostActive(a.boosted_until) ? 1 : 0;
    const bBoost = isBoostActive(b.boosted_until) ? 1 : 0;
    if (aBoost !== bBoost) return bBoost - aBoost;
    const aPro = profileMap.get(a.user_id)?.is_pro ? 1 : 0;
    const bPro = profileMap.get(b.user_id)?.is_pro ? 1 : 0;
    if (aPro !== bPro) return bPro - aPro;
    return waitHours(b.created_at) - waitHours(a.created_at);
  });

  const helpPeer = sorted.find((r) => {
    if (r.user_id === me.id) return false;
    if (waitHours(r.created_at) >= 24) return false;
    const owner = profileMap.get(r.user_id);
    return owner && !owner.is_pro;
  });

  const base = boardBase(type);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <BoardHeader />
      <TrackTabs active={type} />

      {params.error ? (
        <p className="mt-4 text-[13px] text-flag">{params.error}</p>
      ) : null}

      {helpPeer ? (
        <Link
          href={`/requests/${helpPeer.id}`}
          className="board-row mt-6 block"
        >
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
        <Link
          href={withParam(base, "platform", params.platform)}
          className={filterChipClass(!params.focus)}
        >
          All
        </Link>
        {(["Everything", "UX", "Market", "Technical"] as const).map((tag) => (
          <Link
            key={tag}
            href={withParam(
              withParam(base, "focus", tag),
              "platform",
              params.platform,
            )}
            className={filterChipClass(params.focus === tag)}
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
        <span className="text-ink/50">Platform:</span>
        <Link
          href={withParam(base, "focus", params.focus)}
          className={filterChipClass(!params.platform)}
        >
          All
        </Link>
        {PLATFORMS.map((p) => (
          <Link
            key={p}
            href={withParam(
              withParam(base, "focus", params.focus),
              "platform",
              p,
            )}
            className={filterChipClass(params.platform === p)}
          >
            {PLATFORM_LABEL[p]}
          </Link>
        ))}
      </div>

      <div className="board-grid">
        {sorted.length === 0 ? (
          <p className="py-10 text-ink/70">Nothing waiting.</p>
        ) : (
          sorted.map((request) => {
            const owner = profileMap.get(request.user_id);
            const wait = formatWaitLabel(request.created_at);
            const platform = request.platform
              ? PLATFORM_LABEL[request.platform] ?? request.platform
              : null;
            const duration =
              type === "feedback"
                ? null
                : request.duration_days ?? TESTER_DAYS;
            const payout =
              type === "feedback" || type === "combo"
                ? Number(request.bounty_multiplier) > 1
                  ? formatCredits(
                      reviewEarnForQuestionCount(request.question_count) *
                        Number(request.bounty_multiplier),
                    )
                  : null
                : null;
            const mine = duration ? myByRequest.get(request.id) : undefined;
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
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="board-row"
              >
                <div className="grid grid-cols-[1fr_auto] items-center gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{request.app_name}</span>
                    {platform ? (
                      <span className="text-[13px] text-ink/60">{platform}</span>
                    ) : null}
                    {request.focus_tag ? (
                      <span className="text-[13px] text-ink/60">
                        {request.focus_tag}
                      </span>
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
                    {owner
                      ? ` · ${owner.reviews_given ?? 0} reviews`
                      : ""}
                    {type === "feedback"
                      ? ` · ${request.question_count}q`
                      : type === "combo"
                        ? ` · ${request.testers_filled}/${request.testers_needed} testers · ${request.question_count}q · ${duration}d`
                        : ` · ${request.testers_filled}/${request.testers_needed} testers · ${duration}d`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13px] text-ink/80">{wait}</p>
                </div>
                </div>
                {cubes ? (
                  <div className="mt-3">
                    <DayStrip
                      total={cubes.total}
                      filled={cubes.filled}
                      label={cubes.label}
                    />
                  </div>
                ) : null}
              </Link>
            );
          })
        )}
      </div>
    </div>
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
          Pick a post, leave structured feedback, or join a tester run.
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
