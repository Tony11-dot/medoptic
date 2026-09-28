// Live Google rating + reviews via Google "Places API (New)" Place Details,
// which returns the overall rating, the total review count and up to 5
// reviews. Needs two things to work:
//   • GOOGLE_PLACES_API_KEY  — a key with "Places API (New)" enabled (kept
//                              secret, server-only; set in Vercel env vars)
//   • a Google Place ID      — set in the admin (Content → Reviews)
// Without either, or on any error, the helpers return empty so the section
// falls back to the admin-entered rating/reviews. Never throws to the page.
import "server-only";
import { unstable_cache } from "next/cache";
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

// One request serves both the rating and the reviews, and its result is kept
// in Next's data cache for an hour — shared by every visitor and instance — so
// Google is called at most ~24 times a day (~750/month), inside the free
// monthly allowance. unstable_cache is used rather than fetch's own
// `next.revalidate` because the home page is `force-dynamic`, which turns
// fetch caching off. Failures throw inside the cached function so they are
// NOT cached: fixing a bad key/Place ID takes effect on the next visit.
const cachedPlace = unstable_cache(
  async (placeId: string, language: string): Promise<NewPlaceDetails> => {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    url.searchParams.set("languageCode", language);
    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text().catch(() => "")}`);
    return (await res.json()) as NewPlaceDetails;
  },
  ["google-place-details-v1"],
  { revalidate: 3600 },
);

async function fetchPlace(placeId: string | undefined, language: string): Promise<NewPlaceDetails | null> {
  if (!process.env.GOOGLE_PLACES_API_KEY || !placeId) return null;
  try {
    return await cachedPlace(placeId, language);
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
