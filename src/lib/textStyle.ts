// Shared text-styling helpers used by both the admin editor and the public site.
import type { CSSProperties } from "react";
import type { TextStyle } from "./types";

// Curated "top 10" font choices. All are web-safe stacks (no extra font
// downloads) and most carry Hebrew + Cyrillic glyphs, so they work in all three
// site languages. "default" is the site's Rubik.
export const FONT_OPTIONS: { id: string; label: string; css: string }[] = [
  { id: "default", label: "Default (Rubik)", css: "var(--font-rubik), system-ui, sans-serif" },
  { id: "system", label: "System", css: "system-ui, -apple-system, Segoe UI, sans-serif" },
  { id: "arial", label: "Arial", css: "Arial, Helvetica, sans-serif" },
  { id: "helvetica", label: "Helvetica", css: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
  { id: "verdana", label: "Verdana", css: "Verdana, Geneva, sans-serif" },
  { id: "tahoma", label: "Tahoma", css: "Tahoma, Geneva, sans-serif" },
  { id: "trebuchet", label: "Trebuchet", css: "'Trebuchet MS', Tahoma, sans-serif" },
  { id: "georgia", label: "Georgia (serif)", css: "Georgia, 'Times New Roman', serif" },
  { id: "times", label: "Times (serif)", css: "'Times New Roman', Times, serif" },
  { id: "mono", label: "Monospace", css: "'Courier New', ui-monospace, monospace" },
];

export function fontCss(id?: string): string | undefined {
  if (!id) return undefined;
  return FONT_OPTIONS.find((f) => f.id === id)?.css;
}

// Stable keys for each styleable field, stored in SiteContent.styles.
export const STYLE_KEYS = {
  heroTitle: "hero.title",
  heroSubtitle: "hero.subtitle",
  heroBody: "hero.body",
  teamHeading: "team.heading",
  teamBody: "team.body",
} as const;

const ALIGN_MAP: Record<NonNullable<TextStyle["align"]>, CSSProperties["textAlign"]> = {
  start: "start",
  center: "center",
  end: "end",
};

/** Convert a TextStyle into inline CSS. Only sets properties the admin chose,
 *  so unset ones keep the component's default (responsive) design. */
export function styleToCss(s?: TextStyle): CSSProperties {
  if (!s) return {};
  const css: CSSProperties = {};
  if (s.fontFamily) css.fontFamily = fontCss(s.fontFamily);
  if (s.fontSize) {
    css.fontSize = `${s.fontSize}px`;
    css.lineHeight = 1.15;
  }
  if (s.bold) css.fontWeight = 800;
  if (s.italic) css.fontStyle = "italic";
  if (s.align) css.textAlign = ALIGN_MAP[s.align];
  if (s.color) css.color = s.color;
  return css;
}
