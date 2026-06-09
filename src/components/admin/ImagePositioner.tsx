"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";

// Drag-to-reposition control: shows the photo in a frame and lets you drag it to
// choose which part stays visible. The value is a CSS object-position string in
// percentages, e.g. "30% 65%". Works with mouse and touch (pointer events).
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
}: {
  src?: string;
  value?: string;
  onChange: (v: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [px, py] = parse(value);

  if (!src) return null;

  function onDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, px, py };
    setDragging(true);
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = boxRef.current;
    if (!d || !box) return;
    const rect = box.getBoundingClientRect();
    // Dragging the image right reveals its left side → object-position x drops.
    const nx = clamp(d.px - ((e.clientX - d.x) / rect.width) * 100);
    const ny = clamp(d.py - ((e.clientY - d.y) / rect.height) * 100);
    onChange(`${Math.round(nx)}% ${Math.round(ny)}%`);
  }
  function onUp() {
    drag.current = null;
    setDragging(false);
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
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className={cn(
          "relative aspect-[4/3] w-full max-w-xs touch-none select-none overflow-hidden rounded-xl border border-line",
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
