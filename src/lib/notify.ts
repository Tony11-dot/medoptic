// Notification layer. The actual WhatsApp/email provider (Twilio, SendGrid, …)
// plugs in where marked below; until credentials are set it logs the message
// instead of throwing, so the admin approve/decline flow stays complete.
import "server-only";
import type { Appointment, ReminderChannel } from "./types";
import { SCHEDULING_URL } from "./config";

// Business sender identity — the account that messages reach customers from.
// Override in production via env vars; these are the MEDOPTIC defaults.
export const BUSINESS = {
  name: "MEDOPTIC",
  phone: process.env.MEDOPTIC_PHONE ?? "0509652008",
  email: process.env.MEDOPTIC_EMAIL ?? "Medoptic24@gmail.com",
};

interface NotifyResult {
  ok: boolean;
  channels: ("sms" | "email")[];
  to: string;
  preview: string;
}

/** Human-friendly date+time for the confirmed slot. */
function whenText(appt: Appointment): string | null {
  if (!appt.appointmentAt) return null;
  const d = new Date(appt.appointmentAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildMessage(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const signoff = `Questions? Call ${BUSINESS.phone}.`;
  const when = whenText(appt);

  if (appt.status === "approved") {
    const slot = when
      ? `Your appointment is confirmed for ${when}.`
      : `Pick your time here: ${SCHEDULING_URL}`;
    return `${BUSINESS.name}: Hi ${name}, your booking is approved. ${slot} ${signoff}`;
  }
  if (appt.status === "declined") {
    const reason = appt.decisionReason ? ` Reason: ${appt.decisionReason}` : "";
    return `${BUSINESS.name}: Hi ${name}, we couldn't confirm this appointment.${reason} Please contact us to reschedule. ${signoff}`;
  }
  return `${BUSINESS.name}: Hi ${name}, we received your request. ${signoff}`;
}

function buildReminder(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const slot = when ? ` tomorrow, ${when}` : " tomorrow";
  return `${BUSINESS.name}: Hi ${name}, a reminder of your appointment${slot}. See you soon! Call ${BUSINESS.phone} to change it.`;
}

// Logs the message until a real provider is wired in at the marked spot.
async function dispatch(appt: Appointment, message: string): Promise<NotifyResult> {
  // Send via each chosen channel (defaults to SMS). Email only if we have one.
  const wanted: ReminderChannel[] = appt.reminderChannels?.length ? appt.reminderChannels : ["sms"];
  const channels: ReminderChannel[] = Array.from(new Set(wanted)).filter(
    (c) => c === "sms" || (c === "email" && !!appt.email),
  );
  if (channels.length === 0) channels.push("sms");

  const recipients: string[] = [];
  for (const ch of channels) {
    if (ch === "sms") {
      recipients.push(appt.phone);
      await sendSms(appt.phone, message);
    } else if (appt.email) {
      recipients.push(appt.email);
      await sendEmail(appt.email, `${BUSINESS.name} — appointment update`, message);
    }
  }

  return { ok: true, channels, to: recipients.join(", "), preview: message };
}

// ---- Providers --------------------------------------------------------------
// Each helper sends for real when its env vars are configured, otherwise logs
// the message (so the admin flow works end-to-end before keys are added).

// Turn a phone number into E.164, e.g. "0509652008" -> "+972509652008".
// Defaults to the Israel country code; override with WHATSAPP_COUNTRY_CODE.
function toE164(raw: string): string {
  let n = raw.trim().replace(/[^\d+]/g, "");
  if (!n.startsWith("+")) {
    const cc = process.env.WHATSAPP_COUNTRY_CODE ?? "972";
    n = `+${cc}${n.startsWith("0") ? n.slice(1) : n}`;
  }
  return n;
}

// Twilio's WhatsApp address form, e.g. "whatsapp:+972509652008".
function toWhatsApp(raw: string): string {
  const v = raw.trim();
  return v.startsWith("whatsapp:") ? v : `whatsapp:${toE164(v)}`;
}

// Sends the customer notification. By default it goes out as a plain SMS from
// TWILIO_FROM (an alphanumeric sender id like "MEDOPTIC", or a Twilio number) —
// this reaches any phone with no opt-in, while the business keeps WhatsApp for
// manual chats. Set NOTIFY_TRANSPORT=whatsapp to deliver over Twilio's WhatsApp
// API instead (needs a WhatsApp-enabled TWILIO_WHATSAPP_FROM). Logs instead of
// sending until Twilio is configured, so the admin flow always completes.
async function sendSms(to: string, body: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const useWhatsApp = process.env.NOTIFY_TRANSPORT === "whatsapp";
  const from = useWhatsApp
    ? process.env.TWILIO_WHATSAPP_FROM ?? process.env.TWILIO_FROM
    : process.env.TWILIO_FROM ?? process.env.TWILIO_WHATSAPP_FROM;
  const label = useWhatsApp ? "whatsapp" : "sms";
  if (!sid || !token || !from) {
    // eslint-disable-next-line no-console
    console.log(`[notify:${label} (unconfigured) -> ${to}] ${body}`);
    return;
  }
  try {
    const { default: twilio } = await import("twilio");
    const params = useWhatsApp
      ? { to: toWhatsApp(to), from: toWhatsApp(from), body }
      : { to: toE164(to), from, body };
    await twilio(sid, token).messages.create(params);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[notify:${label} FAILED -> ${to}]`, e instanceof Error ? e.message : e);
  }
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    // eslint-disable-next-line no-console
    console.log(`[notify:email (unconfigured) -> ${to}] ${text}`);
    return;
  }
  try {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
    await transport.sendMail({ from: `${BUSINESS.name} <${user}>`, to, subject, text });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[notify:email FAILED -> ${to}]`, e instanceof Error ? e.message : e);
  }
}

/** Notify a customer about an approve/decline decision. The confirmation goes to
 * every channel we can reach — always SMS, plus email whenever one was given —
 * regardless of which reminder channels were ticked. */
export function notifyCustomer(appt: Appointment): Promise<NotifyResult> {
  const channels: ReminderChannel[] = ["sms", ...(appt.email ? (["email"] as const) : [])];
  return dispatch({ ...appt, reminderChannels: channels }, buildMessage(appt));
}

/** Send the day-before appointment reminder via the customer's chosen channel. */
export function notifyReminder(appt: Appointment): Promise<NotifyResult> {
  return dispatch(appt, buildReminder(appt));
}
