"use client";

import type { GalleryImage, Localized } from "@/lib/types";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ImagePositioner } from "@/components/admin/ImagePositioner";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { Button } from "@/components/ui/Button";

const emptyLocalized = (): Localized => ({ he: "", en: "", ru: "" });

// Manage the hero gallery / carousel slides: add, reorder, caption, remove.
export function GalleryEditor({
  gallery,
  onChange,
  addLabel,
  emptyLabel,
  captionLabel,
}: {
  gallery: GalleryImage[];
  onChange: (g: GalleryImage[]) => void;
  addLabel: string;
  emptyLabel: string;
  captionLabel: string;
}) {
  const update = (id: string, patch: Partial<GalleryImage>) =>
    onChange(gallery.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const remove = (id: string) => onChange(gallery.filter((g) => g.id !== id));
  const add = () => onChange([...gallery, { id: crypto.randomUUID(), image: "", caption: emptyLocalized() }]);

  function move(from: number, to: number) {
    if (to < 0 || to >= gallery.length) return;
    const next = gallery.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="subtle" onClick={add}>+ {addLabel}</Button>
      </div>

      {gallery.length === 0 && (
        <p className="rounded-xl border border-line bg-white px-4 py-8 text-center text-sm text-muted">{emptyLabel}</p>
      )}

      {gallery.map((g, i) => (
        <div key={g.id} className="space-y-3 rounded-xl border border-line p-4">
          <div className="flex items-center gap-1">
            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-dark">#{i + 1}</span>
            <div className="ms-auto flex items-center gap-1">
              <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="up" className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, i + 1)} disabled={i === gallery.length - 1} aria-label="down" className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand disabled:opacity-30">↓</button>
              <button type="button" onClick={() => remove(g.id)} aria-label="delete" className="grid size-7 place-items-center rounded-md bg-rose-50 text-rose-600 transition hover:bg-rose-100">✕</button>
            </div>
          </div>
          <ImageUpload value={g.image} icon="eye" onChange={(image) => update(g.id, { image })} />
          {g.image && (
            <ImagePositioner value={g.imagePosition} onChange={(imagePosition) => update(g.id, { imagePosition })} />
          )}
          <LocalizedField label={captionLabel} value={g.caption} onChange={(caption) => update(g.id, { caption })} />
        </div>
      ))}
    </div>
  );
}
