import { cn } from "@/lib/cn";

// Renders an image, or a branded placeholder when no src is set.
// Uses a plain <img> so locally-uploaded /uploads paths work without
// next/image remote-pattern configuration (fine for this prototype).
export function ImageBlock({
  src,
  alt,
  className,
  rounded = "rounded-2xl",
  icon = "glasses",
}: {
  src?: string;
  alt: string;
  className?: string;
  rounded?: string;
  icon?: "glasses" | "eye" | "user";
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn("h-full w-full object-cover", rounded, className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden brand-gradient-animated",
        rounded,
        className,
      )}
      aria-label={alt}
      role="img"
    >
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_30%_20%,white,transparent_40%)]" />
      <Glyph kind={icon} />
    </div>
  );
}

function Glyph({ kind }: { kind: "glasses" | "eye" | "user" }) {
  const common = { fill: "none", stroke: "white", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "eye") {
    return (
      <svg width="64" height="64" viewBox="0 0 48 48" className="opacity-90">
        <path d="M4 24s7-11 20-11 20 11 20 11-7 11-20 11S4 24 4 24Z" {...common} />
        <circle cx="24" cy="24" r="6" {...common} />
      </svg>
    );
  }
  if (kind === "user") {
    return (
      <svg width="64" height="64" viewBox="0 0 48 48" className="opacity-90">
        <circle cx="24" cy="18" r="8" {...common} />
        <path d="M8 40c2-8 9-12 16-12s14 4 16 12" {...common} />
      </svg>
    );
  }
  return (
    <svg width="72" height="72" viewBox="0 0 48 48" className="opacity-90">
      <circle cx="13" cy="28" r="7" {...common} />
      <circle cx="35" cy="28" r="7" {...common} />
      <path d="M20 27c1.5-2 6.5-2 8 0M4 24l3-6h6M44 24l-3-6h-6" {...common} />
    </svg>
  );
}
