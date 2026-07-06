// Validation for eye-test / prescription records (shared by create + update).
import { RX_FIELDS, type EyeTest, type RxEye, type RxTable } from "./types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const clip = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

function rxEye(v: unknown): RxEye {
  const o = (v ?? {}) as Record<string, unknown>;
  const eye: RxEye = {};
  for (const f of RX_FIELDS) {
    const val = clip(o[f], 12);
    if (val) eye[f] = val;
  }
  return eye;
}

function rxTable(v: unknown): RxTable {
  const o = (v ?? {}) as Record<string, unknown>;
  return { od: rxEye(o.od), os: rxEye(o.os) };
}

const tableEmpty = (t: RxTable) =>
  RX_FIELDS.every((f) => !t.od[f]) && RX_FIELDS.every((f) => !t.os[f]);

export type EyeTestInput = Omit<EyeTest, "id" | "createdAt">;

export function sanitizeEyeTestInput(
  body: unknown,
): { ok: true; value: EyeTestInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid body" };
  const b = body as Record<string, unknown>;

  const date = clip(b.date, 10);
  const firstName = clip(b.firstName, 80);
  const lastName = clip(b.lastName, 80);
  const idNumber = clip(b.idNumber, 20);
  const birthDate = clip(b.birthDate, 10);
  const notes = clip(b.notes, 2000);

  if (!DATE_RE.test(date)) return { ok: false, error: "valid date is required" };
  if (birthDate && !DATE_RE.test(birthDate)) return { ok: false, error: "invalid birthDate" };
  if (!firstName) return { ok: false, error: "firstName is required" };
  if (!lastName) return { ok: false, error: "lastName is required" };
  if (!idNumber) return { ok: false, error: "idNumber is required" };

  const previous = rxTable(b.previous);
  return {
    ok: true,
    value: {
      date,
      firstName,
      lastName,
      idNumber,
      birthDate: birthDate || undefined,
      previous: tableEmpty(previous) ? undefined : previous,
      current: rxTable(b.current),
      notes: notes || undefined,
    },
  };
}
