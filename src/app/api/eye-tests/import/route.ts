import { isAuthed } from "@/lib/auth";
import { importTestsFile } from "@/lib/importTests";

// Files can carry hundreds of records; cap the upload itself. Access
// databases have a large fixed overhead, so the cap is generous.
const MAX_FILE_BYTES = 40 * 1024 * 1024;

// POST — parse an uploaded .pptx / .xlsx / .csv into candidate test records.
// Nothing is stored here: the client shows a preview and saves each confirmed
// record through the regular validated create endpoint.
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
    const result = await importTestsFile(file.name, buffer);
    return Response.json(result);
  } catch {
    return Response.json({ error: "could not parse file" }, { status: 422 });
  }
}
