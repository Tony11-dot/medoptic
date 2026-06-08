import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { isAuthed } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

// POST — upload an image (admin only). Uses Vercel Blob in production; falls back
// to /public/uploads locally when no blob token is configured.
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: "Unsupported file type" }, { status: 415 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "File too large (max 5MB)" }, { status: 413 });
  }

  const name = `${randomUUID()}.${EXT[file.type]}`;

  // Production: store in Vercel Blob (publicly served via CDN).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${name}`, file, { access: "public" });
    return Response.json({ url: blob.url }, { status: 201 });
  }

  // Local dev fallback: write to /public/uploads.
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOAD_DIR, name), buffer);
  return Response.json({ url: `/uploads/${name}` }, { status: 201 });
}
