import { randomUUID } from "crypto";
import { getServices, updateServices } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { Localized, Service } from "@/lib/types";

function localized(v: unknown): Localized {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    he: String(o.he ?? "").trim(),
    en: String(o.en ?? "").trim(),
    ru: String(o.ru ?? "").trim(),
  };
}

// GET — list services. Public callers (the booking form) only need enabled ones;
// the admin panel passes ?all=1 to also see disabled services.
export async function GET(request: Request) {
  const all = new URL(request.url).searchParams.get("all") === "1";
  const services = (await getServices()).slice().sort((a, b) => a.order - b.order);
  const visible = all ? services : services.filter((s) => s.enabled);
  return Response.json({ services: visible });
}

// POST — create a service (admin only).
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const label = localized(body.label);
  if (!label.he && !label.en && !label.ru) {
    return Response.json({ error: "label is required" }, { status: 422 });
  }

  const current = await getServices();
  const maxOrder = current.reduce((m, s) => Math.max(m, s.order), -1);

  const service: Service = {
    id: randomUUID(),
    label,
    description: localized(body.description),
    image: typeof body.image === "string" ? body.image : "",
    enabled: body.enabled === undefined ? true : Boolean(body.enabled),
    order: typeof body.order === "number" ? body.order : maxOrder + 1,
    createdAt: new Date().toISOString(),
  };

  await updateServices((list) => [...list, service]);
  return Response.json({ service }, { status: 201 });
}
