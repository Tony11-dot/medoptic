"use client";

import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { SiteContent } from "@/lib/types";
import { Logo } from "@/components/ui/Logo";
import { SocialIcon, socialHref } from "./SocialIcon";

export function Footer({ footer }: { footer: SiteContent["footer"] }) {
  const { t, pick } = useI18n();

  return (
    <footer id="contact" className="scroll-mt-20 brand-gradient text-white">
      <div className="container-x py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <span className="inline-flex">
              <Logo className="h-28 w-auto brightness-0 invert" />
            </span>
            <p className="mt-4 max-w-xs text-sm text-white/75">{pick(footer.address)}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">{t.footer.contact}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={`tel:${footer.phone.replace(/\s/g, "")}`} className="text-white/90 transition hover:text-white" dir="ltr">
                  {footer.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${footer.email}`} className="text-white/90 transition hover:text-white">
                  {footer.email}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">{t.footer.hours}</h3>
            <p className="mt-4 text-sm text-white/90">{pick(footer.hours)}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60">{t.footer.follow}</h3>
            <ul className="mt-4 flex flex-wrap gap-2.5">
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
                      className="grid size-11 place-items-center rounded-xl bg-white/10 text-white transition hover:-translate-y-0.5 hover:bg-white/20"
                    >
                      <SocialIcon label={s.label} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-white/15 pt-6 text-sm text-white/70">
          <p>© {new Date().getFullYear()} MEDOPTIC. {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
