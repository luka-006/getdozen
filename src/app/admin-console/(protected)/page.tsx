import Link from "next/link";
import { awardBugReport } from "@/actions/bug-report";
import {
  adminAdjustCredits,
  adminBanUser,
  adminConfirmReview,
  adminRejectReview,
  adminRefundCredits,
  signOutAdminConsole,
} from "@/actions/admin-console";
import { BUG_REPORT_AWARD } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  searchParams: Promise<{ message?: string; error?: string; bug?: string }>;
};

async function loadConsoleData() {
  const admin = createAdminClient();

  const [
    usersRes,
    openRequestsRes,
    pendingReviewsRes,
    creditsRes,
    bugsRes,
    reportsRes,
    recentUsersRes,
    pendingListRes,
    ledgerRes,
  ] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    admin
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("confirm_status", "pending"),
    admin.from("profiles").select("credits, credits_pending"),
    admin
      .from("site_bug_reports")
      .select(
        "id, summary, details, email, page, created_at, user_id, awarded_at, awarded_credits",
      )
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("reports")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("profiles")
      .select("id, display_name, email, is_banned, created_at, reviews_given, credits")
      .order("created_at", { ascending: false })
      .limit(25),
    admin
      .from("reviews")
      .select("id, created_at, auto_confirm_at, request_id, reviewer_id")
      .eq("confirm_status", "pending")
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("credit_ledger")
      .select("id, user_id, amount, reason, status, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const creditsRows = creditsRes.data ?? [];
  const creditsTotal = creditsRows.reduce(
    (sum, row) => sum + Number(row.credits ?? 0),
    0,
  );
  const pendingTotal = creditsRows.reduce(
    (sum, row) => sum + Number(row.credits_pending ?? 0),
    0,
  );

  const pendingReviews = pendingListRes.data ?? [];
  const requestIds = [...new Set(pendingReviews.map((r) => r.request_id))];
  const reviewerIds = [...new Set(pendingReviews.map((r) => r.reviewer_id))];

  const [{ data: reqRows }, { data: reviewerRows }] = await Promise.all([
    requestIds.length
      ? admin.from("requests").select("id, app_name").in("id", requestIds)
      : Promise.resolve({ data: [] as { id: string; app_name: string }[] }),
    reviewerIds.length
      ? admin
          .from("profiles")
          .select("id, display_name, email")
          .in("id", reviewerIds)
      : Promise.resolve({
          data: [] as { id: string; display_name: string; email: string }[],
        }),
  ]);

  const reqMap = new Map((reqRows ?? []).map((r) => [r.id, r]));
  const reviewerMap = new Map((reviewerRows ?? []).map((r) => [r.id, r]));

  return {
    stats: {
      users: usersRes.count ?? 0,
      openRequests: openRequestsRes.count ?? 0,
      pendingReviews: pendingReviewsRes.count ?? 0,
      creditsTotal,
      pendingTotal,
    },
    siteBugs: bugsRes.data ?? [],
    reports: reportsRes.data ?? [],
    recentUsers: recentUsersRes.data ?? [],
    pendingReviews: pendingReviews.map((review) => ({
      ...review,
      appName: reqMap.get(review.request_id)?.app_name ?? "Request",
      reviewerName:
        reviewerMap.get(review.reviewer_id)?.display_name ??
        reviewerMap.get(review.reviewer_id)?.email ??
        review.reviewer_id,
    })),
    ledger: ledgerRes.data ?? [],
  };
}

export default async function AdminConsolePage({ searchParams }: Props) {
  const query = await searchParams;
  const data = await loadConsoleData();
  const focusedBug = data.siteBugs.find((bug) => bug.id === query.bug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[12px] text-ink/45">Operations</p>
          <h1 className="font-display text-[32px] font-semibold">Console</h1>
        </div>
        <form action={signOutAdminConsole}>
          <button type="submit" className="btn btn-secondary min-h-9 text-[13px]">
            Lock console
          </button>
        </form>
      </div>

      {query.message ? (
        <p className="mt-4 rounded-[6px] border border-border bg-paper px-3 py-2 text-[13px]">
          {query.message}
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-4 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          {query.error}
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Users", data.stats.users],
          ["Open posts", data.stats.openRequests],
          ["Pending reviews", data.stats.pendingReviews],
          ["Credits live", data.stats.creditsTotal.toFixed(1)],
          ["Credits pending", data.stats.pendingTotal.toFixed(1)],
        ].map(([label, value]) => (
          <div key={String(label)} className="surface px-4 py-4">
            <p className="text-[12px] text-ink/55">{label}</p>
            <p className="mt-1 font-display text-[24px] font-semibold tabular-nums">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="font-display text-[20px] font-semibold">Credit refund</h2>
          <p className="mt-1 text-[13px] text-ink/60">
            Add credits to a user wallet (max 500).
          </p>
          <form action={adminRefundCredits} className="mt-4 space-y-3">
            <div className="field">
              <label htmlFor="refund-user">User ID</label>
              <input id="refund-user" name="user_id" className="input font-mono text-[13px]" required />
            </div>
            <div className="field">
              <label htmlFor="refund-amount">Credits</label>
              <input
                id="refund-amount"
                name="amount"
                type="number"
                min={0.01}
                max={500}
                step={0.01}
                className="input font-mono"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="refund-note">Note (optional)</label>
              <input id="refund-note" name="note" className="input" maxLength={200} />
            </div>
            <button type="submit" className="btn btn-primary">
              Refund credits
            </button>
          </form>
        </div>

        <div className="surface p-5">
          <h2 className="font-display text-[20px] font-semibold">Credit adjust</h2>
          <p className="mt-1 text-[13px] text-ink/60">
            Positive adds credits; negative removes (max ±500).
          </p>
          <form action={adminAdjustCredits} className="mt-4 space-y-3">
            <div className="field">
              <label htmlFor="adj-user">User ID</label>
              <input id="adj-user" name="user_id" className="input font-mono text-[13px]" required />
            </div>
            <div className="field">
              <label htmlFor="adj-amount">Amount (+ / −)</label>
              <input
                id="adj-amount"
                name="amount"
                type="number"
                min={-500}
                max={500}
                step={0.01}
                className="input font-mono"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="adj-note">Note (optional)</label>
              <input id="adj-note" name="note" className="input" maxLength={200} />
            </div>
            <button type="submit" className="btn btn-secondary">
              Apply adjustment
            </button>
          </form>
        </div>
      </section>

      {focusedBug && !focusedBug.awarded_at ? (
        <section
          id="award"
          className="mt-10 rounded-[6px] border border-border bg-paper px-4 py-4"
        >
          <p className="font-display text-[20px] font-semibold">Award bug report</p>
          <p className="mt-2 font-medium">{focusedBug.summary}</p>
          <form action={awardBugReport} className="mt-3">
            <input type="hidden" name="bug_id" value={focusedBug.id} />
            <button type="submit" className="btn btn-primary">
              Award {BUG_REPORT_AWARD} credits
            </button>
          </form>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Pending reviews</h2>
        <div className="mt-4 border-t border-border">
          {data.pendingReviews.length === 0 ? (
            <p className="py-6 text-ink/65">Nothing waiting for confirmation.</p>
          ) : (
            data.pendingReviews.map((review) => (
              <div key={review.id} className="border-b border-border py-3">
                <p className="font-medium">{review.appName}</p>
                <p className="mt-1 text-[13px] text-ink/65">
                  {review.reviewerName} ·{" "}
                  {new Date(review.created_at).toLocaleString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/reviews/${review.id}/confirm`}
                    className="btn btn-secondary min-h-9 text-[13px]"
                  >
                    Open review
                  </Link>
                  <form action={adminConfirmReview}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <button type="submit" className="btn btn-primary min-h-9 text-[13px]">
                      Confirm
                    </button>
                  </form>
                  <form action={adminRejectReview}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <button type="submit" className="btn btn-danger min-h-9 text-[13px]">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Recent ledger</h2>
        <div className="mt-4 overflow-x-auto border-t border-border">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-ink/55">
                <th className="py-2 pr-3 font-medium">When</th>
                <th className="py-2 pr-3 font-medium">User</th>
                <th className="py-2 pr-3 font-medium">Amount</th>
                <th className="py-2 pr-3 font-medium">Reason</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.ledger.map((row) => (
                <tr key={row.id} className="border-b border-border">
                  <td className="py-2 pr-3 font-mono text-[12px]">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[12px]">{row.user_id.slice(0, 8)}…</td>
                  <td className="py-2 pr-3 font-mono">{row.amount}</td>
                  <td className="py-2 pr-3">{row.reason}</td>
                  <td className="py-2">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Site bugs</h2>
        <div className="mt-4 border-t border-border">
          {data.siteBugs.length === 0 ? (
            <p className="py-6 text-ink/65">No site bug reports.</p>
          ) : (
            data.siteBugs.map((bug) => (
              <div key={bug.id} className="border-b border-border py-3">
                <p className="font-medium">{bug.summary}</p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink/75">
                  {bug.details}
                </p>
                <p className="mt-1 font-mono text-[12px] text-ink/55">
                  {bug.page} · {bug.email || "no email"}
                </p>
                {bug.awarded_at ? (
                  <p className="mt-2 text-[13px] text-ink/60">Awarded</p>
                ) : (
                  <form action={awardBugReport} className="mt-2">
                    <input type="hidden" name="bug_id" value={bug.id} />
                    <button type="submit" className="btn btn-secondary min-h-9 text-[13px]">
                      Award {BUG_REPORT_AWARD} credits
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Users</h2>
        <div className="mt-4 border-t border-border">
          {data.recentUsers.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
            >
              <div>
                <p className="font-medium">{user.display_name}</p>
                <p className="font-mono text-[12px] text-ink/55">
                  {user.email} · {user.credits} cr · {user.reviews_given} reviews
                  {user.is_banned ? " · banned" : ""}
                </p>
                <p className="font-mono text-[11px] text-ink/45">{user.id}</p>
              </div>
              {!user.is_banned ? (
                <form action={adminBanUser}>
                  <input type="hidden" name="user_id" value={user.id} />
                  <button type="submit" className="btn btn-danger min-h-9 text-[13px]">
                    Ban
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Open reports</h2>
        <div className="mt-4 border-t border-border">
          {data.reports.length === 0 ? (
            <p className="py-6 text-ink/65">No open reports.</p>
          ) : (
            data.reports.map((report) => (
              <div key={report.id} className="border-b border-border py-3">
                <p>{report.reason}</p>
                <p className="font-mono text-[12px] text-ink/55">
                  {report.id} · {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
