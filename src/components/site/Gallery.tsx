"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { GalleryImage } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { SectionHeading } from "./SectionHeading";

// Auto-advancing image carousel ("hero gallery"), fully managed in the admin.
export function Gallery({ gallery }: { gallery: GalleryImage[] }) {
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
    <section id="gallery" className="scroll-mt-20 bg-surface py-20 md:py-28">
      <div className="container-x">
        <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.heading} subtitle={t.gallery.subheading} />

        <div className="relative mx-auto mt-10 max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl shadow-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                <ImageBlock src={slide.image} alt={pick(slide.caption) || "MEDOPTIC"} rounded="rounded-3xl" />
                {pick(slide.caption) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-6 md:p-8">
                    <p className="text-lg font-bold text-white drop-shadow md:text-2xl">{pick(slide.caption)}</p>
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
                onClick={() => go(i - 1)}
                aria-label="Previous"
                className="absolute start-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-brand-dark shadow-lg transition hover:bg-white"
              >
                <span className="flip-x">‹</span>
              </button>
              <button
                type="button"
                onClick={() => go(i + 1)}
                aria-label="Next"
                className="absolute end-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-brand-dark shadow-lg transition hover:bg-white"
              >
                <span className="flip-x">›</span>
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
