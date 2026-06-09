"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/lib/cn";

type SectionId = "home" | "gallery" | "team" | "services" | "reviews" | "book" | "contact";
const SECTIONS_DEFAULT = ["home", "gallery", "team", "services", "reviews", "book", "contact"];

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
