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
import { bumpDailyCounter, getKv, setKv } from "./db";
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

// Cost guard — the site must never cost money. Two layers:
//  1. The result is kept in Next's data cache for 6 hours (shared by every
//     visitor and instance), so normal use is ~4 Google calls a day (~125 a
//     month), far inside Google's free monthly allowance. unstable_cache is
//     used rather than fetch's `next.revalidate` because the home page is
//     `force-dynamic`, which turns fetch caching off.
//  2. A hard daily cap counted in the database: past DAILY_LIMIT calls (UTC
//     day) the site stops calling Google and serves the last good answer, so
//     even a bug or cache wipe tops out at DAILY_LIMIT × 31 calls a month.
// Failures throw inside the cached function so they aren't cached (a fixed
// key/Place ID takes effect on the next visit) — but they still count toward
// the daily cap.
const DAILY_LIMIT = 8;
const LAST_GOOD_KEY = "googlePlaceLastGood";

interface LastGood {
  placeId: string;
  language: string;
  data: NewPlaceDetails;
}

const cachedPlace = unstable_cache(
  async (placeId: string, language: string): Promise<NewPlaceDetails> => {
    if ((await bumpDailyCounter("google-places")) > DAILY_LIMIT) {
      const last = await getKv<LastGood | null>(LAST_GOOD_KEY, null);
      console.warn("Google Places daily limit reached; serving last good data");
      return last && last.placeId === placeId && last.language === language ? last.data : {};
    }
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
    const data = (await res.json()) as NewPlaceDetails;
    await setKv<LastGood>(LAST_GOOD_KEY, { placeId, language, data }).catch(() => {});
    return data;
  },
  ["google-place-details-v2"],
  { revalidate: 6 * 3600 },
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
