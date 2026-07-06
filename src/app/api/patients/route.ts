import { randomUUID } from "crypto";
import { getPatients, updatePatients } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { sanitizePatientInput } from "@/lib/patient";
import type { Patient } from "@/lib/types";

// Patient folders hold medical data — every method is admin-only.

// GET — all folders, newest first.
export async function GET() {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getPatients();
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ patients: list });
}

// POST — create a folder, or merge into an existing one with the same ID
// number (so importing / re-adding the same person appends tests instead of
// creating a duplicate folder).
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sanitizePatientInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 422 });
  }

  let result: Patient | undefined;
  const key = parsed.value.idNumber.replace(/\D/g, "");
  await updatePatients((list) => {
    const existing = key ? list.find((p) => p.idNumber.replace(/\D/g, "") === key) : undefined;
    if (existing) {
      // Merge: append the new exams, backfill a missing birth date.
      result = {
        ...existing,
        birthDate: existing.birthDate || parsed.value.birthDate,
        exams: [...existing.exams, ...parsed.value.exams],
      };
      return list.map((p) => (p.id === existing.id ? result! : p));
    }
    result = { id: randomUUID(), createdAt: new Date().toISOString(), ...parsed.value };
    return [result, ...list];
  });

  return Response.json({ patient: result }, { status: 201 });
}
