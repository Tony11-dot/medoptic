"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { GalleryImage, SiteContent } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { styleToCss } from "@/lib/textStyle";
import { SectionHeading } from "./SectionHeading";
import { SectionBg } from "./SectionBg";

// Auto-advancing image carousel ("hero gallery"), fully managed in the admin.
export function Gallery({ gallery, bg, styles }: { gallery: GalleryImage[]; bg?: string; styles?: SiteContent["styles"] }) {
  const { t, pick } = useI18n();
  const [i, setI] = useState(0);
  const count = gallery.length;

  const go = useCallback((n: number) => setI((c) => (n + count) % count), [count]);

  // Auto-advance every 5s (pauses implicitly when tab is hidden).
  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setI((c) => (c + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count]);

  if (count === 0) return null;
  const slide = gallery[Math.min(i, count - 1)];

  return (
    <section id="gallery" className={`relative scroll-mt-20 overflow-hidden bg-surface py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
      <SectionBg url={bg} />
      <div className="container-x">
        <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.heading} subtitle={t.gallery.subheading} />

        <div className="relative mx-auto mt-10 max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl shadow-card" style={{ aspectRatio: slide.aspectRatio ?? "16 / 9" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <ImageBlock src={slide.image} alt={pick(slide.caption) || "MEDOPTIC"} rounded="rounded-3xl" objectPosition={slide.imagePosition} />
                {pick(slide.caption) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6 md:p-8">
                    <p className="text-lg font-bold text-white drop-shadow md:text-2xl" style={styleToCss(styles?.[`gallery.${slide.id}.caption`])}>{pick(slide.caption)}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {count > 1 && (
            <>
              {/* Arrows */}
              <button
                type="button"
                onClick={() => go(i + 1)}
                aria-label="Next"
                className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-brand-dark shadow-lg transition hover:bg-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(i - 1)}
                aria-label="Previous"
                className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-brand-dark shadow-lg transition hover:bg-white"
              >
                ›
              </button>

              {/* Dots */}
              <div className="mt-5 flex justify-center gap-2">
                {gallery.map((g, n) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setI(n)}
                    aria-label={`Slide ${n + 1}`}
                    className={`h-2.5 rounded-full transition-all ${n === i ? "w-7 bg-brand" : "w-2.5 bg-brand-200 hover:bg-brand-light"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
