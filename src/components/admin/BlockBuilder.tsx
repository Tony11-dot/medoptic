"use client";

import { useState } from "react";
import type { Block, BlockType, BlocksPosition, BlockWidth } from "@/lib/types";
import {
  BLOCK_TYPE_LABEL,
  JUSTIFY_CLASS,
  POSITION_LABEL,
  WIDTH_LABEL,
  newBlock,
} from "@/lib/blocks";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { StyleToolbar } from "@/components/admin/StyleToolbar";
import { AlignIcon } from "@/components/admin/AlignIcon";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const TYPES: BlockType[] = ["heading", "paragraph", "image", "button"];
const WIDTHS: BlockWidth[] = ["narrow", "medium", "wide", "full"];
const ALIGNS: { v: Block["align"]; label: string }[] = [
  { v: "start", label: "Left" },
  { v: "center", label: "Center" },
  { v: "end", label: "Right" },
];

export function BlockBuilder({
  blocks,
  position,
  onBlocksChange,
  onPositionChange,
}: {
  blocks: Block[];
  position: BlocksPosition;
  onBlocksChange: (b: Block[]) => void;
  onPositionChange: (p: BlocksPosition) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);

  const update = (id: string, patch: Partial<Block>) =>
    onBlocksChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => onBlocksChange(blocks.filter((b) => b.id !== id));
  const add = (type: BlockType) => onBlocksChange([...blocks, newBlock(type, crypto.randomUUID())]);

  function move(from: number, to: number) {
    if (to < 0 || to >= blocks.length) return;
    const next = blocks.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onBlocksChange(next);
  }
  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    move(blocks.findIndex((b) => b.id === dragId), blocks.findIndex((b) => b.id === targetId));
    setDragId(null);
  }

  return (
    <div className="space-y-5">
      {/* Where the section sits on the site */}
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-ink">Where on the page?</span>
        <select
          value={position}
          onChange={(e) => onPositionChange(e.target.value as BlocksPosition)}
          className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand"
        >
          {(Object.keys(POSITION_LABEL) as BlocksPosition[]).map((p) => (
            <option key={p} value={p}>{POSITION_LABEL[p]}</option>
          ))}
        </select>
      </label>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-line bg-surface p-3">
        <span className="self-center text-sm font-semibold text-muted">Add block:</span>
        {TYPES.map((t) => (
          <Button key={t} size="sm" variant="subtle" onClick={() => add(t)}>
            + {BLOCK_TYPE_LABEL[t]}
          </Button>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="rounded-xl border border-line bg-white px-4 py-8 text-center text-sm text-muted">
          No blocks yet. Add a heading, paragraph, image or button above.
        </p>
      )}

      {/* Block cards */}
      <div className="space-y-3">
        {blocks.map((b, i) => (
          <div
            key={b.id}
            draggable
            onDragStart={() => setDragId(b.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(b.id)}
            className={cn(
              "rounded-xl border border-line bg-white p-4 shadow-sm transition",
              dragId === b.id && "opacity-50",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="cursor-grab select-none text-muted" title="Drag to reorder" aria-hidden>⠿</span>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-dark">
                {BLOCK_TYPE_LABEL[b.type]}
              </span>
              <div className="ms-auto flex items-center gap-1">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand hover:text-brand-dark disabled:opacity-30">↑</button>
                <button onClick={() => move(i, i + 1)} disabled={i === blocks.length - 1} aria-label="Move down" className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand hover:text-brand-dark disabled:opacity-30">↓</button>
                <button onClick={() => remove(b.id)} aria-label="Delete block" className="grid size-7 place-items-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100">✕</button>
              </div>
            </div>

            <div className="mt-3 space-y-3">
              {b.type === "image" ? (
                <>
                  <ImageUpload value={b.image ?? ""} onChange={(image) => update(b.id, { image })} />
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-ink">Link (optional)</span>
                    <input
                      dir="ltr"
                      placeholder="#book or https://…"
                      value={b.href ?? ""}
                      onChange={(e) => update(b.id, { href: e.target.value })}
                      className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                    />
                  </label>
                </>
              ) : (
                <>
                  <LocalizedField
                    label={b.type === "button" ? "Button label" : b.type === "heading" ? "Heading text" : "Text"}
                    value={b.text ?? { he: "", en: "", ru: "" }}
                    onChange={(text) => update(b.id, { text })}
                    textarea={b.type === "paragraph"}
                  />
                  {b.type === "button" && (
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold text-ink">Button link</span>
                      <input
                        dir="ltr"
                        placeholder="#book or https://…"
                        value={b.href ?? ""}
                        onChange={(e) => update(b.id, { href: e.target.value })}
                        className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand"
                      />
                    </label>
                  )}
                  <StyleToolbar value={b.style} onChange={(style) => update(b.id, { style })} />
                </>
              )}

              {/* Placement + width */}
              <div className="flex flex-wrap items-center gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-muted">Place:</span>
                  {ALIGNS.map((a) => (
                    <button
                      key={a.v}
                      type="button"
                      onClick={() => update(b.id, { align: a.v })}
                      aria-label={a.label}
                      aria-pressed={b.align === a.v ? "true" : "false"}
                      className={cn(
                        "grid size-8 place-items-center rounded-md border transition",
                        b.align === a.v ? "border-brand bg-brand text-white" : "border-line bg-white text-ink hover:border-brand",
                      )}
                    >
                      <AlignIcon align={a.v} />
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted">Width:</span>
                  <select
                    value={b.width}
                    onChange={(e) => update(b.id, { width: e.target.value as BlockWidth })}
                    className="h-8 rounded-md border border-line bg-white px-2 text-xs outline-none focus:border-brand"
                  >
                    {WIDTHS.map((w) => (
                      <option key={w} value={w}>{WIDTH_LABEL[w]}</option>
                    ))}
                  </select>
                </label>
                {/* Tiny placement indicator */}
                <div className="ms-auto hidden items-center gap-1 sm:flex" title="Placement">
                  <span className={cn("flex h-5 w-16 rounded bg-surface", JUSTIFY_CLASS[b.align])}>
                    <span className="my-auto h-2.5 w-5 rounded-sm bg-brand-200" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
