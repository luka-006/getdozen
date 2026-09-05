"use client";

import { useRef, useState } from "react";
import { DropdownPanel } from "@/components/dropdown-panel";
import { FOCUS_TAGS, PLATFORMS, PRODUCT_TYPES } from "@/lib/constants";
import { PLATFORM_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/platform-labels";
import { PlatformIcon } from "@/components/platform-icon";
import type { BoardSortId } from "@/lib/board-filters";

export type BoardFilters = {
  focus?: string;
  platform?: string;
  product?: string;
  sort: BoardSortId;
  boostedOnly: boolean;
};

type Props = {
  filters: BoardFilters;
  onChange: (next: BoardFilters) => void;
};

function countActive(filters: BoardFilters): number {
  let n = 0;
  if (filters.focus) n++;
  if (filters.platform) n++;
  if (filters.product) n++;
  if (filters.sort !== "default") n++;
  if (filters.boostedOnly) n++;
  return n;
}

export function BoardFiltersMenu({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = countActive(filters);

  function patch(partial: Partial<BoardFilters>) {
    onChange({ ...filters, ...partial });
  }

  function clearAll() {
    onChange({
      focus: undefined,
      platform: undefined,
      product: undefined,
      sort: "default",
      boostedOnly: false,
    });
  }

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={`filter-chip inline-flex items-center gap-1.5${active ? " filter-chip-active" : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        Filters
        {active > 0 ? (
          <span className="font-mono text-[11px] text-blue">{active}</span>
        ) : null}
      </button>

      <DropdownPanel
        open={open}
        onClose={() => setOpen(false)}
        ignoreCloseRefs={[triggerRef]}
        align="start"
        className="board-filters-dropdown mt-2 w-[min(100vw-2rem,20rem)]"
      >
        <div className="surface p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink/45">
              Filter board
            </p>
            {active > 0 ? (
              <button
                type="button"
                className="text-[12px] text-blue"
                onClick={clearAll}
              >
                Clear
              </button>
            ) : null}
          </div>

          <label className="mt-4 block text-[12px] font-medium text-ink/55">
            Focus
            <select
              className="input mt-1 w-full text-[13px]"
              value={filters.focus ?? ""}
              onChange={(e) =>
                patch({ focus: e.target.value || undefined })
              }
            >
              <option value="">All</option>
              {FOCUS_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-[12px] font-medium text-ink/55">
            Platform
            <select
              className="input mt-1 w-full text-[13px]"
              value={filters.platform ?? ""}
              onChange={(e) =>
                patch({ platform: e.target.value || undefined })
              }
            >
              <option value="">All</option>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {PLATFORM_LABELS[p]}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-[12px] font-medium text-ink/55">
            Product
            <select
              className="input mt-1 w-full text-[13px]"
              value={filters.product ?? ""}
              onChange={(e) =>
                patch({ product: e.target.value || undefined })
              }
            >
              <option value="">Apps & games</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PRODUCT_TYPE_LABELS[t]} only
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block text-[12px] font-medium text-ink/55">
            Sort
            <select
              className="input mt-1 w-full text-[13px]"
              value={filters.sort}
              onChange={(e) =>
                patch({ sort: e.target.value as BoardSortId })
              }
            >
              <option value="default">Boost · Pro · waiting</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Longest waiting</option>
              <option value="bounty">Highest bounty</option>
            </select>
          </label>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-ink/75">
            <input
              type="checkbox"
              checked={filters.boostedOnly}
              onChange={(e) => patch({ boostedOnly: e.target.checked })}
            />
            Boosted posts only
          </label>
        </div>
      </DropdownPanel>
    </div>
  );
}
