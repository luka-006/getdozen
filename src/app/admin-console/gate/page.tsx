import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminGateForm } from "@/components/admin-gate-form";
import {
  consoleConfigured,
  readAdminSession,
  requireAdminOwner,
} from "@/lib/admin-console";
import { adminConsolePath } from "@/lib/admin-console-path";

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminGatePage({ searchParams }: Props) {
  const profile = await requireAdminOwner();
  const session = await readAdminSession();
  if (session?.uid === profile.id) {
    redirect(adminConsolePath());
  }

  const query = await searchParams;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <p className="font-mono text-[12px] text-ink/45">Restricted</p>
      <h1 className="mt-2 font-display text-[28px] font-semibold">Console access</h1>
      <p className="mt-2 text-[14px] text-ink/65">
        Signed in as {profile.email}. Authenticator required.
      </p>
      {query.error ? (
        <p className="mt-4 rounded-[6px] border border-flag/30 bg-flag/5 px-3 py-2 text-[13px] text-flag">
          {query.error}
        </p>
      ) : null}
      <AdminGateForm configured={consoleConfigured()} />
      <p className="mt-8 text-center text-[13px] text-ink/55">
        <Link href="/board" className="text-blue">
          Back to Dozen
        </Link>
      </p>
    </div>
  );
}
