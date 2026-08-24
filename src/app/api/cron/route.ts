import { NextResponse } from "next/server";
import { voidStaleCommitments } from "@/actions/testers";
import { sendBoostOffers } from "@/lib/boost-mail";
import { refundUnusedTesterSlots } from "@/lib/expire-requests";
import { createAdminClient } from "@/lib/supabase/admin";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${expected}`) return true;

  const custom = request.headers.get("x-cron-secret");
  return custom === expected;
}

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
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCron();
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCron();
}
