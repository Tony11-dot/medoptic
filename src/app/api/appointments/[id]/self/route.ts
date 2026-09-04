import { getAppointments, getServices, updateAppointments } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { notifyAdminCancelled, notifyCustomerCancelled, resolveServiceLabel } from "@/lib/notify";
import type { Appointment } from "@/lib/types";

// GET — minimal appointment state for the public cancel page. The UUID is the
// capability; only the slot time and status are exposed, no personal details.
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
    appointment: { status: appt.status, appointmentAt: appt.appointmentAt ?? null },
  });
}

// POST — customer self-service on their own appointment. No login: the UUID in
// the URL is the capability (returned to them right after booking).
//   { action: "cancel" } → remove the booking entirely (frees the slot on the
//     hour grid and clears it from the admin queue — a customer cancellation
//     leaves no record to manage).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!rateLimit(`self:${clientIp(request)}`, 10, 10 * 60_000)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const { id } = await params;
  let body: { action?: string };
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
    await Promise.allSettled([
      notifyAdminCancelled(removed, resolveServiceLabel(services, removed.service), "customer"),
      notifyCustomerCancelled(removed),
    ]);

    return Response.json({ ok: true });
  }

  return Response.json({ error: "Unknown action" }, { status: 422 });
}
