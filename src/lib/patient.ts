// Validation + helpers for patient folders and their eye tests (shared by the
// create/update API and the importer).
import { randomUUID } from "crypto";
import { RX_FIELDS, type EyeExam, type Patient, type RxEye, type RxResult, type RxTable } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const today = () => new Date().toISOString().slice(0, 10);

export function rxEye(v: unknown): RxEye {
  const o = (v ?? {}) as Record<string, unknown>;
  const eye: RxEye = {};
  for (const f of RX_FIELDS) {
    const val = clip(o[f], 12);
    if (val) eye[f] = val;
  }
  return eye;
}

export function rxTable(v: unknown): RxTable {
  const o = (v ?? {}) as Record<string, unknown>;
  return { od: rxEye(o.od), os: rxEye(o.os) };
}

export const eyeEmpty = (e: RxEye) => RX_FIELDS.every((f) => !e[f]);
export const tableEmpty = (t: RxTable) => eyeEmpty(t.od) && eyeEmpty(t.os);
export const emptyTable = (): RxTable => ({ od: {}, os: {} });

function sanitizeResult(v: unknown): RxResult {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    id: typeof o.id === "string" && o.id ? o.id.slice(0, 40) : randomUUID(),
    label: o.label ? clip(o.label, 60) : undefined,
    table: rxTable(o.table),
  };
}

function sanitizeExam(v: unknown): EyeExam {
  const o = (v ?? {}) as Record<string, unknown>;
  const date = clip(o.date, 10);
  const rawResults = Array.isArray(o.results) ? o.results : [];
  const results = rawResults.map(sanitizeResult).slice(0, 20);
  return {
    id: typeof o.id === "string" && o.id ? o.id.slice(0, 40) : randomUUID(),
    name: o.name ? clip(o.name, 60) : undefined,
    date: DATE_RE.test(date) ? date : today(),
    createdAt: typeof o.createdAt === "string" && o.createdAt ? o.createdAt : new Date().toISOString(),
    results: results.length ? results : [{ id: randomUUID(), table: emptyTable() }],
    notes: o.notes ? clip(o.notes, 2000) : undefined,
  };
}

export type PatientInput = Omit<Patient, "id" | "createdAt">;

export function sanitizePatientInput(
  body: unknown,
): { ok: true; value: PatientInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  const firstName = clip(b.firstName, 80);
  const lastName = clip(b.lastName, 80);
  const idNumber = clip(b.idNumber, 20);
  const birthDate = clip(b.birthDate, 10);

  if (!firstName) return { ok: false, error: "firstName is required" };
  if (!lastName) return { ok: false, error: "lastName is required" };
  if (!idNumber) return { ok: false, error: "idNumber is required" };
  if (birthDate && !DATE_RE.test(birthDate)) return { ok: false, error: "invalid birthDate" };

  const exams = Array.isArray(b.exams) ? b.exams.map(sanitizeExam).slice(0, 200) : [];
  return {
    ok: true,
    value: { firstName, lastName, idNumber, birthDate: birthDate || undefined, exams },
  };
}

/** Merge freshly-imported exams into an existing patient folder (same ID). */
export function mergeExams(existing: Patient, incoming: EyeExam[]): Patient {
  return { ...existing, exams: [...existing.exams, ...incoming] };
}
