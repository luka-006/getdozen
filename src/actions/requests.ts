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
  MIN_TESTERS,
  PLATFORMS,
  REQUEST_EXPIRY_DAYS,
  TESTER_COST,
  TESTER_DURATION_OPTIONS,
  getComboPack,
} from "@/lib/constants";
import { creditCostForQuestionCount, spendCredits } from "@/lib/credits";
import { encryptCredentials } from "@/lib/crypto";
import type { RequestFormState } from "@/lib/request-form";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const customQuestionSchema = z.object({
  text: z.string().min(8).max(300),
  suggestions: z.array(z.string().min(1).max(200)).max(6).default([]),
});

const feedbackSchema = z.object({
  app_name: z.string().min(2).max(120),
  app_url: z.string().url(),
  app_description: z.string().min(20).max(2000),
  platform: z.enum(PLATFORMS).default("web"),
  focus_tag: z.enum(FOCUS_TAGS).default("Everything"),
  test_credentials: z.string().max(500).optional(),
  custom_questions: z
    .array(customQuestionSchema)
    .min(MIN_QUESTIONS - CORE_QUESTIONS.length),
  proof_question: z.string().min(8).max(300),
  proof_answer: z.string().min(1).max(200),
});

const testerSchema = z.object({
  app_name: z.string().min(2).max(120),
  app_url: z.string().url(),
  app_description: z.string().min(20).max(2000),
  platform: z.enum(PLATFORMS).default("android"),
  opt_in_link: z.string().url(),
  testers_needed: z.number().int().min(MIN_TESTERS).max(100).default(MIN_TESTERS),
  duration_days: z.coerce
    .number()
    .int()
    .refine((n) => (TESTER_DURATION_OPTIONS as readonly number[]).includes(n), {
      message: "Pick a test length",
    }),
  test_focus: z.string().min(10).max(1000),
  test_start_date: z.string().min(8),
});

type CustomQuestionInput = z.infer<typeof customQuestionSchema>;

const FIELD_LABELS: Record<string, string> = {
  app_name: "App name",
  app_url: "App URL",
  app_description: "Description",
  platform: "Platform",
  focus_tag: "Focus",
  test_credentials: "Throwaway login",
  custom_questions: "Your questions",
  proof_question: "Proof question",
  proof_answer: "Proof answer",
  opt_in_link: "Opt-in link",
  testers_needed: "Testers needed",
  duration_days: "Test length",
  test_focus: "What to focus on",
  test_start_date: "Start date",
  combo_pack: "Pack",
};

function formatZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid request";

  const path = issue.path;
  const root = String(path[0] ?? "");
  const label = FIELD_LABELS[root] ?? root;

  if (root === "custom_questions" && typeof path[1] === "number") {
    const n = path[1] + 1;
    if (path[2] === "text" || path.length === 2) {
      if (issue.code === "too_small") {
        return `Question ${n} needs at least 8 characters`;
      }
      return `Question ${n}: ${issue.message}`;
    }
    if (path[2] === "suggestions") {
      return `Question ${n}: check suggested answers`;
    }
  }

  if (root === "testers_needed" && issue.code === "too_small") {
    return `Need at least ${MIN_TESTERS} testers`;
  }

  if (issue.code === "too_small" && issue.origin === "string") {
    const min =
      "minimum" in issue && typeof issue.minimum === "number"
        ? issue.minimum
        : null;
    if (root === "proof_question") {
      return "Proof question needs at least 8 characters";
    }
    if (root === "app_description") {
      return "Description needs at least 20 characters";
    }
    if (root === "test_focus") {
      return "Focus needs at least 10 characters";
    }
    if (root === "app_name") {
      return "App name needs at least 2 characters";
    }
    if (min != null) {
      return `${label} needs at least ${min} characters`;
    }
  }

  if (issue.code === "too_small" && issue.origin === "array") {
    return `Add more of your own questions (need ${MIN_QUESTIONS}+ total)`;
  }

  if (issue.code === "invalid_type" || issue.code === "invalid_format") {
    if (root === "app_url" || root === "opt_in_link") {
      return `${label} must be a full URL (https://…)`;
    }
  }

  if (label) return `${label}: ${issue.message}`;
  return issue.message;
}

function parseCustomQuestions(
  raw: FormDataEntryValue | null,
): CustomQuestionInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (typeof item === "string") {
          return { text: item.trim(), suggestions: [] as string[] };
        }
        if (item && typeof item === "object" && "text" in item) {
          const text = String((item as { text: unknown }).text ?? "").trim();
          const suggestions = Array.isArray(
            (item as { suggestions?: unknown }).suggestions,
          )
            ? (item as { suggestions: unknown[] }).suggestions
                .map((s) => String(s).trim())
                .filter(Boolean)
                .slice(0, 6)
            : [];
          return { text, suggestions };
        }
        return { text: "", suggestions: [] as string[] };
      })
      // Keep short non-empty questions so validation can name them;
      // only drop blank slots.
      .filter((q) => q.text.length > 0);
  } catch {
    return [];
  }
}

export async function createFeedbackRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const profile = await requireProfile();
  const parsed = feedbackSchema.safeParse({
    app_name: formData.get("app_name"),
    app_url: formData.get("app_url"),
    app_description: formData.get("app_description"),
    platform: formData.get("platform") || "web",
    focus_tag: formData.get("focus_tag") || "Everything",
    test_credentials: String(formData.get("test_credentials") ?? "") || undefined,
    custom_questions: parseCustomQuestions(formData.get("custom_questions")),
    proof_question: formData.get("proof_question"),
    proof_answer: formData.get("proof_answer"),
  });

  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const data = parsed.data;
  const focusTag =
    data.focus_tag === "Everything" ? null : data.focus_tag;
  const totalQuestions = CORE_QUESTIONS.length + data.custom_questions.length + 1;
  if (totalQuestions < MIN_QUESTIONS || totalQuestions > MAX_QUESTIONS) {
    return {
      error: `Need ${MIN_QUESTIONS}–${MAX_QUESTIONS} questions total (you have ${totalQuestions})`,
    };
  }

  const creditCost = creditCostForQuestionCount(totalQuestions);
  if (profile.credits < creditCost) {
    return { error: "Not enough credits — use Buy credits below." };
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
      platform: data.platform,
      focus_tag: focusTag,
      question_count: totalQuestions,
      credit_cost: creditCost,
      test_credentials_encrypted: encrypted,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !request) {
    return { error: error?.message ?? "Could not create request" };
  }

  const questions = [
    ...CORE_QUESTIONS.map((text, i) => ({
      request_id: request.id,
      position: i,
      text,
      is_core: true,
      is_proof: false,
      expected_answer: null as string | null,
      suggested_answers: [] as string[],
    })),
    ...data.custom_questions.map((q, i) => ({
      request_id: request.id,
      position: CORE_QUESTIONS.length + i,
      text: q.text,
      is_core: false,
      is_proof: false,
      expected_answer: null as string | null,
      suggested_answers: q.suggestions,
    })),
    {
      request_id: request.id,
      position: CORE_QUESTIONS.length + data.custom_questions.length,
      text: data.proof_question,
      is_core: false,
      is_proof: true,
      expected_answer: data.proof_answer.trim().toLowerCase(),
      suggested_answers: [] as string[],
    },
  ];

  const { error: qError } = await supabase.from("questions").insert(questions);
  if (qError) {
    const admin = createAdminClient();
    await admin.from("requests").delete().eq("id", request.id);
    return { error: qError.message };
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
    return {
      error: e instanceof Error ? e.message : "Credit spend failed",
    };
  }

  revalidatePath("/board");
  revalidatePath("/wallet");
  redirect(`/requests/${request.id}`);
}

export async function createTesterRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const profile = await requireProfile();
  const parsed = testerSchema.safeParse({
    app_name: formData.get("app_name"),
    app_url: formData.get("app_url"),
    app_description: formData.get("app_description"),
    platform: formData.get("platform") || "android",
    opt_in_link: formData.get("opt_in_link"),
    testers_needed: Number(formData.get("testers_needed") ?? MIN_TESTERS),
    duration_days: Number(formData.get("duration_days") ?? 14),
    test_focus: formData.get("test_focus"),
    test_start_date: formData.get("test_start_date"),
  });

  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const data = parsed.data;
  const totalCost = data.testers_needed * TESTER_COST;
  if (profile.credits < totalCost) {
    return {
      error: `Need ${totalCost} credits for ${data.testers_needed} testers`,
    };
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
      platform: data.platform,
      credit_cost: totalCost,
      testers_needed: data.testers_needed,
      duration_days: data.duration_days,
      opt_in_link: data.opt_in_link,
      test_focus: data.test_focus,
      test_start_date: data.test_start_date,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !request) {
    return { error: error?.message ?? "Could not create request" };
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
    return {
      error: e instanceof Error ? e.message : "Credit spend failed",
    };
  }

  revalidatePath("/board");
  revalidatePath("/testers");
  revalidatePath("/wallet");
  redirect(`/requests/${request.id}`);
}

export async function createComboRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const profile = await requireProfile();
  const pack = getComboPack(String(formData.get("combo_pack") ?? ""));
  if (!pack) {
    return { error: "Pick a pack" };
  }

  const parsed = z
    .object({
      app_name: z.string().min(2).max(120),
      app_url: z.string().url(),
      app_description: z.string().min(20).max(2000),
      platform: z.enum(PLATFORMS).default("android"),
      opt_in_link: z.string().url(),
      test_focus: z.string().min(10).max(1000),
      test_start_date: z.string().min(8),
      duration_days: z.coerce
        .number()
        .int()
        .refine((n) => (TESTER_DURATION_OPTIONS as readonly number[]).includes(n), {
          message: "Pick a test length",
        }),
      test_credentials: z.string().max(500).optional(),
      custom_questions: z.array(customQuestionSchema),
      proof_question: z.string().min(8).max(300),
      proof_answer: z.string().min(1).max(200),
    })
    .safeParse({
      app_name: formData.get("app_name"),
      app_url: formData.get("app_url"),
      app_description: formData.get("app_description"),
      platform: formData.get("platform") || "android",
      opt_in_link: formData.get("opt_in_link"),
      test_focus: formData.get("test_focus"),
      test_start_date: formData.get("test_start_date"),
      duration_days: Number(formData.get("duration_days") ?? 14),
      test_credentials:
        String(formData.get("test_credentials") ?? "") || undefined,
      custom_questions: parseCustomQuestions(formData.get("custom_questions")),
      proof_question: formData.get("proof_question"),
      proof_answer: formData.get("proof_answer"),
    });

  if (!parsed.success) {
    return { error: formatZodError(parsed.error) };
  }

  const data = parsed.data;
  const totalQuestions =
    CORE_QUESTIONS.length + data.custom_questions.length + 1;
  if (totalQuestions !== pack.questions) {
    return {
      error: `This pack needs exactly ${pack.questions} questions (you have ${totalQuestions})`,
    };
  }

  if (profile.credits < pack.credits) {
    return { error: `Need ${pack.credits} credits for this pack` };
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
      type: "combo",
      app_name: data.app_name,
      app_url: data.app_url,
      app_description: data.app_description,
      platform: data.platform,
      credit_cost: pack.credits,
      testers_needed: pack.testers,
      duration_days: data.duration_days,
      question_count: pack.questions,
      opt_in_link: data.opt_in_link,
      test_focus: data.test_focus,
      test_start_date: data.test_start_date,
      test_credentials_encrypted: encrypted,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !request) {
    return { error: error?.message ?? "Could not create request" };
  }

  const questions = [
    ...CORE_QUESTIONS.map((text, i) => ({
      request_id: request.id,
      position: i,
      text,
      is_core: true,
      is_proof: false,
      expected_answer: null as string | null,
      suggested_answers: [] as string[],
    })),
    ...data.custom_questions.map((q, i) => ({
      request_id: request.id,
      position: CORE_QUESTIONS.length + i,
      text: q.text,
      is_core: false,
      is_proof: false,
      expected_answer: null as string | null,
      suggested_answers: q.suggestions,
    })),
    {
      request_id: request.id,
      position: CORE_QUESTIONS.length + data.custom_questions.length,
      text: data.proof_question,
      is_core: false,
      is_proof: true,
      expected_answer: data.proof_answer.trim().toLowerCase(),
      suggested_answers: [] as string[],
    },
  ];

  const { error: qError } = await supabase.from("questions").insert(questions);
  if (qError) {
    const admin = createAdminClient();
    await admin.from("requests").delete().eq("id", request.id);
    return { error: qError.message };
  }

  try {
    await spendCredits({
      userId: profile.id,
      amount: pack.credits,
      reason: "combo_request",
      refId: request.id,
    });
  } catch (e) {
    const admin = createAdminClient();
    await admin.from("requests").delete().eq("id", request.id);
    return {
      error: e instanceof Error ? e.message : "Credit spend failed",
    };
  }

  revalidatePath("/board");
  revalidatePath("/testers");
  revalidatePath("/wallet");
  redirect(`/requests/${request.id}`);
}
