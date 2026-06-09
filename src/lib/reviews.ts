// Live Google reviews. Uses the Google Places "Place Details" API, which returns
// up to 5 reviews for a place. Needs two things to work:
//   • GOOGLE_PLACES_API_KEY  — a billing-enabled key (kept secret, server-only)
//   • a Google Place ID      — set in the admin (Reviews tab)
// Without either, or on any error, this returns [] so the section just falls
// back to the admin-entered reviews. Never throws to the page.
import "server-only";
import type { Review } from "./types";

interface GooglePlaceReview {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  time?: number;
}

/** Fetch up to 5 Google reviews for the given Place ID. Returns [] if not
 *  configured or on failure. `language` biases the returned review language. */
export async function getGoogleReviews(
  placeId: string | undefined,
  language = "en",
): Promise<Review[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !placeId) return [];

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews");
  url.searchParams.set("reviews_sort", "newest");
  url.searchParams.set("language", language);
  url.searchParams.set("key", key);

  try {
    // Cache for an hour so we don't hit the API (and bill) on every page view.
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { result?: { reviews?: GooglePlaceReview[] } };
    const reviews = data.result?.reviews ?? [];
    return reviews
      .filter((r) => (r.text ?? "").trim().length > 0)
      .map((r, i) => ({
        id: `google-${r.time ?? i}`,
        author: r.author_name?.trim() || "Google user",
        rating: Math.round(r.rating ?? 5),
        text: r.text!.trim(),
        date: r.relative_time_description,
        source: "google" as const,
      }));
  } catch {
    return [];
  }
}
