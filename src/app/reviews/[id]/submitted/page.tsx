import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCredits } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ReviewSubmittedPage({ params }: Props) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: review } = await supabase
    .from("reviews")
    .select("id, credits_awarded, auto_confirm_at, reviewer_id")
    .eq("id", id)
    .single();

  if (!review || review.reviewer_id !== profile.id) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <p>Review not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12">
      <h1 className="font-display text-[32px] font-semibold">Review submitted</h1>
      <p className="mt-3 text-ink/75">
        <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
          {formatCredits(Number(review.credits_awarded ?? 0))}
        </span>{" "}
        credits are pending. They unlock when the requester confirms, or
        automatically after 48 hours.
      </p>
      <p className="mt-2 font-mono text-[13px] text-ink/60">
        Auto-confirm: {new Date(review.auto_confirm_at).toLocaleString()}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/board" className="btn btn-primary">
          Back to board
        </Link>
        <Link href="/wallet" className="btn btn-secondary">
          Open wallet
        </Link>
      </div>
    </div>
  );
}
