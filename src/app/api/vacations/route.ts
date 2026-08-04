import { getVacations, updateVacations } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { parseVacations } from "@/lib/schedule";

// GET — admin-declared closure ranges. Public: the booking picker reads it to
// grey out closed days, and it contains nothing sensitive.
export async function GET() {
  const vacations = await getVacations();
  return Response.json({ vacations });
}

// PUT — replace the closure ranges (admin only).
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

  const vacations = parseVacations(body);
  if (!vacations) {
    return Response.json({ error: "Invalid vacations" }, { status: 422 });
  }

  const saved = await updateVacations(() => vacations);
  return Response.json({ vacations: saved });
}
