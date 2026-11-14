import { NextResponse } from "next/server";
import { denyCron } from "@/lib/cron-auth";
import { seedBlockedReason } from "@/lib/seed-guard";
import { runSeedJohnPromo, runSeedPreviewIfNeeded } from "@/lib/seed-john-promo";

export const maxDuration = 300;

export async function GET(request: Request) {
  const denied = denyCron(request);
  if (denied) return denied;
  if (seedBlockedReason()) {
    return new NextResponse(null, { status: 404 });
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

