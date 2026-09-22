"use client";

import { CreditIcon } from "@/components/icons";

export type ProfileStat = {
  label: string;
  value: string;
  kind?: "dots" | "plain" | "empty";
};

export function ProfileStats({ stats }: { stats: ProfileStat[] }) {
  return (
    <section className="profile-stats mt-8">
      {stats.map((stat) => {
        const isDots = stat.kind === "dots";
        const isEmpty = stat.kind === "empty";
        return (
          <div
            key={stat.label}
            className={`profile-stat${isDots ? " profile-stat-dots" : ""}`}
          >
            <p className="profile-stat-label">{stat.label}</p>
            {isDots ? (
              <p className="profile-stat-value profile-stat-value-dots">
                <CreditIcon className="h-4 w-4 shrink-0" />
                <span>{stat.value}</span>
              </p>
            ) : (
              <p
                className={`profile-stat-value${isEmpty ? " profile-stat-value-empty" : ""}`}
              >
                {stat.value}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
