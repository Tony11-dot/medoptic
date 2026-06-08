// Lightweight validators shared by the booking form and the API.

// Accepts Israeli & international formats: digits, spaces, dashes, leading +.
const PHONE_RE = /^\+?[\d\s-]{7,18}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidPhone = (v: string) => PHONE_RE.test(v.trim());
export const isValidEmail = (v: string) => EMAIL_RE.test(v.trim());

import type { ReminderChannel } from "./types";

export interface AppointmentInput {
  firstName: string;
  lastName: string;
  phone: string;
  service: string;
  reminderChannels: ReminderChannel[];
  email?: string;
  notes?: string;
}

/**
 * Validate a booking submission. `validServiceIds` is the set of currently
 * bookable service ids (managed by admins) the chosen service must belong to.
 */
export function validateAppointment(
  body: unknown,
  validServiceIds: string[],
): { ok: true; value: AppointmentInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;
  const firstName = String(b.firstName ?? "").trim();
  const lastName = String(b.lastName ?? "").trim();
  const phone = String(b.phone ?? "").trim();
  const service = String(b.service ?? "").trim();
  const email = b.email ? String(b.email).trim() : undefined;
  const notes = b.notes ? String(b.notes).trim() : undefined;

  // Reminder channels: accept an array (multi-select). Email needs an email
  // address; if it's missing we drop email and keep SMS.
  const raw = Array.isArray(b.reminderChannels) ? b.reminderChannels : [];
  let reminderChannels = (["sms", "email"] as ReminderChannel[]).filter((c) => raw.includes(c));
  if (!email) reminderChannels = reminderChannels.filter((c) => c !== "email");
  if (reminderChannels.length === 0) reminderChannels = ["sms"];

  if (!firstName) return { ok: false, error: "firstName is required" };
  if (!lastName) return { ok: false, error: "lastName is required" };
  if (!isValidPhone(phone)) return { ok: false, error: "valid phone is required" };
  if (!service || !validServiceIds.includes(service))
    return { ok: false, error: "valid service is required" };
  if (email && !isValidEmail(email)) return { ok: false, error: "invalid email" };

  return { ok: true, value: { firstName, lastName, phone, service, reminderChannels, email, notes } };
}
