import { getAppointments, updateAppointments } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { notifyCustomer } from "@/lib/notify";

// POST — manually (re)send the notification for an appointment (admin only).
// Body: { appointmentId: string }
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { appointmentId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const list = await getAppointments();
  const appt = list.find((a) => a.id === body.appointmentId);
  if (!appt) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await notifyCustomer(appt);
  await updateAppointments((l) =>
    l.map((a) => (a.id === appt.id ? { ...a, notifiedAt: new Date().toISOString() } : a)),
  );

  return Response.json({ ok: true, notification: result });
}
