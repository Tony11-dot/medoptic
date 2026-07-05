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
  /** Slot start the customer picked on the hour grid (UTC ISO). */
  appointmentAt: string;
  reminderChannels: ReminderChannel[];
  email?: string;
  notes?: string;
}

/** Cap free-text fields so a hostile client can't store unbounded blobs. */
const clip = (s: string, max: number) => s.slice(0, max);

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
  const firstName = clip(String(b.firstName ?? "").trim(), 80);
  const lastName = clip(String(b.lastName ?? "").trim(), 80);
  const phone = clip(String(b.phone ?? "").trim(), 25);
  const service = clip(String(b.service ?? "").trim(), 60);
  const email = b.email ? clip(String(b.email).trim(), 120) : undefined;
  const notes = b.notes ? clip(String(b.notes).trim(), 1000) : undefined;
  const appointmentAtRaw = String(b.appointmentAt ?? "").trim();

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

  // The slot comes from the site's own hour picker; whether it's actually an
  // open, free slot is checked against the schedule in the API route.
  const slot = new Date(appointmentAtRaw);
  if (!appointmentAtRaw || isNaN(slot.getTime()))
    return { ok: false, error: "valid appointmentAt is required" };
  const appointmentAt = slot.toISOString();

  return { ok: true, value: { firstName, lastName, phone, service, appointmentAt, reminderChannels, email, notes } };
}
