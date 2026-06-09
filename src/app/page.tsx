import { Fragment } from "react";
import { promises as fs } from "fs";
import path from "path";
import { getContent, getServices } from "@/lib/db";
import { Navbar } from "@/components/site/Navbar";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { Hero } from "@/components/site/Hero";
import { Gallery } from "@/components/site/Gallery";
import { Optometrists } from "@/components/site/Optometrists";
import { Services } from "@/components/site/Services";
import { Reviews } from "@/components/site/Reviews";
import { Booking } from "@/components/site/Booking";
import { Footer } from "@/components/site/Footer";
import { BlocksLive } from "@/components/site/Blocks";
import type { BlocksPosition, Review } from "@/lib/types";

// Always render fresh so admin edits to content show immediately.
export const dynamic = "force-dynamic";

// Returns `/<name>` if that file exists under /public, else undefined. Lets you
// drop in a default background image without going through the admin uploader.
async function fileBg(name: string): Promise<string | undefined> {
  try {
    await fs.access(path.join(process.cwd(), "public", name));
    return `/${name}`;
  } catch {
    return undefined;
  }
}

export default async function HomePage() {
  const [content, services] = await Promise.all([getContent(), getServices()]);
  const enabledServices = services.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const position: BlocksPosition = content.blocksPosition ?? "afterProducts";
  const bg = (id: string) => content.backgrounds?.[id];

  // Reviews: admin-entered + approved visitor submissions (pending ones hidden).
  const reviews: Review[] = (content.reviews ?? []).filter((r) => r.approved !== false);

  // "Who We Are" is the home/Hero section. Use the admin-uploaded background if
  // set, otherwise fall back to public/who-we-are.jpg if you've dropped one in.
  const homeBg = bg("home") ?? (await fileBg("who-we-are.jpg"));

  // Every section can be reordered / hidden from the admin (Sections page).
  const sectionEls: Record<string, React.ReactNode> = {
    home: <Hero key="home" hero={content.hero} styles={content.styles} bg={homeBg} />,
    gallery: <Gallery key="gallery" gallery={content.gallery ?? []} bg={bg("gallery")} styles={content.styles} />,
    team: <Optometrists key="team" team={content.team} styles={content.styles} bg={bg("team")} />,
    services: <Services key="services" services={enabledServices} bg={bg("services")} />,
    reviews: <Reviews key="reviews" reviews={reviews} placeId={content.googlePlaceId} bg={bg("reviews")} />,
    book: <Booking key="book" bg={bg("book")} />,
    contact: <Footer key="contact" footer={content.footer} styles={content.styles} />,
  };
  const DEFAULT_ORDER = ["home", "gallery", "team", "services", "reviews", "book", "contact"];
  const order = (content.sectionOrder ?? DEFAULT_ORDER).filter((id) => id in sectionEls);
  for (const id of DEFAULT_ORDER) if (!order.includes(id)) order.push(id);
  const hidden = new Set(content.hiddenSections ?? []);
  const visibleOrder = order.filter((id) => !hidden.has(id));

  // Custom blocks (if any) anchor relative to certain sections.
  const blocksBefore: Record<string, BlocksPosition> = { book: "beforeBooking", contact: "beforeFooter" };
  const blocksAfter: Record<string, BlocksPosition> = { home: "afterHero", gallery: "afterProducts" };
  const blocks = (at: BlocksPosition | undefined) =>
    at && position === at ? <BlocksLive blocks={content.blocks} /> : null;

  return (
    <>
      <ScrollProgress />
      <Navbar sections={visibleOrder} />
      <main>
        {visibleOrder.map((id) => (
          <Fragment key={id}>
            {blocks(blocksBefore[id])}
            {sectionEls[id]}
            {blocks(blocksAfter[id])}
          </Fragment>
        ))}
      </main>
    </>
  );
}
