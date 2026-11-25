import { WaitlistCancel } from "@/components/waitlist-cancel";
import { WaitlistEarlyAccess } from "@/components/waitlist-early-access";

export function WaitlistJoined({
  email,
  earlyAccessRequested = false,
}: {
  email?: string | null;
  earlyAccessRequested?: boolean;
}) {
  return (
    <div className="waitlist-joined surface space-y-4 p-6 sm:p-8">
      <p className="font-display text-[22px] font-semibold">You&apos;re on the list.</p>
      <p className="text-[15px] text-ink/70">
        We&apos;ll email you when Dozen opens.
      </p>
      <div className="flex gap-1.5 pt-1" aria-hidden>
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="waitlist-cube inline-block h-2.5 w-2.5 rounded-[2px] bg-blue"
            style={{ animationDelay: `${i * 45}ms` }}
          />
        ))}
      </div>
      <WaitlistEarlyAccess initialDone={earlyAccessRequested} />
      {email ? <WaitlistCancel email={email} /> : null}
    </div>
  );
}
