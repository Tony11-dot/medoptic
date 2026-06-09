import { randomUUID } from "crypto";
import { updateContent } from "@/lib/db";
import type { Review } from "@/lib/types";

// POST — a visitor submits a review from the site. It's stored unapproved
// (hidden) until an admin approves it in the Content → Reviews tab. Public, but
// guarded by light validation; admins moderate before anything shows.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const author = String(body.author ?? "").trim().slice(0, 80);
  const text = String(body.text ?? "").trim().slice(0, 1000);
  const ratingNum = Number(body.rating);
  const rating = Number.isFinite(ratingNum) ? Math.max(1, Math.min(5, Math.round(ratingNum))) : 5;

  if (!author) return Response.json({ error: "name is required" }, { status: 422 });
  if (text.length < 2) return Response.json({ error: "review text is required" }, { status: 422 });

  const review: Review = {
    id: randomUUID(),
    author,
    text,
    rating,
    source: "manual",
    approved: false,
  };

  await updateContent((c) => ({ ...c, reviews: [...(c.reviews ?? []), review] }));
  return Response.json({ ok: true }, { status: 201 });
}
