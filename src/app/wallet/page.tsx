import { requireProfile } from "@/lib/auth";
import { CreditBadge } from "@/components/credit-badge";
import { createClient } from "@/lib/supabase/server";
import { formatCredits } from "@/lib/utils";
import type { CreditLedgerEntry } from "@/lib/types";

export default async function WalletPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: ledger } = await supabase
    .from("credit_ledger")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const entries = (ledger ?? []) as CreditLedgerEntry[];

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8">
      <h1 className="font-display text-[32px] font-semibold">Wallet</h1>
      <p className="mt-1 text-ink/70">
        Credits expire 6 months from the date earned.
      </p>

      <div className="mt-6">
        <CreditBadge
          value={profile.credits}
          pending={profile.credits_pending}
          pulseKey={profile.credits}
        />
      </div>

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

      <p className="mt-8 text-[13px] text-ink/60">
        Buying credits ships later. Earn by reviewing and testing first.
      </p>
    </div>
  );
}
