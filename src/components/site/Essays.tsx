"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Essay } from "@/lib/types";

// Admin-written essays: each is a band of text over its own background image.
export function Essays({ essays }: { essays: Essay[] }) {
  const { pick } = useI18n();
  const visible = essays.filter((e) => pick(e.title) || pick(e.body));
  if (visible.length === 0) return null;

  return (
    <section id="essays" className="scroll-mt-20">
      {visible.map((e) => (
        <article key={e.id} className="relative flex min-h-[60vh] items-center overflow-hidden py-20 md:py-28">
          {/* background */}
          {e.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={e.image}
                alt=""
                style={{ objectPosition: e.imagePosition }}
                className="absolute inset-0 -z-10 h-full w-full object-cover"
              />
              <div className="absolute inset-0 -z-10 bg-black/45" />
            </>
          ) : (
            <div className="absolute inset-0 -z-10 brand-gradient" />
          )}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="container-x text-center text-white"
          >
            {pick(e.title) && (
              <h2 className="mx-auto max-w-3xl whitespace-pre-line text-3xl font-extrabold leading-tight drop-shadow md:text-5xl">
                {pick(e.title)}
              </h2>
            )}
            {pick(e.body) && (
              <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-white/90 drop-shadow md:text-xl">
                {pick(e.body)}
              </p>
            )}
          </motion.div>
        </article>
      ))}
    </section>
  );
}
