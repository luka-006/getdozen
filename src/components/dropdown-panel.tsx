"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
  /** Clicks on these elements do not close the panel (e.g. trigger button). */
  ignoreCloseRefs?: React.RefObject<Element | null>[];
};

export function DropdownPanel({
  open,
  onClose,
  children,
  className = "",
  align = "end",
  ignoreCloseRefs = [],
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      for (const ref of ignoreCloseRefs) {
        if (ref.current?.contains(target)) return;
      }
      onClose();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose, ignoreCloseRefs]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      role="region"
      className={`dropdown-panel ${align === "end" ? "dropdown-panel-end" : "dropdown-panel-start"} ${className}`}
    >
      {children}
    </div>
  );
}
