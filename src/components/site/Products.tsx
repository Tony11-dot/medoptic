"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Product } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { Modal } from "@/components/ui/Modal";
import { SectionHeading } from "./SectionHeading";
import { cn } from "@/lib/cn";

export function Products({ products }: { products: Product[] }) {
  const { t, pick } = useI18n();
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [products]);

  const filtered = category === "all" ? products : products.filter((p) => p.category === category);
  const label = (c: string) => t.products.categories[c] ?? c;
  const price = (p: Product) =>
    p.price > 0 ? t.products.currency(p.price) : t.products.askInStore;

  return (
    <section id="products" className="scroll-mt-20 bg-surface py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow={t.products.eyebrow}
          title={t.products.heading}
          subtitle={t.products.subheading}
        />

        {categories.length > 2 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  category === c
                    ? "bg-brand text-white shadow-[0_8px_20px_rgba(0,102,204,0.25)]"
                    : "bg-white text-ink/70 hover:text-brand-dark",
                )}
              >
                {label(c)}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-muted">{t.products.empty}</p>
        ) : (
          <motion.ul layout className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.45, delay: (i % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <article className="group h-full overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
                    <div className="aspect-[4/3] overflow-hidden">
                      <div className="h-full transition-transform duration-500 group-hover:scale-105">
                        <ImageBlock src={p.image} alt={pick(p.name)} rounded="rounded-none" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-ink">{pick(p.name)}</h3>
                        <span className="whitespace-nowrap text-sm font-extrabold text-brand">
                          {price(p)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted">{pick(p.description)}</p>
                      <button
                        onClick={() => setSelected(p)}
                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark transition hover:gap-2.5"
                      >
                        {t.products.viewDetails}
                        <span className="flip-x" aria-hidden>→</span>
                      </button>
                    </div>
                  </article>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? pick(selected.name) : ""}>
        {selected && (
          <div className="space-y-4">
            <div className="aspect-[4/3] overflow-hidden rounded-xl">
              <ImageBlock src={selected.image} alt={pick(selected.name)} rounded="rounded-xl" />
            </div>
            <p className="text-sm leading-relaxed text-muted">{pick(selected.description)}</p>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-dark">
                {label(selected.category)}
              </span>
              <span className="text-lg font-extrabold text-brand">{price(selected)}</span>
            </div>
            <a
              href="#book"
              onClick={() => setSelected(null)}
              className="block w-full rounded-xl bg-brand py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              {t.hero.cta}
            </a>
          </div>
        )}
      </Modal>
    </section>
  );
}
