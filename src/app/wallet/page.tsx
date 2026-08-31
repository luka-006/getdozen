import { requireProfile } from "@/lib/auth";
import { CreditBadge } from "@/components/credit-badge";
import { BuyDotsSection } from "@/components/buy-dots-section";
import { WalletLedger } from "@/components/wallet-ledger";
import { canPurchaseDots } from "@/lib/credits";
import { DOT_PACKS, stripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
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
  for (const pack of DOT_PACKS) {
    const check = canPurchaseDots(profile, pack.dots);
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

      <BuyDotsSection isPro={profile.is_pro} purchaseErrors={purchaseErrors} />

      <WalletLedger entries={entries} />
    </div>
  );
}
