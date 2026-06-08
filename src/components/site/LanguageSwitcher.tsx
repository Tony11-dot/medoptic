"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/types";
import { cn } from "@/lib/cn";

const FLAGS: Record<Locale, string> = { he: "🇮🇱", en: "🇬🇧", ru: "🇷🇺" };

export function LanguageSwitcher({ light = false }: { light?: boolean }) {
  const { locale, setLocale, locales } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
          light
            ? "text-white/90 hover:bg-white/10"
            : "text-ink hover:bg-brand-50",
        )}
      >
        <span aria-hidden>{FLAGS[locale]}</span>
        <span>{dictionaries[locale].langName}</span>
        <span aria-hidden className={cn("text-xs transition", open && "rotate-180")}>▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 mt-2 w-40 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-card"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-start text-sm transition hover:bg-brand-50",
                  l === locale ? "font-bold text-brand-dark" : "text-ink",
                )}
              >
                <span aria-hidden>{FLAGS[l]}</span>
                {dictionaries[l].langName}
                {l === locale && <span className="ms-auto text-brand">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
