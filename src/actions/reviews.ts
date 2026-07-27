"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  DAILY_REVIEW_LIMIT,
  MIN_ANSWER_CHARS,
  minSecondsForQuestionCount,
} from "@/lib/constants";
import {
  appendLedger,
  autoConfirmAt,
  earnAmountForReview,
} from "@/lib/credits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { answersTooSimilar, normalizeAnswer } from "@/lib/utils";

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

async function enforceDailyLimit(profileId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("daily_review_count, daily_review_date")
    .eq("id", profileId)
    .single();

  if (!profile) throw new Error("Profile not found");

  const today = todayUtc();
  let count = profile.daily_review_count ?? 0;
  if (profile.daily_review_date !== today) {
    count = 0;
  }
  if (count >= DAILY_REVIEW_LIMIT) {
    throw new Error(`Daily limit reached (${DAILY_REVIEW_LIMIT} reviews)`);
  }

  await admin
    .from("profiles")
    .update({
      daily_review_count: count + 1,
      daily_review_date: today,
    })
    .eq("id", profileId);
}

export async function submitReview(formData: FormData) {
  const profile = await requireProfile();
  const requestId = String(formData.get("request_id") ?? "");
  const timeSpent = Number(formData.get("time_spent_seconds") ?? 0);
  const rawAnswers = String(formData.get("answers") ?? "{}");

  let answers: Record<string, string>;
  try {
    answers = JSON.parse(rawAnswers) as Record<string, string>;
  } catch {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent("Could not read answers")}`);
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request || request.type !== "feedback" || request.status !== "open") {
    redirect(`/board?error=${encodeURIComponent("Request is not available")}`);
  }
  if (request.user_id === profile.id) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent("You cannot review your own request")}`);
  }

  try {
    await enforceDailyLimit(profile.id);
  } catch (e) {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent(e instanceof Error ? e.message : "Rate limited")}`);
  }

  const { data: questions } = await admin
    .from("questions")
    .select("*")
    .eq("request_id", requestId)
    .order("position");

  if (!questions?.length) {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent("Questions missing")}`);
  }

  const proof = questions.find((q) => q.is_proof);
  if (!proof) {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent("Proof question missing")}`);
  }

  const proofAnswer = normalizeAnswer(answers[proof.id] ?? "");
  const expected = normalizeAnswer(proof.expected_answer ?? "");
  const proofPassed = proofAnswer.length > 0 && proofAnswer === expected;

  if (!proofPassed) {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent("Proof question failed. Open the app and try again.")}`);
  }

  for (const q of questions) {
    const answer = (answers[q.id] ?? "").trim();
    if (answer.length < MIN_ANSWER_CHARS) {
      redirect(`/requests/${requestId}/review?error=${encodeURIComponent(`Answers need at least ${MIN_ANSWER_CHARS} characters`)}`);
    }
  }

  const floor = minSecondsForQuestionCount(request.question_count);
  if (timeSpent < floor) {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent("This review was completed unrealistically fast")}`);
  }

  const { data: previous } = await admin
    .from("reviews")
    .select("answers")
    .eq("reviewer_id", profile.id)
    .limit(20);

  for (const prev of previous ?? []) {
    const prevAnswers = prev.answers as Record<string, string>;
    for (const value of Object.values(answers)) {
      for (const old of Object.values(prevAnswers ?? {})) {
        if (answersTooSimilar(value, old)) {
          redirect(`/requests/${requestId}/review?error=${encodeURIComponent("Answers look copied from a previous review")}`);
        }
      }
    }
  }

  const nonProofIds = questions.filter((q) => !q.is_proof).map((q) => q.id);
  const sample = [...nonProofIds].sort(() => Math.random() - 0.5).slice(0, 3);
  const earn = earnAmountForReview(
    request.question_count,
    profile,
    Number(request.bounty_multiplier ?? 1),
  );

  const { data: review, error } = await admin
    .from("reviews")
    .insert({
      request_id: requestId,
      reviewer_id: profile.id,
      answers,
      proof_passed: true,
      time_spent_seconds: timeSpent,
      confirm_status: "pending",
      credits_awarded: earn,
      sample_question_ids: sample,
      auto_confirm_at: autoConfirmAt(),
    })
    .select("id")
    .single();

  if (error || !review) {
    redirect(`/requests/${requestId}/review?error=${encodeURIComponent(error?.message ?? "Could not submit review")}`);
  }

  await appendLedger({
    userId: profile.id,
    amount: earn,
    reason: "review_pending",
    refId: review.id,
    status: "pending",
    availableAt: autoConfirmAt(),
  });

  await admin
    .from("requests")
    .update({ status: "in_progress", claimed_at: new Date().toISOString() })
    .eq("id", requestId);

  revalidatePath("/board");
  revalidatePath("/wallet");
  redirect(`/reviews/${review.id}/submitted`);
}

export async function confirmReview(formData: FormData) {
  const profile = await requireProfile();
  const reviewId = String(formData.get("review_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const rating = Number(formData.get("rating") ?? 0);

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .single();

  if (!review) {
    redirect(`/board?error=${encodeURIComponent("Not allowed")}`);
  }

  const { data: ownedRequest } = await admin
    .from("requests")
    .select("id, user_id")
    .eq("id", review.request_id)
    .single();

  if (!ownedRequest || ownedRequest.user_id !== profile.id) {
    redirect(`/board?error=${encodeURIComponent("Not allowed")}`);
  }
  if (review.confirm_status !== "pending") {
    redirect(`/reviews/${reviewId}/confirm?error=${encodeURIComponent("Already decided")}`);
  }

  if (decision === "reject") {
    await admin
      .from("reviews")
      .update({ confirm_status: "rejected" })
      .eq("id", reviewId);

    await admin
      .from("credit_ledger")
      .update({ status: "voided" })
      .eq("ref_id", reviewId)
      .eq("status", "pending");

    await admin.rpc("recompute_balances", { p_user_id: review.reviewer_id });
    revalidatePath(`/reviews/${reviewId}/confirm`);
    redirect(`/reviews/${reviewId}/confirm?message=Review rejected. Credits were not refunded.`);
  }

  if (decision !== "confirm") {
    redirect(`/reviews/${reviewId}/confirm?error=${encodeURIComponent("Choose confirm or reject")}`);
  }

  await admin
    .from("reviews")
    .update({
      confirm_status: "confirmed",
      rating_received: rating >= 1 && rating <= 5 ? rating : null,
    })
    .eq("id", reviewId);

  await admin.rpc("release_pending_credits", { p_review_id: reviewId });

  const { data: reviewer } = await admin
    .from("profiles")
    .select("reviews_given, rating_avg, rating_count")
    .eq("id", review.reviewer_id)
    .single();

  if (reviewer) {
    const ratingCount = reviewer.rating_count + (rating >= 1 && rating <= 5 ? 1 : 0);
    const ratingAvg =
      rating >= 1 && rating <= 5
        ? Number(
            (
              (reviewer.rating_avg * reviewer.rating_count + rating) /
              ratingCount
            ).toFixed(2),
          )
        : reviewer.rating_avg;

    await admin
      .from("profiles")
      .update({
        reviews_given: reviewer.reviews_given + 1,
        is_ramped: reviewer.reviews_given + 1 >= 5,
        rating_avg: ratingAvg,
        rating_count: ratingCount,
      })
      .eq("id", review.reviewer_id);
  }

  await admin
    .from("requests")
    .update({ status: "completed" })
    .eq("id", review.request_id);

  revalidatePath("/wallet");
  revalidatePath(`/reviews/${reviewId}/confirm`);
  redirect(`/reviews/${reviewId}/confirm?message=Review confirmed.`);
}

export async function sendThanks(formData: FormData) {
  const profile = await requireProfile();
  const reviewId = String(formData.get("review_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body || body.length > 280) {
    redirect(`/reviews/${reviewId}/confirm?error=${encodeURIComponent("Message must be 1–280 characters")}`);
  }

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("id, reviewer_id, request_id")
    .eq("id", reviewId)
    .single();

  if (!review) {
    redirect(`/board?error=${encodeURIComponent("Not allowed")}`);
  }

  const { data: ownedRequest } = await admin
    .from("requests")
    .select("user_id")
    .eq("id", review.request_id)
    .single();

  if (!ownedRequest || ownedRequest.user_id !== profile.id) {
    redirect(`/board?error=${encodeURIComponent("Not allowed")}`);
  }

  const supabase = await createClient();
  await supabase.from("thanks_messages").insert({
    from_user_id: profile.id,
    to_user_id: review.reviewer_id,
    review_id: reviewId,
    body,
  });

  redirect(`/reviews/${reviewId}/confirm?message=Thanks sent.`);
}
