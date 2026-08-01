"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { haveInteracted } from "@/lib/profile-reviews";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitProfileReview(formData: FormData) {
  const me = await requireProfile();
  const toUserId = String(formData.get("to_user_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const ratingRaw = String(formData.get("rating") ?? "");
  const rating = ratingRaw ? Number(ratingRaw) : null;

  if (!toUserId || toUserId === me.id) {
    redirect(`/profile/${me.id}?error=${encodeURIComponent("Invalid profile")}`);
  }
  if (body.length < 8 || body.length > 280) {
    redirect(
      `/profile/${toUserId}?error=${encodeURIComponent("Review must be 8–280 characters")}`,
    );
  }
  if (
    rating !== null &&
    (rating < 1 || rating > 5 || !Number.isInteger(rating))
  ) {
    redirect(
      `/profile/${toUserId}?error=${encodeURIComponent("Pick a rating from 1–5")}`,
    );
  }

  const ok = await haveInteracted(me.id, toUserId);
  if (!ok) {
    redirect(
      `/profile/${toUserId}?error=${encodeURIComponent(
        "You can only review people you’ve worked with on Dozen",
      )}`,
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profile_reviews").upsert(
    {
      from_user_id: me.id,
      to_user_id: toUserId,
      body,
      rating,
    },
    { onConflict: "from_user_id,to_user_id" },
  );

  if (error) {
    redirect(
      `/profile/${toUserId}?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/profile/${toUserId}`);
  redirect(`/profile/${toUserId}?message=${encodeURIComponent("Review posted")}`);
}

export async function deleteProfileReview(formData: FormData) {
  const me = await requireProfile();
  const reviewId = String(formData.get("review_id") ?? "");
  const toUserId = String(formData.get("to_user_id") ?? "");

  const admin = createAdminClient();
  await admin
    .from("profile_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("from_user_id", me.id);

  revalidatePath(`/profile/${toUserId || me.id}`);
  redirect(
    `/profile/${toUserId || me.id}?message=${encodeURIComponent("Review removed")}`,
  );
}
