import { NextResponse } from "next/server";
import { denyCron } from "@/lib/cron-auth";
import { sendWaitlistLaunchEmails } from "@/lib/waitlist-launch";

export async function GET(request: Request) {
  const denied = denyCron(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") !== "0";
  const singleTo = url.searchParams.get("to")?.trim() || undefined;

  try {
    const result = await sendWaitlistLaunchEmails({ dryRun, singleTo });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Waitlist launch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

