"use client";

import { useState } from "react";
import { resolveAvatarUrl } from "@/lib/avatar-presets";

type Props = {
  name: string;
  url?: string | null;
  userId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  rounded?: "square" | "full";
};

const sizes = {
  sm: "h-9 w-9 text-[13px]",
  md: "h-16 w-16 text-[24px]",
  lg: "h-20 w-20 text-[28px]",
};

export function Avatar({
  name,
  url,
  userId,
  size = "sm",
  className = "",
  rounded = "square",
}: Props) {
  const [broken, setBroken] = useState(false);
  const radius = rounded === "full" ? "rounded-full" : "rounded-[6px]";
  const box = `${sizes[size]} ${radius} ${className}`;
  const src = resolveAvatarUrl({ name, avatarUrl: url, userId });

  if (!broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        className={`${box} border border-border bg-mist object-cover`}
        onError={() => setBroken(true)}
      />
    );
  }

  const initial = name.slice(0, 1).toUpperCase();
  return (
    <div
      className={`flex items-center justify-center bg-mist font-display font-semibold text-ink ${box}`}
    >
      {initial}
    </div>
  );
}
