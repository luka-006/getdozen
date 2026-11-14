import { NextResponse } from "next/server";
import { seedBlockedReason } from "@/lib/seed-guard";
import { waitlistApiGuard } from "@/lib/waitlist-guard";
import { runSeedJohnPromo, runSeedPreviewIfNeeded } from "@/lib/seed-john-promo";

export const maxDuration = 300;

function authorized(request: Request) {
  if (process.env.SEED_JOHN_ON_DEPLOY === "1") return true;

  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const bearer = request.headers.get("authorization");
  if (bearer === `Bearer ${expected}`) return true;

  return request.headers.get("x-cron-secret") === expected;
}

export async function GET(request: Request) {
  const waitlistDenied = await waitlistApiGuard();
  if (waitlistDenied) return waitlistDenied;
  if (seedBlockedReason()) {
    return new NextResponse(null, { status: 404 });
  }
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const preview = await runSeedPreviewIfNeeded({ force: true });
    const john = await runSeedJohnPromo({ force: true });

    return NextResponse.json({
      ok: true,
      preview,
      john,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "John profile seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const waitlistDenied = await waitlistApiGuard();
  if (waitlistDenied) return waitlistDenied;
  return GET(request);
}
