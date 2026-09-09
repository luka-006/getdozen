"use client";

import { updateProfileAvatar } from "@/actions/auth";
import {
  AVATAR_PRESETS,
  activeAvatarPresetId,
  isOAuthAvatarUrl,
} from "@/lib/avatar-presets";

type Props = {
  userId: string;
  avatarUrl: string | null;
};

export function ProfileAvatarPicker({ userId, avatarUrl }: Props) {
  const activeId = activeAvatarPresetId(avatarUrl, userId);
  const usingOAuthPhoto = Boolean(avatarUrl && isOAuthAvatarUrl(avatarUrl));

  return (
    <section className="mt-6">
      <h2 className="font-display text-[18px] font-semibold">Avatar</h2>
      <p className="mt-1 text-[13px] text-ink/60">
        {usingOAuthPhoto
          ? "You're using your sign-in photo — pick a preset below to replace it."
          : "Pick a look — yours stays the same everywhere on Dozen."}
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {AVATAR_PRESETS.map((preset) => {
          const selected = activeId !== null && preset.id === activeId;
          return (
            <form key={preset.id} action={updateProfileAvatar}>
              <input type="hidden" name="avatar_preset" value={preset.id} />
              <button
                type="submit"
                title={preset.label}
                aria-label={`Use ${preset.label} avatar`}
                aria-pressed={selected}
                className={`block rounded-full p-0.5 transition ${
                  selected
                    ? "ring-2 ring-blue ring-offset-2 ring-offset-paper"
                    : "ring-1 ring-border hover:ring-ink/30"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preset.url}
                  alt=""
                  className="h-12 w-12 rounded-full bg-mist object-cover"
                  width={48}
                  height={48}
                />
              </button>
            </form>
          );
        })}
      </div>
    </section>
  );
}
