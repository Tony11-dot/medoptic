"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { BUSINESS_TZ } from "@/lib/schedule";
import type { ActivityLogEntry, ActivityType } from "@/lib/types";
import { cn } from "@/lib/cn";

// Every timestamp is shown in the shop's timezone, so the log reads the same
// clock as the rest of the admin — no matter where the browser or server run.
const fmt = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    timeZone: BUSINESS_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const TYPE_STYLE: Record<ActivityType, { dot: string; badge: string; icon: string }> = {
  booked: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", icon: "📥" },
  cancelled: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700", icon: "❌" },
  rescheduled: { dot: "bg-amber-500", badge: "bg-amber-50 text-amber-700", icon: "🔁" },
  approved: { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", icon: "✓" },
  declined: { dot: "bg-rose-500", badge: "bg-rose-50 text-rose-700", icon: "🚫" },
};

export default function ActivityPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [log, setLog] = useState<ActivityLogEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLog(data.activity ?? []);
    } catch {
      toast.error(t.admin.activity.loadError);
      setLog((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.activity.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.activity.subtitle}</p>
        </div>
        <Button variant="subtle" onClick={load} disabled={loading}>
          {t.admin.activity.refresh}
        </Button>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6 shadow-sm">
        {log === null ? (
          <p className="text-muted">{t.admin.loading}</p>
        ) : log.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {t.admin.activity.empty}
          </p>
        ) : (
          <ul className="space-y-3">
            {log.map((entry) => {
              const style = TYPE_STYLE[entry.type];
              const name = `${entry.firstName} ${entry.lastName}`.trim();
              return (
                <li key={entry.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span aria-hidden className={cn("size-2 rounded-full", style.dot)} />
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", style.badge)}>
                        {style.icon} {t.admin.activity.type[entry.type]}
                      </span>
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink/60">
                        {t.admin.activity.by[entry.by]}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-muted">{fmt(entry.at)}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    <p className="font-bold text-ink">{name || "—"}</p>
                    <p className="text-ink/70">
                      <span className="text-muted">{t.admin.activity.service}: </span>
                      {entry.serviceLabel}
                    </p>
                    <p className="text-ink/70">
                      <span className="text-muted">{t.admin.activity.phone}: </span>
                      {entry.phone}
                    </p>
                    {entry.email && (
                      <p className="text-ink/70">
                        <span className="text-muted">{t.admin.activity.email}: </span>
                        {entry.email}
                      </p>
                    )}
                    {entry.appointmentAt && (
                      <p className="text-ink/70">
                        <span className="text-muted">{t.admin.activity.time}: </span>
                        {fmt(entry.appointmentAt)}
                      </p>
                    )}
                    {entry.previousAppointmentAt && (
                      <p className="text-ink/70">
                        <span className="text-muted">{t.admin.activity.previousTime}: </span>
                        {fmt(entry.previousAppointmentAt)}
                      </p>
                    )}
                    {entry.reason && (
                      <p className="text-ink/70 sm:col-span-2">
                        <span className="text-muted">{t.admin.activity.reason}: </span>
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}
