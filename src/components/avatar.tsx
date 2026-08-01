"use client";

import { useState } from "react";

type Props = {
  name: string;
  url?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 text-[13px]",
  md: "h-16 w-16 text-[24px]",
  lg: "h-20 w-20 text-[28px]",
};

export function Avatar({ name, url, size = "sm", className = "" }: Props) {
  const [broken, setBroken] = useState(false);
  const box = `${sizes[size]} rounded-[6px] ${className}`;
  const initial = name.slice(0, 1).toUpperCase();

  if (url && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        className={`${box} object-cover`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-mist font-display font-semibold text-ink ${box}`}
    >
      {initial}
    </div>
  );
}
