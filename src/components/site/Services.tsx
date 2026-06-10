"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Service } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { SectionHeading } from "./SectionHeading";
import { SectionBg } from "./SectionBg";

// Public "Our Services" section. Each card opens a full-screen detail view (with
// its own editable background) showing the photo(s), title and description.
export function Services({ services, bg }: { services: Service[]; bg?: string }) {
  const { t, pick } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = services.find((s) => s.id === openId) ?? null;
  // With a detail background photo we use the soft, faded section-style backdrop
  // (white overlay) — so the foreground text is dark, like the normal sections.
  const light = !!open?.detailBg;

  // Cards whose description is expanded inline (via "Read more").
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The detail gallery: the card "face" photo plus any extra photos (de-duped).
  const detailImages = useMemo(() => {
    if (!open) return [] as string[];
    return [open.image, ...(open.images ?? [])].filter(
      (v, i, a): v is string => !!v && a.indexOf(v) === i,
    );
  }, [open]);

  // Auto-cycle the detail photos "like a train" (every 4s) when there's more
  // than one — they sit 3-up and scroll horizontally.
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = trackRef.current;
    if (!el || detailImages.length <= 1) return;
    const id = setInterval(() => {
      const first = el.children[0] as HTMLElement | undefined;
      const step = first ? first.getBoundingClientRect().width + 16 : el.clientWidth;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 4000);
    return () => clearInterval(id);
  }, [detailImages.length, openId]);

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
          <div className="mx-auto mt-12 grid max-w-5xl items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => {
              const desc = pick(s.description);
              const isLong = desc.length > 150;
              const expanded = expandedIds.has(s.id);
              return (
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
                <div className="flex flex-1 flex-col p-5 pt-4">
                  <h3 className="whitespace-pre-line text-xl font-bold text-ink">{pick(s.label)}</h3>
                  {desc && (
                    <p className={`mt-2 whitespace-pre-line text-base leading-relaxed text-muted ${expanded ? "" : "line-clamp-3"}`}>{desc}</p>
                  )}
                  {isLong && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleExpand(s.id); }}
                      className="mt-2 self-start text-sm font-bold text-brand-dark transition hover:text-brand"
                    >
                      {expanded ? t.services.readLess : t.services.readMore}
                    </button>
                  )}
                  <a
                    href="#book"
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-5 text-base font-semibold text-white transition hover:bg-brand-dark"
                  >
                    {t.services.book}
                  </a>
                </div>
              </motion.article>
              );
            })}
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
            {/* background — same soft, faded treatment as the section backgrounds */}
            {open.detailBg ? (
              <SectionBg url={open.detailBg} />
            ) : (
              <div className="fixed inset-0 brand-gradient" />
            )}

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
                className={`w-full text-center ${detailImages.length > 1 ? "max-w-3xl" : "max-w-lg"}`}
              >
                {detailImages.length === 1 && (
                  <div className="mx-auto mb-6 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl" style={{ aspectRatio: open.aspectRatio ?? "16 / 10" }}>
                    <ImageBlock src={detailImages[0]} alt={pick(open.label)} icon="glasses" rounded="rounded-none" objectPosition={open.imagePosition} />
                  </div>
                )}
                {detailImages.length > 1 && (
                  // 3-up auto-cycling photo "train" (horizontal scroll). All the
                  // service's photos show here; the card outside shows just the face.
                  <div
                    ref={trackRef}
                    dir="ltr"
                    className="mb-6 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  >
                    {detailImages.map((src, idx) => (
                      <div
                        key={idx}
                        className="shrink-0 basis-[80%] snap-center overflow-hidden rounded-2xl shadow-2xl sm:basis-[48%] lg:basis-[31.5%]"
                        style={{ aspectRatio: open.aspectRatio ?? "16 / 10" }}
                      >
                        <ImageBlock src={src} alt={`${pick(open.label)} ${idx + 1}`} icon="glasses" rounded="rounded-none" />
                      </div>
                    ))}
                  </div>
                )}
                <h3 className={`whitespace-pre-line text-3xl font-extrabold md:text-4xl ${light ? "text-ink" : "text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.7)]"}`}>{pick(open.label)}</h3>
                {pick(open.description) && (
                  <p className={`mx-auto mt-4 max-w-md whitespace-pre-line text-lg leading-relaxed ${light ? "text-muted" : "text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]"}`}>{pick(open.description)}</p>
                )}
                <a
                  href="#book"
                  onClick={() => setOpenId(null)}
                  className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl px-7 text-base font-semibold shadow-lg transition hover:-translate-y-0.5 ${light ? "bg-brand text-white hover:bg-brand-dark" : "bg-white text-brand-dark"}`}
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
