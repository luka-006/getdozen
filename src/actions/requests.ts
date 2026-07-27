"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfile } from "@/lib/auth";
import {
  CORE_QUESTIONS,
  FOCUS_TAGS,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  REQUEST_EXPIRY_DAYS,
  TESTER_COST,
} from "@/lib/constants";
import { creditCostForQuestionCount, spendCredits } from "@/lib/credits";
import { encryptCredentials } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const feedbackSchema = z.object({
  app_name: z.string().min(2).max(120),
  app_url: z.string().url(),
  app_description: z.string().min(20).max(2000),
  focus_tag: z.enum(FOCUS_TAGS).optional(),
  test_credentials: z.string().max(500).optional(),
  custom_questions: z.array(z.string().min(8).max(300)).min(MIN_QUESTIONS - CORE_QUESTIONS.length),
  proof_question: z.string().min(8).max(300),
  proof_answer: z.string().min(1).max(200),
});

const testerSchema = z.object({
  app_name: z.string().min(2).max(120),
  app_url: z.string().url(),
  app_description: z.string().min(20).max(2000),
  opt_in_link: z.string().url(),
  testers_needed: z.number().int().min(1).max(100).default(12),
  test_focus: z.string().min(10).max(1000),
  test_start_date: z.string().min(8),
});

function parseCustomQuestions(raw: FormDataEntryValue | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw)) as string[];
    return parsed.map((q) => q.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export async function createFeedbackRequest(formData: FormData) {
  const profile = await requireProfile();
  const parsed = feedbackSchema.safeParse({
    app_name: formData.get("app_name"),
    app_url: formData.get("app_url"),
    app_description: formData.get("app_description"),
    focus_tag: formData.get("focus_tag") || undefined,
    test_credentials: String(formData.get("test_credentials") ?? "") || undefined,
    custom_questions: parseCustomQuestions(formData.get("custom_questions")),
    proof_question: formData.get("proof_question"),
    proof_answer: formData.get("proof_answer"),
  });

  if (!parsed.success) {
    redirect(`/requests/new?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid request")}`);
  }

  const data = parsed.data;
  const totalQuestions = CORE_QUESTIONS.length + data.custom_questions.length + 1;
  if (totalQuestions < MIN_QUESTIONS || totalQuestions > MAX_QUESTIONS) {
    redirect(`/requests/new?error=${encodeURIComponent(`Need ${MIN_QUESTIONS}–${MAX_QUESTIONS} questions total`)}`);
  }

  const creditCost = creditCostForQuestionCount(totalQuestions);
  if (profile.credits < creditCost) {
    redirect(`/requests/new?error=${encodeURIComponent("Not enough credits. Write reviews or earn tester credits first.")}`);
  }

  const supabase = await createClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REQUEST_EXPIRY_DAYS);

  const encrypted = data.test_credentials
    ? encryptCredentials(data.test_credentials)
    : null;

  const { data: request, error } = await supabase
    .from("requests")
    .insert({
      user_id: profile.id,
      type: "feedback",
      app_name: data.app_name,
      app_url: data.app_url,
      app_description: data.app_description,
      focus_tag: data.focus_tag ?? null,
      question_count: totalQuestions,
      credit_cost: creditCost,
      test_credentials_encrypted: encrypted,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !request) {
    redirect(`/requests/new?error=${encodeURIComponent(error?.message ?? "Could not create request")}`);
  }

  const questions = [
    ...CORE_QUESTIONS.map((text, i) => ({
      request_id: request.id,
      position: i,
      text,
      is_core: true,
      is_proof: false,
      expected_answer: null as string | null,
    })),
    ...data.custom_questions.map((text, i) => ({
      request_id: request.id,
      position: CORE_QUESTIONS.length + i,
      text,
      is_core: false,
      is_proof: false,
      expected_answer: null as string | null,
    })),
    {
      request_id: request.id,
      position: CORE_QUESTIONS.length + data.custom_questions.length,
      text: data.proof_question,
      is_core: false,
      is_proof: true,
      expected_answer: data.proof_answer.trim().toLowerCase(),
    },
  ];

  const { error: qError } = await supabase.from("questions").insert(questions);
  if (qError) {
    const admin = createAdminClient();
    await admin.from("requests").delete().eq("id", request.id);
    redirect(`/requests/new?error=${encodeURIComponent(qError.message)}`);
  }

  try {
    await spendCredits({
      userId: profile.id,
      amount: creditCost,
      reason: "receive_review",
      refId: request.id,
    });
  } catch (e) {
    const admin = createAdminClient();
    await admin.from("requests").delete().eq("id", request.id);
    redirect(`/requests/new?error=${encodeURIComponent(e instanceof Error ? e.message : "Credit spend failed")}`);
  }

  revalidatePath("/board");
  revalidatePath("/wallet");
  redirect(`/requests/${request.id}`);
}

export async function createTesterRequest(formData: FormData) {
  const profile = await requireProfile();
  const parsed = testerSchema.safeParse({
    app_name: formData.get("app_name"),
    app_url: formData.get("app_url"),
    app_description: formData.get("app_description"),
    opt_in_link: formData.get("opt_in_link"),
    testers_needed: Number(formData.get("testers_needed") ?? 12),
    test_focus: formData.get("test_focus"),
    test_start_date: formData.get("test_start_date"),
  });

  if (!parsed.success) {
    redirect(`/requests/new?type=tester&error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid request")}`);
  }

  const data = parsed.data;
  const totalCost = data.testers_needed * TESTER_COST;
  if (profile.credits < totalCost) {
    redirect(`/requests/new?type=tester&error=${encodeURIComponent(`Need ${totalCost} credits for ${data.testers_needed} testers`)}`);
  }

  const supabase = await createClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REQUEST_EXPIRY_DAYS);

  const { data: request, error } = await supabase
    .from("requests")
    .insert({
      user_id: profile.id,
      type: "tester",
      app_name: data.app_name,
      app_url: data.app_url,
      app_description: data.app_description,
      credit_cost: totalCost,
      testers_needed: data.testers_needed,
      opt_in_link: data.opt_in_link,
      test_focus: data.test_focus,
      test_start_date: data.test_start_date,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !request) {
    redirect(`/requests/new?type=tester&error=${encodeURIComponent(error?.message ?? "Could not create request")}`);
  }

  try {
    await spendCredits({
      userId: profile.id,
      amount: totalCost,
      reason: "recruit_testers",
      refId: request.id,
    });
  } catch (e) {
    const admin = createAdminClient();
    await admin.from("requests").delete().eq("id", request.id);
    redirect(`/requests/new?type=tester&error=${encodeURIComponent(e instanceof Error ? e.message : "Credit spend failed")}`);
  }

  revalidatePath("/board");
  revalidatePath("/testers");
  revalidatePath("/wallet");
  redirect(`/requests/${request.id}`);
}
