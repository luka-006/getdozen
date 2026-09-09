import { resolveAvatarUrl } from "@/lib/avatar-presets";

type Props = {
  name: string;
  avatarUrl?: string | null;
  userId?: string;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, userId, className = "h-8 w-8" }: Props) {
  const src = resolveAvatarUrl({ name, avatarUrl, userId });

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
