import { randomUUID } from "crypto";
import { getAppointments, updateAppointments, getServices } from "@/lib/db";
import { validateAppointment } from "@/lib/validation";
import { isAuthed } from "@/lib/auth";
import { notifyCustomer } from "@/lib/notify";
import type { Appointment } from "@/lib/types";

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

// POST — create an appointment (public).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow booking a service that currently exists and is enabled.
  const services = await getServices();
  const validIds = services.filter((s) => s.enabled).map((s) => s.id);
  const result = validateAppointment(body, validIds);
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 422 });
  }

  // Bookings are auto-approved — no manual approve/decline step.
  const now = new Date().toISOString();
  const appointment: Appointment = {
    id: randomUUID(),
    createdAt: now,
    status: "approved",
    decisionAt: now,
    ...result.value,
  };

  await updateAppointments((list) => [appointment, ...list]);

  // Send the confirmation (with the scheduling link) right away.
  let notifiedAt: string | undefined;
  try {
    await notifyCustomer(appointment);
    notifiedAt = new Date().toISOString();
    await updateAppointments((list) =>
      list.map((a) => (a.id === appointment.id ? { ...a, notifiedAt } : a)),
    );
  } catch {
    /* notification failure shouldn't block the booking */
  }

  return Response.json({ appointment: { ...appointment, notifiedAt } }, { status: 201 });
}
