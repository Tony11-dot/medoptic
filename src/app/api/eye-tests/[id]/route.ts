import { getEyeTests, updateEyeTests } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { sanitizeEyeTestInput } from "@/lib/eyeTest";
import type { EyeTest } from "@/lib/types";

// GET — one test record (used by the printable prescription page).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const test = (await getEyeTests()).find((t) => t.id === id);
  if (!test) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ test });
}

// PUT — replace a test's fields (same validated shape as create).
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
  const parsed = sanitizeEyeTestInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 422 });
  }

  let updated: EyeTest | undefined;
  await updateEyeTests((list) =>
    list.map((t) => {
      if (t.id !== id) return t;
      updated = { ...t, ...parsed.value };
      return updated;
    }),
  );
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ test: updated });
}

// DELETE — remove a test record.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let found = false;
  await updateEyeTests((list) => {
    const next = list.filter((t) => t.id !== id);
    found = next.length !== list.length;
    return next;
  });
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
