import { getContent, updateContent } from "@/lib/db";
import { isAuthed } from "@/lib/auth";
import type { SiteContent } from "@/lib/types";

// GET — public site content.
export async function GET() {
  const content = await getContent();
  return Response.json({ content });
}

// PATCH — update site content (admin only). Accepts a partial { hero?, team?, footer? }
// and shallow-merges each provided section over the current value.
export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Partial<SiteContent>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = await updateContent((c) => ({
    hero: { ...c.hero, ...(body.hero ?? {}) },
    team: { ...c.team, ...(body.team ?? {}) },
    footer: { ...c.footer, ...(body.footer ?? {}) },
    styles: body.styles ?? c.styles,
    blocks: body.blocks ?? c.blocks,
    blocksPosition: body.blocksPosition ?? c.blocksPosition,
    gallery: body.gallery ?? c.gallery,
    essays: body.essays ?? c.essays,
    backgrounds: body.backgrounds ?? c.backgrounds,
    reviews: body.reviews ?? c.reviews,
    googlePlaceId: body.googlePlaceId ?? c.googlePlaceId,
    showGoogleReviews: body.showGoogleReviews ?? c.showGoogleReviews,
    sectionOrder: body.sectionOrder ?? c.sectionOrder,
    hiddenSections: body.hiddenSections ?? c.hiddenSections,
  }));

  return Response.json({ content: updated });
}
