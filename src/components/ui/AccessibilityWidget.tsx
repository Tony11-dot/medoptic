"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "medoptic.a11y";
const FONT_STEPS = [100, 110, 120, 130];

interface A11yPrefs {
  fontStep: number;
  contrast: boolean;
  grayscale: boolean;
  underline: boolean;
  reduceMotion: boolean;
}

const DEFAULT_PREFS: A11yPrefs = { fontStep: 0, contrast: false, grayscale: false, underline: false, reduceMotion: false };

type BoolKey = "contrast" | "grayscale" | "underline" | "reduceMotion";

function readPrefs(): A11yPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function apply(prefs: A11yPrefs) {
  const root = document.documentElement;
  root.style.fontSize = `${FONT_STEPS[prefs.fontStep] ?? 100}%`;
  root.classList.toggle("a11y-contrast", prefs.contrast);
  root.classList.toggle("a11y-grayscale", prefs.grayscale);
  root.classList.toggle("a11y-underline", prefs.underline);
  root.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
}

/** Floating accessibility control (bottom-left corner) — text size, contrast, grayscale, link
 * underlining and reduced motion. Preferences persist per-browser
 * (localStorage) and are re-applied on load by an inline script in the root
 * layout, so there's no flash back to defaults on refresh. */
export function AccessibilityWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Saved prefs are read lazily on the client; the panel only renders once
  // opened, so the server's defaults never mismatch what hydrates.
  const [prefs, setPrefs] = useState<A11yPrefs>(() =>
    typeof window === "undefined" ? DEFAULT_PREFS : readPrefs(),
  );

  useEffect(() => {
    apply(prefs);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // best-effort persistence
    }
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (key: BoolKey) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const toggles: [BoolKey, string][] = [
    ["contrast", t.a11y.contrast],
    ["grayscale", t.a11y.grayscale],
    ["underline", t.a11y.underline],
    ["reduceMotion", t.a11y.reduceMotion],
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {open && (
        <div
          role="dialog"
          aria-label={t.a11y.title}
          className="mb-3 w-72 rounded-2xl border border-line bg-white p-4 shadow-card"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink">{t.a11y.title}</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label={t.a11y.close}
              className="grid size-7 place-items-center rounded-full text-muted transition hover:bg-surface"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink">{t.a11y.fontSize}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPrefs((p) => ({ ...p, fontStep: Math.max(0, p.fontStep - 1) }))}
                disabled={prefs.fontStep === 0}
                aria-label={t.a11y.decrease}
                className="grid size-8 place-items-center rounded-lg border border-line text-sm font-bold text-ink transition hover:bg-surface disabled:opacity-40"
              >
                A-
              </button>
              <button
                onClick={() => setPrefs((p) => ({ ...p, fontStep: Math.min(FONT_STEPS.length - 1, p.fontStep + 1) }))}
                disabled={prefs.fontStep === FONT_STEPS.length - 1}
                aria-label={t.a11y.increase}
                className="grid size-8 place-items-center rounded-lg border border-line text-sm font-bold text-ink transition hover:bg-surface disabled:opacity-40"
              >
                A+
              </button>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {toggles.map(([key, label]) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                aria-pressed={prefs[key]}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold transition",
                  prefs[key] ? "border-brand bg-brand-50 text-brand-dark" : "border-line text-ink hover:bg-surface",
                )}
              >
                {label}
                <span className={cn("relative h-4 w-7 shrink-0 rounded-full transition", prefs[key] ? "bg-brand" : "bg-line")}>
                  <span
                    className={cn(
                      "absolute top-0.5 size-3 rounded-full bg-white shadow transition-all",
                      prefs[key] ? "start-3.5" : "start-0.5",
                    )}
                  />
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setPrefs(DEFAULT_PREFS)}
            className="mt-3 w-full rounded-lg border border-line py-2 text-xs font-bold text-muted transition hover:bg-surface"
          >
            {t.a11y.reset}
          </button>
          <Link href="/accessibility" className="mt-2 block text-center text-xs font-semibold text-brand-dark underline">
            {t.a11y.statement}
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.a11y.open}
        aria-expanded={open}
        className="grid size-12 place-items-center rounded-full bg-brand text-white shadow-brand transition hover:scale-105"
      >
        <span aria-hidden className="text-xl leading-none">♿</span>
      </button>
    </div>
  );
}
