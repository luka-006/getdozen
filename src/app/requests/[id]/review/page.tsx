import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReviewForm } from "@/components/review-form";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/crypto";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ReviewPage({ params, searchParams }: Props) {
  const profile = await requireProfile();
  const { id } = await params;
  const query = await searchParams;
  const admin = createAdminClient();

  const { data: request } = await admin
    .from("requests")
    .select("*")
    .eq("id", id)
    .single();

  if (!request || (request.type !== "feedback" && request.type !== "combo"))
    notFound();
  if (request.user_id === profile.id) {
    redirect(`/requests/${id}?error=${encodeURIComponent("You cannot review your own request")}`);
  }
  if (request.status !== "open") {
    redirect(`/requests/${id}?error=${encodeURIComponent("This request is no longer open")}`);
  }

  const { data: questions } = await admin
    .from("questions")
    .select("id, text, is_core, is_proof, position, suggested_answers")
    .eq("request_id", id)
    .order("position");

  if (!questions?.length) notFound();

  let credentials: string | null = null;
  if (request.test_credentials_encrypted) {
    try {
      credentials = decryptCredentials(request.test_credentials_encrypted);
    } catch {
      credentials = null;
    }
  }

  const isDemo = String(request.app_name).startsWith("Demo ");
  const proofHint = isDemo ? "test" : null;
  const loginHint =
    credentials ??
    (isDemo ? "demo@test.com / password123" : null);

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="text-[13px] text-ink/55">
        <Link href={`/requests/${id}`} className="text-blue">
          {request.app_name}
        </Link>{" "}
        / review
      </p>
      <h1 className="mt-2 font-display text-[32px] font-semibold">Review</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={request.app_url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary"
        >
          Open app
        </a>
        <a
          href={request.app_url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          Sign in
        </a>
      </div>

      {loginHint ? (
        <div className="mt-4 well px-4 py-3">
          <p className="text-[13px] font-medium">Throwaway login</p>
          <p className="mt-1 font-mono text-[13px] whitespace-pre-wrap">
            {loginHint}
          </p>
        </div>
      ) : null}

      {isDemo ? (
        <p className="mt-4 text-[13px] text-ink/60">
          Demo request — proof answer is <span className="font-mono">test</span>
          . Credits confirm automatically.
        </p>
      ) : null}

      {query.error ? (
        <p className="mt-4 text-[13px] text-flag">{query.error}</p>
      ) : null}

      <div className="mt-8">
        <ReviewForm
          requestId={id}
          questions={questions}
          isDemo={isDemo}
          proofHint={proofHint}
        />
      </div>
    </div>
  );
}
