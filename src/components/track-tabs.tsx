import Link from "next/link";

type TrackId = "tester" | "feedback" | "combo" | "language";

type Props = {
  active: TrackId;
  /** Board shows Language (soon); Post does not. */
  variant?: "board" | "post";
};

/** Soft arc pointing up into Both. */
function JoinArc({
  side,
  lit,
}: {
  side: "left" | "right";
  lit: boolean;
}) {
  // Left arc: rises from Testers toward Both.
  // Right arc: rises from Feedback toward Both (mirrored).
  const path =
    side === "left"
      ? "M2 16 C8 16 10 5 20 4"
      : "M22 16 C16 16 14 5 4 4";
  const tip =
    side === "left"
      ? "M17 2.5l3.2 1.2-1.6 3"
      : "M7 2.5L3.8 3.7l1.6 3";

  return (
    <span
      className={`track-join ${lit ? "track-join-lit" : ""}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 20" className="h-5 w-6" fill="none">
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <path
          d={tip}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function TrackTabs({ active, variant = "board" }: Props) {
  const href = (id: TrackId) => {
    if (variant === "post") {
      if (id === "tester") return "/requests/new";
      if (id === "feedback") return "/requests/new?type=feedback";
      return "/requests/new?type=combo";
    }
    if (id === "tester") return "/board";
    if (id === "feedback") return "/board?type=feedback";
    if (id === "combo") return "/board?type=combo";
    return "/board?type=language";
  };

  const btn = (id: TrackId) =>
    `btn ${active === id ? "btn-primary" : "btn-secondary"}`;

  const comboLit = active === "combo";

  return (
    <div className="mt-6 flex flex-wrap items-end gap-3">
      <div className={`track-merge ${comboLit ? "track-merge-active" : ""}`}>
        <Link href={href("tester")} className={`${btn("tester")} track-side`}>
          Testers
        </Link>
        <JoinArc side="left" lit={comboLit} />
        <Link
          href={href("combo")}
          className={`${btn("combo")} track-both`}
          title="Testers + feedback pack"
        >
          Both
        </Link>
        <JoinArc side="right" lit={comboLit} />
        <Link href={href("feedback")} className={`${btn("feedback")} track-side`}>
          Feedback
        </Link>
      </div>

      {variant === "board" ? (
        <Link href={href("language")} className={`${btn("language")} track-side`}>
          Language
          <span className="text-[11px] opacity-70">soon</span>
        </Link>
      ) : null}
    </div>
  );
}
