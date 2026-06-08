// Placeholder admin auth. Real auth (NextAuth, JWT, a user table) can replace
// this later — the rest of the app only depends on `isAuthed()` / cookie name.
import "server-only";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "medoptic_admin";
// In a real deployment set ADMIN_PASSWORD / ADMIN_TOKEN via env vars.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "medoptic";
const SESSION_TOKEN = process.env.ADMIN_TOKEN ?? "medoptic-session-ok";

export function checkPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function sessionToken(): string {
  return SESSION_TOKEN;
}

/** True when the request carries a valid admin session cookie (async in Next 16). */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}
