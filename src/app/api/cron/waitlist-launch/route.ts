import { NextResponse } from "next/server";
import { sendWaitlistLaunchEmails } from "@/lib/waitlist-launch";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${expected}`) return true;

  return request.headers.get("x-cron-secret") === expected;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

export async function POST(request: Request) {
  return GET(request);
}
