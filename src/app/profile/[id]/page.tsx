import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCredits } from "@/lib/utils";
import { signOut } from "@/actions/auth";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const me = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: shipped } = await supabase
    .from("shipped_apps")
    .select("*")
    .or(`owner_id.eq.${id},helper_ids.cs.{${id}}`)
    .order("launched_at", { ascending: false });

  const { data: thanks } = await supabase
    .from("thanks_messages")
    .select("*")
    .eq("to_user_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-16 w-16 rounded-[6px] object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-[6px] bg-mist font-display text-[24px] font-semibold">
            {profile.display_name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="font-display text-[32px] font-semibold">
            {profile.display_name}
          </h1>
          <p className="mt-1 text-[13px] text-ink/65">
            {profile.reviews_given} reviews given · rating{" "}
            <span className="font-mono">
              {Number(profile.rating_avg).toFixed(1)}
            </span>
            {profile.is_pro ? " · Pro" : ""}
          </p>
        </div>
      </div>

      {me.id === profile.id ? (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="rounded-[6px] bg-credit px-2 py-1 font-mono text-[13px]">
            {formatCredits(profile.credits)} credits
          </span>
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      ) : null}

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[24px] font-semibold">
            Helped ship
          </h2>
          {me.id === profile.id ? (
            <Link href="/wall/new" className="text-[13px] text-blue">
              Add shipped app
            </Link>
          ) : null}
        </div>
        <div className="mt-4 border-t border-border">
          {(shipped ?? []).length === 0 ? (
            <p className="py-6 text-ink/65">Nothing listed yet.</p>
          ) : (
            (shipped ?? []).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-3 border-b border-border py-3"
              >
                <div>
                  <p className="font-medium">{app.app_name}</p>
                  <p className="font-mono text-[12px] text-ink/55">
                    {app.launched_at}
                  </p>
                </div>
                <a href={app.app_url} className="text-blue text-[13px]" target="_blank" rel="noreferrer">
                  Open
                </a>
              </div>
            ))
          )}
        </div>
        <p className="mt-3 text-[13px] text-ink/55">
          <Link href="/wall" className="text-blue">
            View the shipped wall
          </Link>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Thanks</h2>
        <div className="mt-4 space-y-3">
          {(thanks ?? []).length === 0 ? (
            <p className="text-ink/65">No thanks messages yet.</p>
          ) : (
            (thanks ?? []).map((msg) => (
              <div key={msg.id} className="well px-3 py-2 text-[15px]">
                {msg.body}
              </div>
            ))
          )}
        </div>
      </section>

      <p className="mt-10">
        <Link href="/board" className="text-blue text-[13px]">
          Back to board
        </Link>
      </p>
    </div>
  );
}
