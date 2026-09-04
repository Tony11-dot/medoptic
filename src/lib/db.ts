// Storage layer. In production it uses Upstash Redis (Vercel KV); locally — when
// no KV env vars are set — it falls back to JSON files so dev keeps working.
// Everything goes through these helpers so the backend stays swappable.
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { ActivityLogEntry, AdminSettings, Appointment, BookingSettings, Patient, Product, Service, SiteContent, VacationRange } from "./types";
import { seedAppointments, seedProducts, seedServices, seedContent, seedBookingSettings, seedVacations } from "./seed";

const useRedis = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

type RedisClient = import("@upstash/redis").Redis;
let _redis: RedisClient | null = null;
async function redis(): Promise<RedisClient> {
  if (_redis) return _redis;
  const { Redis } = await import("@upstash/redis");
  _redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
  return _redis;
}

// Local-dev file storage (only used when Redis isn't configured).
const DATA_DIR = process.env.VERCEL ? "/tmp/medoptic-data" : path.join(process.cwd(), "data");

// Serialise writes per-key to avoid lost updates within a single instance.
const locks = new Map<string, Promise<unknown>>();

// Upstash talks over HTTPS, so any call can hit a transient network blip
// (dropped connection, cold edge, brief 5xx). Those are exactly the failures
// that made saves "sometimes work, sometimes not" — so retry them with a short
// backoff before giving up. Deterministic operations only (GET/SET/EVAL-CAS),
// all of which are safe to repeat.
async function withRetry<T>(op: () => Promise<T>, tries = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 80 * (i + 1) + Math.random() * 60));
    }
  }
  throw lastErr;
}

async function read<T>(key: string, fallback: T): Promise<T> {
  if (useRedis) {
    const r = await redis();
    const val = await withRetry(() => r.get<T>(key));
    if (val == null) {
      await withRetry(() => r.set(key, fallback));
      return fallback;
    }
    return val;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = path.join(DATA_DIR, `${key}.json`);
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function write<T>(key: string, value: T): Promise<void> {
  if (useRedis) {
    const r = await redis();
    await withRetry(() => r.set(key, value));
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${key}.json`), JSON.stringify(value, null, 2), "utf8");
}

// Compare-and-set guard for Redis: write the new value only if the version
// counter is unchanged since we read it. This makes read-modify-write safe
// across serverless instances (the in-process lock below can't reach that far —
// without it two concurrent bookings could both pass the slot-conflict check).
const CAS_SCRIPT = `
local v = redis.call('GET', KEYS[2])
if (v == false and ARGV[2] == '0') or v == ARGV[2] then
  redis.call('SET', KEYS[1], ARGV[1])
  redis.call('INCR', KEYS[2])
  return 1
end
return 0`;

async function mutateRedis<T>(key: string, fn: (current: T) => T | Promise<T>, fallback: T): Promise<T> {
  const r = await redis();
  const verKey = `${key}:ver`;
  for (let attempt = 0; attempt < 12; attempt++) {
    // Each read/eval is retried on transient network errors so a single blip
    // doesn't fail the whole save (this is what made saves flaky before).
    const [current, ver] = await Promise.all([
      withRetry(() => r.get<T>(key)),
      withRetry(() => r.get<number>(verKey)),
    ]);
    const updated = await fn(current ?? fallback);
    const ok = await withRetry(() => r.eval(CAS_SCRIPT, [key, verKey], [JSON.stringify(updated), String(ver ?? 0)]));
    if (ok === 1) return updated;
    // Lost the race — back off briefly, then re-read and re-apply fn against
    // the fresh state (jitter de-synchronizes competing writers).
    await new Promise((resolve) => setTimeout(resolve, 20 * (attempt + 1) + Math.random() * 40));
  }
  throw new Error(`mutate(${key}): persistent write contention`);
}

/** Run a read-modify-write atomically (CAS on Redis, per-key lock on files). */
async function mutate<T>(key: string, fn: (current: T) => T | Promise<T>, fallback: T): Promise<T> {
  if (useRedis) return mutateRedis(key, fn, fallback);
  const prev = locks.get(key) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  locks.set(key, prev.then(() => next));
  await prev;
  try {
    const current = await read<T>(key, fallback);
    const updated = await fn(current);
    await write(key, updated);
    return updated;
  } finally {
    release();
  }
}

// ---- Appointments -----------------------------------------------------------

export const getAppointments = () => read<Appointment[]>("appointments", seedAppointments);

export const updateAppointments = (fn: (list: Appointment[]) => Appointment[]) =>
  mutate<Appointment[]>("appointments", fn, seedAppointments);

// ---- Products ---------------------------------------------------------------

export const getProducts = () => read<Product[]>("products", seedProducts);

export const updateProducts = (fn: (list: Product[]) => Product[]) =>
  mutate<Product[]>("products", fn, seedProducts);

// ---- Services (queue types) -------------------------------------------------

export const getServices = () => read<Service[]>("services", seedServices);

export const updateServices = (fn: (list: Service[]) => Service[]) =>
  mutate<Service[]>("services", fn, seedServices);

// ---- Site content -----------------------------------------------------------

export const getContent = () => read<SiteContent>("content", seedContent);

export const updateContent = (fn: (c: SiteContent) => SiteContent) =>
  mutate<SiteContent>("content", fn, seedContent);

// ---- Booking / scheduling settings -------------------------------------------

export const getBookingSettings = () => read<BookingSettings>("bookingSettings", seedBookingSettings);

export const updateBookingSettings = (fn: (s: BookingSettings) => BookingSettings) =>
  mutate<BookingSettings>("bookingSettings", fn, seedBookingSettings);

// ---- Vacation / closure ranges ------------------------------------------------

export const getVacations = () => read<VacationRange[]>("vacations", seedVacations);

export const updateVacations = (fn: (list: VacationRange[]) => VacationRange[]) =>
  mutate<VacationRange[]>("vacations", fn, seedVacations);

// ---- Activity log -------------------------------------------------------------

// Keep the log bounded so storage and per-request reads stay cheap — the
// admin only ever needs recent history, not an unbounded audit trail.
const MAX_ACTIVITY_LOG = 1000;

export const getActivityLog = () => read<ActivityLogEntry[]>("activityLog", []);

/** Append one event to the log (newest first), trimming to the retention cap. */
export const logActivity = (entry: ActivityLogEntry) =>
  mutate<ActivityLogEntry[]>("activityLog", (list) => [entry, ...list].slice(0, MAX_ACTIVITY_LOG), []);

// ---- Patient folders / eye tests ----------------------------------------------

export const getPatients = () => read<Patient[]>("patients", []);

export const updatePatients = (fn: (list: Patient[]) => Patient[]) =>
  mutate<Patient[]>("patients", fn, []);

// ---- Admin settings ---------------------------------------------------------

export const getSettings = () => read<AdminSettings>("settings", {});

export const updateSettings = (fn: (s: AdminSettings) => AdminSettings) =>
  mutate<AdminSettings>("settings", fn, {});
