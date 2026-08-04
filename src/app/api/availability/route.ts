import { getAppointments, getBookingSettings, getServices, getVacations } from "@/lib/db";
import { durationResolver, serviceDuration, windowAvailability, BUSINESS_TZ } from "@/lib/schedule";

// GET /api/availability?service=<id> — the open days & free time slots a
// customer can book for that service (public; drives the slot picker).
export async function GET(request: Request) {
  const serviceId = new URL(request.url).searchParams.get("service") ?? "";
  const services = await getServices();
  const service = services.find((s) => s.id === serviceId && s.enabled);
  if (!service) {
    return Response.json({ error: "Unknown service" }, { status: 422 });
  }

  const [settings, appointments, vacations] = await Promise.all([
    getBookingSettings(),
    getAppointments(),
    getVacations(),
  ]);
  const durationMinutes = serviceDuration(service);
  // durationByService covers appointments stored before the duration snapshot
  // existed, so they block the grid for their real configured length.
  const days = windowAvailability(
    settings,
    durationMinutes,
    appointments,
    Date.now(),
    { durationByService: durationResolver(services) },
    vacations,
  );

  return Response.json(
    { days, durationMinutes, tz: BUSINESS_TZ },
    // Slots change as people book — keep responses fresh.
    { headers: { "Cache-Control": "no-store" } },
  );
}
