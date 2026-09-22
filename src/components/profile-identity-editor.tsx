"use client";

import { useRef, useState } from "react";
import { updateProfile, updateProfileAvatar } from "@/actions/auth";
import { DropdownPanel } from "@/components/dropdown-panel";
import { CheckIcon, PenIcon } from "@/components/icons";
import {
  AVATAR_PRESETS,
  activeAvatarPresetId,
  isOAuthAvatarUrl,
} from "@/lib/avatar-presets";

type Props = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
};

export function ProfileIdentityEditor({
  userId,
  displayName,
  avatarUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeId = activeAvatarPresetId(avatarUrl, userId);
  const usingOAuthPhoto = Boolean(avatarUrl && isOAuthAvatarUrl(avatarUrl));

  return (
    <div className="relative flex items-center gap-2">
      <h1 className="font-display text-[32px] font-semibold">{displayName}</h1>
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        aria-label="Edit profile"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <PenIcon />
      </button>

      <DropdownPanel
        open={open}
        onClose={() => setOpen(false)}
        ignoreCloseRefs={[triggerRef]}
        align="start"
        className="profile-edit-dropdown mt-2 w-[min(100vw-2rem,20rem)]"
      >
        <div className="surface space-y-4 p-4">
          <form action={updateProfile} className="space-y-2">
            <label
              htmlFor="display_name"
              className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink/45"
            >
              Display name
            </label>
            <div className="flex gap-2">
              <input
                id="display_name"
                name="display_name"
                className="input min-w-0 flex-1"
                defaultValue={displayName}
                required
                minLength={2}
                maxLength={40}
              />
              <button
                type="submit"
                className="btn btn-primary min-h-9 shrink-0 px-3"
                title="Save name"
              >
                <CheckIcon />
              </button>
            </div>
          </form>

          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink/45">
              Avatar
            </p>
            {usingOAuthPhoto ? (
              <p className="mt-1 text-[12px] text-ink/55">
                Using your sign-in photo. Pick a preset to replace it.
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-4 gap-2">
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
                        className="h-11 w-11 rounded-full bg-mist object-cover"
                        width={44}
                        height={44}
                      />
                    </button>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      </DropdownPanel>
    </div>
  );
}
