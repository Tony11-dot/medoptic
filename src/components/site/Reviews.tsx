"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
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

  // Auto-cycle the review cards like a train (every 7s).
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = trackRef.current;
    if (!el || reviews.length <= 1) return;
    const id = setInterval(() => {
      const first = el.children[0] as HTMLElement | undefined;
      const step = first ? first.getBoundingClientRect().width + 24 : el.clientWidth;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 12) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 7000);
    return () => clearInterval(id);
  }, [reviews.length]);

  return (
    <section id="reviews" className={`relative scroll-mt-20 overflow-hidden py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
      <SectionBg url={bg} />
      <div className="container-x">
        <SectionHeading eyebrow={t.reviews.eyebrow} title={t.reviews.heading} subtitle={t.reviews.subheading} />

        {reviews.length === 0 ? (
          !(rating && rating.rating > 0) && (
            <p className="mx-auto mt-12 max-w-xl text-center text-lg text-muted">{t.reviews.empty}</p>
          )
        ) : (
            <div
              ref={trackRef}
              dir="ltr"
              className="mx-auto mt-12 flex max-w-5xl snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {reviews.map((rev, i) => {
                const isPhoto = !rev.live && (rev.source ?? (rev.image ? "google" : "manual")) === "google";
                if (isPhoto && !rev.image) return null;
                return (
                <motion.figure
                  key={rev.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex shrink-0 snap-start basis-[85%] flex-col rounded-2xl border border-line bg-white shadow-sm sm:basis-[calc(50%-12px)] lg:basis-[calc(33.333%-16px)] ${isPhoto ? "self-start overflow-hidden" : "p-6"}`}
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
                </motion.figure>
                );
              })}
            </div>
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
