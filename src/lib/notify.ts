// Notification layer. SMS goes through sms4free, email through Gmail SMTP
// (providers below); until credentials are set it logs the message
// instead of throwing, so the admin approve/decline flow stays complete.
import "server-only";
import { BUSINESS_TZ } from "./schedule";
import type { Appointment, ReminderChannel } from "./types";

// Business sender identity — the account that messages reach customers from.
// Override in production via env vars; these are the MEDOPTIC defaults.
export const BUSINESS = {
  name: "MEDOPTIC",
  phone: process.env.MEDOPTIC_PHONE ?? "0509652008",
  email: process.env.MEDOPTIC_EMAIL ?? "Medoptic24@gmail.com",
};

// Inboxes that get a heads-up on every appointment event (new booking, cancel,
// reschedule, decline). Follows the business inbox unless a dedicated alerts
// address is configured via MEDOPTIC_ADMIN_EMAIL (comma-separated for more
// than one) — and always includes Samer's inbox regardless of that config, so
// removing/changing the env var can never silently drop him from the loop.
const SAMER_EMAIL = "samernasser24@gmail.com";
function dedupeEmails(emails: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of emails) {
    const e = raw.trim();
    if (!e || seen.has(e.toLowerCase())) continue;
    seen.add(e.toLowerCase());
    out.push(e);
  }
  return out;
}
const ADMIN_EMAIL = dedupeEmails([
  ...(process.env.MEDOPTIC_ADMIN_EMAIL ?? BUSINESS.email).split(","),
  SAMER_EMAIL,
]).join(", ");

interface NotifyResult {
  ok: boolean;
  channels: ("sms" | "email")[];
  to: string;
  preview: string;
}

/** Human-friendly date+time for the confirmed slot, in the business timezone
 * (the server may run in UTC — never format appointment times in server-local). */
function whenText(appt: Appointment): string | null {
  if (!appt.appointmentAt) return null;
  const d = new Date(appt.appointmentAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleString("he-IL", {
    timeZone: BUSINESS_TZ,
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Public self-service links where the customer can cancel or move this booking. */
const cancelUrl = (appt: Appointment) => `${SITE_URL}/cancel/${appt.id}`;
const changeUrl = (appt: Appointment) => `${SITE_URL}/change/${appt.id}`;

/** SMS tail with both self-service links. */
const selfServiceText = (appt: Appointment) =>
  `לשינוי מועד: ${changeUrl(appt)} לביטול: ${cancelUrl(appt)}`;

function buildMessage(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const signoff = `לשאלות חייגו ${BUSINESS.phone}.`;
  const when = whenText(appt);

  if (appt.status === "approved") {
    const slot = when
      ? `התור שלך נקבע ל-${when}.`
      : `התור שלך אושר, נחזור אליך לתיאום מועד.`;
    return `${BUSINESS.name}: שלום ${name}, ${slot} ${signoff} ${selfServiceText(appt)}`;
  }
  if (appt.status === "declined") {
    const reason = appt.decisionReason ? ` סיבה: ${appt.decisionReason}` : "";
    return `${BUSINESS.name}: שלום ${name}, לא הצלחנו לאשר את התור.${reason} אנא צרו קשר לתיאום מחדש. ${signoff}`;
  }
  return `${BUSINESS.name}: שלום ${name}, קיבלנו את בקשתך. ${signoff}`;
}

function buildCancelMessage(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const signoff = `לשאלות חייגו ${BUSINESS.phone}.`;
  const slot = when ? ` ל-${when}` : "";
  return `${BUSINESS.name}: שלום ${name}, התור שלך${slot} בוטל כמבוקש. נשמח לראותך בפעם הבאה! ${signoff}`;
}

function buildRescheduleMessage(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  return `${BUSINESS.name}: שלום ${name}, התור שלך הועבר${when ? ` ל-${when}` : ""}. לשאלות חייגו ${BUSINESS.phone}. ${selfServiceText(appt)}`;
}

function buildReminder(appt: Appointment): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const slot = when ? ` מחר, ${when}` : " מחר";
  return `${BUSINESS.name}: שלום ${name}, תזכורת לתור שלך${slot}. נתראה בקרוב! ${selfServiceText(appt)}`;
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

/** Self-service block under the main email content: a "change date" button,
 * with the cancel link kept understated beside it. */
function cancelLinkHtml(appt: Appointment): string {
  return `<p style="margin:22px 0 0;font-size:14px;color:#46505e;">המועד לא מסתדר? אפשר להחליף אותו בכמה לחיצות:</p>
  <p style="margin:12px 0 0;">${buttonHtml(changeUrl(appt), "🗓 שינוי מועד")}</p>
  <p style="margin:14px 0 0;font-size:13px;color:#8a94a3;">
    או <a href="${cancelUrl(appt)}" style="color:#c2410c;font-weight:bold;text-decoration:underline;">לחצו כאן לביטול התור</a>
  </p>`;
}

function buildEmailHtml(appt: Appointment): string {
  const name = esc(`${appt.firstName} ${appt.lastName}`.trim());
  const when = whenText(appt);
  if (appt.status === "approved") {
    if (when) {
      return emailShell(
        `שלום ${name}, התור שלך אושר 🎉`,
        `התור נקבע ל-<strong>${esc(when)}</strong>. נשמח לראותך!${cancelLinkHtml(appt)}`,
      );
    }
    return emailShell(
      `שלום ${name}, התור שלך אושר 🎉`,
      `נחזור אליכם בהקדם לתיאום המועד שנוח לכם.${cancelLinkHtml(appt)}`,
    );
  }
  if (appt.status === "declined") {
    const reason = appt.decisionReason ? ` <br/><br/>סיבה: ${esc(appt.decisionReason)}.` : "";
    return emailShell(`שלום ${name},`, `לצערנו לא הצלחנו לאשר את התור.${reason}<br/><br/>אנא צרו קשר ונשמח לתאם מועד חדש.`);
  }
  return emailShell(`שלום ${name},`, `קיבלנו את בקשתכם ונחזור אליכם בהקדם.`);
}

function buildCancelEmailHtml(appt: Appointment): string {
  const name = esc(`${appt.firstName} ${appt.lastName}`.trim());
  const when = whenText(appt);
  const slot = when
    ? `התור שנקבע ל-<strong>${esc(when)}</strong> בוטל בהצלחה, כפי שביקשת.`
    : `התור בוטל בהצלחה, כפי שביקשת.`;
  return emailShell(`שלום ${name}, התור בוטל`, `${slot}<br/><br/>מתחשק לקבוע תור חדש? נשמח לראות אותך שוב.`);
}

function buildRescheduleEmailHtml(appt: Appointment): string {
  const name = esc(`${appt.firstName} ${appt.lastName}`.trim());
  const when = whenText(appt);
  const slot = when ? `התור הועבר ל-<strong>${esc(when)}</strong>.` : `התור הועבר.`;
  return emailShell(`שלום ${name}, המועד עודכן 🔁`, `${slot} נשמח לראותך!${cancelLinkHtml(appt)}`);
}

function buildReminderHtml(appt: Appointment): string {
  const name = esc(`${appt.firstName} ${appt.lastName}`.trim());
  const when = whenText(appt);
  const slot = when ? `<strong>מחר, ${esc(when)}</strong>` : "<strong>מחר</strong>";
  return emailShell(`שלום ${name}, תזכורת ידידותית 👋`, `תזכורת לתור שלך ${slot}. נתראה בקרוב!${cancelLinkHtml(appt)}`);
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

// Turn a phone number into Israeli local form, e.g. "+972509652008" -> "0509652008".
function toLocalIL(raw: string): string {
  const n = raw.trim().replace(/[^\d+]/g, "");
  if (n.startsWith("+972")) return `0${n.slice(4)}`;
  if (n.startsWith("972")) return `0${n.slice(3)}`;
  return n;
}

// Sends the customer notification as an SMS through sms4free (Israeli provider,
// a few agorot per message; Hebrew up to ~201 chars is one unit). SMS4FREE_SENDER
// is the sender shown to the customer: the registered phone number on the free
// tier, or an English name like "MEDOPTIC" (≤11 chars) once a package is bought.
// Logs instead of sending until configured, so the admin flow always completes.
async function sendSms(to: string, body: string): Promise<void> {
  const key = process.env.SMS4FREE_KEY;
  const user = process.env.SMS4FREE_USER;
  const pass = process.env.SMS4FREE_PASS;
  const sender = process.env.SMS4FREE_SENDER ?? user;
  if (!key || !user || !pass || !sender) {
    // eslint-disable-next-line no-console
    console.log(`[notify:sms (unconfigured) -> ${to}] ${body}`);
    return;
  }
  try {
    const res = await fetch("https://api.sms4free.co.il/ApiSMS/v2/SendSMS", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ key, user, pass, sender, recipient: toLocalIL(to), msg: body }),
    });
    const text = await res.text();
    // v2 answers {status, message}; older endpoints answer a bare number. >0 = sent.
    let status = Number(text);
    let message = text;
    try {
      const json = JSON.parse(text) as { status?: number; message?: string };
      if (typeof json === "object" && json) {
        status = Number(json.status);
        message = json.message ?? text;
      }
    } catch {}
    if (!res.ok || !(status > 0)) throw new Error(`sms4free status ${status}: ${message}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[notify:sms FAILED -> ${to}]`, e instanceof Error ? e.message : e);
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

/** Notify a customer that their own cancellation went through. Same delivery
 * rule as a decision: always SMS, plus email whenever one was given. */
export function notifyCustomerCancelled(appt: Appointment): Promise<NotifyResult> {
  const channels: ReminderChannel[] = ["sms", ...(appt.email ? (["email"] as const) : [])];
  return dispatch({ ...appt, reminderChannels: channels }, buildCancelMessage(appt), {
    subject: `${BUSINESS.name} — התור בוטל`,
    html: buildCancelEmailHtml(appt),
  });
}

/** Confirm to the customer that their booking moved to a new time. Same delivery
 * rule as a decision: always SMS, plus email whenever one was given. */
export function notifyCustomerRescheduled(appt: Appointment): Promise<NotifyResult> {
  const channels: ReminderChannel[] = ["sms", ...(appt.email ? (["email"] as const) : [])];
  return dispatch({ ...appt, reminderChannels: channels }, buildRescheduleMessage(appt), {
    subject: `${BUSINESS.name} — מועד התור עודכן`,
    html: buildRescheduleEmailHtml(appt),
  });
}

/** Send the day-before appointment reminder via the customer's chosen channel. */
export function notifyReminder(appt: Appointment): Promise<NotifyResult> {
  return dispatch(appt, buildReminder(appt), {
    subject: `${BUSINESS.name} — appointment reminder`,
    html: buildReminderHtml(appt),
  });
}

// ---- Admin "new booking" alert ---------------------------------------------

// One detail row in the admin alert table.
function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#8a94a3;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0 8px 14px;font-size:15px;color:#1a2330;font-weight:bold;">${esc(value) || "—"}</td>
  </tr>`;
}

/** Branded Hebrew HTML alerting the office that a new booking arrived, with a
 * button that opens this exact appointment in the admin queue. */
function buildAdminEmailHtml(appt: Appointment, serviceLabel: string): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const channels = (appt.reminderChannels ?? [])
    .map((c) => (c === "sms" ? "SMS" : "אימייל"))
    .join(", ");
  const duration = appt.durationMinutes ? `${appt.durationMinutes} דקות` : "";
  const rows = [
    detailRow("מועד התור", when ?? ""),
    detailRow("שירות", serviceLabel),
    detailRow("משך", duration),
    detailRow("שם", name),
    detailRow("טלפון", appt.phone),
    detailRow("אימייל", appt.email ?? ""),
    detailRow("הערות", appt.notes ?? ""),
    detailRow("תזכורת", channels),
  ].join("");
  const body = `נקבע תור חדש דרך מערכת התורים באתר. הפרטים:
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e6eaef;">
      ${rows}
    </table>`;
  return emailShell(
    "📥 תור חדש נקבע באתר",
    body,
    buttonHtml(`${SITE_URL}/admin/queue?appt=${encodeURIComponent(appt.id)}`, "פתיחת התור בניהול"),
  );
}

/** Notify the office that a new booking came in. Sent only by email, to the
 * MEDOPTIC inbox. `serviceLabel` is the human-readable (Hebrew) service name. */
export async function notifyAdminNewBooking(appt: Appointment, serviceLabel: string): Promise<void> {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const text = `תור חדש: ${name}, טלפון ${appt.phone}, שירות: ${serviceLabel}${when ? `, מועד: ${when}` : ""}. לניהול: ${SITE_URL}/admin/queue?appt=${encodeURIComponent(appt.id)}`;
  await sendEmail(
    ADMIN_EMAIL,
    `${BUSINESS.name} — תור חדש${when ? ` ל${when}` : ""} · ${name}`,
    text,
    buildAdminEmailHtml(appt, serviceLabel),
  );
}

// ---- Admin "cancelled" / "rescheduled" alerts -------------------------------

/** Who initiated the change — shown in the alert so the office knows whether to
 * expect the customer to re-book, or whether they made the change themselves. */
export type ChangedBy = "customer" | "admin";

function changedByLabel(by: ChangedBy, action: "cancel" | "change" = "cancel"): string {
  if (by === "admin") return "הצוות (מהניהול)";
  return action === "cancel" ? "הלקוח/ה (ביטול עצמי באתר)" : "הלקוח/ה (שינוי עצמי באתר)";
}

/** Branded Hebrew HTML alerting the office that a booking was cancelled. */
function buildAdminCancelHtml(appt: Appointment, serviceLabel: string, cancelledBy: ChangedBy): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const rows = [
    detailRow("מועד שבוטל", when ?? ""),
    detailRow("שירות", serviceLabel),
    detailRow("שם", name),
    detailRow("טלפון", appt.phone),
    detailRow("אימייל", appt.email ?? ""),
    detailRow("בוטל על ידי", changedByLabel(cancelledBy)),
  ].join("");
  const body = `תור בוטל במערכת התורים. הפרטים:
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e6eaef;">
      ${rows}
    </table>`;
  return emailShell("❌ תור בוטל", body);
}

/** Notify the office that a booking was cancelled — by the customer (self-service
 * cancel link) or by the admin (delete from the queue). Email only. */
export async function notifyAdminCancelled(
  appt: Appointment,
  serviceLabel: string,
  cancelledBy: ChangedBy,
): Promise<void> {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const text = `תור בוטל: ${name}, טלפון ${appt.phone}, שירות: ${serviceLabel}${when ? `, מועד שבוטל: ${when}` : ""}. בוטל על ידי: ${changedByLabel(cancelledBy)}.`;
  await sendEmail(
    ADMIN_EMAIL,
    `${BUSINESS.name} — תור בוטל${when ? ` (${when})` : ""} · ${name}`,
    text,
    buildAdminCancelHtml(appt, serviceLabel, cancelledBy),
  );
}

/** Branded Hebrew HTML alerting the office that a booking was moved to a new time. */
function buildAdminRescheduleHtml(
  appt: Appointment,
  serviceLabel: string,
  previousAppointmentAt: string | undefined,
  changedBy: ChangedBy,
): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const prevWhen = previousAppointmentAt ? whenText({ ...appt, appointmentAt: previousAppointmentAt }) : null;
  const when = whenText(appt);
  const rows = [
    detailRow("מועד קודם", prevWhen ?? ""),
    detailRow("מועד חדש", when ?? ""),
    detailRow("שירות", serviceLabel),
    detailRow("שם", name),
    detailRow("טלפון", appt.phone),
    detailRow("אימייל", appt.email ?? ""),
    detailRow("שונה על ידי", changedByLabel(changedBy, "change")),
  ].join("");
  const body = `תור שונה במערכת התורים. הפרטים:
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e6eaef;">
      ${rows}
    </table>`;
  return emailShell(
    "🔁 תור שונה",
    body,
    buttonHtml(`${SITE_URL}/admin/queue?appt=${encodeURIComponent(appt.id)}`, "פתיחת התור בניהול"),
  );
}

/** Notify the office that a booking's time was changed — by the admin (from the
 * queue) or by the customer (self-service change link). Email only. */
export async function notifyAdminRescheduled(
  appt: Appointment,
  serviceLabel: string,
  previousAppointmentAt: string | undefined,
  changedBy: ChangedBy = "admin",
): Promise<void> {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const prevWhen = previousAppointmentAt ? whenText({ ...appt, appointmentAt: previousAppointmentAt }) : null;
  const when = whenText(appt);
  const text = `תור שונה: ${name}, טלפון ${appt.phone}, שירות: ${serviceLabel}${prevWhen ? `, ממועד: ${prevWhen}` : ""}${when ? `, למועד: ${when}` : ""}. שונה על ידי: ${changedByLabel(changedBy, "change")}.`;
  await sendEmail(
    ADMIN_EMAIL,
    `${BUSINESS.name} — תור שונה${when ? ` ל${when}` : ""} · ${name}`,
    text,
    buildAdminRescheduleHtml(appt, serviceLabel, previousAppointmentAt, changedBy),
  );
}

// ---- Admin "declined" alert --------------------------------------------------

/** Branded Hebrew HTML alerting the office that a booking was declined. */
function buildAdminDeclineHtml(appt: Appointment, serviceLabel: string): string {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const rows = [
    detailRow("מועד שבוקש", when ?? ""),
    detailRow("שירות", serviceLabel),
    detailRow("שם", name),
    detailRow("טלפון", appt.phone),
    detailRow("אימייל", appt.email ?? ""),
    detailRow("סיבת דחייה", appt.decisionReason ?? ""),
  ].join("");
  const body = `תור נדחה במערכת התורים. הפרטים:
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;border-top:1px solid #e6eaef;">
      ${rows}
    </table>`;
  return emailShell("🚫 תור נדחה", body);
}

/** Notify the office that a pending appointment was declined from the admin
 * queue. Email only. */
export async function notifyAdminDeclined(appt: Appointment, serviceLabel: string): Promise<void> {
  const name = `${appt.firstName} ${appt.lastName}`.trim();
  const when = whenText(appt);
  const reason = appt.decisionReason ? ` סיבה: ${appt.decisionReason}.` : "";
  const text = `תור נדחה: ${name}, טלפון ${appt.phone}, שירות: ${serviceLabel}${when ? `, מועד שבוקש: ${when}` : ""}.${reason}`;
  await sendEmail(
    ADMIN_EMAIL,
    `${BUSINESS.name} — תור נדחה · ${name}`,
    text,
    buildAdminDeclineHtml(appt, serviceLabel),
  );
}

/** Resolve a service id to its human-readable (Hebrew, falling back to English)
 * label, matching the resolution used at booking time. */
export function resolveServiceLabel(
  services: { id: string; label: { he?: string; en?: string } }[],
  serviceId: string,
): string {
  const service = services.find((s) => s.id === serviceId);
  return service?.label.he || service?.label.en || serviceId;
}
