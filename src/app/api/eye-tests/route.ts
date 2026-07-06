import { randomUUID } from "crypto";
import { getEyeTests, updateEyeTests } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import { sanitizeEyeTestInput } from "@/lib/eyeTest";
import type { EyeTest } from "@/lib/types";

// Eye-test records are medical data — every method is admin-only.

// GET — all tests, newest test date first.
export async function GET() {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const list = await getEyeTests();
  list.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return Response.json({ tests: list });
}

// POST — create a test record.
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

  const parsed = sanitizeEyeTestInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 422 });
  }

  const test: EyeTest = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...parsed.value,
  };
  await updateEyeTests((list) => [test, ...list]);
  return Response.json({ test }, { status: 201 });
}
