"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Service } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

// Public "Our Services" section — lists the same enabled queue types customers
// see in the booking dropdown, with their descriptions.
export function Services({ services }: { services: Service[] }) {
  const { t, pick } = useI18n();

  return (
    <section id="services" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-x">
        <SectionHeading eyebrow={t.services.eyebrow} title={t.services.heading} subtitle={t.services.subheading} />

        {services.length === 0 ? (
          <p className="mt-12 text-center text-muted">{t.services.empty}</p>
        ) : (
          <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-2xl" aria-hidden>
                  👁️
                </span>
                <h3 className="mt-4 text-xl font-bold text-ink">{pick(s.label)}</h3>
                {pick(s.description) && (
                  <p className="mt-2 flex-1 text-base leading-relaxed text-muted">{pick(s.description)}</p>
                )}
                <a
                  href="#book"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-base font-semibold text-white transition hover:bg-brand-dark"
                >
                  {t.services.book}
                </a>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
