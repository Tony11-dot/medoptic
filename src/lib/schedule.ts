// The built-in hour system: opening-hours rules -> bookable time slots.
// Pure functions only (no storage, no secrets) so both the API routes and the
// client components can share the same logic. All slot math happens in the
// business timezone regardless of where the server or the visitor is.
import type { Appointment, BookingSettings, OpeningRule, Service, VacationRange } from "./types";

export const BUSINESS_TZ = "Asia/Jerusalem";

/** Fallback when a service has no explicit duration configured. */
export const DEFAULT_DURATION_MINUTES = 15;

/** Customers can't grab a slot that starts sooner than this from "now". */
export const MIN_LEAD_MINUTES = 30;

export const DEFAULT_WINDOW_DAYS = 21;
export const MAX_WINDOW_DAYS = 90;

/** Clamp an admin-entered appointment duration to a sane 5–240 minute range. */
export function parseDurationInput(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(240, Math.max(5, Math.round(n)));
}

export const serviceDuration = (s?: Pick<Service, "durationMinutes"> | null): number => {
  const d = s?.durationMinutes;
  return typeof d === "number" && Number.isFinite(d) && d >= 5 ? Math.round(d) : DEFAULT_DURATION_MINUTES;
};

// ---- Timezone helpers ---------------------------------------------------------

// Intl.DateTimeFormat construction is ~100x the cost of formatting — cache one
// formatter per timezone (a 21-day availability sweep calls this thousands of times).
const tzFormatters = new Map<string, Intl.DateTimeFormat>();
function tzFormatter(tz: string): Intl.DateTimeFormat {
  let fmt = tzFormatters.get(tz);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    tzFormatters.set(tz, fmt);
  }
  return fmt;
}

function tzParts(date: Date, tz: string): Record<string, string> {
  return Object.fromEntries(tzFormatter(tz).formatToParts(date).map((p) => [p.type, p.value]));
}

/** Minutes the zone is ahead of UTC at the given instant. */
function tzOffsetMinutes(date: Date, tz: string): number {
  const p = tzParts(date, tz);
  const hour = p.hour === "24" ? "00" : p.hour; // some ICU versions emit 24:00
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +hour, +p.minute, +p.second);
  return Math.round((asUtc - date.getTime()) / 60_000);
}

/** Convert a wall-clock "YYYY-MM-DD" + "HH:MM" in `tz` to a UTC Date. */
export function zonedToUtc(dateStr: string, time: string, tz = BUSINESS_TZ): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes handle DST boundaries: correct by the offset at the guessed
  // instant, then re-check the offset at the corrected instant.
  let ts = guess - tzOffsetMinutes(new Date(guess), tz) * 60_000;
  ts = guess - tzOffsetMinutes(new Date(ts), tz) * 60_000;
  return new Date(ts);
}

/** The calendar date ("YYYY-MM-DD") of an instant, in the business timezone. */
export function dateStrInTz(date: Date, tz = BUSINESS_TZ): string {
  const p = tzParts(date, tz);
  return `${p.year}-${p.month}-${p.day}`;
}

/** The wall-clock "HH:MM" of an instant, in the business timezone. */
export function timeStrInTz(date: Date, tz = BUSINESS_TZ): string {
  const p = tzParts(date, tz);
  return `${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
}

/** Weekday (0=Sunday … 6=Saturday) of a calendar date — tz-independent. */
export function weekdayOf(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay();
}

/** dateStr + n days, staying in pure calendar arithmetic. */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- Settings validation ------------------------------------------------------

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const timeToMinutes = (t: string): number => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

/** Parse + sanity-check admin-submitted settings. Returns null when invalid. */
export function parseBookingSettings(body: unknown): BookingSettings | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  // 7 days × a few windows each is the realistic ceiling; the cap keeps a
  // hostile payload from inflating every availability computation.
  if (!Array.isArray(b.rules) || b.rules.length > 21) return null;

  const rules: OpeningRule[] = [];
  for (const raw of b.rules) {
    if (typeof raw !== "object" || raw === null) return null;
    const r = raw as Record<string, unknown>;
    const days = Array.isArray(r.days)
      ? Array.from(new Set(r.days.filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6))).sort()
      : [];
    const start = String(r.start ?? "");
    const end = String(r.end ?? "");
    if (days.length === 0) return null;
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) return null;
    if (timeToMinutes(start) >= timeToMinutes(end)) return null;
    rules.push({ id: typeof r.id === "string" && r.id ? r.id.slice(0, 40) : `r-${rules.length}`, days, start, end });
  }

  const rawWindow = Number(b.windowDays);
  const windowDays = Number.isFinite(rawWindow)
    ? Math.min(MAX_WINDOW_DAYS, Math.max(1, Math.round(rawWindow)))
    : DEFAULT_WINDOW_DAYS;

  return { rules, windowDays };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parse + sanity-check admin-submitted vacation ranges. Returns null when invalid. */
export function parseVacations(body: unknown): VacationRange[] | null {
  if (!Array.isArray(body) || body.length > 100) return null;

  const ranges: VacationRange[] = [];
  for (const raw of body) {
    if (typeof raw !== "object" || raw === null) return null;
    const r = raw as Record<string, unknown>;
    const start = String(r.start ?? "");
    const end = String(r.end ?? "");
    if (!DATE_RE.test(start) || !DATE_RE.test(end)) return null;
    if (start > end) return null;
    const note = typeof r.note === "string" ? r.note.slice(0, 200) : undefined;
    ranges.push({
      id: typeof r.id === "string" && r.id ? r.id.slice(0, 40) : `v-${ranges.length}-${Date.now()}`,
      start,
      end,
      note,
      createdAt: typeof r.createdAt === "string" && r.createdAt ? r.createdAt : new Date().toISOString(),
    });
  }
  return ranges;
}

/** True when `dateStr` ("YYYY-MM-DD") falls inside any admin-declared closure. */
export function isVacationDate(dateStr: string, vacations: VacationRange[]): boolean {
  return vacations.some((v) => dateStr >= v.start && dateStr <= v.end);
}

// ---- Slot computation ---------------------------------------------------------

export interface Slot {
  /** Exact start instant, UTC ISO — what gets stored on the appointment. */
  iso: string;
  /** Wall-clock label in the business timezone, e.g. "18:00". */
  label: string;
}

export interface DayAvailability {
  date: string; // "YYYY-MM-DD" in the business tz
  weekday: number; // 0=Sunday … 6=Saturday
  /** True when the shop is open that day (even if every slot is taken). */
  open: boolean;
  slots: Slot[];
}

export interface BusyInterval {
  start: number;
  end: number;
}

export interface BusyOptions {
  /** Appointment id to leave out (when rescheduling that appointment). */
  excludeId?: string;
  /** Resolve a service's configured duration for appointments stored before
   * the per-appointment durationMinutes snapshot existed. */
  durationByService?: (serviceId: string) => number | undefined;
}

/** Appointments that block the grid: anything not declined with a valid time. */
export function busyIntervals(appointments: Appointment[], opts?: BusyOptions): BusyInterval[] {
  const out: BusyInterval[] = [];
  for (const a of appointments) {
    if (a.status === "declined" || !a.appointmentAt) continue;
    if (opts?.excludeId && a.id === opts.excludeId) continue;
    const start = Date.parse(a.appointmentAt);
    if (Number.isNaN(start)) continue;
    const minutes = a.durationMinutes ?? opts?.durationByService?.(a.service) ?? DEFAULT_DURATION_MINUTES;
    out.push({ start, end: start + minutes * 60_000 });
  }
  return out;
}

/** True when a slot starting at `startMs` for `durationMin` hits a busy interval. */
export function overlapsBusy(busy: BusyInterval[], startMs: number, durationMin: number): boolean {
  const end = startMs + durationMin * 60_000;
  return busy.some((b) => startMs < b.end && b.start < end);
}

/** Duration resolver over the current service catalogue (for legacy
 * appointments that predate the durationMinutes snapshot). */
export function durationResolver(services: Service[]): (serviceId: string) => number | undefined {
  const byId = new Map(services.map((s) => [s.id, serviceDuration(s)]));
  return (serviceId) => byId.get(serviceId);
}

/**
 * Compute the bookable slots for one calendar day.
 *
 * Slots are not a fixed grid: within each opening window the walk advances by
 * this service's duration, and whenever a step collides with an existing
 * appointment (of any service/duration) it jumps to that appointment's exact
 * end and chains from there. Mixed durations therefore pack back-to-back with
 * zero dead time — a 45-minute visit ending 10:45 is followed by a 10:45
 * offer for a 15-minute service, not 11:00.
 */
export function daySlots(
  dateStr: string,
  settings: BookingSettings,
  durationMin: number,
  busy: BusyInterval[],
  now: number,
  vacations: VacationRange[] = [],
): DayAvailability {
  const weekday = weekdayOf(dateStr);
  if (isVacationDate(dateStr, vacations)) return { date: dateStr, weekday, open: false, slots: [] };
  const rules = settings.rules.filter((r) => r.days.includes(weekday));
  const durationMs = durationMin * 60_000;
  const earliest = now + MIN_LEAD_MINUTES * 60_000;

  const slots: Slot[] = [];
  const seen = new Set<number>();
  // Slots still reachable time-wise, ignoring bookings. Distinguishes a
  // fully-booked day ("full") from a day that's simply over ("closed").
  let reachable = 0;
  for (const rule of rules) {
    const opens = zonedToUtc(dateStr, rule.start).getTime();
    const closes = zonedToUtc(dateStr, rule.end).getTime();
    for (let s = opens; s + durationMs <= closes; s += durationMs) {
      if (s >= earliest) reachable++;
    }

    // Greedy chaining walk (bounded: steps consume either a duration or a
    // busy interval, both finite; the guard is a hard backstop).
    let t = opens;
    let guard = 0;
    while (t + durationMs <= closes && guard++ < 2000) {
      const blocker = busy.find((b) => t < b.end && b.start < t + durationMs);
      if (blocker) {
        t = blocker.end; // resume exactly where that appointment finishes
        continue;
      }
      if (t >= earliest && !seen.has(t)) {
        seen.add(t);
        const d = new Date(t);
        slots.push({ iso: d.toISOString(), label: timeStrInTz(d) });
      }
      t += durationMs;
    }
  }
  slots.sort((a, b) => a.iso.localeCompare(b.iso));
  return { date: dateStr, weekday, open: reachable > 0, slots };
}

/** Availability for the whole booking window, starting today (business tz). */
export function windowAvailability(
  settings: BookingSettings,
  durationMin: number,
  appointments: Appointment[],
  now = Date.now(),
  busyOpts?: BusyOptions,
  vacations: VacationRange[] = [],
): DayAvailability[] {
  // Past appointments can't collide with future slots — drop them up front so
  // the per-slot scan stays O(bookings in the window), not O(all history).
  const busy = busyIntervals(appointments, busyOpts).filter((b) => b.end >= now);
  const today = dateStrInTz(new Date(now));
  const days: DayAvailability[] = [];
  for (let i = 0; i < settings.windowDays; i++) {
    days.push(daySlots(addDays(today, i), settings, durationMin, busy, now, vacations));
  }
  return days;
}

/**
 * Check that a requested instant is one of the slots the hour system currently
 * offers: inside the booking window and produced by the same chaining walk as
 * the picker, against the same busy intervals. Because slot positions depend
 * on existing bookings, this must run against the live appointment list —
 * call it inside the DB mutation so the check-and-insert stays atomic.
 */
export function isOfferedSlot(
  iso: string,
  settings: BookingSettings,
  durationMin: number,
  busy: BusyInterval[],
  now = Date.now(),
  vacations: VacationRange[] = [],
): boolean {
  const start = Date.parse(iso);
  if (Number.isNaN(start)) return false;
  const dateStr = dateStrInTz(new Date(start));
  const today = dateStrInTz(new Date(now));
  if (dateStr < today || dateStr > addDays(today, settings.windowDays - 1)) return false;
  return daySlots(dateStr, settings, durationMin, busy, now, vacations).slots.some(
    (s) => Date.parse(s.iso) === start,
  );
}

// ---- Footer formatting ---------------------------------------------------------

/**
 * Turn the opening rules into human-readable lines for the footer, e.g.
 * ["Sun–Thu 09:00–19:00", "Fri 09:00–13:00"]. `dayNames` is the 7 localized
 * short day names, Sunday first.
 */
export function formatOpeningLines(rules: OpeningRule[], dayNames: readonly string[]): string[] {
  return rules
    .filter((r) => r.days.length > 0)
    .map((r) => {
      const days = Array.from(new Set(r.days)).sort((a, b) => a - b);
      // Compress consecutive weekdays into ranges: [0,1,2,3,4] -> "Sun–Thu".
      const groups: string[] = [];
      let runStart = days[0];
      let prev = days[0];
      const flush = () => {
        groups.push(runStart === prev ? dayNames[runStart] : `${dayNames[runStart]}–${dayNames[prev]}`);
      };
      for (const d of days.slice(1)) {
        if (d === prev + 1) {
          prev = d;
          continue;
        }
        flush();
        runStart = prev = d;
      }
      flush();
      return `${groups.join(", ")} ${r.start}–${r.end}`;
    });
}
