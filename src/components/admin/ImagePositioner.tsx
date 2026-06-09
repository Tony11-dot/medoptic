"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Drag-to-reposition control: shows the photo in a frame and lets you drag it to
// choose which part stays visible. The value is a CSS object-position string in
// percentages, e.g. "30% 65%". Uses window-level pointer listeners during a drag
// so it keeps tracking even if the cursor leaves the box.
function parse(v?: string): [number, number] {
  const m = v?.match(/(-?\d+(?:\.\d+)?)%\s+(-?\d+(?:\.\d+)?)%/);
  if (m) return [parseFloat(m[1]), parseFloat(m[2])];
  return [50, 50];
}
const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function ImagePositioner({
  src,
  value,
  onChange,
  aspect = "aspect-[4/3]",
}: {
  src?: string;
  value?: string;
  onChange: (v: string) => void;
  /** Tailwind aspect class matching the real frame, so the preview is WYSIWYG. */
  aspect?: string;
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
      <div
        ref={boxRef}
        onPointerDown={onDown}
        className={cn(
          "relative w-full max-w-xs touch-none select-none overflow-hidden rounded-xl border border-line",
          aspect,
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
