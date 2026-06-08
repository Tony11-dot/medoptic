"use client";

import { useState } from "react";
import type { Locale, Localized } from "@/lib/types";

const LANGS: { code: Locale; label: string }[] = [
  { code: "he", label: "Hebrew" },
  { code: "en", label: "English" },
  { code: "ru", label: "Russian" },
];

// A single field edited across all three languages via a small tab switcher.
export function LocalizedField({
  label,
  value,
  onChange,
  textarea = false,
  rows = 3,
}: {
  label: string;
  value: Localized;
  onChange: (v: Localized) => void;
  textarea?: boolean;
  rows?: number;
}) {
  const [lang, setLang] = useState<Locale>("he");
  const common =
    "w-full rounded-xl border border-line bg-white px-3.5 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{label}</span>
        <div className="flex gap-1 rounded-lg bg-surface p-0.5">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                lang === l.code ? "bg-white text-brand-dark shadow-sm" : "text-muted"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {textarea ? (
        <textarea
          rows={rows}
          dir={lang === "he" ? "rtl" : "ltr"}
          value={value[lang]}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
          className={`${common} resize-none py-2.5`}
        />
      ) : (
        <input
          dir={lang === "he" ? "rtl" : "ltr"}
          value={value[lang]}
          onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
          className={`${common} h-10`}
        />
      )}
    </div>
  );
}
