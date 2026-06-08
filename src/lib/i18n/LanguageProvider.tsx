"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale, Localized } from "../types";
import { DEFAULT_LOCALE, LOCALES, dictionaries, type Dict } from "./dictionary";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
  /** Resolve a localized value to the active language (falls back to Hebrew). */
  pick: (value: Localized) => string;
  locales: Locale[];
}

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "medoptic.locale";

function isLocale(v: string | null): v is Locale {
  return v === "he" || v === "en" || v === "ru";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Restore saved preference after mount (avoids SSR/CSR mismatch).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) setLocaleState(saved);
  }, []);

  // Keep <html lang/dir> in sync with the active language.
  useEffect(() => {
    const dir = dictionaries[locale].dir;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore storage failures (private mode etc.) */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const t = dictionaries[locale];
    return {
      locale,
      setLocale,
      t,
      pick: (v) => v?.[locale] ?? v?.he ?? "",
      locales: LOCALES,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within <LanguageProvider>");
  return ctx;
}
