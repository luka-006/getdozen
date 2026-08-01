import { requireProfile } from "@/lib/auth";
import { CreditBadge } from "@/components/credit-badge";
import { BuyCreditsSection } from "@/components/buy-credits-section";
import { canPurchaseCredits } from "@/lib/credits";
import { CREDIT_PACKS, stripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { formatCredits } from "@/lib/utils";
import type { CreditLedgerEntry } from "@/lib/types";

type Props = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function WalletPage({ searchParams }: Props) {
  const profile = await requireProfile();
  const params = await searchParams;
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("credit_ledger")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const entries = (ledger ?? []) as CreditLedgerEntry[];
  const purchaseErrors: Record<string, string | null> = {};
  for (const pack of CREDIT_PACKS) {
    const check = canPurchaseCredits(profile, pack.credits);
    purchaseErrors[pack.id] = check.ok ? null : check.error;
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Wallet</h1>
      {profile.is_pro ? (
        <p className="mt-1 text-[13px] text-ink/60">Pro</p>
      ) : null}

      {params.error ? (
        <p className="mt-4 text-[13px] text-flag">{params.error}</p>
      ) : null}
      {params.message ? (
        <p className="mt-4 text-[13px] text-ink/80">{params.message}</p>
      ) : null}
      {!stripeConfigured() ? (
        <p className="mt-4 rounded-[6px] border border-border bg-mist px-3 py-2 text-[13px] text-ink/70">
          Stripe keys are not set yet. Add STRIPE_SECRET_KEY and
          STRIPE_WEBHOOK_SECRET to enable checkout.
        </p>
      ) : null}

      <div className="mt-6">
        <CreditBadge
          value={profile.credits}
          pending={profile.credits_pending}
          pulseKey={profile.credits}
        />
      </div>

      <BuyCreditsSection isPro={profile.is_pro} purchaseErrors={purchaseErrors} />

      <div className="mt-10">
        <h2 className="font-display text-[24px] font-semibold">Ledger</h2>
        <div className="mt-4 border-t border-border">
          {entries.length === 0 ? (
            <p className="py-8 text-ink/65">No ledger rows yet.</p>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-border py-3"
              >
                <div>
                  <p className="text-[15px]">{entry.reason.replaceAll("_", " ")}</p>
                  <p className="font-mono text-[12px] text-ink/55">
                    {new Date(entry.created_at).toLocaleString()} · {entry.status}
                    {entry.expires_at
                      ? ` · expires ${new Date(entry.expires_at).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <p
                  className={`font-mono text-[15px] ${
                    entry.amount >= 0 ? "text-ink" : "text-flag"
                  }`}
                >
                  {entry.amount >= 0 ? "+" : ""}
                  {formatCredits(Number(entry.amount))}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
