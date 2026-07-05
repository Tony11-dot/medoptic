import { getServices, updateAppointments } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { notifyCustomer } from "@/lib/notify";
import { busyIntervals, durationResolver, overlapsBusy, zonedToUtc, DEFAULT_DURATION_MINUTES } from "@/lib/schedule";
import type { Appointment, AppointmentStatus } from "@/lib/types";

// A datetime-local value has no timezone. The admin thinks in shop (Israel)
// time, but the server may run in UTC — so naive values are interpreted as
// business wall-clock time, not server-local.
const NAIVE_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;
function parseAdminDate(raw: string): string | undefined {
  const naive = NAIVE_RE.exec(raw);
  if (naive && !/(?:Z|[+-]\d{2}:?\d{2})$/.test(raw)) {
    return zonedToUtc(naive[1], naive[2]).toISOString();
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
}

const VALID: AppointmentStatus[] = ["pending", "approved", "declined"];

// Thrown inside the DB mutation when the target slot is occupied, so the
// check-and-write stays atomic.
class SlotTakenError extends Error {}

// PATCH — approve/decline an appointment and (placeholder) notify the customer.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: { status?: string; reason?: string; appointmentAt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = body.status as AppointmentStatus;
  if (!VALID.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 422 });
  }

  // Confirmed slot the admin set (from a datetime-local value). Normalise to ISO.
  const appointmentAt = body.appointmentAt ? parseAdminDate(body.appointmentAt) : undefined;

  // Rescheduling must respect the same "one booking per slot" invariant as the
  // public picker — check overlaps atomically, ignoring the appointment being
  // moved. (Admins may place a time outside opening hours on purpose, so only
  // conflicts are enforced here, not the grid.)
  const byService = durationResolver(await getServices());
  let updated: Appointment | undefined;
  try {
    await updateAppointments((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        const durationMinutes =
          a.durationMinutes ?? byService(a.service) ?? DEFAULT_DURATION_MINUTES;
        if (appointmentAt && status !== "declined") {
          const busy = busyIntervals(list, { excludeId: id, durationByService: byService });
          if (overlapsBusy(busy, Date.parse(appointmentAt), durationMinutes)) {
            throw new SlotTakenError();
          }
        }
        updated = {
          ...a,
          status,
          appointmentAt: appointmentAt ?? a.appointmentAt,
          durationMinutes,
          decisionAt: new Date().toISOString(),
          decisionReason: status === "declined" ? body.reason?.trim() || undefined : undefined,
        };
        return updated;
      }),
    );
  } catch (e) {
    if (e instanceof SlotTakenError) {
      return Response.json({ error: "slot already taken" }, { status: 409 });
    }
    throw e;
  }

  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Fire the (placeholder) notification for decisions, then record it.
  let notification = null;
  if (status === "approved" || status === "declined") {
    const result = await notifyCustomer(updated);
    const stamped = { ...updated, notifiedAt: new Date().toISOString() };
    await updateAppointments((list) => list.map((a) => (a.id === id ? stamped : a)));
    updated = stamped;
    notification = result;
  }

  return Response.json({ appointment: updated, notification });
}

// DELETE — remove an appointment (admin only).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let found = false;
  await updateAppointments((list) => {
    const next = list.filter((a) => a.id !== id);
    found = next.length !== list.length;
    return next;
  });
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
