import { getAppointments, updateAppointments } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { notifyReminder } from "@/lib/notify";

// How far ahead an appointment must be to get the "day before" reminder. With a
// once-daily cron this covers everything happening in roughly the next day.
const WINDOW_HOURS = 36;

// Send day-before reminders for upcoming, approved appointments that have a
// confirmed time and haven't been reminded yet. Triggered by a daily cron
// (see vercel.json) which authenticates with CRON_SECRET, or manually by an
// authenticated admin.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const fromCron = !!secret && authHeader === `Bearer ${secret}`;
  if (!fromCron && !(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const windowMs = WINDOW_HOURS * 60 * 60 * 1000;
  const list = await getAppointments();

  const due = list.filter((a) => {
    if (a.status !== "approved" || a.remindedAt || !a.appointmentAt) return false;
    const at = new Date(a.appointmentAt).getTime();
    if (isNaN(at)) return false;
    return at > now && at - now <= windowMs;
  });

  const sent: { id: string; to: string; channels: string[] }[] = [];
  for (const appt of due) {
    const result = await notifyReminder(appt);
    const stamp = new Date().toISOString();
    await updateAppointments((l) =>
      l.map((a) => (a.id === appt.id ? { ...a, remindedAt: stamp } : a)),
    );
    sent.push({ id: appt.id, to: result.to, channels: result.channels });
  }

  return Response.json({ ok: true, reminded: sent.length, sent });
}

export const GET = run;
export const POST = run;
