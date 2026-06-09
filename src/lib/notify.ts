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
  return d.toLocaleString("he-IL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildMessage(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const signoff = `לשאלות חייגו ${BUSINESS.phone}.`;
  const when = whenText(appt);

  if (appt.status === "approved") {
    const slot = when
      ? `התור שלך נקבע ל-${when}.`
      : `לבחירת מועד שנוח לך: ${SCHEDULING_URL}`;
    return `${BUSINESS.name}: שלום ${name}, התור שלך אושר. ${slot} ${signoff}`;
  }
  if (appt.status === "declined") {
    const reason = appt.decisionReason ? ` סיבה: ${appt.decisionReason}` : "";
    return `${BUSINESS.name}: שלום ${name}, לא הצלחנו לאשר את התור.${reason} אנא צרו קשר לתיאום מחדש. ${signoff}`;
  }
  return `${BUSINESS.name}: שלום ${name}, קיבלנו את בקשתך. ${signoff}`;
}

function buildReminder(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const slot = when ? ` מחר, ${when}` : " מחר";
  return `${BUSINESS.name}: שלום ${name}, תזכורת לתור שלך${slot}. נתראה בקרוב! לשינוי חייגו ${BUSINESS.phone}.`;
}

// ---- Branded HTML email -----------------------------------------------------

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://medoptic.net";
const BRAND = "#0066CC";

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function emailSubject(appt: Appointment): string {
  if (appt.status === "approved") return `${BUSINESS.name} — התור שלך אושר`;
  if (appt.status === "declined") return `${BUSINESS.name} — לגבי התור שלך`;
  return `${BUSINESS.name} — קיבלנו את בקשתך`;
}

// A branded, email-client-safe HTML shell (tables + inline styles).
function emailShell(lead: string, body: string, button = ""): string {
  return `<!doctype html><html dir="rtl"><body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e6eaef;">
        <tr><td align="center" style="padding:28px 24px 10px;">
          <img src="${SITE_URL}/logo-web.png" alt="MEDOPTIC" width="170" style="display:block;width:170px;max-width:60%;height:auto;" />
        </td></tr>
        <tr><td style="font-size:0;line-height:0;height:4px;background:${BRAND};">&nbsp;</td></tr>
        <tr><td style="padding:28px 32px 4px;">
          <p style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#1a2330;">${lead}</p>
          <p style="margin:0;font-size:16px;line-height:1.6;color:#46505e;">${body}</p>
          ${button ? `<p style="margin:26px 0 6px;">${button}</p>` : ""}
        </td></tr>
        <tr><td style="padding:22px 32px 28px;">
          <hr style="border:none;border-top:1px solid #e6eaef;margin:0 0 16px;" />
          <p style="margin:0;font-size:13px;line-height:1.7;color:#8a94a3;">
            <strong style="color:#1a2330;">${BUSINESS.name}</strong><br/>
            ☎ <a href="tel:${BUSINESS.phone.replace(/\s/g, "")}" style="color:${BRAND};text-decoration:none;">${esc(BUSINESS.phone)}</a><br/>
            ✉ <a href="mailto:${BUSINESS.email}" style="color:${BRAND};text-decoration:none;">${esc(BUSINESS.email)}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buttonHtml(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 30px;border-radius:12px;font-size:16px;">${label}</a>`;
}

function buildEmailHtml(appt: Appointment): string {
  const name = esc(`${appt.firstName} ${appt.lastName}`.trim());
  const when = whenText(appt);
  if (appt.status === "approved") {
    if (when) {
      return emailShell(`שלום ${name}, התור שלך אושר 🎉`, `התור נקבע ל-<strong>${esc(when)}</strong>. נשמח לראותך!`);
    }
    return emailShell(
      `שלום ${name}, התור שלך אושר 🎉`,
      `נותר שלב אחד — בחרו את המועד שנוח לכם ונאשר אותו.`,
      buttonHtml(SCHEDULING_URL, "בחירת מועד"),
    );
  }
  if (appt.status === "declined") {
    const reason = appt.decisionReason ? ` <br/><br/>סיבה: ${esc(appt.decisionReason)}.` : "";
    return emailShell(`שלום ${name},`, `לצערנו לא הצלחנו לאשר את התור.${reason}<br/><br/>אנא צרו קשר ונשמח לתאם מועד חדש.`);
  }
  return emailShell(`שלום ${name},`, `קיבלנו את בקשתכם ונחזור אליכם בהקדם.`);
}

function buildReminderHtml(appt: Appointment): string {
  const name = esc(`${appt.firstName} ${appt.lastName}`.trim());
  const when = whenText(appt);
  const slot = when ? `<strong>מחר, ${esc(when)}</strong>` : "<strong>מחר</strong>";
  return emailShell(`שלום ${name}, תזכורת ידידותית 👋`, `תזכורת לתור שלך ${slot}. נתראה בקרוב!`);
}

// Logs the message until a real provider is wired in at the marked spot.
async function dispatch(
  appt: Appointment,
  message: string,
  email?: { subject: string; html: string },
): Promise<NotifyResult> {
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
      await sendEmail(appt.email, email?.subject ?? `${BUSINESS.name} — appointment update`, message, email?.html);
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

async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<void> {
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
    await transport.sendMail({ from: `${BUSINESS.name} <${user}>`, to, subject, text, html });
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
  return dispatch({ ...appt, reminderChannels: channels }, buildMessage(appt), {
    subject: emailSubject(appt),
    html: buildEmailHtml(appt),
  });
}

/** Send the day-before appointment reminder via the customer's chosen channel. */
export function notifyReminder(appt: Appointment): Promise<NotifyResult> {
  return dispatch(appt, buildReminder(appt), {
    subject: `${BUSINESS.name} — appointment reminder`,
    html: buildReminderHtml(appt),
  });
}
