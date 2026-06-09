// A soft, transparent background image for a section. The white overlay keeps
// text readable (important for the older audience). Renders nothing if no image.
// The parent <section> must be `relative` (and usually `overflow-hidden`).
export function SectionBg({ url, overlay = 78 }: { url?: string; overlay?: number }) {
  if (!url) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-white" style={{ opacity: overlay / 100 }} />
    </div>
  );
}
