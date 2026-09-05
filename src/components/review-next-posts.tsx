"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { PLATFORM_LABELS } from "@/lib/platform-labels";
import { PlatformIcon } from "@/components/platform-icon";
import { reviewEarnForQuestionCount } from "@/lib/constants";
import { formatCredits } from "@/lib/utils";

export type NextReviewPost = {
  id: string;
  app_name: string;
  app_icon_url?: string | null;
  app_description: string;
  platform?: string | null;
  question_count: number;
  bounty_multiplier: number;
};

export function ReviewNextPosts({ posts }: { posts: NextReviewPost[] }) {
  const [open, setOpen] = useState(posts.length > 0);

  useEffect(() => {
    if (posts.length > 0) setOpen(true);
  }, [posts.length]);

  if (!open || posts.length === 0) return null;

  return (
    <div
      className="review-next-overlay fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-next-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/25"
        aria-label="Close"
        onClick={() => setOpen(false)}
      />
      <div className="surface relative z-10 w-full max-w-md p-5 shadow-lg">
        <p
          id="review-next-title"
          className="font-display text-[20px] font-semibold"
        >
          Keep going — {posts.length} more
        </p>
        <p className="mt-1 text-[13px] text-ink/65">
          Pick another post while you&apos;re in the flow.
        </p>

        <ul className="mt-4 space-y-2">
          {posts.map((post) => {
            const payout =
              Number(post.bounty_multiplier) > 1
                ? formatCredits(
                    reviewEarnForQuestionCount(post.question_count) *
                      Number(post.bounty_multiplier),
                  )
                : null;
            const platform = post.platform as keyof typeof PLATFORM_LABELS | undefined;

            return (
              <li key={post.id}>
                <Link
                  href={`/requests/${post.id}/review`}
                  className="flex items-start gap-3 rounded-[8px] border border-border px-3 py-2.5 transition hover:bg-mist/70"
                  onClick={() => setOpen(false)}
                >
                  <AppIcon
                    name={post.app_name}
                    iconUrl={post.app_icon_url}
                    className="h-10 w-10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{post.app_name}</p>
                    <p className="truncate text-[12px] text-ink/60">
                      {post.app_description}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-ink/50">
                      {platform && PLATFORM_LABELS[platform] ? (
                        <span className="inline-flex items-center gap-0.5">
                          <PlatformIcon platform={platform} className="h-3 w-3" />
                          {PLATFORM_LABELS[platform]}
                        </span>
                      ) : null}
                      <span>{post.question_count} questions</span>
                      {payout ? (
                        <span className="rounded-[4px] bg-credit px-1 font-mono text-ink">
                          {payout}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/board?type=feedback" className="btn btn-secondary">
            All feedback
          </Link>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setOpen(false)}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
