import { createAdminClient } from "@/lib/supabase/admin";
import { checkinSlotIndex, fallbackCheckinPrompt } from "@/lib/tester-checkin";

export async function checkinQuestionForCommitment(opts: {
  requestId: string;
  optedInAt: string;
  dayIndex: number;
  productType?: string | null;
}): Promise<string> {
  const slot = checkinSlotIndex(opts.dayIndex);
  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("questions")
    .select("text, is_proof, position")
    .eq("request_id", opts.requestId)
    .eq("is_proof", false)
    .order("position");

  const texts = (questions ?? []).map((q) => q.text.trim()).filter(Boolean);
  if (texts.length > 0) {
    return texts[slot % texts.length]!;
  }
  return fallbackCheckinPrompt(slot, opts.productType);
}
