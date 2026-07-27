import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCredits, formatWait, waitHours } from "@/lib/utils";
import type { Profile, RequestRow } from "@/lib/types";

type Props = {
  searchParams: Promise<{ type?: string; error?: string }>;
};

export default async function BoardPage({ searchParams }: Props) {
  await requireProfile();
  const params = await searchParams;
  const type = params.type === "tester" ? "tester" : "feedback";

  try {
    const admin = createAdminClient();
    await admin.rpc("escalate_bounties");
  } catch {
    // Board still renders if cron/admin is unavailable.
  }

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select("*")
    .eq("type", type)
    .eq("status", "open")
    .order("created_at", { ascending: true });

  const rows = (requests ?? []) as RequestRow[];
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-semibold">Board</h1>
          <p className="mt-1 text-ink/70">
            Longest waiting first. Pick freely — no matching algorithm.
          </p>
        </div>
        <Link href="/requests/new" className="btn btn-primary">
          Post request
        </Link>
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href="/board"
          className={`btn ${type === "feedback" ? "btn-primary" : "btn-secondary"}`}
        >
          Feedback
        </Link>
        <Link
          href="/board?type=tester"
          className={`btn ${type === "tester" ? "btn-primary" : "btn-secondary"}`}
        >
          Testers
        </Link>
      </div>

      {params.error ? (
        <p className="mt-4 text-[13px] text-flag">{params.error}</p>
      ) : null}

      <div className="mt-6 border-t border-border">
        {sorted.length === 0 ? (
          <p className="py-10 text-ink/70">
            Nothing waiting right now. Post your app and it goes to the top of
            the queue.
          </p>
        ) : (
          sorted.map((request) => {
            const owner = profileMap.get(request.user_id);
            const wait = formatWait(request.created_at);
            return (
              <Link
                key={request.id}
                href={`/requests/${request.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-border px-1 py-4 hover:bg-mist/70"
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
                      ? ` · ${request.question_count} questions · ${formatCredits(Number(request.credit_cost))} credits`
                      : ` · ${request.testers_filled}/${request.testers_needed} testers`}
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
