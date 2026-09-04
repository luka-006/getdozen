type Props = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, className = "h-8 w-8" }: Props) {
  const src =
    avatarUrl?.trim() ||
    `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(name)}`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className={`rounded-full border border-border bg-mist object-cover ${className}`}
      width={32}
      height={32}
      title={name}
    />
  );
}
