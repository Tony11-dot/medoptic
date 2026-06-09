"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { SiteContent } from "@/lib/types";

// Every reorderable / hideable page section (matches the home page + nav tabs).
const SECTION_IDS = ["home", "gallery", "team", "services", "reviews", "book", "contact"] as const;
type SId = (typeof SECTION_IDS)[number];

export default function SectionsAdmin() {
  const toast = useToast();
  const { t } = useI18n();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/content").then((r) => r.json()).then((d) => setContent(d.content));
  }, []);

  if (!content) {
    return (
      <AdminShell>
        <p className="text-muted">{t.admin.loading}</p>
      </AdminShell>
    );
  }

  // Normalise the saved order to always cover every section.
  const order = (content.sectionOrder ?? []).filter((id) => (SECTION_IDS as readonly string[]).includes(id));
  for (const id of SECTION_IDS) if (!order.includes(id)) order.push(id);
  const hidden = new Set(content.hiddenSections ?? []);

  const update = (patch: Partial<SiteContent>) => setContent((c) => (c ? { ...c, ...patch } : c));
  const move = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    const [m] = next.splice(i, 1);
    next.splice(target, 0, m);
    update({ sectionOrder: next });
  };
  const toggle = (id: string) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    update({ hiddenSections: [...next] });
  };

  async function save() {
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error();
      toast.success("Saved — live on the site");
    } catch {
      toast.error("Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.nav.sections}</h1>
          <p className="mt-1 text-sm text-muted">Show/hide sections and reorder them. This controls both the page and the nav tabs.</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? t.admin.saving : t.admin.save}</Button>
      </div>

      <div className="mt-6 max-w-xl space-y-2">
        {order.map((id, i) => {
          const isHidden = hidden.has(id);
          return (
            <div key={id} className={`flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm ${isHidden ? "opacity-60" : ""}`}>
              <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-dark">#{i + 1}</span>
              <span className="text-sm font-semibold text-ink">{t.nav[id as SId]}</span>
              <div className="ms-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  role="switch"
                  aria-checked={!isHidden}
                  aria-label={isHidden ? "Hidden" : "Shown"}
                  title={isHidden ? "Hidden — tap to show" : "Shown — tap to hide"}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${isHidden ? "bg-line" : "bg-emerald-500"}`}
                >
                  <span className={`inline-block size-4 transform rounded-full bg-white shadow transition ${isHidden ? "translate-x-1" : "translate-x-6"}`} />
                </button>
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid size-8 place-items-center rounded-md border border-line text-muted transition hover:border-brand disabled:opacity-30">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Move down" className="grid size-8 place-items-center rounded-md border border-line text-muted transition hover:border-brand disabled:opacity-30">↓</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 max-w-xl text-xs text-muted">Tip: hiding Booking or Contact removes the booking form / contact details from the site — usually keep those on.</p>
    </AdminShell>
  );
}
