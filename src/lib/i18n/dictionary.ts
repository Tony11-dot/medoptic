import type { Locale, ServiceType } from "../types";

// UI string dictionary. Page *content* (hero copy, products, team) lives in the
// data layer and is localised there; this covers chrome, labels and buttons.

export interface Dict {
  dir: "rtl" | "ltr";
  langName: string;
  nav: {
    home: string;
    products: string;
    gallery: string;
    team: string;
    services: string;
    reviews: string;
    book: string;
    contact: string;
  };
  hero: {
    badge: string;
    cta: string;
    secondary: string;
  };
  gallery: {
    eyebrow: string;
    heading: string;
    subheading: string;
  };
  services: {
    eyebrow: string;
    heading: string;
    subheading: string;
    book: string;
    empty: string;
  };
  products: {
    eyebrow: string;
    heading: string;
    subheading: string;
    viewDetails: string;
    askInStore: string;
    currency: (n: number) => string;
    empty: string;
    categories: Record<string, string>;
  };
  team: {
    eyebrow: string;
  };
  reviews: {
    eyebrow: string;
    heading: string;
    subheading: string;
    empty: string;
    leaveReview: string;
  };
  booking: {
    eyebrow: string;
    heading: string;
    subheading: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    emailOptional: string;
    service: string;
    servicePlaceholder: string;
    notes: string;
    notesOptional: string;
    reminderLabel: string;
    reminderSms: string;
    reminderEmail: string;
    submit: string;
    submitPickTime: string;
    submitHint: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    pickTimeCta: string;
    pickTimeHelp: string;
    warnPickTime: string;
    bookAnother: string;
    services: Record<ServiceType, string>;
    errors: {
      required: string;
      phone: string;
      email: string;
      generic: string;
    };
  };
  footer: {
    contact: string;
    hours: string;
    address: string;
    follow: string;
    rights: string;
    adminLink: string;
  };
  admin: {
    loading: string;
    viewSite: string;
    signOut: string;
    save: string;
    saving: string;
    refresh: string;
    actions: { approve: string; decline: string; add: string; edit: string; delete: string; cancel: string; search: string };
    nav: { overview: string; appointments: string; queueTypes: string; products: string; content: string; settings: string };
    settings: {
      title: string;
      subtitle: string;
      current: string;
      newPass: string;
      confirm: string;
      save: string;
      saved: string;
      mismatch: string;
      tooShort: string;
      wrongCurrent: string;
    };
    login: {
      title: string;
      subtitle: string;
      passwordLabel: string;
      signIn: string;
      signingIn: string;
      wrong: string;
      error: string;
      demo: string;
    };
    titles: {
      overview: string;
      overviewSub: string;
      appointments: string;
      appointmentsSub: string;
      queueTypes: string;
      queueTypesSub: string;
      products: string;
      productsSub: string;
      content: string;
      contentSub: string;
    };
    contentTabs: { hero: string; gallery: string; team: string; reviews: string; blocks: string; footer: string; backgrounds: string };
    bg: { subtitle: string };
    reviews: {
      subtitle: string;
      author: string;
      rating: string;
      text: string;
      date: string;
      datePlaceholder: string;
      add: string;
      remove: string;
      none: string;
      googleTitle: string;
      googleHelp: string;
      placeId: string;
      placeIdHint: string;
      showGoogle: string;
    };
    status: { pending: string; approved: string; declined: string; allStatuses: string; allServices: string };
    gallery: { add: string; empty: string; caption: string };
    fields: {
      headline: string;
      subtitle: string;
      body: string;
      sectionHeading: string;
      sectionDescription: string;
      teamMembers: string;
      addMember: string;
      removeMember: string;
      memberName: string;
      memberTitle: string;
      memberSpecialty: string;
      phone: string;
      email: string;
      address: string;
      hours: string;
      socialLinks: string;
      addLink: string;
      previewLanguage: string;
      visibleOnSite: string;
    };
    svc: {
      order: string;
      nameCol: string;
      visible: string;
      none: string;
      addTitle: string;
      editTitle: string;
      name: string;
      description: string;
      show: string;
      deleteTitle: string;
      deleteWarn: string;
    };
    overview: { total: string; thisMonth: string; latest: string; viewAll: string; none: string };
    queue: {
      booked: string;
      customer: string;
      phone: string;
      service: string;
      appointment: string;
      status: string;
      actions: string;
      none: string;
      details: string;
      name: string;
      email: string;
      reminderBy: string;
      notes: string;
      notified: string;
      setTime: string;
      setTimeDesc: string;
      dateTime: string;
      dateTimeHint: string;
    };
  };
}

const services_he: Record<ServiceType, string> = {
  eye_test: "בדיקת עיניים",
  glasses: "קניית משקפיים",
  consultation: "ייעוץ",
  repair: "תיקון / התאמה",
};
const services_en: Record<ServiceType, string> = {
  eye_test: "Eye Test",
  glasses: "Glasses Purchase",
  consultation: "Consultation",
  repair: "Repair / Adjustment",
};
const services_ru: Record<ServiceType, string> = {
  eye_test: "Проверка зрения",
  glasses: "Покупка очков",
  consultation: "Консультация",
  repair: "Ремонт / подгонка",
};

const categories_he = { all: "הכל", optical: "אופטיות", sun: "שמש", kids: "ילדים", contact: "עדשות מגע" };
const categories_en = { all: "All", optical: "Optical", sun: "Sun", kids: "Kids", contact: "Contacts" };
const categories_ru = { all: "Все", optical: "Оптические", sun: "Солнце", kids: "Детские", contact: "Линзы" };

export const dictionaries: Record<Locale, Dict> = {
  he: {
    dir: "rtl",
    langName: "עברית",
    nav: { home: "מי אנחנו", products: "המוצרים שלנו", gallery: "גלריה", team: "האופטומטריסטים", services: "השירותים שלנו", reviews: "ביקורות", book: "קביעת תור", contact: "צור קשר" },
    hero: { badge: "ברוכים הבאים ל-MEDOPTIC", cta: "קביעת תור עכשיו", secondary: "לגלריה" },
    gallery: { eyebrow: "הצצה אלינו", heading: "גלריה", subheading: "רגעים, מוצרים והאווירה אצלנו בחנות." },
    services: { eyebrow: "מה אנחנו מציעים", heading: "השירותים שלנו", subheading: "בחרו את השירות המתאים לכם וקבעו תור בקלות.", book: "קביעת תור", empty: "אין שירותים זמינים כרגע." },
    products: {
      eyebrow: "הקולקציה שלנו",
      heading: "המוצרים שלנו",
      subheading: "מבחר מסגרות ועדשות נבחרות, לכל סגנון ולכל גיל.",
      viewDetails: "לפרטים",
      askInStore: "לפרטים בחנות",
      currency: (n) => `₪${n.toLocaleString("he-IL")}`,
      empty: "אין מוצרים להצגה כרגע.",
      categories: categories_he,
    },
    team: { eyebrow: "הצוות המקצועי" },
    reviews: {
      eyebrow: "מה הלקוחות אומרים",
      heading: "ביקורות",
      subheading: "לקוחות מספרים על החוויה שלהם ב-MEDOPTIC.",
      empty: "עדיין אין ביקורות. נשמח אם תשתפו את החוויה שלכם!",
      leaveReview: "כתבו ביקורת בגוגל",
    },
    booking: {
      eyebrow: "נשמח לראות אתכם",
      heading: "קביעת תור",
      subheading: "השאירו פרטים ונחזור אליכם לאישור התור בהקדם.",
      firstName: "שם פרטי",
      lastName: "שם משפחה",
      phone: "טלפון",
      email: "אימייל",
      emailOptional: "אימייל (לא חובה)",
      service: "סוג השירות",
      servicePlaceholder: "בחרו שירות",
      notes: "הערות",
      notesOptional: "הערות (לא חובה)",
      reminderLabel: "איך לשלוח לכם תזכורת? (אפשר לבחור בשניהם)",
      reminderSms: "ב-SMS",
      reminderEmail: "באימייל",
      submit: "שליחת בקשה",
      submitPickTime: "בחירת שעה ושליחה",
      submitHint: "ייפתח יומן לבחירת השעה שנוחה לכם.",
      submitting: "פותח יומן…",
      successTitle: "הבקשה התקבלה!",
      successBody: "פתחנו עבורכם את היומן — בחרו את השעה שנוחה לכם.",
      pickTimeCta: "פתיחת היומן",
      pickTimeHelp: "השעה שתבחרו היא שעת התור. נשלח לכם אישור ותזכורת.",
      warnPickTime: "⚠️ חשוב: יש לבחור תאריך ושעה ביומן, אחרת לא נוכל לשמור לכם תור. לא בחרתם? לחצו למעלה.",
      bookAnother: "קביעת תור נוסף",
      services: services_he,
      errors: {
        required: "שדה חובה",
        phone: "מספר טלפון לא תקין",
        email: "כתובת אימייל לא תקינה",
        generic: "אירעה שגיאה. נסו שוב.",
      },
    },
    footer: {
      contact: "צור קשר",
      hours: "שעות פעילות",
      address: "כתובת",
      follow: "עקבו אחרינו",
      rights: "כל הזכויות שמורות.",
      adminLink: "ניהול",
    },
    admin: {
      loading: "טוען…",
      viewSite: "צפייה באתר",
      signOut: "התנתקות",
      save: "שמירת שינויים",
      saving: "שומר…",
      refresh: "רענון",
      actions: { approve: "אישור", decline: "דחייה", add: "הוספה", edit: "עריכה", delete: "מחיקה", cancel: "ביטול", search: "חיפוש" },
      nav: { overview: "סקירה", appointments: "תורים", queueTypes: "סוגי תורים", products: "מוצרים", content: "תוכן", settings: "הגדרות" },
      settings: {
        title: "הגדרות",
        subtitle: "שינוי סיסמת הניהול.",
        current: "סיסמה נוכחית",
        newPass: "סיסמה חדשה",
        confirm: "אישור סיסמה",
        save: "עדכון סיסמה",
        saved: "הסיסמה עודכנה",
        mismatch: "הסיסמאות אינן תואמות",
        tooShort: "הסיסמה קצרה מדי (לפחות 4 תווים)",
        wrongCurrent: "הסיסמה הנוכחית שגויה",
      },
      login: {
        title: "כניסת מנהל",
        subtitle: "הזינו את סיסמת המנהל כדי להמשיך.",
        passwordLabel: "סיסמה",
        signIn: "כניסה",
        signingIn: "מתחבר…",
        wrong: "סיסמה שגויה. נסו שוב.",
        error: "משהו השתבש. נסו שוב.",
        demo: "סיסמת הדגמה:",
      },
      titles: {
        overview: "לוח בקרה",
        overviewSub: "סקירה של התורים והקטלוג.",
        appointments: "תורים",
        appointmentsSub: "צפייה, אישור או דחייה של בקשות לתור.",
        queueTypes: "סוגי תורים",
        queueTypesSub: "השירותים שהלקוחות יכולים לבחור. מופיעים בטופס קביעת התור ובסינון.",
        products: "מוצרים",
        productsSub: "פריטים אלה מופיעים בגלריית המוצרים באתר.",
        content: "תוכן",
        contentSub: "עריכת טקסט, גופנים ותמונות. התצוגה מתעדכנת תוך כדי; השינויים נשמרים בלחיצה.",
      },
      contentTabs: { hero: "מי אנחנו", gallery: "גלריה", team: "אופטומטריסטים", reviews: "ביקורות", blocks: "בלוקים", footer: "כותרת תחתונה", backgrounds: "רקעים" },
      bg: { subtitle: "העלו תמונת רקע לכל מקטע. התמונה תופיע מטושטשת מאחורי התוכן." },
      reviews: {
        subtitle: "הוסיפו ביקורות לקוחות ידנית, או חברו את גוגל כדי למשוך ביקורות אוטומטית.",
        author: "שם הלקוח",
        rating: "דירוג (כוכבים)",
        text: "תוכן הביקורת",
        date: "תאריך",
        datePlaceholder: "למשל: מאי 2026",
        add: "הוספת ביקורת",
        remove: "הסרה",
        none: "אין ביקורות ידניות עדיין.",
        googleTitle: "ביקורות מגוגל (אוטומטי)",
        googleHelp: "כדי למשוך ביקורות מגוגל צריך מפתח API (משתנה הסביבה GOOGLE_PLACES_API_KEY) ומזהה מקום (Place ID).",
        placeId: "Google Place ID",
        placeIdHint: "מצאו את ה-Place ID של ‏‎מדאופטיק‏ Medoptic בכלי של גוגל ‏(Place ID Finder).",
        showGoogle: "להציג ביקורות מגוגל באתר",
      },
      status: { pending: "ממתין", approved: "אושר", declined: "נדחה", allStatuses: "כל הסטטוסים", allServices: "כל השירותים" },
      gallery: { add: "הוספת תמונה", empty: "אין תמונות עדיין. הוסיפו תמונות לקרוסלה.", caption: "כיתוב (לא חובה)" },
      fields: {
        headline: "כותרת ראשית",
        subtitle: "כותרת משנה",
        body: "תוכן",
        sectionHeading: "כותרת המקטע",
        sectionDescription: "תיאור המקטע",
        teamMembers: "חברי הצוות",
        addMember: "הוספת איש צוות",
        removeMember: "הסרה",
        memberName: "שם",
        memberTitle: "תפקיד",
        memberSpecialty: "התמחות",
        phone: "טלפון",
        email: "אימייל",
        address: "כתובת",
        hours: "שעות פעילות",
        socialLinks: "רשתות חברתיות",
        addLink: "הוספת קישור",
        previewLanguage: "שפת תצוגה",
        visibleOnSite: "מוצג באתר",
      },
      svc: {
        order: "סדר",
        nameCol: "שם",
        visible: "מוצג באתר",
        none: "אין סוגי תורים עדיין.",
        addTitle: "הוספת סוג תור",
        editTitle: "עריכת סוג תור",
        name: "שם",
        description: "תיאור (לא חובה)",
        show: "הצגת השירות בטופס קביעת התור",
        deleteTitle: "מחיקת סוג תור",
        deleteWarn: "למחוק? לקוחות חדשים לא יוכלו לבחור בו. תורים קיימים יישארו.",
      },
      overview: { total: "סך התורים", thisMonth: "החודש", latest: "בקשות אחרונות", viewAll: "הצגת הכל", none: "אין תורים עדיין." },
      queue: {
        booked: "נקבע ב",
        customer: "לקוח",
        phone: "טלפון",
        service: "שירות",
        appointment: "מועד התור",
        status: "סטטוס",
        actions: "פעולות",
        none: "אין תורים תואמים.",
        details: "פרטי התור",
        name: "שם",
        email: "אימייל",
        reminderBy: "תזכורת ב",
        notes: "הערות",
        notified: "נשלחה הודעה",
        setTime: "קביעת מועד",
        setTimeDesc: "קבעו את מועד התור — הוא נכלל ב-SMS/אימייל ובתזכורת.",
        dateTime: "תאריך ושעה",
        dateTimeHint: "לא חובה — אם ריק, יישלח קישור ללקוח לבחירת מועד.",
      },
    },
  },
  en: {
    dir: "ltr",
    langName: "English",
    nav: { home: "Who We Are", products: "Our Products", gallery: "Gallery", team: "Optometrists", services: "Our Services", reviews: "Reviews", book: "Book", contact: "Contact" },
    hero: { badge: "Welcome to MEDOPTIC", cta: "Book Appointment Now", secondary: "See gallery" },
    gallery: { eyebrow: "A look inside", heading: "Gallery", subheading: "Moments, frames and the atmosphere at our store." },
    services: { eyebrow: "What we offer", heading: "Our Services", subheading: "Choose the service that fits you and book in a few taps.", book: "Book this", empty: "No services available right now." },
    products: {
      eyebrow: "Our collection",
      heading: "Our Products",
      subheading: "A curated range of frames and lenses for every style and age.",
      viewDetails: "View details",
      askInStore: "Ask in store",
      currency: (n) => `₪${n.toLocaleString("en-US")}`,
      empty: "No products to show right now.",
      categories: categories_en,
    },
    team: { eyebrow: "The professional team" },
    reviews: {
      eyebrow: "What our customers say",
      heading: "Reviews",
      subheading: "Real experiences from people who visited MEDOPTIC.",
      empty: "No reviews yet. We'd love to hear about your visit!",
      leaveReview: "Write a review on Google",
    },
    booking: {
      eyebrow: "We'd love to see you",
      heading: "Book an Appointment",
      subheading: "Leave your details and we'll get back to you to confirm.",
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone",
      email: "Email",
      emailOptional: "Email (optional)",
      service: "Service type",
      servicePlaceholder: "Choose a service",
      notes: "Notes",
      notesOptional: "Notes (optional)",
      reminderLabel: "How should we remind you? (pick one or both)",
      reminderSms: "By SMS",
      reminderEmail: "By email",
      submit: "Send request",
      submitPickTime: "Pick a time & send",
      submitHint: "A calendar opens so you can choose the time that suits you.",
      submitting: "Opening calendar…",
      successTitle: "Request received!",
      successBody: "We opened the calendar — choose the time that suits you.",
      pickTimeCta: "Open the calendar",
      pickTimeHelp: "The time you pick is your appointment time. We'll send a confirmation and a reminder.",
      warnPickTime: "⚠️ Important: you must pick a date & time on the calendar, or we can't hold your appointment. Didn't choose one? Tap above.",
      bookAnother: "Book another",
      services: services_en,
      errors: {
        required: "Required field",
        phone: "Invalid phone number",
        email: "Invalid email address",
        generic: "Something went wrong. Please try again.",
      },
    },
    footer: {
      contact: "Contact",
      hours: "Opening hours",
      address: "Address",
      follow: "Follow us",
      rights: "All rights reserved.",
      adminLink: "Admin",
    },
    admin: {
      loading: "Loading…",
      viewSite: "View site",
      signOut: "Sign out",
      save: "Save changes",
      saving: "Saving…",
      refresh: "Refresh",
      actions: { approve: "Approve", decline: "Decline", add: "Add", edit: "Edit", delete: "Delete", cancel: "Cancel", search: "Search" },
      nav: { overview: "Overview", appointments: "Appointments", queueTypes: "Queue Types", products: "Products", content: "Content", settings: "Settings" },
      settings: {
        title: "Settings",
        subtitle: "Change the admin password.",
        current: "Current password",
        newPass: "New password",
        confirm: "Confirm password",
        save: "Update password",
        saved: "Password updated",
        mismatch: "Passwords don't match",
        tooShort: "Password too short (at least 4 characters)",
        wrongCurrent: "Current password is incorrect",
      },
      login: {
        title: "Admin sign in",
        subtitle: "Enter the admin password to continue.",
        passwordLabel: "Password",
        signIn: "Sign in",
        signingIn: "Signing in…",
        wrong: "Incorrect password. Try again.",
        error: "Something went wrong. Try again.",
        demo: "Demo password:",
      },
      titles: {
        overview: "Dashboard",
        overviewSub: "Overview of appointments and catalogue.",
        appointments: "Appointments",
        appointmentsSub: "Review, approve or decline booking requests.",
        queueTypes: "Queue Types",
        queueTypesSub: "The services customers can book. They appear in the booking form and the filters.",
        products: "Products",
        productsSub: "Items here appear in the website's product grid.",
        content: "Content",
        contentSub: "Edit text, fonts and images. The preview updates as you type; changes go live on save.",
      },
      contentTabs: { hero: "Who We Are", gallery: "Gallery", team: "Optometrists", reviews: "Reviews", blocks: "Blocks", footer: "Footer", backgrounds: "Backgrounds" },
      bg: { subtitle: "Upload a background image for any section. It appears softly behind the content." },
      reviews: {
        subtitle: "Add customer reviews by hand, or connect Google to pull them in automatically.",
        author: "Customer name",
        rating: "Rating (stars)",
        text: "Review text",
        date: "Date",
        datePlaceholder: "e.g. May 2026",
        add: "Add review",
        remove: "Remove",
        none: "No manual reviews yet.",
        googleTitle: "Google reviews (automatic)",
        googleHelp: "To pull reviews from Google you need an API key (the GOOGLE_PLACES_API_KEY env var) and a Place ID.",
        placeId: "Google Place ID",
        placeIdHint: "Find the Place ID for ‘מדאופטיק Medoptic’ using Google's Place ID Finder tool.",
        showGoogle: "Show Google reviews on the site",
      },
      status: { pending: "Pending", approved: "Approved", declined: "Declined", allStatuses: "All statuses", allServices: "All services" },
      gallery: { add: "Add image", empty: "No images yet. Add images to the carousel.", caption: "Caption (optional)" },
      fields: {
        headline: "Headline",
        subtitle: "Subtitle",
        body: "Body",
        sectionHeading: "Section heading",
        sectionDescription: "Section description",
        teamMembers: "Team members",
        addMember: "Add member",
        removeMember: "Remove",
        memberName: "Name",
        memberTitle: "Title",
        memberSpecialty: "Specialty",
        phone: "Phone",
        email: "Email",
        address: "Address",
        hours: "Opening hours",
        socialLinks: "Social links",
        addLink: "Add link",
        previewLanguage: "Preview language",
        visibleOnSite: "Visible on site",
      },
      svc: {
        order: "Order",
        nameCol: "Name",
        visible: "Visible on site",
        none: "No queue types yet.",
        addTitle: "Add queue type",
        editTitle: "Edit queue type",
        name: "Name",
        description: "Description (optional)",
        show: "Show this service on the booking form",
        deleteTitle: "Delete queue type",
        deleteWarn: "Delete it? New bookings can't choose it. Existing appointments stay.",
      },
      overview: { total: "Total appointments", thisMonth: "This month", latest: "Latest requests", viewAll: "View all", none: "No appointments yet." },
      queue: {
        booked: "Booked",
        customer: "Customer",
        phone: "Phone",
        service: "Service",
        appointment: "Appointment",
        status: "Status",
        actions: "Actions",
        none: "No appointments match.",
        details: "Appointment details",
        name: "Name",
        email: "Email",
        reminderBy: "Reminder by",
        notes: "Notes",
        notified: "Notified",
        setTime: "Set time",
        setTimeDesc: "Set the appointment time — it's included in the SMS/email and the reminder.",
        dateTime: "Date & time",
        dateTimeHint: "Optional — if empty, the customer gets the link to pick a time.",
      },
    },
  },
  ru: {
    dir: "ltr",
    langName: "Русский",
    nav: { home: "О нас", products: "Продукция", gallery: "Галерея", team: "Оптометристы", services: "Услуги", reviews: "Отзывы", book: "Запись", contact: "Контакты" },
    hero: { badge: "Добро пожаловать в MEDOPTIC", cta: "Записаться сейчас", secondary: "Смотреть галерею" },
    gallery: { eyebrow: "Загляните к нам", heading: "Галерея", subheading: "Моменты, оправы и атмосфера нашего магазина." },
    services: { eyebrow: "Что мы предлагаем", heading: "Наши услуги", subheading: "Выберите подходящую услугу и запишитесь за пару касаний.", book: "Записаться", empty: "Сейчас нет доступных услуг." },
    products: {
      eyebrow: "Наша коллекция",
      heading: "Наша продукция",
      subheading: "Подобранный ассортимент оправ и линз для любого стиля и возраста.",
      viewDetails: "Подробнее",
      askInStore: "Уточнить в магазине",
      currency: (n) => `₪${n.toLocaleString("ru-RU")}`,
      empty: "Сейчас нет товаров для показа.",
      categories: categories_ru,
    },
    team: { eyebrow: "Профессиональная команда" },
    reviews: {
      eyebrow: "Что говорят клиенты",
      heading: "Отзывы",
      subheading: "Реальные впечатления тех, кто побывал в MEDOPTIC.",
      empty: "Пока нет отзывов. Будем рады услышать о вашем визите!",
      leaveReview: "Оставить отзыв в Google",
    },
    booking: {
      eyebrow: "Будем рады вас видеть",
      heading: "Запись на приём",
      subheading: "Оставьте данные, и мы свяжемся с вами для подтверждения.",
      firstName: "Имя",
      lastName: "Фамилия",
      phone: "Телефон",
      email: "Эл. почта",
      emailOptional: "Эл. почта (необязательно)",
      service: "Тип услуги",
      servicePlaceholder: "Выберите услугу",
      notes: "Примечания",
      notesOptional: "Примечания (необязательно)",
      reminderLabel: "Как напомнить вам? (можно выбрать оба)",
      reminderSms: "По SMS",
      reminderEmail: "По эл. почте",
      submit: "Отправить заявку",
      submitPickTime: "Выбрать время и отправить",
      submitHint: "Откроется календарь, чтобы выбрать удобное время.",
      submitting: "Открываем календарь…",
      successTitle: "Заявка принята!",
      successBody: "Мы открыли календарь — выберите удобное вам время.",
      pickTimeCta: "Открыть календарь",
      pickTimeHelp: "Выбранное время — это время приёма. Мы пришлём подтверждение и напоминание.",
      warnPickTime: "⚠️ Важно: выберите дату и время в календаре, иначе мы не сможем закрепить приём. Не выбрали? Нажмите выше.",
      bookAnother: "Записаться ещё раз",
      services: services_ru,
      errors: {
        required: "Обязательное поле",
        phone: "Неверный номер телефона",
        email: "Неверный адрес эл. почты",
        generic: "Что-то пошло не так. Попробуйте снова.",
      },
    },
    footer: {
      contact: "Контакты",
      hours: "Часы работы",
      address: "Адрес",
      follow: "Мы в соцсетях",
      rights: "Все права защищены.",
      adminLink: "Админ",
    },
    admin: {
      loading: "Загрузка…",
      viewSite: "Открыть сайт",
      signOut: "Выйти",
      save: "Сохранить",
      saving: "Сохранение…",
      refresh: "Обновить",
      actions: { approve: "Подтвердить", decline: "Отклонить", add: "Добавить", edit: "Изменить", delete: "Удалить", cancel: "Отмена", search: "Поиск" },
      nav: { overview: "Обзор", appointments: "Записи", queueTypes: "Типы услуг", products: "Товары", content: "Контент", settings: "Настройки" },
      settings: {
        title: "Настройки",
        subtitle: "Изменить пароль администратора.",
        current: "Текущий пароль",
        newPass: "Новый пароль",
        confirm: "Подтвердите пароль",
        save: "Обновить пароль",
        saved: "Пароль обновлён",
        mismatch: "Пароли не совпадают",
        tooShort: "Пароль слишком короткий (минимум 4 символа)",
        wrongCurrent: "Неверный текущий пароль",
      },
      login: {
        title: "Вход для админа",
        subtitle: "Введите пароль администратора, чтобы продолжить.",
        passwordLabel: "Пароль",
        signIn: "Войти",
        signingIn: "Вход…",
        wrong: "Неверный пароль. Попробуйте снова.",
        error: "Что-то пошло не так. Попробуйте снова.",
        demo: "Демо-пароль:",
      },
      titles: {
        overview: "Панель",
        overviewSub: "Обзор записей и каталога.",
        appointments: "Записи",
        appointmentsSub: "Просмотр, подтверждение или отклонение заявок.",
        queueTypes: "Типы услуг",
        queueTypesSub: "Услуги, которые могут выбрать клиенты. Показаны в форме записи и фильтрах.",
        products: "Товары",
        productsSub: "Эти позиции отображаются в каталоге на сайте.",
        content: "Контент",
        contentSub: "Редактирование текста, шрифтов и изображений. Предпросмотр обновляется на лету; изменения публикуются при сохранении.",
      },
      contentTabs: { hero: "О нас", gallery: "Галерея", team: "Оптометристы", reviews: "Отзывы", blocks: "Блоки", footer: "Подвал", backgrounds: "Фоны" },
      bg: { subtitle: "Загрузите фоновое изображение для раздела. Оно появится мягко за контентом." },
      reviews: {
        subtitle: "Добавляйте отзывы клиентов вручную или подключите Google для автоматической загрузки.",
        author: "Имя клиента",
        rating: "Оценка (звёзды)",
        text: "Текст отзыва",
        date: "Дата",
        datePlaceholder: "напр.: май 2026",
        add: "Добавить отзыв",
        remove: "Удалить",
        none: "Пока нет отзывов, добавленных вручную.",
        googleTitle: "Отзывы Google (автоматически)",
        googleHelp: "Чтобы загружать отзывы из Google, нужен API-ключ (переменная GOOGLE_PLACES_API_KEY) и Place ID.",
        placeId: "Google Place ID",
        placeIdHint: "Найдите Place ID для «מדאופטיק Medoptic» с помощью инструмента Google Place ID Finder.",
        showGoogle: "Показывать отзывы Google на сайте",
      },
      status: { pending: "Ожидает", approved: "Подтверждено", declined: "Отклонено", allStatuses: "Все статусы", allServices: "Все услуги" },
      gallery: { add: "Добавить фото", empty: "Пока нет изображений. Добавьте фото в карусель.", caption: "Подпись (необязательно)" },
      fields: {
        headline: "Заголовок",
        subtitle: "Подзаголовок",
        body: "Текст",
        sectionHeading: "Заголовок раздела",
        sectionDescription: "Описание раздела",
        teamMembers: "Сотрудники",
        addMember: "Добавить",
        removeMember: "Удалить",
        memberName: "Имя",
        memberTitle: "Должность",
        memberSpecialty: "Специализация",
        phone: "Телефон",
        email: "Эл. почта",
        address: "Адрес",
        hours: "Часы работы",
        socialLinks: "Соцсети",
        addLink: "Добавить ссылку",
        previewLanguage: "Язык предпросмотра",
        visibleOnSite: "Показывать на сайте",
      },
      svc: {
        order: "Порядок",
        nameCol: "Название",
        visible: "На сайте",
        none: "Пока нет типов услуг.",
        addTitle: "Добавить тип услуги",
        editTitle: "Изменить тип услуги",
        name: "Название",
        description: "Описание (необязательно)",
        show: "Показывать услугу в форме записи",
        deleteTitle: "Удалить тип услуги",
        deleteWarn: "Удалить? Новые клиенты не смогут выбрать. Существующие записи останутся.",
      },
      overview: { total: "Всего записей", thisMonth: "За месяц", latest: "Последние заявки", viewAll: "Показать все", none: "Пока нет записей." },
      queue: {
        booked: "Создано",
        customer: "Клиент",
        phone: "Телефон",
        service: "Услуга",
        appointment: "Приём",
        status: "Статус",
        actions: "Действия",
        none: "Нет подходящих записей.",
        details: "Детали записи",
        name: "Имя",
        email: "Эл. почта",
        reminderBy: "Напоминание",
        notes: "Примечания",
        notified: "Уведомление",
        setTime: "Указать время",
        setTimeDesc: "Укажите время приёма — оно войдёт в SMS/письмо и напоминание.",
        dateTime: "Дата и время",
        dateTimeHint: "Необязательно — если пусто, клиент получит ссылку для выбора времени.",
      },
    },
  },
};

export const LOCALES: Locale[] = ["he", "en", "ru"];
export const DEFAULT_LOCALE: Locale = "he";
