import { redirect } from "next/navigation";
import { SignupConfirmForm } from "@/components/signup-confirm-form";
import { safeInternalPath } from "@/lib/safe-path";

type Props = {
  searchParams: Promise<{
    email?: string;
    next?: string;
    error?: string;
  }>;
};

export default async function SignupConfirmPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = String(params.email ?? "").trim();
  const next = safeInternalPath(params.next, "/board");

  if (!email) {
    redirect("/signup");
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-14">
      <SignupConfirmForm
        email={email}
        next={next}
        initialError={params.error ?? null}
      />
    </div>
  );
}
