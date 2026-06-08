"use client";

import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";

export default function SettingsPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 4) return toast.error(t.admin.settings.tooShort);
    if (next !== confirm) return toast.error(t.admin.settings.mismatch);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current, next }),
      });
      if (res.status === 403) return toast.error(t.admin.settings.wrongCurrent);
      if (res.status === 422) return toast.error(t.admin.settings.tooShort);
      if (!res.ok) throw new Error();
      toast.success(t.admin.settings.saved);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      toast.error("!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <h1 className="text-2xl font-extrabold text-ink">{t.admin.settings.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.admin.settings.subtitle}</p>

      <form onSubmit={submit} className="mt-6 max-w-md space-y-4 rounded-2xl border border-line bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.settings.current}</span>
          <input type="password" dir="ltr" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.settings.newPass}</span>
          <input type="password" dir="ltr" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.settings.confirm}</span>
          <input type="password" dir="ltr" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
        </label>
        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={saving || !current || !next}>
            {saving ? t.admin.saving : t.admin.settings.save}
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}
