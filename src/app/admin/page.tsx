import { redirect } from "next/navigation";
import { awardBugReport } from "@/actions/bug-report";
import { requireProfile } from "@/lib/auth";
import { BUG_REPORT_AWARD } from "@/lib/constants";
import { createAdminClient } from "@/lib/supabase/admin";

async function banUser(formData: FormData) {
  "use server";
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/board");

  const userId = String(formData.get("user_id") ?? "");
  const admin = createAdminClient();
  await admin.from("profiles").update({ is_banned: true }).eq("id", userId);
  redirect("/admin?message=User%20banned");
}

type Props = {
  searchParams: Promise<{ message?: string; bug?: string }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const profile = await requireProfile();
  if (!profile.is_admin) redirect("/board");

  const query = await searchParams;
  const admin = createAdminClient();

  const { data: reports } = await admin
    .from("reports")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: siteBugs } = await admin
    .from("site_bug_reports")
    .select(
      "id, summary, details, email, page, created_at, user_id, awarded_at, awarded_credits",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: recentUsers } = await admin
    .from("profiles")
    .select("id, display_name, email, is_banned, created_at, reviews_given")
    .order("created_at", { ascending: false })
    .limit(30);

  const focusedBug = (siteBugs ?? []).find((bug) => bug.id === query.bug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Admin</h1>

      {query.message ? (
        <p className="mt-4 text-[13px]">{query.message}</p>
      ) : null}

      {focusedBug && !focusedBug.awarded_at ? (
        <section
          id="award"
          className="mt-8 rounded-[6px] border border-border bg-mist px-4 py-4"
        >
          <p className="font-display text-[20px] font-semibold">Award this report</p>
          <p className="mt-2 font-medium">{focusedBug.summary}</p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink/75">
            {focusedBug.details}
          </p>
          <form action={awardBugReport} className="mt-3">
            <input type="hidden" name="bug_id" value={focusedBug.id} />
            <button type="submit" className="btn btn-primary">
              Award {BUG_REPORT_AWARD} credits
            </button>
          </form>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-[24px] font-semibold">Site bugs</h2>
        <div className="mt-4 border-t border-border">
          {(siteBugs ?? []).length === 0 ? (
            <p className="py-6 text-ink/65">No site bug reports yet.</p>
          ) : (
            (siteBugs ?? []).map((bug) => {
              const highlight = query.bug === bug.id;
              return (
                <div
                  key={bug.id}
                  id={`bug-${bug.id}`}
                  className={`border-b border-border py-3 ${
                    highlight ? "bg-mist/60" : ""
                  }`}
                >
                  <p className="font-medium">{bug.summary}</p>
                  <p className="mt-1 whitespace-pre-wrap text-[13px] text-ink/75">
                    {bug.details}
                  </p>
                  <p className="mt-1 font-mono text-[12px] text-ink/55">
                    {bug.page} · {bug.email || "no email"} ·{" "}
                    {new Date(bug.created_at).toLocaleString()}
                    {bug.user_id ? "" : " · no account"}
                  </p>
                  <div className="mt-2">
                    {bug.awarded_at ? (
                      <p className="text-[13px] text-ink/60">
                        Awarded {bug.awarded_credits ?? BUG_REPORT_AWARD} credits
                      </p>
                    ) : (
                      <form action={awardBugReport}>
                        <input type="hidden" name="bug_id" value={bug.id} />
                        <button type="submit" className="btn btn-secondary">
                          Award {BUG_REPORT_AWARD} credits
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-[24px] font-semibold">Open reports</h2>
        <div className="mt-4 border-t border-border">
          {(reports ?? []).length === 0 ? (
            <p className="py-6 text-ink/65">No open reports.</p>
          ) : (
            (reports ?? []).map((report) => (
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

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Recent users</h2>
        <div className="mt-4 border-t border-border">
          {(recentUsers ?? []).map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
            >
              <div>
                <p className="font-medium">{user.display_name}</p>
                <p className="font-mono text-[12px] text-ink/55">
                  {user.email} · {user.reviews_given} reviews
                  {user.is_banned ? " · banned" : ""}
                </p>
              </div>
              {!user.is_banned ? (
                <form action={banUser}>
                  <input type="hidden" name="user_id" value={user.id} />
                  <button type="submit" className="btn btn-danger">
                    Ban
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
