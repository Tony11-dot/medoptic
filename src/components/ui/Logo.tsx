import { cn } from "@/lib/cn";

// The official MEDOPTIC logo (full lockup: mark + wordmark + tagline) lives in
// /public/uploads. Rendered as a plain <img> so it works without next/image
// config. `className` controls the height (default h-10).
const LOGO_SRC = "/logo-web.png";

export function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="MEDOPTIC"
      className={cn("h-14 w-auto select-none", className)}
    />
  );
}
