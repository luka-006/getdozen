import Link from "next/link";

type TrackId = "tester" | "feedback" | "combo" | "language";

type Props = {
  active: TrackId;
  /** Board shows Language (soon); Post does not. */
  variant?: "board" | "post";
};

const TAB_LABELS: Record<Exclude<TrackId, "language">, string> = {
  tester: "Testers",
  combo: "Dozen pack",
  feedback: "Feedback",
};

const TAB_ORDER: Exclude<TrackId, "language">[] = [
  "tester",
  "combo",
  "feedback",
];

export function TrackTabs({ active, variant = "board" }: Props) {
  const href = (id: Exclude<TrackId, "language">) => {
    if (variant === "post") {
      if (id === "tester") return "/requests/new";
      if (id === "feedback") return "/requests/new?type=feedback";
      return "/requests/new?type=combo";
    }
    if (id === "tester") return "/board";
    if (id === "feedback") return "/board?type=feedback";
    return "/board?type=combo";
  };

  return (
    <div className="track-tabs mt-6">
      <div className="track-tabs-group" role="tablist" aria-label="Request tracks">
        {TAB_ORDER.map((id) => {
          const isActive = active === id;
          return (
            <Link
              key={id}
              href={href(id)}
              role="tab"
              aria-selected={isActive}
              className={`track-tab${isActive ? " track-tab-active" : ""}`}
              title={id === "combo" ? "Testers + feedback pack" : undefined}
            >
              {TAB_LABELS[id]}
            </Link>
          );
        })}
      </div>

      {variant === "board" ? (
        <span
          className="track-tab track-tab-disabled"
          role="tab"
          aria-disabled="true"
          aria-label="Language — coming soon"
          title="Coming soon"
        >
          Language
          <span className="track-tab-soon">soon</span>
        </span>
      ) : null}
    </div>
  );
}
