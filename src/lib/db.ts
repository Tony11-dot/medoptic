// Tiny JSON-file "database". Good enough for a prototype; swap for a real DB later.
// All access goes through these helpers so the storage layer stays isolated.
import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Appointment, Product, Service, SiteContent } from "./types";
import { seedAppointments, seedProducts, seedServices, seedContent } from "./seed";

// On Vercel the project dir is read-only; only /tmp is writable. Use it there so
// the app runs (data is per-instance until the KV store is connected).
const DATA_DIR = process.env.VERCEL ? "/tmp/medoptic-data" : path.join(process.cwd(), "data");

// Serialise writes per-file to avoid lost updates under concurrent requests.
const locks = new Map<string, Promise<unknown>>();

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readFileOr<T>(name: string, fallback: T): Promise<T> {
  await ensureDir();
  const file = path.join(DATA_DIR, name);
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeFile<T>(name: string, value: T): Promise<void> {
  await ensureDir();
  const file = path.join(DATA_DIR, name);
  await fs.writeFile(file, JSON.stringify(value, null, 2), "utf8");
}

/** Run an update against a file under a per-file lock. */
async function mutate<T>(name: string, fn: (current: T) => T | Promise<T>, fallback: T): Promise<T> {
  const prev = locks.get(name) ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  locks.set(name, prev.then(() => next));
  await prev;
  try {
    const current = await readFileOr<T>(name, fallback);
    const updated = await fn(current);
    await writeFile(name, updated);
    return updated;
  } finally {
    release();
  }
}

// ---- Appointments -----------------------------------------------------------

export const getAppointments = () =>
  readFileOr<Appointment[]>("appointments.json", seedAppointments);

export const updateAppointments = (fn: (list: Appointment[]) => Appointment[]) =>
  mutate<Appointment[]>("appointments.json", fn, seedAppointments);

// ---- Products ---------------------------------------------------------------

export const getProducts = () => readFileOr<Product[]>("products.json", seedProducts);

export const updateProducts = (fn: (list: Product[]) => Product[]) =>
  mutate<Product[]>("products.json", fn, seedProducts);

// ---- Services (queue types) -------------------------------------------------

export const getServices = () => readFileOr<Service[]>("services.json", seedServices);

export const updateServices = (fn: (list: Service[]) => Service[]) =>
  mutate<Service[]>("services.json", fn, seedServices);

// ---- Site content -----------------------------------------------------------

export const getContent = () => readFileOr<SiteContent>("content.json", seedContent);

export const updateContent = (fn: (c: SiteContent) => SiteContent) =>
  mutate<SiteContent>("content.json", fn, seedContent);
