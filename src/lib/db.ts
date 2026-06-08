// Storage layer. In production it uses Upstash Redis (Vercel KV); locally — when
// no KV env vars are set — it falls back to JSON files so dev keeps working.
// Everything goes through these helpers so the backend stays swappable.
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { AdminSettings, Appointment, Product, Service, SiteContent } from "./types";
import { seedAppointments, seedProducts, seedServices, seedContent } from "./seed";

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

async function read<T>(key: string, fallback: T): Promise<T> {
  if (useRedis) {
    const r = await redis();
    const val = await r.get<T>(key);
    if (val == null) {
      await r.set(key, fallback);
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
    await r.set(key, value);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${key}.json`), JSON.stringify(value, null, 2), "utf8");
}

/** Run a read-modify-write against a key under a per-key lock. */
async function mutate<T>(key: string, fn: (current: T) => T | Promise<T>, fallback: T): Promise<T> {
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

// ---- Admin settings ---------------------------------------------------------

export const getSettings = () => read<AdminSettings>("settings", {});

export const updateSettings = (fn: (s: AdminSettings) => AdminSettings) =>
  mutate<AdminSettings>("settings", fn, {});
