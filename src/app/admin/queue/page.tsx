"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Appointment, Service } from "@/lib/types";
import { BUSINESS_TZ, dateStrInTz, timeStrInTz } from "@/lib/schedule";
import { cn } from "@/lib/cn";

// All appointment times are shown and edited in the shop's timezone, so the
// admin sees the same clock as the customer slot picker — no matter where the
// browser or server happens to run.
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: BUSINESS_TZ, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const fmtSlot = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { timeZone: BUSINESS_TZ, weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// ISO -> value for <input type="datetime-local">, as shop wall-clock time.
// (The PATCH API interprets naive values as shop time, so this round-trips.)
const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${dateStrInTz(d)}T${timeStrInTz(d)}`;
};

export default function QueuePage() {
  const toast = useToast();
  const { t } = useI18n();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [timeFor, setTimeFor] = useState<Appointment | null>(null);
  const [timeValue, setTimeValue] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Appointment | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/appointments");
    if (res.ok) {
      const data = await res.json();
      const list: Appointment[] = data.appointments ?? [];
      setItems(list);
      // Deep link from the "new booking" email: /admin/queue?appt=<id> opens
      // that appointment's details. Consume the param so refreshes and later
      // actions don't keep re-opening the modal.
      const wanted = new URLSearchParams(window.location.search).get("appt");
      if (wanted) {
        window.history.replaceState(null, "", window.location.pathname);
        const hit = list.find((a) => a.id === wanted);
        if (hit) setViewing(hit);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    fetch("/api/services?all=1")
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([]));
  }, [load]);

  const serviceLabel = useCallback(
    (id: string) => {
      const s = services.find((x) => x.id === id);
      if (!s) return id;
      return s.label.he || s.label.en || s.label.ru || id;
    },
    [services],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (serviceFilter !== "all" && a.service !== serviceFilter) return false;
      if (q) {
        const hay = `${a.firstName} ${a.lastName} ${a.phone} ${a.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, serviceFilter, query]);

  async function remove(a: Appointment) {
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${a.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("✓");
      setConfirmDelete(null);
      await load();
    } catch {
      toast.error("!");
    } finally {
      setBusy(false);
    }
  }

  function openTime(a: Appointment) {
    setTimeValue(a.appointmentAt ? isoToLocalInput(a.appointmentAt) : "");
    setTimeFor(a);
  }

  async function saveTime() {
    if (!timeFor) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${timeFor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved", appointmentAt: timeValue || undefined }),
      });
      if (res.status === 409) {
        // The target time overlaps another booking — keep the modal open.
        toast.error(t.booking.slotTaken);
        return;
      }
      if (!res.ok) throw new Error();
      toast.success("✓");
      setTimeFor(null);
      await load();
    } catch {
      toast.error("!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.appointments}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.titles.appointmentsSub}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={load}>↻ {t.admin.refresh}</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${t.admin.actions.search}…`}
          className="h-10 min-w-56 flex-1 rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <select
          value={serviceFilter}
          aria-label={t.admin.status.allServices}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand"
        >
          <option value="all">{t.admin.status.allServices}</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{serviceLabel(s.id)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-start text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 text-start">{t.admin.queue.booked}</th>
                <th className="px-4 py-3 text-start">{t.admin.queue.customer}</th>
                <th className="px-4 py-3 text-start">{t.admin.queue.phone}</th>
                <th className="px-4 py-3 text-start">{t.admin.queue.service}</th>
                <th className="px-4 py-3 text-start">{t.admin.queue.appointment}</th>
                <th className="px-4 py-3 text-end">{t.admin.queue.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">{t.admin.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">{t.admin.queue.none}</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="transition hover:bg-surface/60">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{a.firstName} {a.lastName}</td>
                    <td className="whitespace-nowrap px-4 py-3" dir="ltr">{a.phone}</td>
                    <td className="px-4 py-3">{serviceLabel(a.service)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtSlot(a.appointmentAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" aria-label="view" onClick={() => setViewing(a)} className="rounded-lg px-2 py-1.5 text-sm text-brand-dark transition hover:bg-brand-50">👁</button>
                        <button type="button" onClick={() => openTime(a)} disabled={busy} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-100 disabled:opacity-50">
                          🕑 {t.admin.queue.setTime}
                        </button>
                        <button type="button" aria-label={t.admin.actions.delete} onClick={() => setConfirmDelete(a)} disabled={busy} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
                          🗑 {t.admin.actions.delete}
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

      {/* View details modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={t.admin.queue.details}>
        {viewing && (
          <dl className="space-y-3 text-sm">
            <Row label={t.admin.queue.name}>{viewing.firstName} {viewing.lastName}</Row>
            <Row label={t.admin.queue.phone}><span dir="ltr">{viewing.phone}</span></Row>
            <Row label={t.admin.queue.email}>{viewing.email || "—"}</Row>
            <Row label={t.admin.queue.service}>{serviceLabel(viewing.service)}</Row>
            <Row label={t.admin.queue.appointment}>{fmtSlot(viewing.appointmentAt)}</Row>
            {viewing.durationMinutes != null && (
              <Row label={t.admin.queue.duration}>{viewing.durationMinutes} {t.booking.minutesShort}</Row>
            )}
            <Row label={t.admin.queue.reminderBy}>{(viewing.reminderChannels ?? []).map((c) => (c === "email" ? "Email" : "SMS")).join(" + ") || "SMS"}</Row>
            <Row label={t.admin.queue.booked}>{fmtDate(viewing.createdAt)}</Row>
            {viewing.notifiedAt && <Row label={t.admin.queue.notified}>{fmtDate(viewing.notifiedAt)}</Row>}
            <Row label={t.admin.queue.notes}>{viewing.notes || "—"}</Row>
            <div className="pt-2">
              <Button size="sm" onClick={() => { const a = viewing; setViewing(null); openTime(a); }}>
                🕑 {t.admin.queue.setTime}
              </Button>
            </div>
          </dl>
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t.admin.actions.delete}>
        {confirmDelete && (
          <>
            <p className="text-sm text-muted">
              <strong className="text-ink">{confirmDelete.firstName} {confirmDelete.lastName}</strong>
              {" — "}{serviceLabel(confirmDelete.service)} · {fmtDate(confirmDelete.createdAt)}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>{t.admin.actions.cancel}</Button>
              <Button variant="danger" disabled={busy} onClick={() => remove(confirmDelete)}>{t.admin.actions.delete}</Button>
            </div>
          </>
        )}
      </Modal>

      {/* Set appointment time modal */}
      <Modal open={!!timeFor} onClose={() => setTimeFor(null)} title={t.admin.queue.setTime}>
        {timeFor && (
          <>
            <p className="text-sm text-muted">
              <strong className="text-ink">{timeFor.firstName} {timeFor.lastName}</strong> — {t.admin.queue.setTimeDesc}
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.queue.dateTime}</span>
              <input
                type="datetime-local"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              <span className="mt-1 block text-xs text-muted">{t.admin.queue.dateTimeHint}</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setTimeFor(null)}>{t.admin.actions.cancel}</Button>
              <Button disabled={busy} onClick={saveTime}>{t.admin.save}</Button>
            </div>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 font-semibold text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
