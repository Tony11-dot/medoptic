import { isAuthed } from "@/lib/auth";
import { importPatientsFile } from "@/lib/importTests";

// Access databases have a large fixed overhead, so the cap is generous.
const MAX_FILE_BYTES = 40 * 1024 * 1024;

// POST — parse an uploaded .pptx / .xlsx / .csv / .accdb into candidate patient
// folders (rows grouped by ID). Nothing is stored: the client previews the
// folders and saves the chosen ones through POST /api/patients (which merges
// by ID).
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const entry = form.get("file");
    if (entry instanceof File) file = entry;
  } catch {
    return Response.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (!file) return Response.json({ error: "file is required" }, { status: 422 });
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "file too large" }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importPatientsFile(file.name, buffer);
    return Response.json(result);
  } catch {
    return Response.json({ error: "could not parse file" }, { status: 422 });
  }
}
