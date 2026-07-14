"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { RX_FIELDS, type EyeExam, type Patient, type RxResult, type RxTable } from "@/lib/types";
import { inputCls, inputClsFull } from "@/components/admin/adminUi";
import { DateField } from "@/components/ui/DatePicker";
import { BulkBar, BulkCheckbox, bulkDelete, useBulkSelect } from "@/components/admin/BulkSelect";
import { cn } from "@/lib/cn";

const emptyTable = (): RxTable => ({ od: {}, os: {} });
const newResult = (): RxResult => ({ id: rid(), table: emptyTable() });
const rid = () => `x-${Math.random().toString(36).slice(2, 10)}`;

const todayStr = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const newExam = (): EyeExam => ({
  id: rid(),
  date: todayStr(),
  createdAt: new Date().toISOString(),
  results: [newResult()],
});

function blankFolder(): Patient {
  return { id: "", createdAt: "", firstName: "", lastName: "", idNumber: "", birthDate: "", exams: [] };
}

const fmtDate = (d: string) => {
  const [y, m, day] = (d ?? "").split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

export default function TestsPage() {
  const toast = useToast();
  const { t } = useI18n();
  const [items, setItems] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  // null → folder list; a folder (working copy) → folder view.
  const [folder, setFolder] = useState<Patient | null>(null);
  const [openExam, setOpenExam] = useState<string | null>(null); // expanded exam id
  const [printSel, setPrintSel] = useState<Set<string>>(new Set()); // tests ticked for printing
  const [confirmDelete, setConfirmDelete] = useState<Patient | null>(null);

  // Reset the print selection whenever a different folder is opened/closed.
  const folderId = folder?.id ?? null;
  useEffect(() => { setPrintSel(new Set()); }, [folderId]);
  const togglePrint = (examId: string) =>
    setPrintSel((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  const printUrl = (ids?: string[]) =>
    folder ? `/admin/tests/${folder.id}/print${ids && ids.length ? `?exams=${ids.join(",")}` : ""}` : "#";

  // File import: upload → parsed folders preview → confirm.
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<{ patients: Patient[]; warnings: string[] } | null>(null);
  const [picked, setPicked] = useState<boolean[]>([]);

  async function load() {
    const res = await fetch("/api/patients");
    if (res.ok) setItems((await res.json()).patients ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) => `${p.firstName} ${p.lastName} ${p.idNumber}`.toLowerCase().includes(q));
  }, [items, query]);

  const bulk = useBulkSelect(filtered);
  async function bulkRemove() {
    setBusy(true);
    const ok = await bulkDelete("/api/patients", [...bulk.selected]);
    setBusy(false);
    bulk.clear();
    toast.success(`${ok} ${t.admin.bulk.deleted}`);
    await load();
  }

  // ---- Folder editing (working copy) ----
  const setF = (patch: Partial<Patient>) => setFolder((f) => (f ? { ...f, ...patch } : f));
  const updateExam = (id: string, patch: Partial<EyeExam>) =>
    setFolder((f) => (f ? { ...f, exams: f.exams.map((e) => (e.id === id ? { ...e, ...patch } : e)) } : f));
  const addExam = () => {
    const e = newExam();
    setFolder((f) => (f ? { ...f, exams: [...f.exams, e] } : f));
    setOpenExam(e.id);
  };
  const removeExam = (id: string) =>
    setFolder((f) => (f ? { ...f, exams: f.exams.filter((e) => e.id !== id) } : f));
  const setResult = (examId: string, resultId: string, table: RxTable) =>
    updateExamResults(examId, (rs) => rs.map((r) => (r.id === resultId ? { ...r, table } : r)));
  const setResultLabel = (examId: string, resultId: string, label: string) =>
    updateExamResults(examId, (rs) => rs.map((r) => (r.id === resultId ? { ...r, label } : r)));
  const addResult = (examId: string) => updateExamResults(examId, (rs) => [...rs, newResult()]);
  const removeResult = (examId: string, resultId: string) =>
    updateExamResults(examId, (rs) => (rs.length > 1 ? rs.filter((r) => r.id !== resultId) : rs));
  function updateExamResults(examId: string, fn: (rs: RxResult[]) => RxResult[]) {
    setFolder((f) =>
      f ? { ...f, exams: f.exams.map((e) => (e.id === examId ? { ...e, results: fn(e.results) } : e)) } : f,
    );
  }

  async function saveFolder(): Promise<Patient | null> {
    if (!folder) return null;
    if (!folder.firstName.trim() || !folder.lastName.trim() || !folder.idNumber.trim()) {
      toast.error(t.admin.tests.required);
      return null;
    }
    setBusy(true);
    try {
      const body = JSON.stringify({
        firstName: folder.firstName,
        lastName: folder.lastName,
        idNumber: folder.idNumber,
        birthDate: folder.birthDate || undefined,
        exams: folder.exams,
      });
      const url = folder.id ? `/api/patients/${folder.id}` : "/api/patients";
      const method = folder.id ? "PUT" : "POST";
      // Retry through transient hiccups (network blip, brief 5xx) so a save
      // that used to fail intermittently now goes through. A 4xx (validation /
      // auth) is a real rejection — don't retry those.
      let res: Response | null = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
          if (res.ok || (res.status >= 400 && res.status < 500)) break;
        } catch {
          res = null; // network error — fall through to backoff + retry
        }
        if (attempt < 3) await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
      }
      if (!res || !res.ok) throw new Error();
      const saved: Patient = (await res.json()).patient;
      setFolder(saved);
      toast.success(t.admin.tests.saved);
      await load();
      return saved;
    } catch {
      toast.error(t.admin.toasts.saveError);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function removeFolder(p: Patient) {
    setBusy(true);
    try {
      const res = await fetch(`/api/patients/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("✓");
      setConfirmDelete(null);
      if (folder?.id === p.id) setFolder(null);
      await load();
    } catch {
      toast.error("!");
    } finally {
      setBusy(false);
    }
  }

  // ---- Import ----
  async function uploadFile(file: File) {
    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/patients/import", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      const data: { patients: Patient[]; warnings: string[] } = await res.json();
      if (!data.patients?.length) {
        toast.error(t.admin.tests.importNone);
        setPreview(data.warnings?.length ? { patients: [], warnings: data.warnings } : null);
        return;
      }
      setPreview(data);
      setPicked(data.patients.map(() => true));
    } catch {
      toast.error(t.admin.tests.importFail);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function commitImport() {
    if (!preview) return;
    const chosen = preview.patients.filter((_, i) => picked[i]);
    if (!chosen.length) return;
    setBusy(true);
    let ok = 0;
    for (const p of chosen) {
      try {
        const res = await fetch("/api/patients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: p.firstName, lastName: p.lastName, idNumber: p.idNumber, birthDate: p.birthDate, exams: p.exams }),
        });
        if (res.ok) ok++;
      } catch { /* count only successes */ }
    }
    setBusy(false);
    setPreview(null);
    toast.success(`${ok} ${t.admin.tests.importDone}`);
    await load();
  }

  const examName = (e: EyeExam, i: number) => e.name?.trim() || `${t.admin.tests.testWord} ${i + 1}`;

  // ============================= FOLDER VIEW =============================
  if (folder) {
    return (
      <AdminShell>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">
              {folder.firstName || folder.lastName ? `${folder.firstName} ${folder.lastName}` : t.admin.tests.newFolder}
            </h1>
            <p className="mt-1 text-sm text-muted">{t.admin.tests.folder}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setFolder(null); setOpenExam(null); }}>← {t.admin.tests.back}</Button>
            <Button onClick={saveFolder} disabled={busy}>{busy ? t.admin.saving : t.admin.tests.saveFolder}</Button>
          </div>
        </div>

        {/* Patient identity */}
        <div className="mt-6 grid gap-4 rounded-2xl border border-line bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.firstName}</span>
            <input value={folder.firstName} onChange={(e) => setF({ firstName: e.target.value })} className={inputClsFull} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.lastName}</span>
            <input value={folder.lastName} onChange={(e) => setF({ lastName: e.target.value })} className={inputClsFull} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.idNumber}</span>
            <input dir="ltr" inputMode="numeric" value={folder.idNumber} onChange={(e) => setF({ idNumber: e.target.value })} className={inputClsFull} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.birthDate}</span>
            <DateField value={folder.birthDate ?? ""} onChange={(v) => setF({ birthDate: v })} ariaLabel={t.admin.tests.birthDate} />
          </label>
        </div>

        {/* Tests */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-ink">{t.admin.tests.examsTitle}</h2>
          <div className="flex items-center gap-2">
            {folder.id && folder.exams.length > 0 && (
              <a
                href={printUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-brand-dark transition hover:border-brand"
              >
                🖨 {t.admin.tests.printAll}
              </a>
            )}
            <Button size="sm" variant="subtle" onClick={addExam}>+ {t.admin.tests.addTest}</Button>
          </div>
        </div>

        {/* Print-selected bar */}
        {printSel.size > 0 && folder.id && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-200 bg-brand-50/60 px-4 py-2.5">
            <p className="text-sm font-bold text-brand-dark">
              <span className="me-1.5 rounded-lg bg-brand px-2 py-0.5 text-white">{printSel.size}</span>
              {t.admin.bulk.selected}
            </p>
            <a
              href={printUrl(folder.exams.filter((e) => printSel.has(e.id)).map((e) => e.id))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              🖨 {t.admin.tests.printSelected}
            </a>
          </div>
        )}

        {folder.exams.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed border-line bg-surface/50 px-4 py-6 text-center text-sm text-muted">{t.admin.tests.noExams}</p>
        )}

        <div className="mt-3 space-y-3">
          {folder.exams.map((exam, i) => {
            const open = openExam === exam.id;
            return (
              <div key={exam.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
                <div className="flex items-center gap-2 px-4 py-3">
                  {folder.id && (
                    <input
                      type="checkbox"
                      checked={printSel.has(exam.id)}
                      onChange={() => togglePrint(exam.id)}
                      aria-label={`${t.admin.tests.printSelected} — ${examName(exam, i)}`}
                      title={t.admin.tests.printSelected}
                      className="size-4 shrink-0 cursor-pointer accent-[#0066CC]"
                    />
                  )}
                  <button type="button" onClick={() => setOpenExam(open ? null : exam.id)} className="flex flex-1 items-center gap-3 text-start">
                    <span className="grid size-8 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-dark">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-bold text-ink">{examName(exam, i)}</span>
                      <span className="block text-xs text-muted" dir="ltr">{fmtDate(exam.date)} · {exam.results.length} {t.admin.tests.results}</span>
                    </span>
                  </button>
                  {folder.id && (
                    <a
                      href={printUrl([exam.id])}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-ink/70 transition hover:border-brand hover:text-brand-dark"
                    >
                      🖨 {t.admin.tests.print}
                    </a>
                  )}
                  <button type="button" onClick={() => removeExam(exam.id)} aria-label={t.admin.actions.delete} className="grid size-8 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100">🗑</button>
                  <button type="button" onClick={() => setOpenExam(open ? null : exam.id)} aria-label="toggle" className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface">{open ? "▲" : "▼"}</button>
                </div>

                {open && (
                  <div className="space-y-4 border-t border-line px-4 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.testDate}</span>
                        <DateField value={exam.date} onChange={(v) => updateExam(exam.id, { date: v })} ariaLabel={t.admin.tests.testDate} />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.testName}</span>
                        <input value={exam.name ?? ""} placeholder={examName(exam, i)} onChange={(e) => updateExam(exam.id, { name: e.target.value })} className={inputClsFull} />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">{t.admin.tests.results}</span>
                        <Button size="sm" variant="subtle" onClick={() => addResult(exam.id)}>+ {t.admin.tests.addResult}</Button>
                      </div>
                      {exam.results.map((r, ri) => (
                        <div key={r.id} className="rounded-xl border-2 border-brand-200 bg-brand-50/30 p-3">
                          <div className="mb-2 flex items-center gap-2">
                            <input
                              value={r.label ?? ""}
                              placeholder={`${t.admin.tests.resultLabel} · #${ri + 1}`}
                              onChange={(e) => setResultLabel(exam.id, r.id, e.target.value)}
                              className={cn(inputCls, "h-9 flex-1")}
                            />
                            {exam.results.length > 1 && (
                              <button type="button" onClick={() => removeResult(exam.id, r.id)} aria-label={t.admin.actions.delete} className="grid size-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100">✕</button>
                            )}
                          </div>
                          <RxEditor table={r.table} onChange={(table) => setResult(exam.id, r.id, table)} />
                        </div>
                      ))}
                    </div>

                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.tests.notes}</span>
                      <textarea rows={2} value={exam.notes ?? ""} onChange={(e) => updateExam(exam.id, { notes: e.target.value })} className={cn(inputClsFull, "h-auto resize-none py-2.5")} />
                    </label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {!folder.id && folder.exams.length > 0 && (
          <p className="mt-3 text-center text-xs text-muted">💡 {t.admin.tests.saveFirst}</p>
        )}
      </AdminShell>
    );
  }

  // ============================= LIST VIEW =============================
  return (
    <AdminShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">{t.admin.tests.title}</h1>
          <p className="mt-1 text-sm text-muted">{t.admin.tests.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".pptx,.xlsx,.xlsm,.csv,.txt,.accdb,.mdb"
            aria-label={t.admin.tests.import}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={importing}>
            📥 {importing ? t.admin.tests.importing : t.admin.tests.import}
          </Button>
          <Button onClick={() => { setFolder(blankFolder()); setOpenExam(null); }}>+ {t.admin.tests.newFolder}</Button>
        </div>
      </div>

      {/* Import preview */}
      {preview && (
        <div className="mt-6 rounded-2xl border-2 border-brand-200 bg-brand-50/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">
              {preview.patients.length > 0 && <span className="me-1 rounded-lg bg-brand px-2 py-0.5 text-white">{preview.patients.filter((_, i) => picked[i]).length}/{preview.patients.length}</span>}
              {preview.patients.length > 0 ? t.admin.tests.importFound : t.admin.tests.importNone}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPreview(null)}>{t.admin.actions.cancel}</Button>
              {preview.patients.length > 0 && (
                <Button size="sm" onClick={commitImport} disabled={busy || picked.every((p) => !p)}>
                  {busy ? t.admin.saving : `✓ ${t.admin.tests.importAll}`}
                </Button>
              )}
            </div>
          </div>
          {preview.warnings.length > 0 && (
            <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-700">
              {preview.warnings.slice(0, 8).map((w, i) => <li key={i}>⚠ {w}</li>)}
            </ul>
          )}
          {preview.patients.length > 0 && (
            <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pe-1">
              {preview.patients.map((p, i) => (
                <label key={i} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 transition", picked[i] ? "border-brand-200" : "border-line opacity-50")}>
                  <input type="checkbox" checked={picked[i] ?? false} onChange={(e) => setPicked((arr) => arr.map((v, j) => (j === i ? e.target.checked : v)))} className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{p.firstName} {p.lastName}</span>
                    <span className="block truncate text-xs text-muted" dir="ltr">{p.idNumber || "—"} · {p.exams.length} {t.admin.tests.examsCol}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.admin.tests.searchHint} className={cn(inputCls, "w-full max-w-md")} />
      </div>

      <BulkBar count={bulk.count} onDelete={bulkRemove} onClear={bulk.clear} busy={busy} />

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-4 py-3">
                  <BulkCheckbox checked={bulk.allSelected} onChange={bulk.toggleAll} label={t.admin.bulk.selected} />
                </th>
                <th className="px-4 py-3 text-start">{t.admin.queue.name}</th>
                <th className="px-4 py-3 text-start">{t.admin.tests.idNumber}</th>
                <th className="px-4 py-3 text-start">{t.admin.tests.birthDate}</th>
                <th className="px-4 py-3 text-start">{t.admin.tests.examsCol}</th>
                <th className="px-4 py-3 text-end">{t.admin.queue.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">{t.admin.loading}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">{t.admin.tests.none}</td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className={cn("cursor-pointer transition hover:bg-surface/60", bulk.isSelected(p.id) && "bg-brand-50/40")} onClick={() => { setFolder(p); setOpenExam(null); }}>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <BulkCheckbox checked={bulk.isSelected(p.id)} onChange={() => bulk.toggle(p.id)} label={`${p.firstName} ${p.lastName}`} />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">📁 {p.firstName} {p.lastName}</td>
                    <td className="whitespace-nowrap px-4 py-3" dir="ltr">{p.idNumber}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted" dir="ltr">{p.birthDate ? fmtDate(p.birthDate) : "—"}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-dark">{p.exams.length}</span></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" onClick={() => { setFolder(p); setOpenExam(null); }} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-100">{t.admin.actions.edit}</button>
                        <button type="button" onClick={() => setConfirmDelete(p)} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t.admin.actions.delete}>
        {confirmDelete && (
          <>
            <p className="text-sm text-muted">
              <strong className="text-ink">{confirmDelete.firstName} {confirmDelete.lastName}</strong>
              {" · "}<span dir="ltr">{confirmDelete.idNumber}</span>{" · "}{confirmDelete.exams.length} {t.admin.tests.examsCol}
            </p>
            <p className="mt-2 text-sm text-muted">{t.admin.tests.deleteWarn}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>{t.admin.actions.cancel}</Button>
              <Button variant="danger" disabled={busy} onClick={() => removeFolder(confirmDelete)}>{t.admin.actions.delete}</Button>
            </div>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}

/** OD/OS × SPH…VA prescription table, laid out LTR like the paper form. */
function RxEditor({ table, onChange }: { table: RxTable; onChange: (t: RxTable) => void }) {
  const set = (eye: "od" | "os", field: string, value: string) =>
    onChange({ ...table, [eye]: { ...table[eye], [field]: value } });
  return (
    <div className="overflow-x-auto" dir="ltr">
      <table className="w-full min-w-130 border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-10" aria-label="eye" />
            {RX_FIELDS.map((f) => (
              <th key={f} className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-muted">{f === "h" ? "H" : f.toUpperCase()}</th>
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
                    onChange={(e) => set(eye, f, e.target.value)}
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
