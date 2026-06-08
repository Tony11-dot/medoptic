// Admin auth. The password can be changed at runtime from the admin panel —
// it's stored (salted + hashed) in the database; until one is set, the
// ADMIN_PASSWORD env var (or its default) is used.
import "server-only";
import { cookies } from "next/headers";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { getSettings, updateSettings } from "./db";

export const SESSION_COOKIE = "medoptic_admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "medoptic24";
const SESSION_TOKEN = process.env.ADMIN_TOKEN ?? "medoptic-session-ok";

function hash(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

/** Verify a password against the stored hash, or the env default if none set. */
export async function checkPassword(password: string): Promise<boolean> {
  const s = await getSettings();
  if (s.passwordSalt && s.passwordHash) {
    const candidate = Buffer.from(hash(password, s.passwordSalt), "hex");
    const stored = Buffer.from(s.passwordHash, "hex");
    return candidate.length === stored.length && timingSafeEqual(candidate, stored);
  }
  return password === ADMIN_PASSWORD;
}

/** Set a new admin password (stored salted + hashed). */
export async function setPassword(next: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const passwordHash = hash(next, salt);
  await updateSettings((cur) => ({ ...cur, passwordSalt: salt, passwordHash }));
}

export function sessionToken(): string {
  return SESSION_TOKEN;
}

/** True when the request carries a valid admin session cookie (async in Next 16). */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === SESSION_TOKEN;
}
