"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Review } from "@/lib/types";
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

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || text.trim().length < 2) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: name, rating, text }),
      });
      if (!res.ok) throw new Error();
      setName("");
      setText("");
      setRating(5);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  // The two CTAs (write on the site / on Google) shown under the reviews.
  const ctas = (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => { setStatus("idle"); setOpen(true); }}
        className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-base font-semibold text-white transition hover:bg-brand-dark"
      >
        ✍ {t.reviews.writeReview}
      </button>
      <a
        href={writeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-12 items-center justify-center rounded-xl border-2 border-brand px-6 text-base font-semibold text-brand-dark transition hover:bg-brand-50"
      >
        ★ {t.reviews.leaveReview}
      </a>
    </div>
  );

  return (
    <section id="reviews" className={`relative scroll-mt-20 overflow-hidden py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
      <SectionBg url={bg} />
      <div className="container-x">
        <SectionHeading eyebrow={t.reviews.eyebrow} title={t.reviews.heading} subtitle={t.reviews.subheading} />

        {reviews.length === 0 ? (
          <div className="mx-auto mt-12 max-w-xl text-center">
            <p className="mb-6 text-lg text-muted">{t.reviews.empty}</p>
            {ctas}
          </div>
        ) : (
          <>
            <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((rev, i) => {
                const isPhoto = (rev.source ?? (rev.image ? "google" : "manual")) === "google";
                if (isPhoto && !rev.image) return null;
                return (
                <motion.figure
                  key={rev.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className={`flex flex-col rounded-2xl border border-line bg-white shadow-sm ${isPhoto ? "self-start overflow-hidden" : "p-6"}`}
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
                      <Stars rating={rev.rating} />
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
            <div className="mt-10">{ctas}</div>
          </>
        )}
      </div>

      {/* Write-a-review form */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
            >
              {status === "done" ? (
                <div className="text-center">
                  <p className="text-4xl">🙏</p>
                  <p className="mt-3 text-lg font-semibold text-ink">{t.reviews.formSuccess}</p>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setStatus("idle"); }}
                    className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-8 text-base font-semibold text-white"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <h3 className="text-2xl font-extrabold text-ink">{t.reviews.formTitle}</h3>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink">{t.reviews.formName}</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-line px-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </label>
                  <div>
                    <span className="mb-1.5 block text-sm font-semibold text-ink">{t.reviews.formRating}</span>
                    <div className="flex gap-1 text-4xl leading-none">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          aria-label={`${n} / 5`}
                          className={n <= rating ? "text-amber-400" : "text-line"}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-ink">{t.reviews.formText}</span>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={4}
                      required
                      className="w-full resize-none rounded-xl border border-line p-4 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </label>
                  {status === "error" && <p className="text-sm font-semibold text-rose-600">{t.reviews.formError}</p>}
                  <div className="flex justify-end gap-2 pt-1">
                    <button type="button" onClick={() => setOpen(false)} className="inline-flex h-12 items-center justify-center rounded-xl px-5 text-base font-semibold text-muted transition hover:bg-surface">
                      ✕
                    </button>
                    <button type="submit" disabled={status === "sending"} className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-7 text-base font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                      {status === "sending" ? t.reviews.formSubmitting : t.reviews.formSubmit}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
