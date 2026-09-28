// The clinic's physical location — one place for every map / navigation link
// (footer address, the "find us" card under the reviews).

const ADDRESS = "Ha-Ta'asiya St 1, Yokne'am Illit, 2069200";
const PLACE_QUERY = `MEDOPTIC, ${ADDRESS}`;

/** Google Business Profile short link (reviews live here). */
export const GOOGLE_PROFILE_URL = "https://g.page/r/CS0DCpLShLONEBM";
export const GOOGLE_WRITE_REVIEW_URL = `${GOOGLE_PROFILE_URL}/review`;

export const WAZE_URL = `https://waze.com/ul?q=${encodeURIComponent(ADDRESS)}&navigate=yes`;
export const GOOGLE_MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(PLACE_QUERY)}`;

/** Keyless Google Maps embed, labelled in the visitor's language. */
export const googleMapsEmbedUrl = (lang: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(PLACE_QUERY)}&hl=${lang}&z=16&output=embed`;
