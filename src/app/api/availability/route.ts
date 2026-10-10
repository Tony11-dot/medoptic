import { getAppointments, getBookingSettings, getServices, getVacations } from "@/lib/db";
import { durationResolver, serviceDuration, windowAvailability, BUSINESS_TZ, DEFAULT_DURATION_MINUTES } from "@/lib/schedule";

// GET /api/availability?service=<id> — the open days & free time slots a
// customer can book for that service (public; drives the slot picker).
// GET /api/availability?appt=<id> — the same grid for moving an existing
// booking (the self-service "change date" page): uses that booking's service
// and duration, and leaves the booking itself out so its own time is free.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const serviceId = params.get("service") ?? "";
  const apptId = params.get("appt") ?? "";

  const [services, settings, appointments, vacations] = await Promise.all([
    getServices(),
    getBookingSettings(),
    getAppointments(),
    getVacations(),
  ]);
  const byService = durationResolver(services);

  let durationMinutes: number;
  if (apptId) {
    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return Response.json({ error: "Not found" }, { status: 404 });
    durationMinutes = appt.durationMinutes ?? byService(appt.service) ?? DEFAULT_DURATION_MINUTES;
  } else {
    const service = services.find((s) => s.id === serviceId && s.enabled);
    if (!service) {
      return Response.json({ error: "Unknown service" }, { status: 422 });
    }
    durationMinutes = serviceDuration(service);
  }

  // durationByService covers appointments stored before the duration snapshot
  // existed, so they block the grid for their real configured length.
  const days = windowAvailability(
    settings,
    durationMinutes,
    appointments,
    Date.now(),
    { durationByService: byService, excludeId: apptId || undefined },
    vacations,
  );

  return Response.json(
    { days, durationMinutes, tz: BUSINESS_TZ },
    // Slots change as people book — keep responses fresh.
    { headers: { "Cache-Control": "no-store" } },
  );
}
