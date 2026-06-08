import { getContent, getServices } from "@/lib/db";
import { Navbar } from "@/components/site/Navbar";
import { ScrollProgress } from "@/components/site/ScrollProgress";
import { Hero } from "@/components/site/Hero";
import { Gallery } from "@/components/site/Gallery";
import { Optometrists } from "@/components/site/Optometrists";
import { Services } from "@/components/site/Services";
import { Booking } from "@/components/site/Booking";
import { Footer } from "@/components/site/Footer";
import { BlocksLive } from "@/components/site/Blocks";
import type { BlocksPosition } from "@/lib/types";

// Always render fresh so admin edits to content show immediately.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [content, services] = await Promise.all([getContent(), getServices()]);
  const enabledServices = services.filter((s) => s.enabled).sort((a, b) => a.order - b.order);

  const position: BlocksPosition = content.blocksPosition ?? "afterProducts";
  const blocksAt = (at: BlocksPosition) =>
    position === at ? <BlocksLive blocks={content.blocks} /> : null;

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>
        <Hero hero={content.hero} styles={content.styles} />
        {blocksAt("afterHero")}
        <Gallery gallery={content.gallery ?? []} />
        {blocksAt("afterProducts")}
        <Optometrists team={content.team} styles={content.styles} />
        <Services services={enabledServices} />
        {blocksAt("beforeBooking")}
        <Booking />
        {blocksAt("beforeFooter")}
        <Footer footer={content.footer} />
      </main>
    </>
  );
}
