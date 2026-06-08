// Public app config — safe to import on the client and the server.

/**
 * Google Calendar appointment-scheduling page where customers pick their slot.
 * Override per deployment with NEXT_PUBLIC_SCHEDULING_URL.
 */
export const SCHEDULING_URL =
  process.env.NEXT_PUBLIC_SCHEDULING_URL ??
  "https://calendar.app.google/GK6fEwVgSRUEnQHL7";

/**
 * Scheduling URL with the customer's details appended as query params, so the
 * Google Calendar booking page can pre-fill them. Google honours these on a
 * best-effort basis depending on the booking page's settings.
 */
export function schedulingUrl(prefill?: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
}): string {
  if (!prefill) return SCHEDULING_URL;
  const p = new URLSearchParams();
  const name = `${prefill.firstName ?? ""} ${prefill.lastName ?? ""}`.trim();
  if (name) p.set("name", name);
  if (prefill.firstName) p.set("firstName", prefill.firstName);
  if (prefill.lastName) p.set("lastName", prefill.lastName);
  if (prefill.email) p.set("email", prefill.email);
  if (prefill.phone) p.set("phone", prefill.phone);
  if (prefill.notes) p.set("notes", prefill.notes);
  const q = p.toString();
  return q ? `${SCHEDULING_URL}?${q}` : SCHEDULING_URL;
}
