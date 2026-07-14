"use client";

// Custom, on-brand date / time / datetime pickers — a single look across the
// whole app (admin + site) instead of the browser's native controls, which
// render differently per OS/browser and ignore our theme, locale and RTL.
//
// Values are plain strings so these are drop-in replacements for the native
// inputs they retire:
//   DateField     — "YYYY-MM-DD"
//   TimeField     — "HH:MM"
//   DateTimeField — "YYYY-MM-DDTHH:MM"
//
// The dropdown is portalled to <body> with fixed positioning so it never gets
// clipped by an overflow-hidden ancestor (e.g. a Modal panel).

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_TIME = /^\d{2}:\d{2}$/;
const pad = (n: number) => String(n).padStart(2, "0");

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const triggerCls =
  "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition hover:border-brand-200 focus:border-brand focus:ring-4 focus:ring-brand/10";

/* -------------------------------------------------------------------------- */
/* Portal popover — fixed to the trigger, flips up when short on space below.  */
/* -------------------------------------------------------------------------- */

function Popover({
  anchorRef,
  open,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; flip: boolean } | null>(null);

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const panelW = panelRef.current?.offsetWidth ?? 300;
    const panelH = panelRef.current?.offsetHeight ?? 340;
    const gap = 6;
    const flip = r.bottom + gap + panelH > window.innerHeight && r.top - gap - panelH > 8;
    // Right-align the panel to the trigger, then clamp inside the viewport.
    let left = r.right - panelW;
    left = Math.min(Math.max(8, left), window.innerWidth - panelW - 8);
    const top = flip ? r.top - gap : r.bottom + gap;
    setPos({ left, top, flip });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    // A second pass once the panel has real dimensions.
    const id = requestAnimationFrame(reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, anchorRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: pos?.flip ? 6 : -6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.14 }}
          style={{
            position: "fixed",
            left: pos?.left ?? -9999,
            top: pos?.top ?? -9999,
            transform: pos?.flip ? "translateY(-100%)" : undefined,
            visibility: pos ? "visible" : "hidden",
          }}
          className="z-[120] rounded-2xl border border-line bg-white p-3 shadow-card"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar grid                                                              */
/* -------------------------------------------------------------------------- */

function Calendar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t, locale } = useI18n();
  const today = todayStr();
  const base = value && ISO_DATE.test(value) ? value : today;
  const [view, setView] = useState(() => ({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 }));

  const monthNames = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2021, i, 1)).toLocaleDateString(locale, { month: "long", timeZone: "UTC" })),
    [locale],
  );
  const years = useMemo(() => {
    const c = new Date().getFullYear();
    return Array.from({ length: 121 }, (_, i) => c + 5 - i); // c+5 … c-115
  }, []);

  const firstWeekday = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay(); // 0 = Sunday
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const dateOf = (d: number) => `${view.y}-${pad(view.m + 1)}-${pad(d)}`;

  const shift = (dir: -1 | 1) => {
    const next = new Date(Date.UTC(view.y, view.m + dir, 1));
    setView({ y: next.getUTCFullYear(), m: next.getUTCMonth() });
  };

  const navBtn = "grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface hover:text-brand-dark";
  const selectCls = "h-8 rounded-lg border border-line bg-white px-1.5 text-sm font-bold text-ink outline-none focus:border-brand";

  return (
    <div className="w-[17.5rem]">
      <div className="flex items-center gap-1">
        <button type="button" aria-label="‹" onClick={() => shift(-1)} className={navBtn}>‹</button>
        <div className="flex flex-1 items-center justify-center gap-1.5">
          <select aria-label="month" value={view.m} onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))} className={selectCls}>
            {monthNames.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
          <select aria-label="year" dir="ltr" value={view.y} onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))} className={selectCls}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button type="button" aria-label="›" onClick={() => shift(1)} className={navBtn}>›</button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-0.5">
        {t.weekdaysShort.map((w, i) => (
          <span key={i} className="grid h-7 place-items-center text-[11px] font-bold text-muted">{w}</span>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <span key={`b${i}`} />;
          const iso = dateOf(d);
          const selected = iso === value;
          const isToday = iso === today;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onChange(iso)}
              aria-pressed={selected ? "true" : "false"}
              className={cn(
                "grid h-9 place-items-center rounded-lg text-sm font-semibold transition",
                selected
                  ? "bg-brand text-white shadow-sm"
                  : isToday
                    ? "bg-brand-50 text-brand-dark ring-1 ring-brand-200"
                    : "text-ink hover:bg-brand-50",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
        <button type="button" onClick={() => { setView({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }); onChange(today); }} className="rounded-lg px-2 py-1 text-xs font-bold text-brand-dark transition hover:bg-brand-50">
          {t.datePicker.today}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="rounded-lg px-2 py-1 text-xs font-semibold text-muted transition hover:bg-surface">
            {t.datePicker.clear}
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Time columns                                                               */
/* -------------------------------------------------------------------------- */

function TimeColumns({ value, onChange, minuteStep = 5 }: { value: string; onChange: (v: string) => void; minuteStep?: number }) {
  const hh = ISO_TIME.test(value) ? value.slice(0, 2) : "";
  const mm = ISO_TIME.test(value) ? value.slice(3, 5) : "";
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = useMemo(() => {
    const list: string[] = [];
    for (let m = 0; m < 60; m += minuteStep) list.push(pad(m));
    if (mm && !list.includes(mm)) list.push(mm); // keep an off-step existing value selectable
    return list.sort();
  }, [minuteStep, mm]);

  const commit = (h: string, m: string) => onChange(`${h}:${m}`);
  const colCls = "h-44 w-16 overflow-y-auto rounded-lg border border-line bg-surface/40 p-1";
  const optCls = (on: boolean) =>
    cn("mb-0.5 w-full rounded-md py-1.5 text-center text-sm font-bold transition", on ? "bg-brand text-white shadow-sm" : "text-ink hover:bg-brand-50");

  return (
    <div className="flex items-stretch gap-2" dir="ltr">
      <div className={colCls}>
        {hours.map((h) => (
          <button key={h} type="button" onClick={() => commit(h, mm || "00")} className={optCls(h === hh)}>{h}</button>
        ))}
      </div>
      <span className="grid place-items-center text-lg font-extrabold text-muted">:</span>
      <div className={colCls}>
        {minutes.map((m) => (
          <button key={m} type="button" onClick={() => commit(hh || "09", m)} className={optCls(m === mm)}>{m}</button>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Public fields                                                              */
/* -------------------------------------------------------------------------- */

function useDateFormat() {
  const { locale } = useI18n();
  return useMemo(
    () => (iso: string) =>
      ISO_DATE.test(iso)
        ? new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
        : "",
    [locale],
  );
}

export function DateField({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const fmt = useDateFormat();

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerCls, !value && "text-muted", className)}
      >
        <span dir="ltr">{value ? fmt(value) : placeholder ?? t.datePicker.pickDate}</span>
        <span aria-hidden className="text-base opacity-70">📅</span>
      </button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)}>
        <Calendar value={value} onChange={(v) => { onChange(v); if (v) setOpen(false); }} />
      </Popover>
    </>
  );
}

export function TimeField({
  value,
  onChange,
  placeholder,
  className,
  minuteStep,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  minuteStep?: number;
  ariaLabel?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerCls, !value && "text-muted", className)}
      >
        <span dir="ltr">{value || placeholder || t.datePicker.pickTime}</span>
        <span aria-hidden className="text-base opacity-70">🕑</span>
      </button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)}>
        <TimeColumns value={value} onChange={onChange} minuteStep={minuteStep} />
        <div className="mt-2 flex justify-end border-t border-line pt-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-dark">
            {t.datePicker.done}
          </button>
        </div>
      </Popover>
    </>
  );
}

export function DateTimeField({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const { t } = useI18n();
  const ref = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const fmt = useDateFormat();

  const [datePart, timePart] = value.includes("T") ? value.split("T") : [value, ""];
  const setDate = (d: string) => onChange(d ? `${d}T${timePart || "09:00"}` : "");
  const setTime = (tm: string) => { if (datePart) onChange(`${datePart}T${tm}`); };

  const label = datePart && ISO_DATE.test(datePart)
    ? `${fmt(datePart)}${timePart ? ` · ${timePart}` : ""}`
    : "";

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerCls, !label && "text-muted", className)}
      >
        <span dir="ltr">{label || placeholder || t.datePicker.pickDateTime}</span>
        <span aria-hidden className="text-base opacity-70">📅</span>
      </button>
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)}>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Calendar value={datePart} onChange={setDate} />
          <div className="sm:border-s sm:border-line sm:ps-3">
            <p className="mb-1.5 text-xs font-bold text-muted">{t.datePicker.time}</p>
            <TimeColumns value={timePart} onChange={setTime} />
          </div>
        </div>
        <div className="mt-2 flex justify-end border-t border-line pt-2">
          <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-brand px-3 py-1 text-xs font-bold text-white transition hover:bg-brand-dark">
            {t.datePicker.done}
          </button>
        </div>
      </Popover>
    </>
  );
}
