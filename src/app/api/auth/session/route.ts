import { isAuthed } from "@/lib/auth";

// GET — report whether the current request has an admin session.
export async function GET() {
  return Response.json({ authed: await isAuthed() });
}
