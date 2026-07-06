import { getPatients, updatePatients } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { sanitizePatientInput } from "@/lib/patient";
import type { Patient } from "@/lib/types";

// GET — one folder (used by the printable prescription page).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const patient = (await getPatients()).find((p) => p.id === id);
  if (!patient) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ patient });
}

// PUT — replace a folder's fields (identity + full exams list).
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
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

  let updated: Patient | undefined;
  await updatePatients((list) =>
    list.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...parsed.value };
      return updated;
    }),
  );
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ patient: updated });
}

// DELETE — remove a folder and all its tests.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let found = false;
  await updatePatients((list) => {
    const next = list.filter((p) => p.id !== id);
    found = next.length !== list.length;
    return next;
  });
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
