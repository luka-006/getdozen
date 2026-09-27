import { SignupForm } from "@/components/signup-form";

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = params.next ?? "/board";

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-14">
      <SignupForm
        next={next}
        initialError={params.error ?? null}
        initialMessage={params.message ?? null}
      />
    </div>
  );
}
