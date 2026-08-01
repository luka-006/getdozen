"use client";

import { useState } from "react";
import { updateProfile } from "@/actions/auth";
import { CheckIcon, PenIcon } from "@/components/icons";

export function ProfileNameEditor({
  displayName,
}: {
  displayName: string;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <h1 className="font-display text-[32px] font-semibold">{displayName}</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label="Edit display name"
          onClick={() => setEditing(true)}
        >
          <PenIcon />
        </button>
      </div>
    );
  }

  return (
    <form action={updateProfile} className="flex flex-wrap items-end gap-2">
      <div className="field min-w-[200px] flex-1">
        <label htmlFor="display_name">Display name</label>
        <input
          id="display_name"
          name="display_name"
          className="input"
          defaultValue={displayName}
          required
          minLength={2}
          maxLength={40}
          autoFocus
        />
      </div>
      <button type="submit" className="btn btn-primary min-h-9 px-3" title="Save">
        <CheckIcon />
        Save
      </button>
      <button
        type="button"
        className="btn btn-secondary min-h-9 px-3"
        onClick={() => setEditing(false)}
      >
        Cancel
      </button>
    </form>
  );
}
