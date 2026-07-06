"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { RX_FIELDS, type EyeTest, type RxEye, type RxTable } from "@/lib/types";
import { inputCls, inputClsFull } from "@/components/admin/adminUi";
import { cn } from "@/lib/cn";

const emptyEye = (): RxEye => ({});
const emptyTable = (): RxTable => ({ od: emptyEye(), os: emptyEye() });

// A fresh, empty record dated today (local calendar date).
function blankDraft(): EyeTest {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    id: "",
    createdAt: "",
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    firstName: "",
    lastName: "",
    idNumber: "",
    previous: emptyTable(),
    current: emptyTable(),
    notes: "",
  };
}

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

export default function TestsPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [items, setItems] = useState<EyeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  // null → list view; a draft (with or without id) → editor view.
  const [draft, setDraft] = useState<EyeTest | null>(null);
  const [showPrevious, setShowPrevious] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<EyeTest | null>(null);

  // File import: upload → parsed candidates preview → confirm.
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{ tests: EyeTest[]; warnings: string[] } | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);

  async function load() {
    const res = await fetch("/api/eye-tests");
    if (res.ok) {
      const data = await res.json();
      setItems(data.tests ?? []);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  // Search by name or ID — the doctor's two lookup keys.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) =>
      `${x.firstName} ${x.lastName} ${x.idNumber}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  function openNew() {
    setShowPrevious(false);
    setDraft(blankDraft());
  }
  function openEdit(test: EyeTest) {
    setShowPrevious(!!test.previous);
    setDraft({ ...blankDraft(), ...test, previous: test.previous ?? emptyTable() });
  }

  const setField = (patch: Partial<EyeTest>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setRx = (table: "previous" | "current", eye: "od" | "os", field: string, value: string) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            [table]: {
              ...(d[table] ?? emptyTable()),
              [eye]: { ...(d[table] ?? emptyTable())[eye], [field]: value },
            },
          }
        : d,
    );

  async function save() {
    if (!draft) return;
    if (!draft.date || !draft.firstName.trim() || !draft.lastName.trim() || !draft.idNumber.trim()) {
      toast.error(t.admin.tests.required);
      return;
    }
    setBusy(true);
    try {
      const body = JSON.stringify({
        date: draft.date,
        firstName: draft.firstName,
        lastName: draft.lastName,
        idNumber: draft.idNumber,
        previous: showPrevious ? draft.previous : undefined,
        current: draft.current,
        notes: draft.notes || undefined,
      });
      const res = draft.id
        ? await fetch(`/api/eye-tests/${draft.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body })
        : await fetch("/api/eye-tests", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(t.admin.tests.saved);
      setDraft(data.test ? { ...blankDraft(), ...data.test, previous: data.test.previous ?? emptyTable() } : null);
      await load();
    } catch {
      toast.error(t.admin.toasts.saveError);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(file: File) {
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/eye-tests/import", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data: { tests: EyeTest[]; warnings: string[] } = await res.json();
      if (!data.tests?.length) {
        toast.error(t.admin.tests.importNone);
        setPreview(data.warnings?.length ? { tests: [], warnings: data.warnings } : null);
        return;
      }
      setPreview(data);
      setPicked(data.tests.map(() => true));
    } catch {
      toast.error(t.admin.tests.importFail);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function commitImport() {
    if (!preview) return;
    const chosen = preview.tests.filter((_, i) => picked[i]);
    if (chosen.length === 0) return;
    setBusy(true);
    let ok = 0;
    for (const rec of chosen) {
      try {
        const res = await fetch("/api/eye-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec),
        });
        if (res.ok) ok++;
      } catch {
        /* count only successes */
      }
    }
    setBusy(false);
    setPreview(null);
    toast.success(`${ok} ${t.admin.tests.importDone}`);
    await load();
  }

  async function remove(test: EyeTest) {
    setBusy(true);
    try {
      const res = await fetch(`/api/eye-tests/${test.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("✓");
      setConfirmDelete(null);
      if (draft?.id === test.id) setDraft(null);
      await load();
    } catch {
      toast.error("!");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.tests.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.tests.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {draft ? (
            <Button variant="secondary" size="sm" onClick={() => setDraft(null)}>← {t.admin.tests.back}</Button>
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".pptx,.xlsx,.xlsm,.csv,.txt,.accdb,.mdb"
                aria-label={t.admin.tests.import}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                }}
              />
              <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={importing}>
                📥 {importing ? t.admin.tests.importing : t.admin.tests.import}
              </Button>
              <Button onClick={openNew}>+ {t.admin.tests.newTest}</Button>
            </>
          )}
        </div>
      </div>

      {/* Import preview — parsed candidates, confirmed by the admin before saving */}
      {preview && !draft && (
        <div className="mt-6 rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">
              {preview.tests.length > 0 && <span className="me-1 rounded-lg bg-brand px-2 py-0.5 text-white">{preview.tests.filter((_, i) => picked[i]).length}/{preview.tests.length}</span>}
              {preview.tests.length > 0 ? t.admin.tests.importFound : t.admin.tests.importNone}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>{t.admin.actions.cancel}</Button>
              {preview.tests.length > 0 && (
                <Button size="sm" onClick={commitImport} disabled={busy || picked.every((p) => !p)}>
                  {busy ? t.admin.saving : `✓ ${t.admin.tests.importAll}`}
                </Button>
              )}
            </div>
          </div>

          {preview.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
              {preview.warnings.slice(0, 8).map((w, i) => (
                <li key={i}>⚠ {w}</li>
              ))}
            </ul>
          )}

          {preview.tests.length > 0 && (
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pe-1">
              {preview.tests.map((x, i) => (
                <label key={i} className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition",
                  picked[i] ? "border-brand-200" : "border-line opacity-50",
                )}>
                  <input
                    type="checkbox"
                    checked={picked[i] ?? false}
                    onChange={(e) => setPicked((arr) => arr.map((v, j) => (j === i ? e.target.checked : v)))}
                    className="size-4 shrink-0"
                  />
                  <span dir="ltr" className="w-20 shrink-0 text-xs font-semibold text-muted">{fmtDate(x.date)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{x.firstName} {x.lastName}</span>
                    <span className="block truncate text-xs text-muted" dir="ltr">
                      {x.idNumber || "—"}
                      {x.current?.od?.sph ? ` · OD ${x.current.od.sph}` : ""}
                      {x.current?.os?.sph ? ` · OS ${x.current.os.sph}` : ""}
                    </span>
                  </span>
                  {x.notes && <span className="hidden max-w-40 truncate text-xs text-muted sm:block">{x.notes}</span>}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {draft ? (
        /* ---- Editor ---- */
        <div className="mt-6 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.date}</span>
              <input type="date" dir="ltr" value={draft.date} onChange={(e) => setField({ date: e.target.value })} className={inputClsFull} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.firstName}</span>
              <input value={draft.firstName} onChange={(e) => setField({ firstName: e.target.value })} className={inputClsFull} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.lastName}</span>
              <input value={draft.lastName} onChange={(e) => setField({ lastName: e.target.value })} className={inputClsFull} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.idNumber}</span>
              <input dir="ltr" inputMode="numeric" value={draft.idNumber} onChange={(e) => setField({ idNumber: e.target.value })} className={inputClsFull} />
            </label>
          </div>

          {/* Previous prescription (optional, collapsed by default) */}
          <div className="rounded-xl border border-line p-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={showPrevious} onChange={(e) => setShowPrevious(e.target.checked)} className="size-4" />
              <span className="text-sm font-bold text-ink">{t.admin.tests.previousRx}</span>
            </label>
            {showPrevious && (
              <div className="mt-3">
                <RxEditor table={draft.previous ?? emptyTable()} onChange={(eye, f, v) => setRx("previous", eye, f, v)} />
              </div>
            )}
          </div>

          {/* Current prescription */}
          <div className="rounded-xl border-2 border-brand-200 bg-brand-50/30 p-4">
            <h3 className="text-sm font-bold text-ink">{t.admin.tests.currentRx}</h3>
            <div className="mt-3">
              <RxEditor table={draft.current} onChange={(eye, f, v) => setRx("current", eye, f, v)} />
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.notes}</span>
            <textarea
              rows={2}
              value={draft.notes ?? ""}
              onChange={(e) => setField({ notes: e.target.value })}
              className={cn(inputClsFull, "h-auto resize-none py-2.5")}
            />
          </label>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            {draft.id && (
              <>
                <a
                  href={`/admin/tests/${draft.id}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-4 text-sm font-semibold text-brand-dark transition hover:border-brand"
                >
                  🖨 {t.admin.tests.print}
                </a>
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(draft)} disabled={busy}>
                  {t.admin.actions.delete}
                </Button>
              </>
            )}
            <Button onClick={save} disabled={busy}>{busy ? t.admin.saving : t.admin.save}</Button>
          </div>
        </div>
      ) : (
        /* ---- List ---- */
        <>
          <div className="mt-6">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.admin.tests.searchHint}
              className={cn(inputCls, "w-full max-w-md")}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-140 text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 text-start">{t.admin.tests.date}</th>
                    <th className="px-4 py-3 text-start">{t.admin.queue.name}</th>
                    <th className="px-4 py-3 text-start">{t.admin.tests.idNumber}</th>
                    <th className="px-4 py-3 text-start">{t.admin.tests.notes}</th>
                    <th className="px-4 py-3 text-end">{t.admin.queue.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loading ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">{t.admin.loading}</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">{t.admin.tests.none}</td></tr>
                  ) : (
                    filtered.map((x) => (
                      <tr key={x.id} className="transition hover:bg-surface/60">
                        <td className="whitespace-nowrap px-4 py-3 text-muted" dir="ltr">{fmtDate(x.date)}</td>
                        <td className="px-4 py-3 font-medium text-ink">{x.firstName} {x.lastName}</td>
                        <td className="whitespace-nowrap px-4 py-3" dir="ltr">{x.idNumber}</td>
                        <td className="max-w-56 truncate px-4 py-3 text-muted">{x.notes || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEdit(x)}
                              className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-100"
                            >
                              ✎ {t.admin.actions.edit}
                            </button>
                            <a
                              href={`/admin/tests/${x.id}/print`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-brand hover:text-brand-dark"
                            >
                              🖨 {t.admin.tests.print}
                            </a>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(x)}
                              className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              🗑
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
        </>
      )}

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t.admin.actions.delete}>
        {confirmDelete && (
          <>
            <p className="text-sm text-muted">
              <strong className="text-ink">{confirmDelete.firstName} {confirmDelete.lastName}</strong>
              {" · "}<span dir="ltr">{confirmDelete.idNumber}</span>{" · "}<span dir="ltr">{fmtDate(confirmDelete.date)}</span>
            </p>
            <p className="mt-2 text-sm text-muted">{t.admin.tests.deleteWarn}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>{t.admin.actions.cancel}</Button>
              <Button variant="danger" disabled={busy} onClick={() => remove(confirmDelete)}>{t.admin.actions.delete}</Button>
            </div>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}

/** The OD/OS × SPH…VA prescription table, always laid out LTR like the paper form. */
function RxEditor({
  table,
  onChange,
}: {
  table: RxTable;
  onChange: (eye: "od" | "os", field: string, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto" dir="ltr">
      <table className="w-full min-w-130 border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10" />
            {RX_FIELDS.map((f) => (
              <th key={f} className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-muted">
                {f === "h" ? "H" : f.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["od", "os"] as const).map((eye) => (
            <tr key={eye}>
              <td className="pe-1 text-sm font-extrabold text-ink">{eye.toUpperCase()}</td>
              {RX_FIELDS.map((f) => (
                <td key={f}>
                  <input
                    value={table[eye][f] ?? ""}
                    onChange={(e) => onChange(eye, f, e.target.value)}
                    aria-label={`${eye.toUpperCase()} ${f.toUpperCase()}`}
                    className="h-10 w-full min-w-14 rounded-lg border border-line bg-white px-1.5 text-center text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
