import Link from "next/link";
import { notFound } from "next/navigation";
import { signOut } from "@/actions/auth";
import { deleteProfileReview } from "@/actions/profile-reviews";
import { Avatar } from "@/components/avatar";
import { CreditIcon } from "@/components/icons";
import { ProfileNameEditor } from "@/components/profile-name-editor";
import { ProfileReviewForm } from "@/components/profile-review-form";
import { getProfile } from "@/lib/auth";
import { haveInteracted } from "@/lib/profile-reviews";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { formatCredits } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function ProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const me = await getProfile();
  const supabase = await createClient();
  const isOwn = me?.id === id;

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

  const { data: languages } = await supabase
    .from("user_languages")
    .select("*")
    .eq("user_id", id)
    .order("language");

  const admin = createAdminClient();
  const { data: earnedRows } = await admin
    .from("credit_ledger")
    .select("amount, status")
    .eq("user_id", id)
    .gt("amount", 0);

  const earnedSoFar = (earnedRows ?? [])
    .filter((row) => row.status === "available" || row.status === "pending")
    .reduce((sum, row) => sum + Number(row.amount), 0);

  const { data: peerReviews } = await admin
    .from("profile_reviews")
    .select("id, from_user_id, body, rating, created_at")
    .eq("to_user_id", id)
    .order("created_at", { ascending: false })
    .limit(40);

  const reviewerIds = [
    ...new Set((peerReviews ?? []).map((r) => r.from_user_id)),
  ];
  const { data: reviewers } = reviewerIds.length
    ? await admin
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", reviewerIds)
    : { data: [] as { id: string; display_name: string; avatar_url: string | null }[] };
  const reviewerMap = new Map((reviewers ?? []).map((p) => [p.id, p]));

  const peerAvg =
    (peerReviews ?? []).filter((r) => r.rating != null).length > 0
      ? (
          (peerReviews ?? [])
            .filter((r) => r.rating != null)
            .reduce((s, r) => s + Number(r.rating), 0) /
          (peerReviews ?? []).filter((r) => r.rating != null).length
        ).toFixed(1)
      : null;

  const canReview =
    me && !isOwn ? await haveInteracted(me.id, id) : false;
  const myExisting = me
    ? (peerReviews ?? []).find((r) => r.from_user_id === me.id)
    : null;

  const helpedCount = (shipped ?? []).filter((app) =>
    (app.helper_ids ?? []).includes(id),
  ).length;
  const ownedShips = (shipped ?? []).filter((app) => app.owner_id === id).length;
  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });

  const stats: [string, string][] = [
    ["Earned so far", formatCredits(earnedSoFar)],
    ["App reviews", String(profile.reviews_given)],
    ["Peer notes", String((peerReviews ?? []).length)],
    [
      "Peer rating",
      peerAvg ? `${peerAvg}★` : "—",
    ],
    ["Helped ship", String(helpedCount)],
    ["Launched", String(ownedShips)],
    ["Bugs found", String(profile.bugs_found ?? 0)],
  ];

  if (isOwn) {
    stats.splice(1, 0, ["Balance", formatCredits(Number(profile.credits))]);
    stats.splice(2, 0, [
      "Pending",
      formatCredits(Number(profile.credits_pending)),
    ]);
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <div className="flex items-start gap-4 motion-fade-in">
        <Avatar
          name={profile.display_name}
          url={profile.avatar_url}
          size="md"
        />
        <div className="min-w-0 flex-1 space-y-1">
          {isOwn ? (
            <ProfileNameEditor displayName={profile.display_name} />
          ) : (
            <h1 className="font-display text-[32px] font-semibold">
              {profile.display_name}
            </h1>
          )}
          <p className="font-mono text-[13px] text-ink/65">
            Joined {memberSince}
            {profile.is_pro ? " · Pro" : ""}
          </p>
        </div>
      </div>

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}
      {query.message ? (
        <p className="mt-4 text-[13px] text-ink/70">{query.message}</p>
      ) : null}

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="well px-3 py-3">
            <p className="text-[12px] text-ink/55">{label}</p>
            <p className="mt-1 font-mono text-[16px]">{value}</p>
          </div>
        ))}
      </section>

      {isOwn ? (
        <section className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-credit px-2.5 py-1 font-mono text-[13px] text-ink"
          >
            <CreditIcon className="h-3.5 w-3.5" />
            {formatCredits(profile.credits)}
          </Link>
          <Link href="/wallet" className="btn btn-secondary min-h-9 px-3 text-[13px]">
            Wallet
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary min-h-9 px-3 text-[13px]">
              Sign out
            </button>
          </form>
        </section>
      ) : null}

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-[22px] font-semibold">
          Peer reviews
        </h2>

        {!isOwn && me && canReview ? (
          <ProfileReviewForm toUserId={id} />
        ) : null}
        {!isOwn && me && !canReview ? (
          <p className="text-[13px] text-ink/55">
            Review after you work together on a request.
          </p>
        ) : null}
        {!isOwn && !me ? (
          <p className="text-[13px] text-ink/55">
            <Link href={`/login?next=/profile/${id}`} className="text-blue">
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        ) : null}

        <div className="border-t border-border">
          {(peerReviews ?? []).length === 0 ? (
            <p className="py-5 text-[14px] text-ink/60">No peer reviews yet.</p>
          ) : (
            (peerReviews ?? []).map((review) => {
              const author = reviewerMap.get(review.from_user_id);
              return (
                <div
                  key={review.id}
                  className="flex gap-3 border-b border-border py-4"
                >
                  <Avatar
                    name={author?.display_name ?? "?"}
                    url={author?.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={`/profile/${review.from_user_id}`}
                        className="text-[14px] font-medium text-blue"
                      >
                        {author?.display_name ?? "User"}
                      </Link>
                      <p className="font-mono text-[12px] text-ink/50">
                        {review.rating != null ? `${review.rating}★ · ` : ""}
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="mt-1 text-[15px] text-ink/85">{review.body}</p>
                    {me?.id === review.from_user_id ? (
                      <form action={deleteProfileReview} className="mt-2">
                        <input type="hidden" name="review_id" value={review.id} />
                        <input type="hidden" name="to_user_id" value={id} />
                        <button
                          type="submit"
                          className="text-[12px] text-flag"
                        >
                          Remove
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {myExisting && canReview ? (
          <p className="text-[12px] text-ink/50">
            Posting again updates your existing review.
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-[22px] font-semibold">Languages</h2>
        <div className="mt-3 border-t border-border">
          {(languages ?? []).length === 0 ? (
            <p className="py-5 text-[14px] text-ink/60">—</p>
          ) : (
            (languages ?? []).map((lang) => (
              <div
                key={lang.id}
                className="flex justify-between border-b border-border py-3 text-[14px]"
              >
                <span>{lang.language}</span>
                <span className="font-mono text-[12px] text-ink/55">
                  {lang.level}
                  {lang.verified ? " · verified" : ""}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[22px] font-semibold">Shipped</h2>
          {isOwn ? (
            <Link href="/wall/new" className="text-[13px] text-blue">
              Add app
            </Link>
          ) : null}
        </div>
        <div className="mt-3 border-t border-border">
          {(shipped ?? []).length === 0 ? (
            <p className="py-5 text-[14px] text-ink/60">—</p>
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
                <a
                  href={app.app_url}
                  className="text-[13px] text-blue"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
            ))
          )}
        </div>
      </section>

      {(thanks ?? []).length > 0 ? (
        <section className="mt-10">
          <h2 className="font-display text-[22px] font-semibold">Thanks</h2>
          <div className="mt-3 space-y-2">
            {(thanks ?? []).map((msg) => (
              <div key={msg.id} className="well px-3 py-2 text-[15px]">
                {msg.body}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
