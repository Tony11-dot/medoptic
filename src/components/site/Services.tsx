"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Service } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { SectionHeading } from "./SectionHeading";
import { SectionBg } from "./SectionBg";

// Public "Our Services" section — lists the same enabled queue types customers
// see in the booking dropdown, with their descriptions.
export function Services({ services, bg }: { services: Service[]; bg?: string }) {
  const { t, pick } = useI18n();

  return (
    <section id="services" className="relative scroll-mt-20 overflow-hidden py-20 md:py-28">
      <SectionBg url={bg} />
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
                className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                {s.image ? (
                  <div className="aspect-[16/10] overflow-hidden">
                    <ImageBlock src={s.image} alt={pick(s.label)} icon="glasses" rounded="rounded-none" objectPosition={s.imagePosition} />
                  </div>
                ) : (
                  <div className="px-6 pt-6">
                    <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-2xl" aria-hidden>
                      👁️
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-6 pt-4">
                <h3 className="text-xl font-bold text-ink">{pick(s.label)}</h3>
                {pick(s.description) && (
                  <p className="mt-2 flex-1 text-base leading-relaxed text-muted">{pick(s.description)}</p>
                )}
                <a
                  href="#book"
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-base font-semibold text-white transition hover:bg-brand-dark"
                >
                  {t.services.book}
                </a>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
