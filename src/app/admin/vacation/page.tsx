"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { inputCls } from "@/components/admin/adminUi";
import { DateField } from "@/components/ui/DatePicker";
import { dateStrInTz } from "@/lib/schedule";
import type { VacationRange } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function VacationPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [ranges, setRanges] = useState<VacationRange[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vacations")
      .then((r) => r.json())
      .then((d) => setRanges(d.vacations ?? []))
      .catch(() => setRanges([]));
  }, []);

  const updateRange = (id: string, patch: Partial<VacationRange>) =>
    setRanges((list) => (list ? list.map((r) => (r.id === id ? { ...r, ...patch } : r)) : list));
  const removeRange = (id: string) =>
    setRanges((list) => (list ? list.filter((r) => r.id !== id) : list));
  const addRange = () => {
    const today = dateStrInTz(new Date());
    setRanges((list) => [
      ...(list ?? []),
      { id: `v-${Date.now()}`, start: today, end: today, note: "", createdAt: new Date().toISOString() },
    ]);
  };

  const rangesValid = (list: VacationRange[]) => list.every((r) => r.start && r.end && r.start <= r.end);

  async function save() {
    if (!ranges) return;
    if (!rangesValid(ranges)) {
      toast.error(t.admin.vacation.invalidRange);
      return;
    }
    setSaving(true);
    try {
      const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
      const res = await fetch("/api/vacations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sorted),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRanges(data.vacations ?? sorted);
      toast.success(t.admin.vacation.saved);
    } catch {
      toast.error(t.admin.toasts.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (!ranges) {
    return (
      <AdminShell>
        <p className="text-muted">{t.admin.loading}</p>
      </AdminShell>
    );
  }

  const today = dateStrInTz(new Date());

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.vacation.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.vacation.subtitle}</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? t.admin.saving : t.admin.save}</Button>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">{t.admin.vacation.title}</h2>
          <Button size="sm" variant="subtle" onClick={addRange}>+ {t.admin.vacation.addRange}</Button>
        </div>

        {ranges.length === 0 && (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {t.admin.vacation.noRanges}
          </p>
        )}

        <div className="mt-4 space-y-4">
          {ranges.map((range) => {
            const isPast = range.end < today;
            return (
              <div key={range.id} className={cn("rounded-xl border border-line p-4", isPast && "opacity-50")}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.vacation.start}</span>
                      <DateField
                        value={range.start}
                        onChange={(v) => updateRange(range.id, { start: v })}
                        ariaLabel={t.admin.vacation.start}
                        className="w-40"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.vacation.end}</span>
                      <DateField
                        value={range.end}
                        onChange={(v) => updateRange(range.id, { end: v })}
                        ariaLabel={t.admin.vacation.end}
                        className="w-40"
                      />
                    </label>
                    <label className="block min-w-48 flex-1">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.vacation.note}</span>
                      <input
                        type="text"
                        value={range.note ?? ""}
                        placeholder={t.admin.vacation.notePlaceholder}
                        onChange={(e) => updateRange(range.id, { note: e.target.value })}
                        className={cn(inputCls, "w-full")}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRange(range.id)}
                    aria-label={t.admin.actions.delete}
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
