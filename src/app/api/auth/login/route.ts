import { cookies } from "next/headers";
import { SESSION_COOKIE, checkPassword, sessionToken } from "@/lib/auth";

// POST — exchange a password for an admin session cookie.
export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!(await checkPassword(String(body.password ?? "")))) {
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });

  return Response.json({ ok: true });
}
