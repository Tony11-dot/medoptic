// Default seed data used to initialise the JSON "database" on first run.
import type { Appointment, Product, Service, SiteContent } from "./types";

export const seedAppointments: Appointment[] = [];

// Starting set of bookable services / queue types. Admins can edit, reorder,
// disable, delete or add their own from the admin panel.
export const seedServices: Service[] = [
  {
    id: "eye_test",
    label: { he: "בדיקת עיניים", en: "Eye Test", ru: "Проверка зрения" },
    description: {
      he: "בדיקת ראייה מקיפה עם אופטומטריסט.",
      en: "Comprehensive eye exam with an optometrist.",
      ru: "Комплексная проверка зрения у оптометриста.",
    },
    enabled: true,
    order: 0,
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "glasses",
    label: { he: "קניית משקפיים", en: "Glasses Purchase", ru: "Покупка очков" },
    description: {
      he: "התאמת מסגרת ועדשות בליווי אישי.",
      en: "Frame and lens fitting with personal guidance.",
      ru: "Подбор оправы и линз с личной консультацией.",
    },
    enabled: true,
    order: 1,
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "consultation",
    label: { he: "ייעוץ", en: "Consultation", ru: "Консультация" },
    description: {
      he: "ייעוץ מקצועי לבחירת הפתרון המתאים.",
      en: "Professional advice to find the right solution.",
      ru: "Профессиональная консультация по выбору решения.",
    },
    enabled: true,
    order: 2,
    createdAt: "2026-01-01T09:00:00.000Z",
  },
  {
    id: "repair",
    label: { he: "תיקון / התאמה", en: "Repair / Adjustment", ru: "Ремонт / подгонка" },
    description: {
      he: "תיקון, ניקוי והתאמה של משקפיים קיימים.",
      en: "Repair, cleaning and adjustment of existing glasses.",
      ru: "Ремонт, чистка и подгонка имеющихся очков.",
    },
    enabled: true,
    order: 3,
    createdAt: "2026-01-01T09:00:00.000Z",
  },
];

export const seedProducts: Product[] = [
  {
    id: "p-aurora",
    name: { he: "אורורה", en: "Aurora", ru: "Аврора" },
    description: {
      he: "מסגרת אצטט קלת משקל בגוון שמנת, עדשות אנטי-בלו.",
      en: "Lightweight acetate frame in cream, with anti-blue lenses.",
      ru: "Лёгкая ацетатная оправа цвета крем, линзы anti-blue.",
    },
    price: 690,
    category: "optical",
    image: "",
    createdAt: "2026-01-10T09:00:00.000Z",
  },
  {
    id: "p-meridian",
    name: { he: "מרידיאן", en: "Meridian", ru: "Меридиан" },
    description: {
      he: "מסגרת טיטניום דקיקה, נוחות מרבית לאורך כל היום.",
      en: "Slim titanium frame engineered for all-day comfort.",
      ru: "Тонкая титановая оправа для комфорта на весь день.",
    },
    price: 980,
    category: "optical",
    image: "",
    createdAt: "2026-01-11T09:00:00.000Z",
  },
  {
    id: "p-solis",
    name: { he: "סוליס", en: "Solis", ru: "Солис" },
    description: {
      he: "משקפי שמש מקוטבים עם הגנת UV400 מלאה.",
      en: "Polarised sunglasses with full UV400 protection.",
      ru: "Поляризационные очки с полной защитой UV400.",
    },
    price: 540,
    category: "sun",
    image: "",
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "p-pixel",
    name: { he: "פיקסל", en: "Pixel", ru: "Пиксель" },
    description: {
      he: "סדרת ילדים גמישה ועמידה, צבעוניות ועליזה.",
      en: "Flexible, durable kids range in cheerful colours.",
      ru: "Гибкая прочная детская серия в ярких цветах.",
    },
    price: 320,
    category: "kids",
    image: "",
    createdAt: "2026-01-13T09:00:00.000Z",
  },
  {
    id: "p-clearday",
    name: { he: "קליר-דיי", en: "ClearDay", ru: "КлирДэй" },
    description: {
      he: "עדשות מגע יומיות, לחות גבוהה לכל היום.",
      en: "Daily contact lenses with all-day hydration.",
      ru: "Однодневные контактные линзы с увлажнением.",
    },
    price: 180,
    category: "contact",
    image: "",
    createdAt: "2026-01-14T09:00:00.000Z",
  },
  {
    id: "p-nova",
    name: { he: "נובה", en: "Nova", ru: "Нова" },
    description: {
      he: "מסגרת מטאל בגימור זהב ורד, מראה אלגנטי.",
      en: "Metal frame in rose-gold finish for an elegant look.",
      ru: "Металлическая оправа цвета розовое золото.",
    },
    price: 760,
    category: "optical",
    image: "",
    createdAt: "2026-01-15T09:00:00.000Z",
  },
];

export const seedContent: SiteContent = {
  hero: {
    title: {
      he: "ראייה חדה. שירות שאכפת לו.",
      en: "Sharp vision. Care that shows.",
      ru: "Чёткое зрение. Забота, которая видна.",
    },
    subtitle: {
      he: "מרפאת ראייה וחנות משקפיים",
      en: "Optometry clinic & eyewear store",
      ru: "Клиника оптометрии и магазин оптики",
    },
    body: {
      he: "ב-MEDOPTIC אנחנו משלבים בדיקות עיניים מדויקות בטכנולוגיה מתקדמת עם מבחר משקפיים נבחר, כדי שתראו ותרגישו במיטבכם. הכל תחת קורת גג אחת, בחוויה רגועה ומקצועית.",
      en: "At MEDOPTIC we combine precise, technology-driven eye exams with a curated eyewear collection so you look and feel your best — all under one roof, in a calm and professional experience.",
      ru: "В MEDOPTIC мы сочетаем точные обследования зрения с подобранной коллекцией оправ, чтобы вы выглядели и чувствовали себя превосходно — всё в одном месте.",
    },
    image: "",
  },
  team: {
    heading: {
      he: "האופטומטריסטים שלנו",
      en: "Our Optometrists",
      ru: "Наши оптометристы",
    },
    body: {
      he: "צוות האופטומטריסטים שלנו מביא שנים של ניסיון קליני, הסמכות מקצועיות וטכנולוגיית בדיקה מתקדמת — עם דגש על דיוק, סבלנות ויחס אישי לכל מטופל.",
      en: "Our optometry team brings years of clinical experience, professional certification and advanced diagnostic technology — with a focus on accuracy, patience and personal care for every patient.",
      ru: "Наша команда оптометристов сочетает многолетний клинический опыт, профессиональную сертификацию и передовую диагностику.",
    },
    members: [
      {
        id: "t-1",
        name: "Dr. A. Levi",
        title: {
          he: "אופטומטריסט/ית בכיר/ה",
          en: "Senior Optometrist",
          ru: "Старший оптометрист",
        },
        specialty: {
          he: "בדיקות ראייה מקיפות והתאמת עדשות",
          en: "Comprehensive eye exams & lens fitting",
          ru: "Комплексные осмотры и подбор линз",
        },
        image: "",
      },
      {
        id: "t-2",
        name: "Dr. M. Cohen",
        title: {
          he: "מומחה/ית לעדשות מגע",
          en: "Contact Lens Specialist",
          ru: "Специалист по контактным линзам",
        },
        specialty: {
          he: "התאמת עדשות מגע מורכבות",
          en: "Advanced contact lens fitting",
          ru: "Подбор сложных контактных линз",
        },
        image: "",
      },
      {
        id: "t-3",
        name: "Dr. S. Mizrahi",
        title: {
          he: "אופטומטריסט/ית קליני/ת",
          en: "Clinical Optometrist",
          ru: "Клинический оптометрист",
        },
        specialty: {
          he: "ראייה ילדים ובריאות העין",
          en: "Pediatric vision & eye health",
          ru: "Детское зрение и здоровье глаз",
        },
        image: "",
      },
    ],
  },
  footer: {
    phone: "050-965-2008",
    email: "Medoptic24@gmail.com",
    address: {
      he: "רחוב הראייה 1, תל אביב",
      en: "1 Vision St, Tel Aviv",
      ru: "ул. Видения 1, Тель-Авив",
    },
    hours: {
      he: "א׳–ה׳ 09:00–19:00 · ו׳ 09:00–13:00",
      en: "Sun–Thu 09:00–19:00 · Fri 09:00–13:00",
      ru: "Вс–Чт 09:00–19:00 · Пт 09:00–13:00",
    },
    social: [
      { label: "Instagram", url: "https://instagram.com/medoptic24" },
      { label: "WhatsApp", url: "https://wa.me/972509652008" },
    ],
  },
};
