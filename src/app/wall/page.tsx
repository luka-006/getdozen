import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ShippedApp } from "@/lib/types";

export default async function WallPage() {
  const profile = await getProfile();
  const admin = createAdminClient();

  const { data: apps } = await admin
    .from("shipped_apps")
    .select("*")
    .order("launched_at", { ascending: false })
    .limit(100);

  const shipped = (apps ?? []) as ShippedApp[];
  const helperIds = [...new Set(shipped.flatMap((app) => app.helper_ids ?? []))];
  const ownerIds = [...new Set(shipped.map((app) => app.owner_id))];
  const allIds = [...new Set([...helperIds, ...ownerIds])];

  const nameById = new Map<string, string>();
  if (allIds.length > 0) {
    const { data: people } = await admin
      .from("profiles")
      .select("id, display_name")
      .in("id", allIds);
    for (const person of people ?? []) {
      nameById.set(person.id, person.display_name);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-semibold">Shipped wall</h1>
          <p className="mt-1 text-ink/70">
            Apps that went out with help from getdozen.app reviewers and testers.
          </p>
        </div>
        {profile ? (
          <Link href="/wall/new" className="btn btn-primary">
            Add shipped app
          </Link>
        ) : (
          <Link href="/login?next=/wall/new" className="btn btn-secondary">
            Sign in to add
          </Link>
        )}
      </div>

      <div className="mt-10 border-t border-border">
        {shipped.length === 0 ? (
          <p className="py-10 text-ink/65">No shipped apps listed yet.</p>
        ) : (
          shipped.map((app) => {
            const helpers = (app.helper_ids ?? []).filter((id) => nameById.has(id));
            return (
              <article
                key={app.id}
                className="border-b border-border py-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-display text-[20px] font-semibold">
                    <a
                      href={app.app_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-blue"
                    >
                      {app.app_name}
                    </a>
                  </h2>
                  <p className="font-mono text-[12px] text-ink/55">
                    {app.launched_at}
                  </p>
                </div>
                <p className="mt-2 text-[13px] text-ink/70">
                  Owner{" "}
                  <Link href={`/profile/${app.owner_id}`} className="text-blue">
                    {nameById.get(app.owner_id) ?? "Maker"}
                  </Link>
                </p>
                {helpers.length > 0 ? (
                  <p className="mt-2 text-[13px] text-ink/75">
                    Helped by{" "}
                    {helpers.map((id, index) => (
                      <span key={id}>
                        {index > 0 ? ", " : null}
                        <Link href={`/profile/${id}`} className="text-blue">
                          {nameById.get(id)}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-ink/55">No helpers listed.</p>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
