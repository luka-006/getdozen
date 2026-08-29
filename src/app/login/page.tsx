import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    mode?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  if (params.mode === "signup") redirect("/signup");
  const next = params.next ?? "/board";

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-14">
      <LoginForm
        next={next}
        initialError={params.error ?? null}
        initialMessage={params.message ?? null}
      />
    </div>
  );
}
