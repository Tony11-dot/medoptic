import { randomUUID } from "crypto";
import { getAppointments, updateAppointments, getServices, getBookingSettings, getVacations } from "@/lib/db";
import { validateAppointment } from "@/lib/validation";
import { isAuthed } from "@/lib/auth";
import { notifyCustomer, notifyAdminNewBooking } from "@/lib/notify";
import { busyIntervals, durationResolver, isOfferedSlot, serviceDuration } from "@/lib/schedule";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import type { Appointment } from "@/lib/types";

// Abuse guards on the public booking endpoint (it reserves slots and triggers
// SMS/email sends, so both slot-hoarding and cost abuse must be bounded).
const MAX_BOOKINGS_PER_IP_WINDOW = 5; // per 10 minutes
const MAX_ACTIVE_PER_PHONE = 3;
const DECLINED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

// Compare phone numbers by their last 9 digits so formatting variants
// ("050-123-4567", "+972501234567") count as the same caller.
const phoneKey = (p: string) => p.replace(/\D/g, "").slice(-9);

// GET — list all appointments (admin only).
export async function GET() {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getAppointments();
  // newest first
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ appointments: list });
}

// Thrown inside the DB mutation when the requested slot is already taken, so
// the read-check-insert stays atomic under the per-key lock.
class SlotTakenError extends Error {}
// Thrown when one phone number already holds too many upcoming appointments.
class TooManyBookingsError extends Error {}

// POST — create an appointment (public). The customer picks a concrete slot on
// the site's hour grid; the server re-checks it against the opening hours and
// existing bookings, so a stale or forged slot can never double-book.
export async function POST(request: Request) {
  if (!rateLimit(`book:${clientIp(request)}`, MAX_BOOKINGS_PER_IP_WINDOW, 10 * 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow booking a service that currently exists and is enabled.
  const [services, settings, vacations] = await Promise.all([
    getServices(),
    getBookingSettings(),
    getVacations(),
  ]);
  const validIds = services.filter((s) => s.enabled).map((s) => s.id);
  const result = validateAppointment(body, validIds);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 422 });
  }

  const service = services.find((s) => s.id === result.value.service)!;
  const durationMinutes = serviceDuration(service);

  // Bookings are auto-approved — the slot picker is the approval.
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: randomUUID(),
    createdAt: now,
    status: "approved",
    decisionAt: now,
    durationMinutes,
    ...result.value,
  };

  // Slot check + insert run atomically (CAS on Redis, lock on files). Because
  // slot positions chain off existing bookings, the requested time must be one
  // of the slots the walk currently offers — this covers overlaps, the opening
  // hours, the lead time, and the booking window in a single source of truth.
  // If a booking that shifts the chain landed first, abort with 409.
  const byService = durationResolver(services);
  try {
    await updateAppointments((list) => {
      const nowMs = Date.now();
      const busy = busyIntervals(list, { durationByService: byService }).filter((b) => b.end >= nowMs);
      if (!isOfferedSlot(appointment.appointmentAt!, settings, durationMinutes, busy, nowMs, vacations)) {
        throw new SlotTakenError();
      }

      // One phone can't hoard the calendar (or spin a book→cancel notification loop).
      const key = phoneKey(appointment.phone);
      const active = list.filter(
        (a) =>
          a.status !== "declined" &&
          a.appointmentAt &&
          Date.parse(a.appointmentAt) > nowMs &&
          phoneKey(a.phone) === key,
      ).length;
      if (active >= MAX_ACTIVE_PER_PHONE) throw new TooManyBookingsError();

      // Housekeeping: long-declined records only grow the list — drop them so
      // storage and the per-request scans stay bounded.
      const kept = list.filter(
        (a) =>
          a.status !== "declined" ||
          Date.parse(a.decisionAt ?? a.createdAt) > nowMs - DECLINED_RETENTION_MS,
      );
      return [appointment, ...kept];
    });
  } catch (e) {
    if (e instanceof SlotTakenError) {
      return Response.json({ error: "slot already taken" }, { status: 409 });
    }
    if (e instanceof TooManyBookingsError) {
      return Response.json({ error: "too many active bookings for this phone" }, { status: 429 });
    }
    throw e;
  }

  // Notify the office and the customer concurrently — both are independent
  // network sends, and neither failure should block the booking.
  const serviceLabel = service.label.he || service.label.en || appointment.service;
  const [, customerSend] = await Promise.allSettled([
    notifyAdminNewBooking(appointment, serviceLabel),
    notifyCustomer(appointment),
  ]);
  let notifiedAt: string | undefined;
  if (customerSend.status === "fulfilled") {
    notifiedAt = new Date().toISOString();
    try {
      await updateAppointments((list) =>
        list.map((a) => (a.id === appointment.id ? { ...a, notifiedAt } : a)),
      );
    } catch {
      /* stamping failure shouldn't block the booking */
    }
  }

  return Response.json({ appointment: { ...appointment, notifiedAt } }, { status: 201 });
}
