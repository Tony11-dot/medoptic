import { updateServices } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { Localized, Service } from "@/lib/types";

function localized(v: unknown, fallback: Localized): Localized {
  if (v == null) return fallback;
  const o = v as Record<string, unknown>;
  return {
    he: String(o.he ?? fallback.he).trim(),
    en: String(o.en ?? fallback.en).trim(),
    ru: String(o.ru ?? fallback.ru).trim(),
  };
}

// PATCH — update a service (admin only).
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

  let updated: Service | undefined;
  await updateServices((list) =>
    list.map((s) => {
      if (s.id !== id) return s;
      updated = {
        ...s,
        label: localized(body.label, s.label),
        description: localized(body.description, s.description),
        image: typeof body.image === "string" ? body.image : s.image,
        imagePosition: typeof body.imagePosition === "string" ? body.imagePosition : s.imagePosition,
        detailBg: typeof body.detailBg === "string" ? body.detailBg : s.detailBg,
        enabled: body.enabled != null ? Boolean(body.enabled) : s.enabled,
        order: typeof body.order === "number" ? body.order : s.order,
      };
      return updated;
    }),
  );

  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ service: updated });
}

// DELETE — remove a service (admin only). Existing appointments keep their stored
// service id; the queue falls back to showing that id if the label is gone.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  let found = false;
  await updateServices((list) => {
    const next = list.filter((s) => s.id !== id);
    found = next.length !== list.length;
    return next;
  });
  if (!found) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
