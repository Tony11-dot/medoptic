// Map / navigation links for the clinic. Everything is built from the address
// the admin saved (Admin → Content → Footer), so moving the clinic is a
// content edit — no code change. The constant is only a fallback for when no
// address has been entered.
import { localizedOr, type Localized } from "./types";

const FALLBACK_ADDRESS = "Ha-Ta'asiya St 1, Yokne'am Illit, 2069200";

/** Google Business Profile short link (reviews live here). */
export const GOOGLE_PROFILE_URL = "https://g.page/r/CS0DCpLShLONEBM";
export const GOOGLE_WRITE_REVIEW_URL = `${GOOGLE_PROFILE_URL}/review`;

/** One-line address for geocoding (English-first — the form Waze and Google
 * resolve most reliably — then any other language; line breaks → commas). */
export function clinicAddress(address?: Localized): string {
  const raw = address ? address.en?.trim() || localizedOr(address, "") : "";
  const oneLine = raw.split(/\s*\n\s*/).filter(Boolean).join(", ").trim();
  return oneLine || FALLBACK_ADDRESS;
}

// Prefixing the business name makes Google pin the MEDOPTIC listing itself
// (with its rating card) rather than a bare street address.
const placeQuery = (address?: Localized) => `MEDOPTIC, ${clinicAddress(address)}`;

export const wazeUrl = (address?: Localized) =>
  `https://waze.com/ul?q=${encodeURIComponent(clinicAddress(address))}&navigate=yes`;

export const googleMapsDirectionsUrl = (address?: Localized) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(placeQuery(address))}`;

/** Keyless Google Maps embed, labelled in the visitor's language. */
export const googleMapsEmbedUrl = (address: Localized | undefined, lang: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(placeQuery(address))}&hl=${lang}&z=16&output=embed`;
