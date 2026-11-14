import { WaitlistCancel } from "@/components/waitlist-cancel";

export function WaitlistJoined({
  email,
  referralCode = null,
  shareUrl = null,
  pendingLine = null,
  inviteLine = null,
}: {
  email?: string | null;
  referralCode?: string | null;
  shareUrl?: string | null;
  pendingLine?: string | null;
  inviteLine?: string | null;
}) {
  return (
    <div className="waitlist-joined surface space-y-4 p-6 sm:p-8">
      <p className="font-display text-[22px] font-semibold">You&apos;re on the list.</p>
      <p className="text-[15px] text-ink/70">
        We&apos;ll email you when Dozen opens.
      </p>
      {inviteLine ? <p className="text-[14px] text-ink/65">{inviteLine}</p> : null}
      {referralCode && shareUrl ? (
        <div className="space-y-1">
          <p className="font-mono text-[13px] text-ink">{referralCode}</p>
          <p className="break-all font-mono text-[12px] text-ink/70">{shareUrl}</p>
        </div>
      ) : null}
      {pendingLine ? <p className="text-[14px] text-ink/65">{pendingLine}</p> : null}
      <div className="flex gap-1.5 pt-1" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="waitlist-cube inline-block h-2.5 w-2.5 rounded-[2px] bg-blue"
            style={{ animationDelay: `${i * 45}ms` }}
          />
        ))}
      </div>
      {email ? <WaitlistCancel email={email} /> : null}
    </div>
  );
}
