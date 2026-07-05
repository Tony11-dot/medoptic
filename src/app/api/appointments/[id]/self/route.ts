import { updateAppointments } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rateLimit";

// POST — customer self-service on their own appointment. No login: the UUID in
// the URL is the capability (returned to them right after booking).
//   { action: "cancel" } → cancel the booking (frees the slot on the hour grid)
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

  return Response.json({ error: "Unknown action" }, { status: 422 });
}
