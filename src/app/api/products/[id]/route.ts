import { updateProducts } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { Localized, Product } from "@/lib/types";

function localized(v: unknown, fallback: Localized): Localized {
  if (v == null) return fallback;
  const o = v as Record<string, unknown>;
  return {
    he: String(o.he ?? fallback.he).trim(),
    en: String(o.en ?? fallback.en).trim(),
    ru: String(o.ru ?? fallback.ru).trim(),
  };
}

// PATCH — update a product (admin only).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let updated: Product | undefined;
  await updateProducts((list) =>
    list.map((p) => {
      if (p.id !== id) return p;
      updated = {
        ...p,
        name: localized(body.name, p.name),
        description: localized(body.description, p.description),
        price: body.price != null ? Math.max(0, Number(body.price) || 0) : p.price,
        category: body.category != null ? String(body.category) : p.category,
        image: body.image != null ? String(body.image) : p.image,
      };
      return updated;
    }),
  );

  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ product: updated });
}

// DELETE — remove a product (admin only).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let found = false;
  await updateProducts((list) => {
    const next = list.filter((p) => p.id !== id);
    found = next.length !== list.length;
    return next;
  });
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
