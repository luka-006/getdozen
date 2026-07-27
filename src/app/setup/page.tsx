import Link from "next/link";
import { readFile } from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

async function schemaReady() {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default async function SetupPage() {
  const ready = await schemaReady();
  const migrationDir = path.join(process.cwd(), "supabase", "migrations");
  let sql = "";
  try {
    const one = await readFile(
      path.join(migrationDir, "20260726120000_initial.sql"),
      "utf8",
    );
    const two = await readFile(
      path.join(migrationDir, "20260727180000_stripe_and_public_wall.sql"),
      "utf8",
    );
    sql = `${one}\n\n${two}`;
  } catch {
    sql = "Could not load migration files.";
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-10">
      <h1 className="font-display text-[32px] font-semibold">Setup</h1>
      <p className="mt-2 text-ink/70">
        Database status for getdozen.app.
      </p>

      <div className="mt-6 well px-4 py-3">
        <p className="font-mono text-[13px]">
          Schema: {ready ? "ready" : "missing — run the SQL below"}
        </p>
      </div>

      {!ready ? (
        <div className="mt-8 space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink/80">
            <li>
              Open{" "}
              <a
                className="text-blue"
                href="https://supabase.com/dashboard/project/bcoimanvvrbgedhlxaqf/sql/new"
                target="_blank"
                rel="noreferrer"
              >
                Supabase SQL editor
              </a>
            </li>
            <li>Paste the full migration SQL and click Run</li>
            <li>
              Auth → URL configuration: add{" "}
              <span className="font-mono text-[13px]">
                {process.env.NEXT_PUBLIC_SITE_URL}/auth/callback
              </span>
            </li>
            <li>Refresh this page</li>
          </ol>
          <pre className="max-h-[420px] overflow-auto rounded-[6px] border border-border bg-white p-3 font-mono text-[11px] leading-relaxed">
            {sql}
          </pre>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <p className="text-ink/75">Database is ready.</p>
          <Link href="/signup" className="btn btn-primary">
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
