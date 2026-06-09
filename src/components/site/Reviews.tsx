"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Review } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
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

// Public "Reviews" section. Shows admin-entered and/or live Google reviews. When
// there are none it invites visitors to leave one on Google instead of looking
// broken. `placeId` (when set) builds a direct "write a review" link.
export function Reviews({
  reviews,
  placeId,
  bg,
}: {
  reviews: Review[];
  placeId?: string;
  bg?: string;
}) {
  const { t } = useI18n();
  const writeUrl = placeId
    ? `https://search.google.com/local/writereview?placeid=${placeId}`
    : "https://www.google.com/maps/search/?api=1&query=מדאופטיק+Medoptic";

  return (
    <section id="reviews" className="relative scroll-mt-20 overflow-hidden py-20 md:py-28">
      <SectionBg url={bg} />
      <div className="container-x">
        <SectionHeading eyebrow={t.reviews.eyebrow} title={t.reviews.heading} subtitle={t.reviews.subheading} />

        {reviews.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl text-center">
            <p className="text-lg text-muted">{t.reviews.empty}</p>
            <a
              href={writeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-white transition hover:bg-brand-dark"
            >
              ★ {t.reviews.leaveReview}
            </a>
          </div>
        ) : (
          <>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((rev, i) => (
                <motion.figure
                  key={rev.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col rounded-2xl border border-line bg-white p-6 shadow-sm"
                >
                  {rev.image && (
                    <div className="mb-4 size-16 overflow-hidden rounded-full border border-line">
                      <ImageBlock src={rev.image} alt={rev.author} icon="user" rounded="rounded-none" />
                    </div>
                  )}
                  <Stars rating={rev.rating} />
                  <blockquote className="mt-4 flex-1 text-base leading-relaxed text-ink">
                    “{rev.text}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                    <span className="font-bold text-ink">{rev.author}</span>
                    <span className="text-sm text-muted">{rev.date}</span>
                  </figcaption>
                </motion.figure>
              ))}
            </div>
            <div className="mt-10 text-center">
              <a
                href={writeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-brand px-6 text-base font-semibold text-brand-dark transition hover:bg-brand-50"
              >
                ★ {t.reviews.leaveReview}
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
