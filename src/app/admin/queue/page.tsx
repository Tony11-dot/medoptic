"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Appointment, AppointmentStatus, Service } from "@/lib/types";
import { SCHEDULING_URL } from "@/lib/config";
import { cn } from "@/lib/cn";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const fmtSlot = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ISO -> value for <input type="datetime-local"> in the admin's local timezone.
const isoToLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function QueuePage() {
  const toast = useToast();
  const { t } = useI18n();
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [services, setServices] = useState<Service[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const [viewing, setViewing] = useState<Appointment | null>(null);
  const [declineFor, setDeclineFor] = useState<string[] | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [approveFor, setApproveFor] = useState<Appointment | null>(null);
  const [approveTime, setApproveTime] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/appointments");
    if (res.ok) {
      const data = await res.json();
      setItems(data.appointments ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Include disabled services so historic appointments still resolve a label.
    fetch("/api/services?all=1")
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([]));
  }, [load]);

  // id -> English label (admin is LTR/English), falling back to any language
  // then to the raw id if a service has since been deleted.
  const serviceLabel = useCallback(
    (id: string) => {
      const s = services.find((x) => x.id === id);
      if (!s) return id;
      return s.label.en || s.label.he || s.label.ru || id;
    },
    [services],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (serviceFilter !== "all" && a.service !== serviceFilter) return false;
      if (q) {
        const hay = `${a.firstName} ${a.lastName} ${a.phone} ${a.email ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, statusFilter, serviceFilter, query]);

  async function decide(
    ids: string[],
    status: AppointmentStatus,
    opts: { reason?: string; appointmentAt?: string } = {},
  ) {
    setBusy(true);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/appointments/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, reason: opts.reason, appointmentAt: opts.appointmentAt }),
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed) toast.error(`${failed} update(s) failed`);
      else {
        const verb = status === "approved" ? "Approved" : "Declined";
        toast.success(`${verb} ${ids.length} request${ids.length > 1 ? "s" : ""} · customer notified`);
      }
      setSelected(new Set());
      await load();
    } catch {
      toast.error("Action failed");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  function toggleAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(filtered.map((a) => a.id)));
  }

  function openDecline(ids: string[]) {
    setDeclineReason("");
    setDeclineFor(ids);
  }

  function openApprove(a: Appointment) {
    // Prefill the picker with any time already on the appointment (local time).
    setApproveTime(a.appointmentAt ? isoToLocalInput(a.appointmentAt) : "");
    setApproveFor(a);
  }

  function confirmApprove() {
    if (!approveFor) return;
    decide([approveFor.id], "approved", { appointmentAt: approveTime || undefined });
    setApproveFor(null);
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.appointments}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.titles.appointmentsSub}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={SCHEDULING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-brand-dark transition hover:border-brand"
          >
            📅 {t.booking.pickTimeCta}
          </a>
          <Button variant="secondary" size="sm" onClick={load}>
            ↻ {t.admin.refresh}
          </Button>
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
          value={statusFilter}
          aria-label={t.admin.status.allStatuses}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand"
        >
          <option value="all">{t.admin.status.allStatuses}</option>
          <option value="pending">{t.admin.status.pending}</option>
          <option value="approved">{t.admin.status.approved}</option>
          <option value="declined">{t.admin.status.declined}</option>
        </select>
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

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3">
          <span className="text-sm font-semibold text-brand-dark">{selected.size}</span>
          <div className="ms-auto flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => decide([...selected], "approved")}>
              {t.admin.actions.approve}
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => openDecline([...selected])}>
              {t.admin.actions.decline}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all" />
                </th>
                <th className="px-4 py-3">Booked</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Appointment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No appointments match.</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className={cn("transition hover:bg-surface/60", selected.has(a.id) && "bg-brand-50/50")}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggle(a.id)} aria-label={`Select ${a.firstName}`} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDate(a.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-ink">{a.firstName} {a.lastName}</td>
                    <td className="whitespace-nowrap px-4 py-3" dir="ltr">{a.phone}</td>
                    <td className="px-4 py-3">{serviceLabel(a.service)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtSlot(a.appointmentAt)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLES[a.status])}>
                        {t.admin.status[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" aria-label="view" onClick={() => setViewing(a)} className="rounded-lg px-2 py-1.5 text-sm text-brand-dark transition hover:bg-brand-50">
                          👁
                        </button>
                        {a.status !== "approved" && (
                          <button type="button" onClick={() => openApprove(a)} disabled={busy} className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50">
                            {t.admin.actions.approve}
                          </button>
                        )}
                        {a.status !== "declined" && (
                          <button type="button" onClick={() => openDecline([a.id])} disabled={busy} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50">
                            {t.admin.actions.decline}
                          </button>
                        )}
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
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Appointment details">
        {viewing && (
          <dl className="space-y-3 text-sm">
            <Row label="Name">{viewing.firstName} {viewing.lastName}</Row>
            <Row label="Phone"><span dir="ltr">{viewing.phone}</span></Row>
            <Row label="Email">{viewing.email || "—"}</Row>
            <Row label="Service">{serviceLabel(viewing.service)}</Row>
            <Row label="Appointment">{fmtSlot(viewing.appointmentAt)}</Row>
            <Row label="Reminder by">{(viewing.reminderChannels ?? []).map((c) => (c === "email" ? "Email" : "SMS")).join(" + ") || "SMS"}</Row>
            <Row label="Booked">{fmtDate(viewing.createdAt)}</Row>
            <Row label="Status"><span>{t.admin.status[viewing.status]}</span></Row>
            {viewing.decisionReason && <Row label="Decline reason">{viewing.decisionReason}</Row>}
            {viewing.notifiedAt && <Row label="Notified">{fmtDate(viewing.notifiedAt)}</Row>}
            {viewing.remindedAt && <Row label="Reminded">{fmtDate(viewing.remindedAt)}</Row>}
            <Row label="Notes">{viewing.notes || "—"}</Row>
            <div className="flex gap-2 pt-2">
              {viewing.status !== "approved" && (
                <Button size="sm" onClick={() => { const a = viewing; setViewing(null); openApprove(a); }}>
                  {t.admin.actions.approve}
                </Button>
              )}
              {viewing.status !== "declined" && (
                <Button size="sm" variant="danger" onClick={() => { const a = viewing; setViewing(null); openDecline([a.id]); }}>
                  {t.admin.actions.decline}
                </Button>
              )}
            </div>
          </dl>
        )}
      </Modal>

      {/* Decline reason modal */}
      <Modal open={!!declineFor} onClose={() => setDeclineFor(null)} title="Decline appointment">
        <p className="text-sm text-muted">
          Optionally add a reason — it will be included in the SMS/email sent to the customer.
        </p>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          rows={3}
          placeholder="e.g. The requested slot is fully booked."
          className="mt-3 w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeclineFor(null)}>{t.admin.actions.cancel}</Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (declineFor) decide(declineFor, "declined", { reason: declineReason });
              setDeclineFor(null);
            }}
          >
            {t.admin.actions.decline}
          </Button>
        </div>
      </Modal>

      {/* Approve + set appointment time modal */}
      <Modal open={!!approveFor} onClose={() => setApproveFor(null)} title="Approve appointment">
        {approveFor && (
          <>
            <p className="text-sm text-muted">
              Approving for <strong className="text-ink">{approveFor.firstName} {approveFor.lastName}</strong>.
              Set the confirmed appointment time — it&apos;s included in the SMS/email and the reminder.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Appointment date &amp; time</span>
              <input
                type="datetime-local"
                value={approveTime}
                onChange={(e) => setApproveTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              <span className="mt-1 block text-xs text-muted">
                Optional — leave empty to send the booking link so the customer picks a time.
              </span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setApproveFor(null)}>{t.admin.actions.cancel}</Button>
              <Button disabled={busy} onClick={confirmApprove}>{t.admin.actions.approve}</Button>
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
