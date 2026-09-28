"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Localized } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";

const BACK: Localized = { he: "→ חזרה לאתר", en: "← Back to the site", ru: "← Вернуться на сайт" };
const UPDATED: Localized = { he: "עודכן לאחרונה: ספטמבר 2026", en: "Last updated: September 2026", ru: "Последнее обновление: сентябрь 2026" };

export interface LegalSection {
  heading: Localized;
  body: Localized[];
}

/** Shared chrome for static legal pages (privacy/cookies/terms) — a minimal
 * header, the localized sections, and a way back to the site. */
export function LegalPage({ title, sections }: { title: Localized; sections: LegalSection[] }) {
  const { pick } = useI18n();

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-line bg-white">
        <div className="container-x flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="h-14 w-auto" />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container-x max-w-3xl py-12 md:py-16">
        <Link href="/" className="text-sm font-semibold text-brand-dark hover:underline">
          {pick(BACK)}
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold text-ink md:text-4xl">{pick(title)}</h1>
        <p className="mt-2 text-sm text-muted">{pick(UPDATED)}</p>

        <div className="mt-8 space-y-8">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-lg font-bold text-brand-dark">{pick(s.heading)}</h2>
              <div className="mt-2 space-y-3 text-sm leading-7 text-muted md:text-base">
                {s.body.map((p, j) => (
                  <p key={j}>{pick(p)}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
