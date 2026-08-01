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
    .select("id, credits_awarded, auto_confirm_at, reviewer_id, confirm_status")
    .eq("id", id)
    .single();

  if (!review || review.reviewer_id !== profile.id) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-12">
        <p>Review not found.</p>
      </div>
    );
  }

  const confirmed = review.confirm_status === "confirmed";

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12">
      <h1 className="font-display text-[32px] font-semibold">Review submitted</h1>
      <p className="mt-3 text-ink/75">
        <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono">
          {formatCredits(Number(review.credits_awarded ?? 0))}
        </span>{" "}
        {confirmed ? "added to your wallet" : "pending · confirms in 48h"}
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/board" className="btn btn-primary">
          Board
        </Link>
        <Link href="/wallet" className="btn btn-secondary">
          Wallet
        </Link>
      </div>
    </div>
  );
}
