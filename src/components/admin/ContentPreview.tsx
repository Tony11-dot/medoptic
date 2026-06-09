"use client";

import type { Locale, Localized, SiteContent } from "@/lib/types";
import { STYLE_KEYS, styleToCss } from "@/lib/textStyle";
import { ImageBlock } from "@/components/ui/ImageBlock";

// A close (not pixel-perfect) live preview of how a section looks on the site,
// reflecting unsaved content + text styles in the chosen language.
export function ContentPreview({
  content,
  locale,
  tab,
}: {
  content: SiteContent;
  locale: Locale;
  tab: "hero" | "team" | "footer" | "blocks" | "gallery" | "reviews" | "backgrounds";
}) {
  const pick = (v: Localized) => v?.[locale] || v?.he || "";
  const dir = locale === "he" ? "rtl" : "ltr";
  const st = (key: string) => styleToCss(content.styles?.[key]);

  return (
    <div dir={dir} className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="border-b border-line bg-surface px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
        Live preview
      </div>
      <div className="max-h-[70vh] overflow-y-auto p-5">
        {tab === "hero" && (
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-dark">
              <span className="size-1.5 rounded-full bg-brand" /> MEDOPTIC
            </span>
            <h1 style={st(STYLE_KEYS.heroTitle)} className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink">
              {pick(content.hero.title) || "Headline"}
            </h1>
            <p style={st(STYLE_KEYS.heroSubtitle)} className="mt-2 text-lg font-semibold text-brand">
              {pick(content.hero.subtitle) || "Subtitle"}
            </p>
            <p style={st(STYLE_KEYS.heroBody)} className="mt-3 text-base leading-relaxed text-muted">
              {pick(content.hero.body) || "Body text…"}
            </p>
            <div className="mt-4 aspect-[16/10] w-full overflow-hidden rounded-xl">
              <ImageBlock src={content.hero.image} alt="hero" icon="eye" rounded="rounded-xl" />
            </div>
          </div>
        )}

        {tab === "team" && (
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
              MEDOPTIC
            </span>
            <h2 style={st(STYLE_KEYS.teamHeading)} className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
              {pick(content.team.heading) || "Section heading"}
            </h2>
            <p style={st(STYLE_KEYS.teamBody)} className="mx-auto mt-2 max-w-md text-base text-muted">
              {pick(content.team.body) || "Section description…"}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-start">
              {content.team.members.slice(0, 4).map((m) => (
                <div key={m.id} className="overflow-hidden rounded-xl border border-line">
                  <div className="aspect-[4/3]">
                    <ImageBlock src={m.image} alt={m.name} icon="user" rounded="rounded-none" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-bold text-ink">{m.name || "Name"}</p>
                    <p className="text-xs font-semibold text-brand">{pick(m.title)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "footer" && (
          <div className="rounded-xl brand-gradient p-5 text-white">
            <p className="text-lg font-extrabold">MEDOPTIC</p>
            <p className="mt-1 text-sm text-white/80">{pick(content.footer.address)}</p>
            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex gap-2"><dt className="text-white/60">Phone:</dt><dd dir="ltr">{content.footer.phone}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60">Email:</dt><dd dir="ltr">{content.footer.email}</dd></div>
              <div className="flex gap-2"><dt className="text-white/60">Hours:</dt><dd>{pick(content.footer.hours)}</dd></div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {content.footer.social.map((s, i) => (
                <span key={i} className="rounded-md bg-white/15 px-2 py-1 text-xs">{s.label || "Link"}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
