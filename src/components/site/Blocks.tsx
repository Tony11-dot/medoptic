"use client";

import type { CSSProperties } from "react";
import type { Block, Localized } from "@/lib/types";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { WIDTH_CLASS, JUSTIFY_CLASS } from "@/lib/blocks";
import { styleToCss } from "@/lib/textStyle";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { cn } from "@/lib/cn";

type Pick = (v: Localized) => string;

// Pure renderer — identical output on the public site and in the admin preview,
// so the preview is always accurate. `pick` + `dir` are passed in so it works
// regardless of which language context it's rendered in.
export function Blocks({
  blocks,
  pick,
  dir,
  className,
}: {
  blocks: Block[];
  pick: Pick;
  dir?: "rtl" | "ltr";
  className?: string;
}) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <section dir={dir} className={cn("scroll-mt-20 py-12 md:py-20", className)}>
      <div className="container-x space-y-8 md:space-y-10">
        {blocks.map((b) => (
          <div key={b.id} className={cn("flex", JUSTIFY_CLASS[b.align])}>
            <div className={WIDTH_CLASS[b.width]}>
              <BlockInner block={b} pick={pick} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BlockInner({ block: b, pick }: { block: Block; pick: Pick }) {
  // Text styling, defaulting text-align to the block's chosen placement.
  const css: CSSProperties = styleToCss(b.style);
  if (!css.textAlign) css.textAlign = b.align;

  if (b.type === "heading") {
    return (
      <h2 style={css} className="text-3xl font-extrabold leading-tight tracking-tight text-ink md:text-4xl">
        {pick(b.text ?? blank) || " "}
      </h2>
    );
  }

  if (b.type === "paragraph") {
    return (
      <p style={css} className="text-base leading-relaxed text-muted md:text-lg">
        {pick(b.text ?? blank) || " "}
      </p>
    );
  }

  if (b.type === "button") {
    return (
      <div style={{ textAlign: css.textAlign }}>
        <a
          href={b.href || "#book"}
          style={{ ...css, textAlign: undefined }}
          className="inline-flex h-13 items-center justify-center rounded-xl bg-brand px-7 text-base font-semibold text-white shadow-[0_10px_28px_rgba(0,102,204,0.28)] transition hover:-translate-y-0.5 hover:bg-brand-dark"
        >
          {pick(b.text ?? blank) || "Button"}
        </a>
      </div>
    );
  }

  // image
  const img = b.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={b.image} alt="" loading="lazy" className="h-auto w-full rounded-2xl shadow-sm" />
  ) : (
    <div className="aspect-video overflow-hidden rounded-2xl">
      <ImageBlock src="" alt="image" rounded="rounded-2xl" />
    </div>
  );
  return b.href ? (
    <a href={b.href} className="block">
      {img}
    </a>
  ) : (
    img
  );
}

const blank: Localized = { he: "", en: "", ru: "" };

// Client wrapper used on the public page: pulls language from the site context.
export function BlocksLive({ blocks }: { blocks?: Block[] }) {
  const { pick, t } = useI18n();
  if (!blocks || blocks.length === 0) return null;
  return <Blocks blocks={blocks} pick={pick} dir={t.dir} />;
}
