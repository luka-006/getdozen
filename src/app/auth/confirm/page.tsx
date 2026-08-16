import { WaitlistForm } from "@/components/waitlist-form";
import { isLaunchOpen } from "@/lib/launch";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ email?: string; error?: string }>;
};

export default async function AuthConfirmPage({ searchParams }: Props) {
  if (isLaunchOpen()) redirect("/login");

  const query = await searchParams;
  const email = query.email?.trim().toLowerCase() ?? "";
  const error =
    query.error === "expired"
      ? "That email link was already used. Enter a new code."
      : query.error
        ? "That email link did not work. Enter the 6-digit code instead."
        : null;

  return (
    <div className="atmosphere">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md flex-col justify-center px-4 py-16">
        <WaitlistForm
          initialEmail={email}
          initialPhase={email ? "code" : "idle"}
          notice={error}
        />
      </section>
    </div>
  );
}
