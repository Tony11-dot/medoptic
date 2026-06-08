"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Localized, Service } from "@/lib/types";

const emptyLocalized = (): Localized => ({ he: "", en: "", ru: "" });

interface Draft {
  id?: string;
  label: Localized;
  description: Localized;
  enabled: boolean;
}

const blankDraft = (): Draft => ({
  label: emptyLocalized(),
  description: emptyLocalized(),
  enabled: true,
});

export default function ServicesAdmin() {
  const toast = useToast();
  const { t } = useI18n();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/services?all=1");
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!draft) return;
    if (!draft.label.he && !draft.label.en && !draft.label.ru) {
      toast.error("Please enter a name in at least one language");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!draft.id;
      const res = await fetch(isEdit ? `/api/services/${draft.id}` : "/api/services", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Queue type updated" : "Queue type added");
      setDraft(null);
      await load();
    } catch {
      toast.error("Could not save queue type");
    } finally {
      setSaving(false);
    }
  }

  async function patch(s: Service, body: Partial<Service>) {
    setBusyId(s.id);
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      toast.error("Could not update queue type");
    } finally {
      setBusyId(null);
    }
  }

  // Swap a service's order with its neighbour to move it up/down the list.
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= services.length) return;
    const a = services[index];
    const b = services[target];
    setBusyId(a.id);
    try {
      await Promise.all([
        fetch(`/api/services/${a.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: b.order }),
        }),
        fetch(`/api/services/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: a.order }),
        }),
      ]);
      await load();
    } catch {
      toast.error("Could not reorder");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(s: Service) {
    try {
      const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Queue type deleted");
      setConfirmDelete(null);
      await load();
    } catch {
      toast.error("Could not delete queue type");
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.queueTypes}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.titles.queueTypesSub}</p>
        </div>
        <Button onClick={() => setDraft(blankDraft())}>+ {t.admin.actions.add}</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Name (EN / HE / RU)</th>
                <th className="px-4 py-3">Visible on site</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-muted">No queue types yet.</td></tr>
              ) : (
                services.map((s, i) => (
                  <tr key={s.id} className="transition hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => move(i, -1)}
                          disabled={i === 0 || busyId === s.id}
                          aria-label="Move up"
                          className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand hover:text-brand-dark disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => move(i, 1)}
                          disabled={i === services.length - 1 || busyId === s.id}
                          aria-label="Move down"
                          className="grid size-7 place-items-center rounded-md border border-line text-muted transition hover:border-brand hover:text-brand-dark disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{s.label.en || s.label.he || s.label.ru}</div>
                      <div className="text-xs text-muted">
                        {[s.label.he, s.label.ru].filter(Boolean).join(" · ") || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => patch(s, { enabled: !s.enabled })}
                        disabled={busyId === s.id}
                        role="switch"
                        aria-checked={s.enabled}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-50 ${
                          s.enabled ? "bg-emerald-500" : "bg-line"
                        }`}
                      >
                        <span
                          className={`inline-block size-4 transform rounded-full bg-white shadow transition ${
                            s.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setDraft({ id: s.id, label: { ...s.label }, description: { ...s.description }, enabled: s.enabled })}
                          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(s)}
                          className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit queue type" : "Add queue type"}
        className="max-w-2xl"
      >
        {draft && (
          <div className="space-y-5">
            <LocalizedField
              label="Name"
              value={draft.label}
              onChange={(label) => setDraft({ ...draft, label })}
            />
            <LocalizedField
              label="Description (optional)"
              textarea
              value={draft.description}
              onChange={(description) => setDraft({ ...draft, description })}
            />
            <label className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                className="size-4"
              />
              <span className="text-sm font-semibold text-ink">
                Show this service on the public booking form
              </span>
            </label>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save queue type"}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete queue type">
        <p className="text-sm text-muted">
          Delete{" "}
          <strong className="text-ink">
            {confirmDelete?.label.en || confirmDelete?.label.he}
          </strong>
          ? New bookings won&apos;t be able to choose it. Existing appointments keep their record.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDelete && remove(confirmDelete)}>Delete</Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
