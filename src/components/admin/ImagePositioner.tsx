"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Drag-to-reposition control: shows the photo in a frame and lets you drag it to
// choose which part stays visible (object-position, in %). Optionally lets you
// pick the frame's aspect ratio. Uses window-level pointer listeners during a
// drag so it keeps tracking even if the cursor leaves the box.
function parse(v?: string): [number, number] {
  const m = v?.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  return [50, 50];
}
const clamp = (n: number) => Math.max(0, Math.min(100, n));

// Frame shape options (CSS aspect-ratio value + short label).
const ASPECTS = [
  { v: "1 / 1", label: "1:1" },
  { v: "4 / 5", label: "4:5" },
  { v: "3 / 4", label: "3:4" },
  { v: "4 / 3", label: "4:3" },
  { v: "3 / 2", label: "3:2" },
  { v: "16 / 10", label: "16:10" },
  { v: "16 / 9", label: "16:9" },
  { v: "2 / 1", label: "2:1" },
  { v: "21 / 9", label: "21:9" },
];

export function ImagePositioner({
  src,
  value,
  onChange,
  aspectRatio = "4 / 3",
  onAspectChange,
}: {
  src?: string;
  value?: string;
  onChange: (v: string) => void;
  /** CSS aspect-ratio of the frame (e.g. "4 / 3"); drives the WYSIWYG preview. */
  aspectRatio?: string;
  /** When provided, shows a frame-shape picker. */
  onAspectChange?: (v: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [dragging, setDragging] = useState(false);
  const [px, py] = parse(value);

  // Clean up listeners if the component unmounts mid-drag.
  useEffect(() => () => setDragging(false), []);

  if (!src) return null;

  function onDown(e: React.PointerEvent) {
    e.preventDefault();
    const box = boxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY, px, py };
    setDragging(true);

    const move = (ev: PointerEvent) => {
      // Dragging the image right reveals its left side → object-position x drops.
      const nx = clamp(start.px - ((ev.clientX - start.x) / rect.width) * 100);
      const ny = clamp(start.py - ((ev.clientY - start.y) / rect.height) * 100);
      onChangeRef.current(`${Math.round(nx)}% ${Math.round(ny)}%`);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">
          Reposition photo <span className="font-normal text-muted">— drag the image to frame it</span>
        </span>
        <button
          type="button"
          onClick={() => onChange("50% 50%")}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold text-brand-dark transition hover:border-brand"
        >
          Reset
        </button>
      </div>

      {onAspectChange && (
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <span className="me-1 text-xs font-semibold text-muted">Frame shape:</span>
          {ASPECTS.map((a) => (
            <button
              key={a.v}
              type="button"
              onClick={() => onAspectChange(a.v)}
              className={cn(
                "rounded-md border px-2 py-1 text-xs font-semibold transition",
                aspectRatio === a.v ? "border-brand bg-brand text-white" : "border-line bg-white text-muted hover:border-brand",
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-muted">Align:</span>
        <div className="inline-grid grid-cols-3 gap-0.5 rounded-md border border-line p-0.5">
          {[0, 50, 100].map((y) =>
            [0, 50, 100].map((x) => {
              const active = Math.round(px) === x && Math.round(py) === y;
              return (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  aria-label={`align ${x}% ${y}%`}
                  onClick={() => onChange(`${x}% ${y}%`)}
                  className={cn(
                    "size-5 rounded-sm transition",
                    active ? "bg-brand" : "bg-line/50 hover:bg-brand-light",
                  )}
                />
              );
            }),
          )}
        </div>
      </div>

      <div
        ref={boxRef}
        onPointerDown={onDown}
        style={{ aspectRatio }}
        className={cn(
          "relative w-full max-w-xs touch-none select-none overflow-hidden rounded-xl border border-line",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          style={{ objectPosition: `${px}% ${py}%` }}
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
