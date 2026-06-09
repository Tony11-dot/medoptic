import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAuthed } from "@/lib/auth";

// Find the Vercel Blob read-write token. The SDK reads BLOB_READ_WRITE_TOKEN,
// but when a Blob store is connected under a custom name Vercel may expose the
// token under a different variable. Blob tokens always start with
// "vercel_blob_rw_", so fall back to scanning the environment for it and pin it
// to BLOB_READ_WRITE_TOKEN so the SDK picks it up.
function resolveBlobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const value of Object.values(process.env)) {
    if (typeof value === "string" && value.startsWith("vercel_blob_rw_")) {
      process.env.BLOB_READ_WRITE_TOKEN = value;
      return value;
    }
  }
  return undefined;
}

// POST — issues a short-lived token so the browser can upload an image straight
// to Vercel Blob (bypasses the serverless request-size limit, so large phone
// photos work). Returns 501 locally where Blob isn't configured.
export async function POST(request: Request) {
  if (!resolveBlobToken()) {
    return Response.json({ error: "blob_not_configured" }, { status: 501 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAuthed())) throw new Error("Unauthorized");
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed" }, { status: 400 });
  }
}
