"use client";

// Shared bulk-selection for admin tables (appointments, eye tests, products):
// row checkboxes + a select-all header checkbox + an action bar with a
// confirm-guarded bulk delete.

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

export function useBulkSelect<T extends { id: string }>(items: T[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drop selections that no longer exist (deleted / filtered away on reload).
  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(items.map((i) => i.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));
  return useMemo(
    () => ({
      selected,
      count: selected.size,
      isSelected: (id: string) => selected.has(id),
      toggle: (id: string) =>
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        }),
      allSelected,
      toggleAll: () => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id))),
      clear: () => setSelected(new Set()),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, allSelected, items],
  );
}

export function BulkCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="size-4 cursor-pointer accent-[#0066CC]"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

/** Action bar shown while rows are selected: count + bulk delete (confirmed). */
export function BulkBar({
  count,
  onDelete,
  onClear,
  busy,
}: {
  count: number;
  onDelete: () => Promise<void>;
  onClear: () => void;
  busy?: boolean;
}) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(false);

  if (count === 0) return null;
  return (
    <>
      <div
        className={cn(
          "mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50/60 px-4 py-2.5",
        )}
      >
        <p className="text-sm font-bold text-brand-dark">
          <span className="me-1.5 rounded-lg bg-brand px-2 py-0.5 text-white">{count}</span>
          {t.admin.bulk.selected}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear}>{t.admin.actions.cancel}</Button>
          <Button variant="danger" size="sm" disabled={busy} onClick={() => setConfirming(true)}>
            🗑 {t.admin.bulk.deleteSelected}
          </Button>
        </div>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title={t.admin.bulk.deleteSelected}>
        <p className="text-sm text-muted">
          <strong className="text-ink">{count}</strong> — {t.admin.bulk.confirm}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>{t.admin.actions.cancel}</Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={async () => {
              await onDelete();
              setConfirming(false);
            }}
          >
            {t.admin.actions.delete}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** Delete a set of ids against a REST collection; resolves to the success count. */
export async function bulkDelete(baseUrl: string, ids: string[]): Promise<number> {
  let ok = 0;
  for (const id of ids) {
    try {
      const res = await fetch(`${baseUrl}/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) ok++;
    } catch {
      /* count only successes */
    }
  }
  return ok;
}
