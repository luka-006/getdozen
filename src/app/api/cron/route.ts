import { NextResponse } from "next/server";
import { denyCron } from "@/lib/cron-auth";
import { voidStaleCommitments } from "@/actions/testers";
import { sendBoostOffers } from "@/lib/boost-mail";
import { refundUnusedTesterSlots } from "@/lib/expire-requests";
import { createAdminClient } from "@/lib/supabase/admin";

async function runCron() {
  const admin = createAdminClient();
  await admin.rpc("escalate_bounties");
  await refundUnusedTesterSlots();
  await admin.rpc("auto_confirm_reviews");
  await admin.rpc("expire_credits");
  await voidStaleCommitments();
  await sendBoostOffers();
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const denied = denyCron(request);
  if (denied) return denied;
  return runCron();
}
