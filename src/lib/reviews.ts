// Live Google rating + reviews via Google "Places API (New)" Place Details,
// which returns the overall rating, the total review count and up to 5
// reviews. Needs two things to work:
//   • GOOGLE_PLACES_API_KEY  — a key with "Places API (New)" enabled (kept
//                              secret, server-only; set in Vercel env vars)
//   • a Google Place ID      — set in the admin (Content → Reviews)
// Without either, or on any error, the helpers return empty so the section
// falls back to the admin-entered rating/reviews. Never throws to the page.
import "server-only";
import type { Review } from "./types";

interface NewPlaceReview {
  name?: string;
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  relativePublishTimeDescription?: string;
  authorAttribution?: { displayName?: string };
}

interface NewPlaceDetails {
  rating?: number;
  userRatingCount?: number;
  reviews?: NewPlaceReview[];
}

// One request serves both the rating and the reviews. Next caches it for an
// hour (keyed on URL + headers), so the page makes at most ~1 call per hour
// per language instead of one per visit.
async function fetchPlace(placeId: string | undefined, language: string): Promise<NewPlaceDetails | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return null;

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("languageCode", language);

  try {
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      console.error("Google Places request failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    return (await res.json()) as NewPlaceDetails;
  } catch (err) {
    console.error("Google Places request failed", err);
    return null;
  }
}

/** Up to 5 recent Google reviews for the given Place ID. Returns [] if not
 *  configured or on failure. `language` (e.g. "he") sets the text language. */
export async function getGoogleReviews(placeId: string | undefined, language = "he"): Promise<Review[]> {
  const place = await fetchPlace(placeId, language);
  return (place?.reviews ?? [])
    .map((r, i) => ({ r, i, text: (r.text?.text ?? r.originalText?.text ?? "").trim() }))
    .filter(({ text }) => text.length > 0)
    .map(({ r, i, text }) => ({
      id: `google-${r.name ?? i}`,
      author: r.authorAttribution?.displayName?.trim() || "Google user",
      rating: Math.round(r.rating ?? 5),
      text,
      date: r.relativePublishTimeDescription,
      source: "google" as const,
      live: true,
    }));
}

export interface GoogleRating {
  rating: number;
  count: number;
}

/** Overall Google rating + total review count for the place. Same requirements
 *  as {@link getGoogleReviews}; returns null when not configured or on failure. */
export async function getGoogleRating(placeId: string | undefined, language = "he"): Promise<GoogleRating | null> {
  const place = await fetchPlace(placeId, language);
  if (typeof place?.rating !== "number") return null;
  return { rating: place.rating, count: place.userRatingCount ?? 0 };
}
