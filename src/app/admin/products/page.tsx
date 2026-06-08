"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { LocalizedField } from "@/components/admin/LocalizedField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Localized, Product } from "@/lib/types";

const CATEGORIES = ["optical", "sun", "kids", "contact"];

const emptyLocalized = (): Localized => ({ he: "", en: "", ru: "" });

interface Draft {
  id?: string;
  name: Localized;
  description: Localized;
  price: number;
  category: string;
  image: string;
}

const blankDraft = (): Draft => ({
  name: emptyLocalized(),
  description: emptyLocalized(),
  price: 0,
  category: "optical",
  image: "",
});

export default function ProductsAdmin() {
  const toast = useToast();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!draft) return;
    if (!draft.name.he && !draft.name.en && !draft.name.ru) {
      toast.error("Please enter a product name");
      return;
    }
    setSaving(true);
    try {
      const isEdit = !!draft.id;
      const res = await fetch(isEdit ? `/api/products/${draft.id}` : "/api/products", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) throw new Error();
      toast.success(isEdit ? "Product updated" : "Product added");
      setDraft(null);
      await load();
    } catch {
      toast.error("Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Product deleted");
      setConfirmDelete(null);
      await load();
    } catch {
      toast.error("Could not delete product");
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.products}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.titles.productsSub}</p>
        </div>
        <Button onClick={() => setDraft(blankDraft())}>+ {t.admin.actions.add}</Button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">Loading…</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No products yet.</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="transition hover:bg-surface/60">
                    <td className="px-4 py-3">
                      <div className="size-12 overflow-hidden rounded-lg border border-line">
                        <ImageBlock src={p.image} alt={p.name.en || p.name.he} rounded="rounded-none" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{p.name.en || p.name.he || p.name.ru}</td>
                    <td className="px-4 py-3 capitalize text-muted">{p.category}</td>
                    <td className="px-4 py-3">{p.price > 0 ? `₪${p.price}` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setDraft({ ...p })} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-50">
                          Edit
                        </button>
                        <button onClick={() => setConfirmDelete(p)} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor */}
      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? "Edit product" : "Add product"} className="max-w-2xl">
        {draft && (
          <div className="space-y-5">
            <ImageUpload value={draft.image} onChange={(image) => setDraft({ ...draft, image })} />

            <LocalizedField
              label="Name"
              value={draft.name}
              onChange={(name) => setDraft({ ...draft, name })}
            />
            <LocalizedField
              label="Description"
              textarea
              value={draft.description}
              onChange={(description) => setDraft({ ...draft, description })}
            />

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Price (₪)</span>
                <input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand focus:ring-4 focus:ring-brand/10"
                />
                <span className="mt-1 block text-xs text-muted">0 = &quot;ask in store&quot;</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-ink">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="h-10 w-full rounded-xl border border-line bg-white px-3 text-sm capitalize outline-none focus:border-brand"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save product"}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete product">
        <p className="text-sm text-muted">
          Delete <strong className="text-ink">{confirmDelete?.name.en || confirmDelete?.name.he}</strong>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => confirmDelete && remove(confirmDelete)}>Delete</Button>
        </div>
      </Modal>
    </AdminShell>
  );
}
