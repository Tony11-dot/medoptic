"use client";

import { cn } from "@/lib/cn";

// A 3×3 grid for choosing which part of a cropped photo stays in frame. The
// value is a CSS object-position string (e.g. "center top"); default "center".
// Used wherever a photo is shown with object-cover and may need repositioning.
const POSITIONS: { value: string; label: string }[] = [
  { value: "left top", label: "top left" },
  { value: "center top", label: "top" },
  { value: "right top", label: "top right" },
  { value: "left center", label: "left" },
  { value: "center", label: "center" },
  { value: "right center", label: "right" },
  { value: "left bottom", label: "bottom left" },
  { value: "center bottom", label: "bottom" },
  { value: "right bottom", label: "bottom right" },
];

export function ImagePositioner({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const current = value || "center";
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        Reposition photo
        <span className="ms-1 font-normal text-muted">— click where the focus should be</span>
      </span>
      <div className="inline-grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface p-1">
        {POSITIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            title={p.label}
            aria-label={p.label}
            aria-pressed={current === p.value}
            onClick={() => onChange(p.value)}
            className={cn(
              "grid size-8 place-items-center rounded-md transition",
              current === p.value ? "bg-brand text-white shadow-sm" : "bg-white text-muted hover:text-brand-dark",
            )}
          >
            <span className="size-2 rounded-full bg-current" />
          </button>
        ))}
      </div>
    </div>
  );
}
