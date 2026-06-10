"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/cn";

type SectionId = "home" | "gallery" | "team" | "services" | "reviews" | "essays" | "book" | "contact";
const SECTIONS_DEFAULT = ["home", "gallery", "team", "services", "reviews", "essays", "book", "contact"];
const WHATSAPP_URL = "https://wa.me/972509652008";

export function Navbar({ sections = SECTIONS_DEFAULT }: { sections?: string[] }) {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<SectionId>("home");
  const [menuOpen, setMenuOpen] = useState(false);

  // Nav tabs follow the admin's Sections order/visibility (all sections).
  const SECTIONS = sections as SectionId[];

  const labels: Record<SectionId, string> = {
    home: t.nav.home,
    gallery: t.nav.gallery,
    team: t.nav.team,
    services: t.nav.services,
    reviews: t.nav.reviews,
    essays: t.nav.essays,
    book: t.nav.book,
    contact: t.nav.contact,
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll spy: highlight the nav link for the section in view.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id as SectionId);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    SECTIONS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-transparent backdrop-blur-xl transition-all duration-300",
        scrolled ? "py-1" : "py-2",
      )}
    >
      <nav className="container-x flex items-center justify-between gap-4">
        <a href="#home" aria-label="MEDOPTIC home" className="group relative transition hover:opacity-90">
          {/* soft spotlight behind the logo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-x-4 -inset-y-3 -z-10 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,204,0.18),transparent_70%)] blur-md"
          />
          <Logo className={cn("transition-all duration-300", scrolled ? "h-12" : "h-16")} />
        </a>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((id) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={cn(
                  "relative rounded-lg px-3.5 py-2 text-sm font-semibold transition",
                  active === id ? "text-brand-dark" : "text-ink/70 hover:text-brand-dark",
                )}
              >
                {labels[id]}
                {active === id && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            title="WhatsApp"
            className="grid size-10 place-items-center rounded-xl bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.3)] transition hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
              <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.973-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>
            </svg>
          </a>
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <a
            href="#book"
            className="hidden rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,102,204,0.28)] transition hover:-translate-y-0.5 hover:bg-brand-dark sm:inline-flex"
          >
            {t.nav.book}
          </a>
          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="grid size-10 place-items-center rounded-lg text-ink transition hover:bg-brand-50 md:hidden"
          >
            <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-line bg-white/95 backdrop-blur-xl md:hidden"
          >
            <ul className="container-x flex flex-col gap-1 py-3">
              {SECTIONS.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-sm font-semibold transition",
                      active === id ? "bg-brand-50 text-brand-dark" : "text-ink/80 hover:bg-surface",
                    )}
                  >
                    {labels[id]}
                  </a>
                </li>
              ))}
              <li className="px-3 py-2">
                <LanguageSwitcher />
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* admin shortcut kept discreet */}
      <Link href="/admin" className="sr-only">
        Admin
      </Link>
    </header>
  );
}
