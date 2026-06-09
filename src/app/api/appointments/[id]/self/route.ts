import { updateAppointments } from "@/lib/db";
import { notifyCustomer } from "@/lib/notify";
import type { Appointment } from "@/lib/types";

// POST — customer self-service on their own appointment. No login: the UUID in
// the URL is the capability (returned to them right after booking).
//   { action: "schedule", appointmentAt }  → store the date/time they picked
//   { action: "cancel" }                   → cancel the booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: { action?: string; appointmentAt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "cancel") {
    let found = false;
    await updateAppointments((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        found = true;
        return { ...a, status: "declined", decisionAt: new Date().toISOString(), decisionReason: "בוטל ע״י הלקוח" };
      }),
    );
    if (!found) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (body.action === "schedule") {
    const d = body.appointmentAt ? new Date(body.appointmentAt) : null;
    if (!d || isNaN(d.getTime())) return Response.json({ error: "Invalid date" }, { status: 422 });
    let updated: Appointment | undefined;
    await updateAppointments((list) =>
      list.map((a) => {
        if (a.id !== id) return a;
        updated = { ...a, appointmentAt: d.toISOString() };
        return updated;
      }),
    );
    if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
    // Re-send the confirmation, now with the chosen time.
    try {
      await notifyCustomer(updated);
    } catch {
      /* ignore notification errors */
    }
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 422 });
}
