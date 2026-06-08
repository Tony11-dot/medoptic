import { randomUUID } from "crypto";
import { getProducts, updateProducts } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { Localized, Product } from "@/lib/types";

function localized(v: unknown): Localized {
  const o = (v ?? {}) as Record<string, unknown>;
  return {
    he: String(o.he ?? "").trim(),
    en: String(o.en ?? "").trim(),
    ru: String(o.ru ?? "").trim(),
  };
}

// GET — public product list.
export async function GET() {
  const products = await getProducts();
  return Response.json({ products });
}

// POST — create a product (admin only).
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

  const name = localized(body.name);
  if (!name.he && !name.en && !name.ru) {
    return Response.json({ error: "name is required" }, { status: 422 });
  }

  const product: Product = {
    id: randomUUID(),
    name,
    description: localized(body.description),
    price: Math.max(0, Number(body.price) || 0),
    category: String(body.category ?? "optical"),
    image: String(body.image ?? ""),
    createdAt: new Date().toISOString(),
  };

  await updateProducts((list) => [...list, product]);
  return Response.json({ product }, { status: 201 });
}
