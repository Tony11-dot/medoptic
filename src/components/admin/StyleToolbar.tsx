"use client";

import type { TextStyle } from "@/lib/types";
import { FONT_OPTIONS } from "@/lib/textStyle";
import { AlignIcon } from "./AlignIcon";
import { cn } from "@/lib/cn";

const SIZES = [0, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72];

// Compact formatting bar for one text field: bold, italic, font, size, color,
// alignment. An empty TextStyle means "use the site's default look".
export function StyleToolbar({
  value,
  onChange,
}: {
  value?: TextStyle;
  onChange: (v: TextStyle) => void;
}) {
  const s = value ?? {};
  const set = (patch: Partial<TextStyle>) => onChange({ ...s, ...patch });
  const hasStyle = Object.values(s).some((v) => v !== undefined && v !== "");

  const toggleCls = (active: boolean) =>
    cn(
      "grid size-8 place-items-center rounded-md border text-sm font-bold transition",
      active ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand",
    );

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface p-1.5">
      <button type="button" aria-label="Bold" aria-pressed={s.bold ? "true" : "false"} onClick={() => set({ bold: !s.bold })} className={toggleCls(!!s.bold)}>
        B
      </button>
      <button type="button" aria-label="Italic" aria-pressed={s.italic ? "true" : "false"} onClick={() => set({ italic: !s.italic })} className={cn(toggleCls(!!s.italic), "italic")}>
        I
      </button>

      <select
        aria-label="Font"
        value={s.fontFamily ?? "default"}
        onChange={(e) => set({ fontFamily: e.target.value === "default" ? undefined : e.target.value })}
        className="h-8 rounded-md border border-line bg-white px-2 text-xs outline-none focus:border-brand"
      >
        {FONT_OPTIONS.map((f) => (
          <option key={f.id} value={f.id}>{f.label}</option>
        ))}
      </select>

      <select
        aria-label="Font size"
        value={s.fontSize ?? 0}
        onChange={(e) => set({ fontSize: Number(e.target.value) || undefined })}
        className="h-8 rounded-md border border-line bg-white px-2 text-xs outline-none focus:border-brand"
      >
        {SIZES.map((n) => (
          <option key={n} value={n}>{n === 0 ? "Size: auto" : `${n}px`}</option>
        ))}
      </select>

      {/* Alignment */}
      <div className="flex gap-0.5">
        {(["start", "center", "end"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-label={`Align ${v}`}
            aria-pressed={s.align === v ? "true" : "false"}
            onClick={() => set({ align: s.align === v ? undefined : v })}
            className={toggleCls(s.align === v)}
          >
            <AlignIcon align={v} />
          </button>
        ))}
      </div>

      {/* Color */}
      <label className="flex items-center gap-1" title="Text color">
        <input
          type="color"
          value={s.color ?? "#0f1b2d"}
          onChange={(e) => set({ color: e.target.value })}
          className="size-8 cursor-pointer rounded-md border border-line bg-white p-0.5"
        />
      </label>

      {hasStyle && (
        <button
          type="button"
          onClick={() => onChange({})}
          className="ms-auto rounded-md px-2 py-1 text-xs font-semibold text-muted transition hover:text-rose-600"
        >
          Reset
        </button>
      )}
    </div>
  );
}
