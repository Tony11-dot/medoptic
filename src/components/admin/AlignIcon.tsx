// Crisp text-alignment icons (SVG) — replaces unicode glyphs that render as
// missing-character boxes in some fonts/OSes.
export function AlignIcon({ align }: { align: "start" | "center" | "end" }) {
  // Short lines (rows 2 & 4) shift by alignment; long lines stay full width.
  const short =
    align === "start"
      ? { x1: 3, x2: 13 }
      : align === "end"
        ? { x1: 7, x2: 17 }
        : { x1: 5, x2: 15 };
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="3" y1="5" x2="17" y2="5" />
        <line x1={short.x1} y1="10" x2={short.x2} y2="10" />
        <line x1="3" y1="15" x2="17" y2="15" />
      </g>
    </svg>
  );
}
