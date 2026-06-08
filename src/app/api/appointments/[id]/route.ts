import { updateAppointments } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { notifyCustomer } from "@/lib/notify";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const VALID: AppointmentStatus[] = ["pending", "approved", "declined"];

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
  let appointmentAt: string | undefined;
  if (body.appointmentAt) {
    const d = new Date(body.appointmentAt);
    if (!isNaN(d.getTime())) appointmentAt = d.toISOString();
  }

  let updated: Appointment | undefined;
  await updateAppointments((list) =>
    list.map((a) => {
      if (a.id !== id) return a;
      updated = {
        ...a,
        status,
        appointmentAt: appointmentAt ?? a.appointmentAt,
        decisionAt: new Date().toISOString(),
        decisionReason: status === "declined" ? body.reason?.trim() || undefined : undefined,
      };
      return updated;
    }),
  );

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
