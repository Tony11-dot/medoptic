"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Service } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { SectionHeading } from "./SectionHeading";
import { SectionBg } from "./SectionBg";

// Public "Our Services" section. Each card opens a full-screen detail view (with
// its own editable background) showing the same photo, title and description.
export function Services({ services, bg }: { services: Service[]; bg?: string }) {
  const { t, pick } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = services.find((s) => s.id === openId) ?? null;

  // Close the detail on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section id="services" className={`relative scroll-mt-20 overflow-hidden py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
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
                onClick={() => setOpenId(s.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpenId(s.id)}
                className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card"
              >
                {s.image ? (
                  <div className="overflow-hidden" style={{ aspectRatio: s.aspectRatio ?? "16 / 10" }}>
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
                  <h3 className="whitespace-pre-line text-xl font-bold text-ink">{pick(s.label)}</h3>
                  {pick(s.description) && (
                    <p className="mt-2 flex-1 whitespace-pre-line text-base leading-relaxed text-muted">{pick(s.description)}</p>
                  )}
                  <a
                    href="#book"
                    onClick={(e) => e.stopPropagation()}
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

      {/* Full-screen detail view with the service's own background */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenId(null)}
            className="fixed inset-0 z-[70] overflow-y-auto"
          >
            {/* background */}
            {open.detailBg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.detailBg} alt="" className="fixed inset-0 h-full w-full object-cover" />
            ) : (
              <div className="fixed inset-0 brand-gradient" />
            )}
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

            <button
              type="button"
              onClick={() => setOpenId(null)}
              aria-label="Close"
              className="fixed end-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/90 text-2xl text-ink shadow-lg transition hover:bg-white"
            >
              ✕
            </button>

            <div className="relative z-0 flex min-h-full items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg text-center text-white"
              >
                {open.image && (
                  <div className="mx-auto mb-6 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: open.aspectRatio ?? "16 / 10" }}>
                    <ImageBlock src={open.image} alt={pick(open.label)} icon="glasses" rounded="rounded-none" objectPosition={open.imagePosition} />
                  </div>
                )}
                <h3 className="whitespace-pre-line text-3xl font-extrabold drop-shadow md:text-4xl">{pick(open.label)}</h3>
                {pick(open.description) && (
                  <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-lg leading-relaxed text-white/90 drop-shadow">{pick(open.description)}</p>
                )}
                <a
                  href="#book"
                  onClick={() => setOpenId(null)}
                  className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-white px-7 text-base font-semibold text-brand-dark shadow-lg transition hover:-translate-y-0.5"
                >
                  {t.services.book}
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
