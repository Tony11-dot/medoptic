// Shared domain types for the MEDOPTIC site + admin platform.

export type Locale = "he" | "en" | "ru";

export type Localized = Record<Locale, string>;

/** First non-empty translation (Hebrew-first — the shop's primary language),
 * or `fallback`. The one place that defines the fallback order. */
export const localizedOr = (v: Localized, fallback: string): string =>
  v.he || v.en || v.ru || fallback;

// Built-in service keys used as the seed services' ids. Services are managed by
// admins at runtime, so this union is only the *starting* set, not a hard limit.
export type ServiceType = "eye_test" | "glasses" | "consultation" | "repair";

export type AppointmentStatus = "pending" | "approved" | "declined";

/** How the customer wants to be reminded before their appointment. */
export type ReminderChannel = "sms" | "email";

/** Admin settings stored in the database (e.g. the changeable admin password). */
export interface AdminSettings {
  passwordSalt?: string;
  passwordHash?: string;
}

/**
 * One opening-hours rule: a set of weekdays that share the same time window,
 * e.g. days [0..4] (Sun–Thu) 09:00–19:00. Weekdays are 0=Sunday … 6=Saturday.
 */
export interface OpeningRule {
  id: string;
  days: number[];
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

/**
 * Scheduling settings managed from the admin. They drive the customer slot
 * picker, the conflict checks on booking, and the opening hours in the footer.
 */
export interface BookingSettings {
  rules: OpeningRule[];
  /** How many days ahead customers can book (rolling window). */
  windowDays: number;
}

/**
 * A bookable service / queue type, fully managed by admins. `id` is what an
 * appointment references in {@link Appointment.service}; the set is not fixed in
 * code, so new types can be added or removed from the admin panel.
 */
export interface Service {
  id: string;
  label: Localized;
  /** Optional short blurb shown alongside the service on the booking form. */
  description: Localized;
  /** Optional photo shown on the service card (URL or /uploads path). */
  image?: string;
  /** Extra photos shown as a gallery inside the full-screen detail view. */
  images?: string[];
  /** CSS object-position for the cropped photo, e.g. "center top". */
  imagePosition?: string;
  /** CSS aspect-ratio for the photo frame, e.g. "16 / 10". */
  aspectRatio?: string;
  /** Optional background image for the full-screen detail view (tap a service). */
  detailBg?: string;
  /** How long one appointment of this service takes, in minutes. Slots on the
   * scheduling grid are offered and reserved in blocks of this size. */
  durationMinutes?: number;
  /** When false the service is hidden from the public booking form. */
  enabled: boolean;
  /** Sort order in the booking form and admin list (ascending). */
  order: number;
  createdAt: string;
}

/**
 * A customer review/testimonial. Stored as plain (single-language) text the way
 * the customer wrote it — shown as-is regardless of the site's UI language.
 * `source` distinguishes admin-entered reviews from ones pulled live from Google.
 */
export interface Review {
  id: string;
  author: string;
  rating: number; // 1–5 stars
  text: string;
  /** Free text or ISO date, e.g. "May 2026". Optional. */
  date?: string;
  /** Optional photo (reviewer or the review itself). */
  image?: string;
  /** For Google-photo reviews: frame aspect-ratio (e.g. "3 / 4") + crop position. */
  aspectRatio?: string;
  imagePosition?: string;
  source?: "manual" | "google";
  /** Visitor-submitted reviews start unapproved (hidden) until an admin approves.
   * Admin-created reviews leave this undefined (treated as approved). */
  approved?: boolean;
}

export interface Appointment {
  id: string;
  createdAt: string; // ISO timestamp
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  service: string; // references a Service id (see {@link Service})
  notes?: string;
  status: AppointmentStatus;
  /** How the customer wants to be reminded (one or both channels). */
  reminderChannels: ReminderChannel[];
  /** Confirmed slot the customer picked on the scheduling calendar (ISO). */
  appointmentAt?: string;
  /** Minutes this appointment blocks on the grid (snapshot of the service's
   * duration at booking time, so later edits don't shift existing bookings). */
  durationMinutes?: number;
  /** Set when an admin approves/declines; reason used for declines. */
  decisionAt?: string;
  decisionReason?: string;
  /** Records that a (placeholder) notification was dispatched. */
  notifiedAt?: string;
  /** Records that the day-before reminder was sent. */
  remindedAt?: string;
}

// ---- Eye tests / prescriptions (מרשמים) -------------------------------------

/** One eye's refraction values. Free-form strings, written the way the
 * optometrist writes them ("+2.75", "-1.00", "83", "31"). */
export interface RxEye {
  sph?: string;
  cyl?: string;
  axis?: string;
  add?: string;
  pd?: string;
  prism?: string;
  base?: string;
  h?: string;
  va?: string;
}

/** A prescription table: right eye (OD) + left eye (OS). */
export interface RxTable {
  od: RxEye;
  os: RxEye;
}

/** Columns of the prescription table, in display order. */
export const RX_FIELDS = ["sph", "cyl", "axis", "add", "pd", "prism", "base", "h", "va"] as const;
export type RxField = (typeof RX_FIELDS)[number];

/** An in-store eye test / prescription record, managed in the admin. */
export interface EyeTest {
  id: string;
  createdAt: string; // ISO timestamp (record creation)
  date: string; // test date, "YYYY-MM-DD"
  firstName: string;
  lastName: string;
  /** תעודת זהות — the national ID the doctor searches by. */
  idNumber: string;
  /** מרשם קודם — the previous prescription, if recorded. */
  previous?: RxTable;
  /** The prescription resulting from this test. */
  current: RxTable;
  notes?: string;
}

export interface Product {
  id: string;
  name: Localized;
  description: Localized;
  price: number; // in ILS; 0 means "ask in store"
  category: string; // e.g. "sun", "optical", "kids", "contact"
  image: string; // URL or /uploads path; may be empty -> placeholder
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: Localized;
  specialty: Localized;
  image: string;
  /** CSS object-position for the cropped photo, e.g. "center top". */
  imagePosition?: string;
  /** CSS aspect-ratio for the photo frame, e.g. "4 / 3". */
  aspectRatio?: string;
}

/** Per-field text styling chosen in the admin Content editor. All optional —
 * unset properties fall back to the site's default design. */
export interface TextStyle {
  fontFamily?: string; // id from FONT_OPTIONS
  fontSize?: number; // px
  bold?: boolean;
  italic?: boolean;
  align?: "start" | "center" | "end";
  color?: string; // hex
}

// ---- Custom content blocks (the admin "block builder") ----------------------

export type BlockType = "heading" | "paragraph" | "image" | "button";

/** Max width of a block on larger screens. On phones every block is full-width
 * so the layout always stays natural and readable. */
export type BlockWidth = "full" | "wide" | "medium" | "narrow";

export interface Block {
  id: string;
  type: BlockType;
  /** heading / paragraph / button label, localized. */
  text?: Localized;
  /** image url (image blocks). */
  image?: string;
  /** link target for button/image blocks (e.g. "#book" or a URL). */
  href?: string;
  /** text styling for heading/paragraph/button blocks. */
  style?: TextStyle;
  /** horizontal placement of the block within the section. */
  align: "start" | "center" | "end";
  width: BlockWidth;
}

/** Where the custom block section sits on the public page. */
export type BlocksPosition = "afterHero" | "afterProducts" | "beforeBooking" | "beforeFooter";

/** An "essay" — a block of admin-written text shown over a background image. */
export interface Essay {
  id: string;
  title: Localized;
  body: Localized;
  /** Background image behind the text. */
  image?: string;
  /** CSS object-position for the background, e.g. "center". */
  imagePosition?: string;
}

/** A slide in the admin-managed hero gallery / carousel. */
export interface GalleryImage {
  id: string;
  image: string;
  caption: Localized;
  /** CSS object-position for the cropped photo, e.g. "center top". */
  imagePosition?: string;
  /** CSS aspect-ratio for the photo frame, e.g. "16 / 9". */
  aspectRatio?: string;
}

export interface SiteContent {
  hero: {
    title: Localized;
    subtitle: Localized;
    body: Localized;
    image: string;
    /** CSS object-position for the cropped hero photo, e.g. "center top". */
    imagePosition?: string;
    /** CSS aspect-ratio for the hero photo frame, e.g. "4 / 5". */
    aspectRatio?: string;
  };
  team: {
    heading: Localized;
    body: Localized;
    members: TeamMember[];
  };
  footer: {
    phone: string;
    email: string;
    address: Localized;
    hours: Localized;
    social: { label: string; url: string }[];
  };
  /** Optional per-field text styles, keyed by STYLE_KEYS (e.g. "hero.title"). */
  styles?: Record<string, TextStyle>;
  /** Admin-built custom blocks and where they render on the page. */
  blocks?: Block[];
  blocksPosition?: BlocksPosition;
  /** Hero gallery / carousel slides, managed in the admin. */
  gallery?: GalleryImage[];
  /** Admin-written essays (text over a background image). */
  essays?: Essay[];
  /** Optional background image per section, keyed by section id
   * (home/gallery/team/services/reviews/book). */
  backgrounds?: Record<string, string>;
  /** Admin-entered customer reviews shown in the Reviews section. */
  reviews?: Review[];
  /** Google Place ID used to pull live Google reviews (the API key lives in
   * the GOOGLE_PLACES_API_KEY env var). Set/cleared from the admin. */
  googlePlaceId?: string;
  /** When true (and a Place ID + API key are configured) live Google reviews
   * are merged in alongside the admin-entered ones. */
  showGoogleReviews?: boolean;
  /** Admin-chosen order of the reorderable middle sections on the home page.
   * Subset/permutation of ["gallery","team","services","reviews"]. */
  sectionOrder?: string[];
  /** Section ids hidden from the page + nav (managed in admin → Sections). */
  hiddenSections?: string[];
}

export const SERVICE_TYPES: ServiceType[] = [
  "eye_test",
  "glasses",
  "consultation",
  "repair",
];
