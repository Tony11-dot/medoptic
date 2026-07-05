import { getBookingSettings, updateBookingSettings } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { parseBookingSettings } from "@/lib/schedule";

// GET — the opening-hours / scheduling settings. Public: the booking picker and
// the footer both render from it, and it contains nothing sensitive.
export async function GET() {
  const settings = await getBookingSettings();
  return Response.json({ settings });
}

// PUT — replace the scheduling settings (admin only).
export async function PUT(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = parseBookingSettings(body);
  if (!settings) {
    return Response.json({ error: "Invalid settings" }, { status: 422 });
  }

  const saved = await updateBookingSettings(() => settings);
  return Response.json({ settings: saved });
}
