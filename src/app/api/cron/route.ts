import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { voidStaleCommitments } from "@/actions/testers";

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  await admin.rpc("escalate_bounties");
  await admin.rpc("auto_confirm_reviews");
  await admin.rpc("expire_credits");
  await voidStaleCommitments();

  return NextResponse.json({ ok: true });
}
