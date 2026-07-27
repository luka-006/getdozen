"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import {
  MAX_CONCURRENT_COMMITMENTS,
  MAX_CONCURRENT_COMMITMENTS_PRO,
  MAX_MISSED_CHECKINS,
  MIN_ANSWER_CHARS,
  TESTER_DAYS,
  TESTER_EARN,
} from "@/lib/constants";
import { appendLedger } from "@/lib/credits";
import { hashEmail } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLaunchBonusActive } from "@/lib/utils";

export async function joinTesterRequest(formData: FormData) {
  const profile = await requireProfile();
  const requestId = String(formData.get("request_id") ?? "");
  const googleEmail = String(formData.get("google_email") ?? "").trim().toLowerCase();

  if (!googleEmail || !googleEmail.includes("@")) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent("Enter the Google account email you will use to opt in")}`);
  }

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!request || request.type !== "tester" || request.status !== "open") {
    redirect(`/board?error=${encodeURIComponent("Tester request is not open")}`);
  }
  if (request.user_id === profile.id) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent("You cannot join your own test")}`);
  }
  if (request.testers_filled >= request.testers_needed) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent("All tester slots are filled")}`);
  }

  const maxSlots = profile.is_pro
    ? MAX_CONCURRENT_COMMITMENTS_PRO
    : MAX_CONCURRENT_COMMITMENTS;

  const { count } = await admin
    .from("tester_commitments")
    .select("*", { count: "exact", head: true })
    .eq("tester_id", profile.id)
    .eq("status", "active");

  if ((count ?? 0) >= maxSlots) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent(`Max ${maxSlots} concurrent commitments`)}`);
  }

  const emailHash = hashEmail(googleEmail);
  const { data: duplicate } = await admin
    .from("tester_commitments")
    .select("id")
    .eq("google_email_hash", emailHash)
    .neq("tester_id", profile.id)
    .limit(1);

  if (duplicate?.length) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent("That Google account is already linked to another profile")}`);
  }

  const completesAt = new Date();
  completesAt.setDate(completesAt.getDate() + TESTER_DAYS);

  const { error } = await admin.from("tester_commitments").insert({
    request_id: requestId,
    tester_id: profile.id,
    google_email: googleEmail,
    google_email_hash: emailHash,
    completes_at: completesAt.toISOString(),
    checkin_days: Array.from({ length: 14 }, () => false),
  });

  if (error) {
    redirect(`/requests/${requestId}?error=${encodeURIComponent(error.message)}`);
  }

  await admin
    .from("requests")
    .update({
      testers_filled: request.testers_filled + 1,
      status:
        request.testers_filled + 1 >= request.testers_needed
          ? "in_progress"
          : "open",
    })
    .eq("id", requestId);

  revalidatePath("/testers");
  revalidatePath(`/requests/${requestId}`);
  redirect("/testers?message=Commitment started. Opt in through the Play Console link today.");
}

export async function submitCheckin(formData: FormData) {
  const profile = await requireProfile();
  const commitmentId = String(formData.get("commitment_id") ?? "");
  const answer = String(formData.get("prompt_answer") ?? "").trim();

  if (answer.length < MIN_ANSWER_CHARS) {
    redirect(`/testers?error=${encodeURIComponent(`Check-in needs at least ${MIN_ANSWER_CHARS} characters`)}`);
  }

  const admin = createAdminClient();
  const { data: commitment } = await admin
    .from("tester_commitments")
    .select("*")
    .eq("id", commitmentId)
    .single();

  if (!commitment || commitment.tester_id !== profile.id || commitment.status !== "active") {
    redirect(`/testers?error=${encodeURIComponent("Commitment not found")}`);
  }

  const start = new Date(commitment.opted_in_at);
  const dayIndex = Math.min(
    13,
    Math.max(0, Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000))),
  );

  const days = [...(commitment.checkin_days as boolean[])];
  if (days[dayIndex]) {
    redirect(`/testers?error=${encodeURIComponent("Check-in already recorded for today")}`);
  }

  const { error } = await admin.from("checkins").insert({
    commitment_id: commitmentId,
    day_index: dayIndex,
    prompt_answer: answer,
  });

  if (error) {
    redirect(`/testers?error=${encodeURIComponent(error.message)}`);
  }

  days[dayIndex] = true;
  await admin
    .from("tester_commitments")
    .update({
      checkin_days: days,
      checkins_completed: commitment.checkins_completed + 1,
      last_checkin_at: new Date().toISOString(),
    })
    .eq("id", commitmentId);

  revalidatePath("/testers");
  redirect("/testers?message=Check-in saved.");
}

export async function completeTesterCommitment(formData: FormData) {
  const profile = await requireProfile();
  const commitmentId = String(formData.get("commitment_id") ?? "");
  const finalNotes = String(formData.get("final_notes") ?? "").trim();

  if (finalNotes.length < MIN_ANSWER_CHARS) {
    redirect(`/testers?error=${encodeURIComponent("Final review is required")}`);
  }

  const admin = createAdminClient();
  const { data: commitment } = await admin
    .from("tester_commitments")
    .select("*, requests(*)")
    .eq("id", commitmentId)
    .single();

  if (!commitment || commitment.tester_id !== profile.id) {
    redirect(`/testers?error=${encodeURIComponent("Commitment not found")}`);
  }
  if (commitment.status !== "active") {
    redirect(`/testers?error=${encodeURIComponent("Commitment is closed")}`);
  }
  if (new Date(commitment.completes_at) > new Date()) {
    redirect(`/testers?error=${encodeURIComponent("Day 14 has not been reached yet")}`);
  }
  if (commitment.checkins_missed > MAX_MISSED_CHECKINS) {
    redirect(`/testers?error=${encodeURIComponent("Too many missed check-ins. Commitment voided.")}`);
  }

  let earn = TESTER_EARN;
  if (isLaunchBonusActive()) earn *= 2;

  await admin
    .from("tester_commitments")
    .update({ status: "completed" })
    .eq("id", commitmentId);

  await appendLedger({
    userId: profile.id,
    amount: earn,
    reason: "tester_completed",
    refId: commitmentId,
    status: "available",
  });

  revalidatePath("/testers");
  revalidatePath("/wallet");
  redirect(`/testers?message=Commitment complete. ${earn} credits added.`);
}

export async function voidStaleCommitments() {
  const admin = createAdminClient();
  const { data: active } = await admin
    .from("tester_commitments")
    .select("*")
    .eq("status", "active");

  for (const c of active ?? []) {
    const start = new Date(c.opted_in_at).getTime();
    const elapsedDays = Math.floor((Date.now() - start) / (24 * 60 * 60 * 1000));
    const days = [...(c.checkin_days as boolean[])];
    let missed = 0;

    for (let i = 0; i < Math.min(elapsedDays, 14); i += 1) {
      // Every other day check-in expected: days 0,2,4,...
      if (i % 2 === 0 && !days[i]) missed += 1;
    }

    if (missed > MAX_MISSED_CHECKINS) {
      await admin
        .from("tester_commitments")
        .update({ status: "voided", checkins_missed: missed })
        .eq("id", c.id);

      const { data: request } = await admin
        .from("requests")
        .select("testers_filled, status")
        .eq("id", c.request_id)
        .single();

      if (request) {
        await admin
          .from("requests")
          .update({
            testers_filled: Math.max(0, request.testers_filled - 1),
            status: "open",
          })
          .eq("id", c.request_id);
      }
    } else if (missed !== c.checkins_missed) {
      await admin
        .from("tester_commitments")
        .update({ checkins_missed: missed })
        .eq("id", c.id);
    }
  }
}
