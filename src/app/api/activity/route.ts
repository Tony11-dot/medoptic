import { getActivityLog } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

// GET — the admin activity log (booked/cancelled/rescheduled/declined events),
// newest first. Admin only.
export async function GET() {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const activity = await getActivityLog();
  return Response.json({ activity });
}
