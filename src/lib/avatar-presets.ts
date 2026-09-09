/** Curated Dicebear thumbs — same family as mock testers on the board. */

export type AvatarPreset = {
  id: string;
  label: string;
  url: string;
};

export const AVATAR_PRESETS: readonly AvatarPreset[] = [
  { id: "coral", label: "Coral", url: dicebearThumb("coral") },
  { id: "mint", label: "Mint", url: dicebearThumb("mint") },
  { id: "violet", label: "Violet", url: dicebearThumb("violet") },
  { id: "amber", label: "Amber", url: dicebearThumb("amber") },
  { id: "ocean", label: "Ocean", url: dicebearThumb("ocean") },
  { id: "rose", label: "Rose", url: dicebearThumb("rose") },
  { id: "lime", label: "Lime", url: dicebearThumb("lime") },
  { id: "slate", label: "Slate", url: dicebearThumb("slate") },
  { id: "sunset", label: "Sunset", url: dicebearThumb("sunset") },
  { id: "frost", label: "Frost", url: dicebearThumb("frost") },
  { id: "plum", label: "Plum", url: dicebearThumb("plum") },
  { id: "sage", label: "Sage", url: dicebearThumb("sage") },
] as const;

const PRESET_BY_ID = new Map(AVATAR_PRESETS.map((p) => [p.id, p]));
const PRESET_URLS = new Set(AVATAR_PRESETS.map((p) => p.url));

function dicebearThumb(seed: string): string {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function defaultAvatarUrlForUser(userId: string): string {
  const index = hashString(userId) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[index]!.url;
}

export function avatarPresetById(id: string): AvatarPreset | undefined {
  return PRESET_BY_ID.get(id);
}

export function avatarPresetByUrl(url: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((p) => p.url === url);
}

export function isAvatarPresetUrl(url: string): boolean {
  return PRESET_URLS.has(url.trim());
}

/** Google / OAuth profile photos users may still have until they pick a preset. */
export function isOAuthAvatarUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.endsWith("googleusercontent.com") || host.endsWith("githubusercontent.com");
  } catch {
    return false;
  }
}

export function resolveAvatarUrl(opts: {
  name: string;
  avatarUrl?: string | null;
  userId?: string;
}): string {
  const stored = opts.avatarUrl?.trim();
  if (stored && (isAvatarPresetUrl(stored) || isOAuthAvatarUrl(stored))) {
    return stored;
  }
  if (opts.userId) return defaultAvatarUrlForUser(opts.userId);
  return dicebearThumb(opts.name);
}

/** Preset id to highlight in the picker, or null when an OAuth photo is active. */
export function activeAvatarPresetId(
  avatarUrl: string | null | undefined,
  userId: string,
): string | null {
  const stored = avatarUrl?.trim();
  if (stored && isOAuthAvatarUrl(stored)) return null;
  const preset = stored ? avatarPresetByUrl(stored) : undefined;
  if (preset) return preset.id;
  const fallback = avatarPresetByUrl(defaultAvatarUrlForUser(userId));
  return fallback?.id ?? AVATAR_PRESETS[0]!.id;
}
