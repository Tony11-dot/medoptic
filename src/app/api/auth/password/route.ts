import { isAuthed, checkPassword, setPassword } from "@/lib/auth";

// POST — change the admin password. Requires an active admin session and the
// current password. Body: { current: string, next: string }
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { current?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const current = String(body.current ?? "");
  const next = String(body.next ?? "");

  if (next.length < 4) {
    return Response.json({ error: "too_short" }, { status: 422 });
  }
  if (!(await checkPassword(current))) {
    return Response.json({ error: "wrong_current" }, { status: 403 });
  }

  await setPassword(next);
  return Response.json({ ok: true });
}
