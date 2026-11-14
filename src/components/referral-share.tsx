export function ReferralShare({
  code,
  shareUrl,
  inviteLine,
  pendingLine,
}: {
  code: string;
  shareUrl: string;
  inviteLine: string | null;
  pendingLine: string | null;
}) {
  return (
    <section className="mt-8 space-y-2">
      <h2 className="font-display text-[22px] font-semibold">Invite friends</h2>
      {inviteLine ? <p className="text-[14px] text-ink/65">{inviteLine}</p> : null}
      <p className="font-mono text-[13px] text-ink">{code}</p>
      <p className="break-all font-mono text-[12px] text-ink/70">{shareUrl}</p>
      {pendingLine ? <p className="text-[14px] text-ink/65">{pendingLine}</p> : null}
    </section>
  );
}
