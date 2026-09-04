type Props = {
  name: string;
  iconUrl?: string | null;
  className?: string;
};

/** Fictional app/game icon — uses stored mock URL or a deterministic placeholder. */
export function AppIcon({ name, iconUrl, className = "h-10 w-10" }: Props) {
  const src =
    iconUrl?.trim() ||
    `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(name)}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`rounded-[10px] border border-border bg-mist object-cover ${className}`}
      width={40}
      height={40}
    />
  );
}
