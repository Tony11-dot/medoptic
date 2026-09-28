"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { OpeningRule, SiteContent } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";
import { styleToCss } from "@/lib/textStyle";
import { formatOpeningLines } from "@/lib/schedule";
import { WAZE_URL } from "@/lib/location";
import { SocialIcon, socialHref } from "./SocialIcon";

export function Footer({
  footer,
  styles,
  openingRules,
}: {
  footer: SiteContent["footer"];
  styles?: SiteContent["styles"];
  /** Admin-managed opening hours (Admin → Schedule). When present they replace
   * the manually-typed footer hours, so the footer always matches the booking
   * system automatically. */
  openingRules?: OpeningRule[];
}) {
  const { t, pick } = useI18n();
  const hourLines = formatOpeningLines(openingRules ?? [], t.weekdaysShort);
  const hasContact = !!(footer.phone || footer.email);

  return (
    <footer id="contact" className="scroll-mt-20 brand-gradient text-white">
      <div className="container-x py-10">
        {/* Single full-width row — spreads edge to edge on desktop, stacks
            centred on mobile. */}
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:justify-between md:gap-10 md:text-start">
          {/* brand + address (the address links straight into Waze navigation) */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <Logo className="h-16 w-auto brightness-0 invert" />
            {pick(footer.address) && (
              <a
                href={WAZE_URL}
                target="_blank"
                rel="noopener noreferrer"
                title={t.footer.directions}
                className="group max-w-xs whitespace-pre-line text-sm text-white/80 transition hover:text-white"
                style={styleToCss(styles?.["footer.address"])}
              >
                📍 {pick(footer.address)}
                <span className="mt-0.5 block text-xs text-white/55 transition group-hover:text-white/80">
                  {t.footer.directions} ↗
                </span>
              </a>
            )}
          </div>

          {hasContact && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">{t.footer.contact}</h3>
              <ul className="mt-2 space-y-1 text-sm">
                {footer.phone && (
                  <li>
                    <a href={`tel:${footer.phone.replace(/\s/g, "")}`} className="text-white/90 transition hover:text-white" dir="ltr">
                      {footer.phone}
                    </a>
                  </li>
                )}
                {footer.email && (
                  <li>
                    <a href={`mailto:${footer.email}`} className="text-white/90 transition hover:text-white">
                      {footer.email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">{t.footer.hours}</h3>
            {hourLines.length > 0 ? (
              <div className="mt-2 space-y-1 text-sm text-white/90" style={styleToCss(styles?.["footer.hours"])}>
                {hourLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="mt-2 whitespace-pre-line text-sm text-white/90" style={styleToCss(styles?.["footer.hours"])}>{pick(footer.hours)}</p>
            )}
          </div>

          {/* follow */}
          <div className="flex flex-col items-center gap-2.5 md:items-end">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">{t.footer.follow}</h3>
            <ul className="flex flex-wrap justify-center gap-2.5">
              {footer.social.map((s) => {
                const href = socialHref(s.label, s.url);
                if (!href) return null;
                return (
                  <li key={s.label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      title={s.label}
                      className="grid size-10 place-items-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                    >
                      <SocialIcon label={s.label} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3 border-t border-white/15 pt-5 text-center text-sm text-white/70">
          <p>© {new Date().getFullYear()} MEDOPTIC. {t.footer.rights}</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-white/60">
            <Link href="/privacy" className="transition hover:text-white">{t.footer.privacy}</Link>
            <Link href="/cookies" className="transition hover:text-white">{t.footer.cookies}</Link>
            <Link href="/terms" className="transition hover:text-white">{t.footer.terms}</Link>
          </nav>
          <p className="text-xs text-white/50">
            {t.footer.credit}{" "}
            <a
              href="https://github.com/Tony11-dot"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white/70 transition hover:text-white"
            >
              Tony Aboud
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
