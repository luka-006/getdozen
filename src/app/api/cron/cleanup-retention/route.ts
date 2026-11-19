import { NextResponse } from "next/server";
import { denyCron } from "@/lib/cron-auth";
import { runRetentionCleanup } from "@/lib/retention-cleanup";

export async function GET(request: Request) {
  const denied = denyCron(request);
  if (denied) return denied;

  try {
    const result = await runRetentionCleanup();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Retention cleanup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

