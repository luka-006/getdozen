import Link from "next/link";
import { TrackTabs } from "@/components/track-tabs";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCredits, formatWait, waitHours } from "@/lib/utils";
import type { Profile, RequestRow } from "@/lib/types";

type Props = {
  searchParams: Promise<{ type?: string; error?: string; platform?: string; focus?: string }>;
};

export default async function BoardPage({ searchParams }: Props) {
  await requireProfile();
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
        <BoardHeader />
        <TrackTabs active="language" />
        <p className="mt-10 text-ink/70">Coming soon.</p>
        <Link href="/requests/new" className="btn btn-primary mt-6">
          Post request
        </Link>
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
    rows = rows.filter((r) => r.focus_tag === params.focus);
  }

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, is_pro")
        .in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "display_name" | "avatar_url" | "is_pro">[] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const sorted = [...rows].sort((a, b) => {
    const aPro = profileMap.get(a.user_id)?.is_pro ? 1 : 0;
    const bPro = profileMap.get(b.user_id)?.is_pro ? 1 : 0;
    if (aPro !== bPro) return bPro - aPro;
    return waitHours(b.created_at) - waitHours(a.created_at);
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <BoardHeader />
      <TrackTabs active={type} />

      {params.error ? (
        <p className="mt-4 text-[13px] text-flag">{params.error}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2 text-[13px]">
        <span className="text-ink/50">Focus:</span>
        <Link
          href={
            type === "feedback"
              ? "/board?type=feedback"
              : type === "combo"
                ? "/board?type=combo"
                : "/board"
          }
          className={!params.focus ? "text-blue" : "text-ink/70 hover:text-blue"}
        >
          All
        </Link>
        {(["Everything", "UX", "Market", "Technical"] as const).map((tag) => (
          <Link
            key={tag}
            href={`${
              type === "feedback"
                ? "/board?type=feedback&"
                : type === "combo"
                  ? "/board?type=combo&"
                  : "/board?"
            }focus=${tag}`}
            className={
              params.focus === tag ? "text-blue" : "text-ink/70 hover:text-blue"
            }
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="mt-4 border-t border-border">
        {sorted.length === 0 ? (
          <p className="py-10 text-ink/70">
            Nothing waiting.
          </p>
        ) : (
          sorted.map((request) => {
            const owner = profileMap.get(request.user_id);
            const wait = formatWait(request.created_at);
            return (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-1 py-4 hover:bg-mist"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{request.app_name}</span>
                    {request.focus_tag ? (
                      <span className="text-[13px] text-ink/60">
                        {request.focus_tag}
                      </span>
                    ) : null}
                    {Number(request.bounty_multiplier) > 1 ? (
                      <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-[12px] text-ink">
                        {request.bounty_multiplier}×
                      </span>
                    ) : null}
                    {owner?.is_pro ? (
                      <span className="text-[12px] text-blue">Pro</span>
                    ) : null}
                  </div>
                  <p className="truncate text-[13px] text-ink/65">
                    {request.app_description}
                  </p>
                  <p className="text-[13px] text-ink/55">
                    {owner?.display_name ?? "Maker"}
                    {type === "feedback"
                      ? ` · ${request.question_count} questions`
                      : type === "combo"
                        ? ` · ${request.testers_filled}/${request.testers_needed} testers · ${request.question_count}q`
                        : ` · ${request.testers_filled}/${request.testers_needed} testers`}
                    {Number(request.bounty_multiplier) > 1
                      ? ` · ${formatCredits(Number(request.credit_cost) * Number(request.bounty_multiplier))} payout`
                      : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[13px] text-ink/80">{wait}</p>
                  <p className="text-[12px] text-ink/50">waiting</p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function BoardHeader() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[32px] font-semibold">Board</h1>
      </div>
      <Link href="/requests/new" className="btn btn-primary">
        Post
      </Link>
    </div>
  );
}
