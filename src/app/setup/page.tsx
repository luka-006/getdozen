import Link from "next/link";
import { readFile } from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripeConfigured } from "@/lib/stripe";

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

function envStatus() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const stripeSecret = process.env.STRIPE_SECRET_KEY ?? "";
  const stripeWh = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  const stripePk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

  const looksPlaceholder = (v: string) =>
    !v ||
    v.startsWith("PASTE_") ||
    v.startsWith("your-") ||
    v.includes("...");

  return {
    supabaseUrl: url.includes("blvoisjgveskbkzzjhcg"),
    anon: !looksPlaceholder(anon),
    serviceRole: !looksPlaceholder(service),
    stripeSecret: !looksPlaceholder(stripeSecret),
    stripeWebhook: !looksPlaceholder(stripeWh),
    stripePublishable: !looksPlaceholder(stripePk),
    stripeReady: stripeConfigured() && !looksPlaceholder(stripeSecret),
  };
}

export default async function SetupPage() {
  const ready = await schemaReady();
  const env = envStatus();
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

  const checks = [
    ["Supabase project URL", env.supabaseUrl],
    ["Anon / publishable key", env.anon],
    ["Service role key", env.serviceRole],
    ["Schema (profiles readable)", ready],
    ["Stripe secret key", env.stripeSecret],
    ["Stripe publishable key", env.stripePublishable],
    ["Stripe webhook secret", env.stripeWebhook],
  ] as const;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-10">
      <h1 className="font-display text-[32px] font-semibold">Setup</h1>
      <p className="mt-2 text-ink/70">
        Database and billing status for Dozen.
      </p>

      <div className="mt-6 space-y-2">
        {checks.map(([label, ok]) => (
          <div key={label} className="well flex items-center justify-between px-4 py-3">
            <span className="text-[14px]">{label}</span>
            <span className="font-mono text-[12px] text-ink/65">
              {ok ? "ok" : "needed"}
            </span>
          </div>
        ))}
      </div>

      {!ready || !env.serviceRole ? (
        <div className="mt-8 space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-[15px] text-ink/80">
            <li>
              Open{" "}
              <a
                className="text-blue"
                href="https://supabase.com/dashboard/project/blvoisjgveskbkzzjhcg/settings/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                Supabase API keys
              </a>{" "}
              → Legacy → copy <span className="font-mono text-[13px]">service_role</span>{" "}
              into <span className="font-mono text-[13px]">.env.local</span>
            </li>
            <li>
              Auth → URL configuration: add{" "}
              <span className="font-mono text-[13px]">
                {process.env.NEXT_PUBLIC_SITE_URL}/auth/callback
              </span>
            </li>
            {!ready ? (
              <li>
                Schema is missing — paste SQL in the{" "}
                <a
                  className="text-blue"
                  href="https://supabase.com/dashboard/project/blvoisjgveskbkzzjhcg/sql/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  SQL editor
                </a>
              </li>
            ) : null}
          </ol>
          {!ready ? (
            <pre className="max-h-[420px] overflow-auto rounded-[6px] border border-border bg-white p-3 font-mono text-[11px] leading-relaxed">
              {sql}
            </pre>
          ) : null}
        </div>
      ) : null}

      {ready && env.serviceRole && !env.stripeReady ? (
        <div className="mt-8 space-y-3 text-[15px] text-ink/80">
          <p>
            Database is ready. Add Stripe keys from{" "}
            <a
              className="text-blue"
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noreferrer"
            >
              Stripe API keys
            </a>{" "}
            (LIVE — products were created in live mode), then create a webhook for{" "}
            <span className="font-mono text-[13px]">
              {process.env.NEXT_PUBLIC_SITE_URL}/api/stripe/webhook
            </span>{" "}
            listening to{" "}
            <span className="font-mono text-[12px]">
              checkout.session.completed, customer.subscription.updated,
              customer.subscription.deleted
            </span>
            .
          </p>
        </div>
      ) : null}

      {ready && env.serviceRole && env.stripeReady ? (
        <div className="mt-8 space-y-3">
          <p className="text-ink/75">Database and Stripe secrets look ready.</p>
          <Link href="/signup" className="btn btn-primary">
            Create account
          </Link>
        </div>
      ) : null}
    </div>
  );
}
