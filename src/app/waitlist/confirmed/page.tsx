import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchOpen } from "@/lib/launch";
import { markWaitlistConfirmed } from "@/lib/waitlist";
import { rememberEarlyAccessRow } from "@/actions/waitlist";
import { WaitlistJoined } from "@/components/waitlist-joined";
import {
  EARLY_ACCESS_COOKIE,
  earlyAccessSecret,
  verifyEarlyAccessToken,
} from "@/lib/early-access";
import { createAdminClient } from "@/lib/supabase/admin";

async function alreadyRequestedEarlyAccess() {
  const secret = earlyAccessSecret();
  if (!secret) return false;
  const jar = await cookies();
  const rowId = await verifyEarlyAccessToken(
    jar.get(EARLY_ACCESS_COOKIE)?.value,
    secret,
  );
  if (!rowId) return false;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("waitlist")
      .select("early_access_requested")
      .eq("id", rowId)
      .maybeSingle();
    return Boolean(data?.early_access_requested);
  } catch {
    return false;
  }
}

export default async function WaitlistConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ early?: string }>;
}) {
  if (isLaunchOpen()) redirect("/");

  const query = await searchParams;
  let email: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? null;
    if (email) {
      const rowId = await markWaitlistConfirmed(email);
      await rememberEarlyAccessRow(rowId);
      await supabase.auth.signOut();
    }
  } catch {
    // The success card still renders if the session cannot be read.
    email = null;
  }

  const previewDone =
    process.env.NODE_ENV === "development" && query.early === "confirmed";
  const earlyAccessRequested = previewDone || (await alreadyRequestedEarlyAccess());

  return (
    <div className="atmosphere">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-16">
        <WaitlistJoined email={email} earlyAccessRequested={earlyAccessRequested} />
      </section>
    </div>
  );
}
