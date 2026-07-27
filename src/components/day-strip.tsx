type Props = {
  days: boolean[];
  missed?: number[];
  label?: string;
};

export function DayStrip({ days, missed = [], label }: Props) {
  const filled = days.filter(Boolean).length;
  const total = 14;
  const text = label ?? `${filled} of ${total} days`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        className="flex gap-1"
        role="img"
        aria-label={text}
      >
        {Array.from({ length: total }, (_, i) => {
          const done = Boolean(days[i]);
          const isMissed = missed.includes(i);
          const tone = isMissed
            ? "bg-flag"
            : done
              ? "bg-blue"
              : "bg-mist border border-border";
          return (
            <span
              key={i}
              className={`inline-block h-2.5 w-2.5 rounded-[2px] ${tone}`}
            />
          );
        })}
      </div>
      <span className="font-mono text-[13px] text-ink/80">{text}</span>
    </div>
  );
}
