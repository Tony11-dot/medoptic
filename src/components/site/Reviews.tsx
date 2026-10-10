"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { OpeningRule, Review, SiteContent } from "@/lib/types";
import { formatOpeningLines } from "@/lib/schedule";
import {
  GOOGLE_PROFILE_URL,
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  wazeUrl,
} from "@/lib/location";
import { SectionHeading } from "./SectionHeading";
import { SectionBg } from "./SectionBg";
import { PauseButton, useCarouselPause } from "./carousel";

// How fast the review cards drift sideways.
const DRIFT_PX_PER_SEC = 32;

// A photo review is an uploaded screenshot of a Google review (not a live one).
function isPhotoReview(rev: Review) {
  return !rev.live && (rev.source ?? (rev.image ? "google" : "manual")) === "google";
}

// Five stars, filled up to `rating`. Large and high-contrast for readability.
function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex gap-0.5 text-2xl leading-none" aria-label={`${r} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= r ? "text-amber-400" : "text-line"} aria-hidden>
          ★
        </span>
      ))}
    </div>
  );
}

// Public "Reviews" section: the review cards, then a "find us" card with the
// Google rating summary, an embedded Google map and quick navigation buttons.
export function Reviews({
  reviews,
  bg,
  rating,
  footer,
  openingRules,
}: {
  reviews: Review[];
  bg?: string;
  /** Google rating summary; hidden when absent or 0. */
  rating?: { rating: number; count: number } | null;
  footer: SiteContent["footer"];
  openingRules?: OpeningRule[];
}) {
  const { t } = useI18n();
  const { paused, pinned, setPinned, reduced, bind, onSurfaceClick } = useCarouselPause();
  const cards = reviews.filter((rev) => !(isPhotoReview(rev) && !rev.image));

  // The cards drift slowly sideways like a train. When they overflow the track,
  // a second (hidden-from-AT) copy follows the first so the loop is seamless.
  const trackRef = useRef<HTMLDivElement>(null);
  const [loop, setLoop] = useState(false);
  const period = useRef(0); // width of one full set of cards + gap
  const pausedRef = useRef(paused);
  const touching = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => {
      const items = el.querySelectorAll<HTMLElement>("[data-card]");
      if (items.length < 2) return setLoop(false);
      const first = items[0];
      const last = items[items.length - 1];
      const width = last.offsetLeft + last.offsetWidth - first.offsetLeft;
      period.current = width + (parseFloat(getComputedStyle(el).columnGap) || 0);
      setLoop(width > el.clientWidth + 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cards.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || !loop) return;
    let raf = 0;
    let last = 0;
    let pos = el.scrollLeft;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (pausedRef.current || touching.current || !visible || period.current <= 0) {
        pos = el.scrollLeft; // pick up wherever the visitor left it
        return;
      }
      pos += (DRIFT_PX_PER_SEC * dt) / 1000;
      if (pos >= period.current) pos -= period.current;
      el.scrollLeft = pos;
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [loop]);

  // On pausing by tap/button, glide to the nearest card so it sits fully in view.
  const settle = () => {
    const el = trackRef.current;
    const kids = el ? (Array.from(el.children) as HTMLElement[]) : [];
    if (!el || !kids.length) return;
    const base = kids[0].offsetLeft;
    const target = kids
      .map((k) => k.offsetLeft - base)
      .reduce((best, x) => (Math.abs(x - el.scrollLeft) < Math.abs(best - el.scrollLeft) ? x : best));
    el.scrollTo({ left: target, behavior: "smooth" });
  };
  const togglePin = () => {
    if (!pinned) settle();
    setPinned(!pinned);
  };

  const renderCard = (rev: Review, clone: boolean) => {
    const isPhoto = isPhotoReview(rev);
    return (
      <figure
        key={clone ? `${rev.id}-clone` : rev.id}
        data-card={clone ? undefined : ""}
        aria-hidden={clone || undefined}
        inert={clone}
        className={`flex shrink-0 basis-[85%] flex-col rounded-2xl border border-line bg-white shadow-sm sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)] ${loop ? "" : "snap-start"} ${isPhoto ? "self-start overflow-hidden" : "p-6"}`}
      >
        {isPhoto ? (
          // A photo review is a screenshot of a real Google review — shown
          // at its chosen frame shape (set in the admin), cropped to fit.
          <div className="w-full overflow-hidden" style={{ aspectRatio: rev.aspectRatio ?? "3 / 4" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rev.image}
              alt={rev.author || "Google review"}
              style={{ objectPosition: rev.imagePosition }}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <Stars rating={rev.rating} />
              {rev.live && <GoogleG className="size-5 shrink-0" />}
            </div>
            <blockquote className="mt-4 flex-1 whitespace-pre-line text-base leading-relaxed text-ink">
              “{rev.text}”
            </blockquote>
            <figcaption className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <span className="font-bold text-ink">{rev.author}</span>
              <span className="text-sm text-muted">{rev.date}</span>
            </figcaption>
          </>
        )}
      </figure>
    );
  };

  return (
    <section id="reviews" className={`relative scroll-mt-20 overflow-hidden py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
      <SectionBg url={bg} />
      <div className="container-x">
        <SectionHeading eyebrow={t.reviews.eyebrow} title={t.reviews.heading} subtitle={t.reviews.subheading} />

        {cards.length === 0 ? (
          !(rating && rating.rating > 0) && (
            <p className="mx-auto mt-12 max-w-xl text-center text-lg text-muted">{t.reviews.empty}</p>
          )
        ) : (
          <motion.div
            {...bind}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-12 max-w-5xl"
          >
            <div
              ref={trackRef}
              dir="ltr"
              onClick={(e) => onSurfaceClick(e) && !pinned && settle()}
              onTouchStart={(e) => {
                touching.current = true;
                touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              }}
              onTouchMove={(e) => {
                // A sideways swipe means they're browsing — keep it still for reading.
                const s = touchStart.current;
                if (!s) return;
                const dx = Math.abs(e.touches[0].clientX - s.x);
                const dy = Math.abs(e.touches[0].clientY - s.y);
                if (dx > 10 && dx > dy) {
                  setPinned(true);
                  touchStart.current = null;
                }
              }}
              onTouchEnd={() => {
                touching.current = false;
                touchStart.current = null;
              }}
              className={`relative flex gap-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${loop ? "" : "snap-x snap-mandatory"}`}
            >
              {cards.map((rev) => renderCard(rev, false))}
              {loop && cards.map((rev) => renderCard(rev, true))}
            </div>
            {loop && !reduced && (
              <div className="mt-4 flex justify-center">
                <PauseButton pinned={pinned} onToggle={togglePin} />
              </div>
            )}
          </motion.div>
        )}

        <FindUs rating={rating} footer={footer} openingRules={openingRules} />
      </div>
    </section>
  );
}

// Google "G" mark (brand colours).
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

// Stars with fractional fill (4.6 → four full + 60% of the fifth).
function PartialStars({ rating }: { rating: number }) {
  return (
    <span className="flex text-lg leading-none" dir="ltr" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, rating - i)) * 100;
        return (
          <span key={i} className="relative text-line">
            ★
            <span className="absolute inset-0 overflow-hidden text-amber-400" style={{ width: `${fill}%` }}>★</span>
          </span>
        );
      })}
    </span>
  );
}

function FindUs({
  rating,
  footer,
  openingRules,
}: {
  rating?: { rating: number; count: number } | null;
  footer: SiteContent["footer"];
  openingRules?: OpeningRule[];
}) {
  const { t, pick, locale } = useI18n();
  const hourLines = formatOpeningLines(openingRules ?? [], t.weekdaysShort);
  const showRating = !!rating && rating.rating > 0;

  const btn =
    "flex h-16 flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-semibold transition hover:-translate-y-0.5";

  return (
    <div className="mx-auto mt-14 grid max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-card md:grid-cols-2">
      {/* Details + quick actions */}
      <div className="flex flex-col gap-5 p-6 md:p-8">
        <h3 className="text-2xl font-extrabold text-ink">MEDOPTIC</h3>
        <dl className="space-y-4 text-base text-ink">
          {pick(footer.address) && (
            <div>
              <dt className="text-sm font-bold text-muted">{t.location.address}</dt>
              <dd className="mt-0.5 whitespace-pre-line">{pick(footer.address)}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-bold text-muted">{t.location.hours}</dt>
            <dd className="mt-0.5 space-y-0.5">
              {hourLines.length > 0
                ? hourLines.map((line, i) => <p key={i}>{line}</p>)
                : <p className="whitespace-pre-line">{pick(footer.hours)}</p>}
            </dd>
          </div>
          {footer.phone && (
            <div>
              <dt className="text-sm font-bold text-muted">{t.location.phone}</dt>
              <dd className="mt-0.5">
                <a href={`tel:${footer.phone.replace(/\s/g, "")}`} dir="ltr" className="font-semibold text-brand-dark underline underline-offset-2 hover:text-brand">
                  📞 {footer.phone}
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-auto grid grid-cols-3 gap-3 pt-2">
          <a href={wazeUrl(footer.address)} target="_blank" rel="noopener noreferrer" className={`${btn} border-line text-ink hover:border-brand`}>
            <span aria-hidden className="text-xl leading-none">🚗</span>
            {t.location.waze}
          </a>
          <a href={googleMapsDirectionsUrl(footer.address)} target="_blank" rel="noopener noreferrer" className={`${btn} border-line text-ink hover:border-brand`}>
            <span aria-hidden className="text-xl leading-none">🗺️</span>
            {t.location.maps}
          </a>
          <a href="#book" className={`${btn} border-brand bg-brand text-white hover:bg-brand-dark`}>
            <span aria-hidden className="text-xl leading-none">📅</span>
            {t.location.book}
          </a>
        </div>
      </div>

      {/* Google rating + map */}
      <div className="flex flex-col border-t border-line md:border-s md:border-t-0">
        {showRating && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3">
            <a
              href={GOOGLE_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              title={t.location.seeOnGoogle}
              className="flex items-center gap-2.5 transition hover:opacity-80"
            >
              <GoogleG className="size-6 shrink-0" />
              <span className="text-xl font-bold text-ink" dir="ltr">{rating.rating.toFixed(1)}</span>
              <PartialStars rating={rating.rating} />
              {rating.count > 0 && (
                <span className="text-sm text-muted underline-offset-2 hover:underline">{t.location.reviewsCount(rating.count)}</span>
              )}
              <span className="sr-only">{`${rating.rating.toFixed(1)} / 5`}</span>
            </a>
          </div>
        )}
        <iframe
          key={`${locale}|${pick(footer.address)}`}
          title={t.location.mapTitle}
          src={googleMapsEmbedUrl(footer.address, locale)}
          className="min-h-80 w-full flex-1 border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </div>
  );
}
