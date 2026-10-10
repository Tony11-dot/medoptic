import { randomUUID } from "crypto";
import { getAppointments, getServices, getBookingSettings, getVacations, updateAppointments, logActivity } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import {
  notifyAdminCancelled,
  notifyAdminRescheduled,
  notifyCustomerCancelled,
  notifyCustomerRescheduled,
  resolveServiceLabel,
} from "@/lib/notify";
import { busyIntervals, durationResolver, isOfferedSlot, DEFAULT_DURATION_MINUTES } from "@/lib/schedule";
import type { Appointment } from "@/lib/types";

// Every self-service move sends the customer an SMS, so one booking can only be
// moved online a few times; after that the page asks them to call.
const MAX_SELF_CHANGES = 3;

/** Whether the customer may still move this booking themselves. */
function canSelfChange(a: Appointment, now = Date.now()): boolean {
  return (
    a.status !== "declined" &&
    !!a.appointmentAt &&
    Date.parse(a.appointmentAt) > now &&
    (a.selfChanges ?? 0) < MAX_SELF_CHANGES
  );
}

// Thrown inside the DB mutation so the slot check-and-move stays atomic.
class SlotTakenError extends Error {}
class ChangeNotAllowedError extends Error {}

// GET — minimal appointment state for the public cancel/change pages. The UUID
// is the capability; only the slot time and status are exposed, no personal details.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!rateLimit(`self:${clientIp(request)}`, 10, 10 * 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const { id } = await params;
  const appt = (await getAppointments()).find((a) => a.id === id);
  if (!appt) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({
    appointment: {
      status: appt.status,
      appointmentAt: appt.appointmentAt ?? null,
      canChange: canSelfChange(appt),
    },
  });
}

// POST — customer self-service on their own appointment. No login: the UUID in
// the URL is the capability (returned to them right after booking).
//   { action: "cancel" } → remove the booking entirely (frees the slot on the
//     hour grid and clears it from the admin queue — a customer cancellation
//     leaves no record to manage).
//   { action: "reschedule", appointmentAt } → move it to another free slot on
//     the same hour grid the booking form uses.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!rateLimit(`self:${clientIp(request)}`, 10, 10 * 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const { id } = await params;
  let body: { action?: string; appointmentAt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "cancel") {
    let removed: Appointment | undefined;
    await updateAppointments((list) => {
      removed = list.find((a) => a.id === id);
      return list.filter((a) => a.id !== id);
    });
    if (!removed) return Response.json({ error: "Not found" }, { status: 404 });

    // Notify the office and the customer concurrently. This must be awaited —
    // on a serverless invocation the runtime can freeze/kill the function the
    // instant the response is sent, so an un-awaited send here would silently
    // never go out (the cause of the "no email on cancel" report).
    const services = await getServices();
    const serviceLabel = resolveServiceLabel(services, removed.service);
    await Promise.allSettled([
      notifyAdminCancelled(removed, serviceLabel, "customer"),
      notifyCustomerCancelled(removed),
    ]);

    await logActivity({
      id: randomUUID(),
      at: new Date().toISOString(),
      type: "cancelled",
      appointmentId: removed.id,
      firstName: removed.firstName,
      lastName: removed.lastName,
      phone: removed.phone,
      email: removed.email,
      service: removed.service,
      serviceLabel,
      appointmentAt: removed.appointmentAt,
      by: "customer",
    });

    return Response.json({ ok: true });
  }

  if (body.action === "reschedule") {
    const iso = typeof body.appointmentAt === "string" ? body.appointmentAt : "";
    if (Number.isNaN(Date.parse(iso))) {
      return Response.json({ error: "Invalid time" }, { status: 422 });
    }
    const [services, settings, vacations] = await Promise.all([
      getServices(),
      getBookingSettings(),
      getVacations(),
    ]);
    const byService = durationResolver(services);

    // Same rule as a new booking: the new time must be one of the slots the
    // grid currently offers — computed with this appointment left out, so its
    // own time doesn't block the slots around it.
    let moved: Appointment | undefined;
    let previousAppointmentAt: string | undefined;
    try {
      await updateAppointments((list) => {
        const current = list.find((a) => a.id === id);
        if (!current) return list;
        if (!canSelfChange(current)) throw new ChangeNotAllowedError();
        const nowMs = Date.now();
        const durationMinutes =
          current.durationMinutes ?? byService(current.service) ?? DEFAULT_DURATION_MINUTES;
        const busy = busyIntervals(list, { excludeId: id, durationByService: byService }).filter(
          (b) => b.end >= nowMs,
        );
        if (!isOfferedSlot(iso, settings, durationMinutes, busy, nowMs, vacations)) {
          throw new SlotTakenError();
        }
        previousAppointmentAt = current.appointmentAt;
        moved = {
          ...current,
          appointmentAt: new Date(iso).toISOString(),
          durationMinutes,
          selfChanges: (current.selfChanges ?? 0) + 1,
          // New date → the day-before reminder should go out again.
          remindedAt: undefined,
        };
        return list.map((a) => (a.id === id ? moved! : a));
      });
    } catch (e) {
      if (e instanceof SlotTakenError) {
        return Response.json({ error: "slot already taken" }, { status: 409 });
      }
      if (e instanceof ChangeNotAllowedError) {
        return Response.json({ error: "change not allowed" }, { status: 403 });
      }
      throw e;
    }
    if (!moved) return Response.json({ error: "Not found" }, { status: 404 });

    // Awaited for the same serverless reason as the cancel branch above.
    const serviceLabel = resolveServiceLabel(services, moved.service);
    await Promise.allSettled([
      notifyAdminRescheduled(moved, serviceLabel, previousAppointmentAt, "customer"),
      notifyCustomerRescheduled(moved),
    ]);

    await logActivity({
      id: randomUUID(),
      at: new Date().toISOString(),
      type: "rescheduled",
      appointmentId: moved.id,
      firstName: moved.firstName,
      lastName: moved.lastName,
      phone: moved.phone,
      email: moved.email,
      service: moved.service,
      serviceLabel,
      appointmentAt: moved.appointmentAt,
      previousAppointmentAt,
      by: "customer",
    });

    return Response.json({ ok: true, appointmentAt: moved.appointmentAt });
  }

  return Response.json({ error: "Unknown action" }, { status: 422 });
}
