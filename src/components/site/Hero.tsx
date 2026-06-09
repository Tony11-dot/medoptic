"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { SiteContent } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { STYLE_KEYS, styleToCss } from "@/lib/textStyle";
import { SectionBg } from "./SectionBg";

export function Hero({
  hero,
  styles,
  bg,
}: {
  hero: SiteContent["hero"];
  styles?: SiteContent["styles"];
  bg?: string;
}) {
  const { t, pick } = useI18n();
  const titleStyle = styleToCss(styles?.[STYLE_KEYS.heroTitle]);
  const subtitleStyle = styleToCss(styles?.[STYLE_KEYS.heroSubtitle]);
  const bodyStyle = styleToCss(styles?.[STYLE_KEYS.heroBody]);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      id="home"
      ref={ref}
      className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28"
    >
      <SectionBg url={bg} />
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 end-[-10%] size-[36rem] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute top-40 start-[-10%] size-[28rem] rounded-full bg-brand-50 blur-3xl" />
      </div>

      <div className="container-x grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-dark"
          >
            <span className="size-2 animate-pulse rounded-full bg-brand" />
            {t.hero.badge}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            style={titleStyle}
            className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-ink md:text-6xl"
          >
            {pick(hero.title)}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            style={subtitleStyle}
            className="mt-3 text-lg font-semibold text-brand"
          >
            {pick(hero.subtitle)}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            style={bodyStyle}
            className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg"
          >
            {pick(hero.body)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href="#book"
              className="inline-flex h-13 items-center justify-center rounded-xl bg-brand px-7 text-base font-semibold text-white shadow-[0_12px_34px_rgba(0,102,204,0.32)] transition hover:-translate-y-0.5 hover:bg-brand-dark"
            >
              {t.hero.cta}
            </a>
            <a
              href="#products"
              className="inline-flex h-13 items-center justify-center rounded-xl border border-line bg-white px-7 text-base font-semibold text-brand-dark transition hover:-translate-y-0.5 hover:border-brand"
            >
              {t.hero.secondary}
            </a>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: visualY }} className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] shadow-card sm:aspect-[5/4] lg:aspect-[4/5]"
          >
            <ImageBlock src={hero.image} alt={pick(hero.title)} icon="eye" rounded="rounded-[2rem]" objectPosition={hero.imagePosition} />
          </motion.div>

          {/* floating accent card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute -bottom-5 start-4 flex items-center gap-3 rounded-2xl bg-white/95 px-5 py-4 shadow-card backdrop-blur"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-xl">👁️</span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">{pick(hero.subtitle)}</p>
              <p className="text-xs text-muted">MEDOPTIC</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
