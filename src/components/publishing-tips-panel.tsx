"use client";

import Link from "next/link";
import type { Platform, ProductType } from "@/lib/constants";
import {
  publishingTipBlogHref,
  publishingTipsFor,
} from "@/lib/publishing-tips";

export function PublishingTipsPanel({
  platform,
  productType,
}: {
  platform: Platform;
  productType: ProductType;
}) {
  const tips = publishingTipsFor(platform, productType);
  if (tips.length === 0) return null;

  return (
    <aside
      className="rounded-[6px] border border-border bg-mist/60 px-3 py-3"
      aria-label="Common publishing pitfalls"
    >
      <p className="text-[12px] font-semibold uppercase tracking-wide text-ink/55">
        Common pitfalls
      </p>
      <ul className="mt-2 space-y-2 text-[12px] leading-relaxed text-ink/75">
        {tips.map((tip) => (
          <li key={tip.id} className="flex gap-2">
            <span className="text-ink/40" aria-hidden>•</span>
            <span>
              {tip.text}
              {tip.blogSlug ? (
                <>
                  {" "}
                  <Link
                    href={publishingTipBlogHref(tip.blogSlug)}
                    className="font-medium text-blue"
                  >
                    Read more
                  </Link>
                </>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
