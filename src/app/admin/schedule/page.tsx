"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_WINDOW_DAYS,
  MAX_WINDOW_DAYS,
  formatOpeningLines,
  parseDurationInput,
  timeToMinutes,
} from "@/lib/schedule";
import type { BookingSettings, OpeningRule, Service } from "@/lib/types";
import { cn } from "@/lib/cn";

const inputCls =
  "h-11 rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

// Israel week: Sunday first.
const WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

const EMPTY_SETTINGS: BookingSettings = { rules: [], windowDays: DEFAULT_WINDOW_DAYS };

// Number inputs briefly hold "" (=> 0) while the admin retypes — never let
// that reach storage. Invalid values fall back instead of clamping to nonsense.
const normalizeWindow = (v: number) =>
  Number.isFinite(v) && v >= 1 ? Math.min(MAX_WINDOW_DAYS, Math.round(v)) : DEFAULT_WINDOW_DAYS;
const normalizeDuration = (v: number | undefined) =>
  v && v > 0 ? parseDurationInput(v) ?? DEFAULT_DURATION_MINUTES : DEFAULT_DURATION_MINUTES;

export default function SchedulePage() {
  const toast = useToast();
  const { t } = useI18n();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  // Durations as loaded, so saving only PATCHes services that actually changed.
  const [loadedDurations, setLoadedDurations] = useState<Map<string, number | undefined>>(new Map());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/booking-settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.settings ?? EMPTY_SETTINGS))
      .catch(() => setSettings(EMPTY_SETTINGS));
    fetch("/api/services?all=1")
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => {
        const list: Service[] = d.services ?? [];
        setServices(list);
        setLoadedDurations(new Map(list.map((s) => [s.id, s.durationMinutes])));
      })
      .catch(() => setServices([]));
  }, []);

  const updateRule = (id: string, patch: Partial<OpeningRule>) =>
    setSettings((s) => (s ? { ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) } : s));
  const removeRule = (id: string) =>
    setSettings((s) => (s ? { ...s, rules: s.rules.filter((r) => r.id !== id) } : s));
  const addRule = () =>
    setSettings((s) =>
      s ? { ...s, rules: [...s.rules, { id: `r-${Date.now()}`, days: [0, 1, 2, 3, 4], start: "09:00", end: "19:00" }] } : s,
    );
  const toggleDay = (rule: OpeningRule, day: number) =>
    updateRule(rule.id, {
      days: rule.days.includes(day) ? rule.days.filter((d) => d !== day) : [...rule.days, day].sort(),
    });

  const setDuration = (id: string, durationMinutes: number) =>
    setServices((list) => list.map((s) => (s.id === id ? { ...s, durationMinutes } : s)));

  const rulesValid = (s: BookingSettings) =>
    s.rules.every((r) => r.days.length > 0 && r.start && r.end && timeToMinutes(r.start) < timeToMinutes(r.end));

  async function save() {
    if (!settings) return;
    if (!rulesValid(settings)) {
      toast.error(t.admin.schedule.invalidRule);
      return;
    }
    setSaving(true);
    try {
      // Normalize half-typed numbers and reflect what actually gets saved.
      const normalized: BookingSettings = { ...settings, windowDays: normalizeWindow(settings.windowDays) };
      const fixedServices = services.map((s) => ({ ...s, durationMinutes: normalizeDuration(s.durationMinutes) }));
      setSettings(normalized);
      setServices(fixedServices);

      const changed = fixedServices.filter((s) => loadedDurations.get(s.id) !== s.durationMinutes);
      const responses = await Promise.all([
        fetch("/api/booking-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalized),
        }),
        ...changed.map((s) =>
          fetch(`/api/services/${s.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ durationMinutes: s.durationMinutes }),
          }),
        ),
      ]);
      if (responses.some((r) => !r.ok)) throw new Error();
      setLoadedDurations(new Map(fixedServices.map((s) => [s.id, s.durationMinutes])));
      toast.success(t.admin.schedule.saved);
    } catch {
      toast.error(t.admin.toasts.saveError);
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <AdminShell>
        <p className="text-muted">{t.admin.loading}</p>
      </AdminShell>
    );
  }

  const previewLines = formatOpeningLines(settings.rules, t.weekdaysShort);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.schedule.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.schedule.subtitle}</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? t.admin.saving : t.admin.save}</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-6">
          {/* Opening hours rules */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-ink">{t.admin.schedule.openingTitle}</h2>
                <p className="mt-0.5 text-sm text-muted">{t.admin.schedule.openingHint}</p>
              </div>
              <Button size="sm" variant="subtle" onClick={addRule}>+ {t.admin.schedule.addRule}</Button>
            </div>

            {settings.rules.length === 0 && (
              <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                {t.admin.schedule.noRules}
              </p>
            )}

            <div className="mt-4 space-y-4">
              {settings.rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{t.admin.schedule.daysLabel}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      aria-label={t.admin.actions.delete}
                      className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                    >
                      ✕
                    </button>
                  </div>
                  {/* Multi-select day chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {WEEK.map((d) => {
                      const on = rule.days.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => toggleDay(rule, d)}
                          aria-pressed={on ? "true" : "false"}
                          className={cn(
                            "h-11 min-w-11 rounded-xl border-2 px-2 text-sm font-bold transition",
                            on
                              ? "border-brand bg-brand text-white shadow-sm"
                              : "border-line bg-white text-ink/60 hover:border-brand-200",
                          )}
                        >
                          {t.weekdaysShort[d]}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.schedule.start}</span>
                      <input
                        type="time"
                        dir="ltr"
                        value={rule.start}
                        onChange={(e) => updateRule(rule.id, { start: e.target.value })}
                        className={inputCls}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.schedule.end}</span>
                      <input
                        type="time"
                        dir="ltr"
                        value={rule.end}
                        onChange={(e) => updateRule(rule.id, { end: e.target.value })}
                        className={inputCls}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <label className="mt-5 block max-w-sm border-t border-line pt-4">
              <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.schedule.windowLabel}</span>
              <input
                type="number"
                min={1}
                max={MAX_WINDOW_DAYS}
                dir="ltr"
                value={settings.windowDays || ""}
                onChange={(e) => setSettings({ ...settings, windowDays: Number(e.target.value) })}
                className={cn(inputCls, "w-28")}
              />
              <span className="mt-1 block text-xs text-muted">{t.admin.schedule.windowHint}</span>
            </label>
          </section>

          {/* Per-service durations */}
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">{t.admin.schedule.durationsTitle}</h2>
            <p className="mt-0.5 text-sm text-muted">{t.admin.schedule.durationsHint}</p>
            <div className="mt-4 divide-y divide-line">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <span className={cn("text-sm font-semibold", s.enabled ? "text-ink" : "text-ink/40 line-through")}>
                    {s.label.he || s.label.en || s.label.ru || s.id}
                  </span>
                  <label className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      step={5}
                      dir="ltr"
                      value={s.durationMinutes || ""}
                      placeholder={String(DEFAULT_DURATION_MINUTES)}
                      onChange={(e) => setDuration(s.id, Number(e.target.value))}
                      className={cn(inputCls, "w-24 text-center")}
                    />
                    <span className="text-sm text-muted">{t.admin.schedule.minutes}</span>
                  </label>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Live footer-hours preview */}
        <aside className="rounded-2xl border border-line bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <h2 className="text-lg font-bold text-ink">{t.footer.hours}</h2>
          <p className="mt-0.5 text-sm text-muted">{t.admin.schedule.footerNote}</p>
          <div className="mt-4 rounded-xl brand-gradient p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">{t.footer.hours}</p>
            <div className="mt-2 space-y-1 text-sm">
              {previewLines.length === 0 ? (
                <p className="text-white/60">—</p>
              ) : (
                previewLines.map((line, i) => <p key={i}>{line}</p>)
              )}
            </div>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
