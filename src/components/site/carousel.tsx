"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";

// Shared pause logic for the auto-scrolling carousels (reviews, gallery).
// Motion stops while a mouse hovers over the carousel or keyboard focus is inside
// it; on touch screens a tap toggles a sticky pause ("pinned") so people can read
// at their own pace. Also stays still for the OS "reduce motion" setting and the
// site's accessibility widget ("Stop animations").
export function useCarouselPause() {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [reduced, setReduced] = useState(false);
  const lastPointer = useRef("mouse");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const update = () => setReduced(mq.matches || root.classList.contains("a11y-reduce-motion"));
    update();
    mq.addEventListener("change", update);
    const mo = new MutationObserver(update);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => {
      mq.removeEventListener("change", update);
      mo.disconnect();
    };
  }, []);

  // Spread onto the carousel wrapper (arrows, dots and the pause button included).
  const bind = {
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setHovered(true);
    },
    onPointerLeave: (e: React.PointerEvent) => {
      if (e.pointerType === "mouse") setHovered(false);
    },
    onPointerDown: (e: React.PointerEvent) => {
      lastPointer.current = e.pointerType;
    },
    // Only keyboard focus pauses; a mouse click on an arrow shouldn't stick.
    onFocus: (e: React.FocusEvent) => {
      if ((e.target as HTMLElement).matches(":focus-visible")) setFocused(true);
    },
    onBlur: (e: React.FocusEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
    },
  };

  // Click handler for the moving surface: a tap (touch/pen) toggles the pause.
  // Mouse users already pause by hovering, and taps on controls are ignored.
  // Returns whether it toggled.
  const onSurfaceClick = (e: React.MouseEvent) => {
    if (lastPointer.current === "mouse") return false;
    if ((e.target as HTMLElement).closest("a, button")) return false;
    setPinned((p) => !p);
    return true;
  };

  return {
    paused: hovered || focused || pinned || reduced,
    pinned,
    setPinned,
    reduced,
    bind,
    onSurfaceClick,
  };
}

// Small round pause/play toggle shown under each carousel (and the visible
// "stop moving content" control accessibility guidelines ask for).
// `compact` drops the "paused" label, for tight rows like the gallery dots.
export function PauseButton({
  pinned,
  onToggle,
  compact = false,
  className = "",
}: {
  pinned: boolean;
  onToggle: () => void;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pinned}
      aria-label={pinned ? t.carousel.play : t.carousel.pause}
      title={pinned ? t.carousel.play : t.carousel.pause}
      className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white/90 text-sm font-semibold text-brand-dark shadow-sm transition hover:border-brand ${compact ? "w-9" : "px-3"} ${className}`}
    >
      <span aria-hidden className="text-xs leading-none">{pinned ? "▶" : "❚❚"}</span>
      {pinned && !compact && <span>{t.carousel.paused}</span>}
    </button>
  );
}
