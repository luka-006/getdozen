import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isLaunchOpen } from "@/lib/launch";
import { markWaitlistConfirmed } from "@/lib/waitlist";
import { WaitlistJoined } from "@/components/waitlist-joined";

export default async function WaitlistConfirmedPage() {
  if (isLaunchOpen()) redirect("/");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    await markWaitlistConfirmed(user.email);
    await supabase.auth.signOut();
  }

  return (
    <div className="atmosphere">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-4 py-16">
        <WaitlistJoined />
      </section>
    </div>
  );
}
