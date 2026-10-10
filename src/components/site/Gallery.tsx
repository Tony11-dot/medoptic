"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { GalleryImage, SiteContent } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { styleToCss } from "@/lib/textStyle";
import { SectionHeading } from "./SectionHeading";
import { SectionBg } from "./SectionBg";
import { PauseButton, useCarouselPause } from "./carousel";

// Slides move like a strip: "next" (the left arrow, RTL-natural) brings the new
// photo in from the left; "previous" from the right.
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
  center: { x: 0 },
  exit: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
};

// Auto-advancing image carousel ("hero gallery"), fully managed in the admin.
export function Gallery({ gallery, bg, styles }: { gallery: GalleryImage[]; bg?: string; styles?: SiteContent["styles"] }) {
  const { t, pick } = useI18n();
  const [[i, dir], setSlide] = useState([0, 1]);
  const count = gallery.length;
  const { paused, pinned, setPinned, reduced, bind, onSurfaceClick } = useCarouselPause();
  const swipeX = useRef<number | null>(null);

  // step +1 = next, -1 = previous; or jump straight to slide `to`.
  const go = useCallback(
    (step: number, to?: number) =>
      setSlide(([c]) => {
        const n = to ?? (c + step + count) % count;
        return [n, to === undefined ? step : n > c ? 1 : -1];
      }),
    [count],
  );

  // Auto-advance 5s after the slide last changed, unless paused (hover, tap,
  // keyboard focus or reduced motion). Manual navigation restarts the timer.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setTimeout(() => go(1), 5000);
    return () => clearTimeout(id);
  }, [count, paused, i, go]);

  if (count === 0) return null;
  const slide = gallery[Math.min(i, count - 1)];

  return (
    <section id="gallery" className={`relative scroll-mt-20 overflow-hidden bg-surface py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
      <SectionBg url={bg} />
      <div className="container-x">
        <SectionHeading eyebrow={t.gallery.eyebrow} title={t.gallery.heading} subtitle={t.gallery.subheading} />

        <div {...bind} className="relative mx-auto mt-10 max-w-5xl">
          <div
            className="relative overflow-hidden rounded-3xl shadow-card"
            style={{ aspectRatio: slide.aspectRatio ?? "16 / 9" }}
            onClick={onSurfaceClick}
            onTouchStart={(e) => (swipeX.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              // Swipe to change photo; same direction as the arrows above it.
              const start = swipeX.current;
              swipeX.current = null;
              if (start === null || count <= 1) return;
              const dx = e.changedTouches[0].clientX - start;
              if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
            }}
          >
            <AnimatePresence initial={false} custom={dir}>
              <motion.div
                key={slide.id}
                custom={dir}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: reduced ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
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
            {pinned && (
              <span className="pointer-events-none absolute start-4 top-4 z-10 rounded-full bg-black/55 px-3 py-1 text-sm font-semibold text-white">
                ❚❚ {t.carousel.paused}
              </span>
            )}
          </div>

          {count > 1 && (
            <>
              {/* Arrows */}
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next"
                className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-brand-dark shadow-lg transition hover:bg-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
                className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-2xl text-brand-dark shadow-lg transition hover:bg-white"
              >
                ›
              </button>

              {/* Dots + pause */}
              <div className="mt-5 flex items-center justify-center gap-2">
                {!reduced && <PauseButton compact pinned={pinned} onToggle={() => setPinned(!pinned)} className="me-2" />}
                {gallery.map((g, n) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => go(0, n)}
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
