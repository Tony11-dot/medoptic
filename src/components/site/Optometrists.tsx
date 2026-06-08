"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { SiteContent } from "@/lib/types";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { SectionHeading } from "./SectionHeading";
import { STYLE_KEYS, styleToCss } from "@/lib/textStyle";

export function Optometrists({
  team,
  styles,
}: {
  team: SiteContent["team"];
  styles?: SiteContent["styles"];
}) {
  const { t, pick } = useI18n();

  return (
    <section id="team" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-x">
        <SectionHeading
          eyebrow={t.team.eyebrow}
          title={pick(team.heading)}
          subtitle={pick(team.body)}
          titleStyle={styleToCss(styles?.[STYLE_KEYS.teamHeading])}
          subtitleStyle={styleToCss(styles?.[STYLE_KEYS.teamBody])}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.members.map((m, i) => (
            <motion.article
              key={m.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-card"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <div className="h-full transition-transform duration-500 group-hover:scale-105">
                  <ImageBlock src={m.image} alt={m.name} icon="user" rounded="rounded-none" />
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-ink">{m.name}</h3>
                <p className="text-sm font-semibold text-brand">{pick(m.title)}</p>
                <p className="mt-2 text-sm text-muted">{pick(m.specialty)}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
