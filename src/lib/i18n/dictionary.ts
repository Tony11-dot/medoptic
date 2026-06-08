import type { Locale, ServiceType } from "../types";

// UI string dictionary. Page *content* (hero copy, products, team) lives in the
// data layer and is localised there; this covers chrome, labels and buttons.

export interface Dict {
  dir: "rtl" | "ltr";
  langName: string;
  nav: {
    home: string;
    products: string;
    team: string;
    services: string;
    book: string;
    contact: string;
  };
  hero: {
    badge: string;
    cta: string;
    secondary: string;
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
    nav: { overview: string; appointments: string; queueTypes: string; products: string; content: string };
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
    contentTabs: { hero: string; team: string; blocks: string; footer: string };
    status: { pending: string; approved: string; declined: string; allStatuses: string; allServices: string };
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
    nav: { home: "מי אנחנו", products: "המוצרים שלנו", team: "האופטומטריסטים", services: "השירותים שלנו", book: "קביעת תור", contact: "צור קשר" },
    hero: { badge: "ברוכים הבאים ל-MEDOPTIC", cta: "קביעת תור עכשיו", secondary: "לצפייה במוצרים" },
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
      nav: { overview: "סקירה", appointments: "תורים", queueTypes: "סוגי תורים", products: "מוצרים", content: "תוכן" },
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
      contentTabs: { hero: "מי אנחנו", team: "אופטומטריסטים", blocks: "בלוקים", footer: "כותרת תחתונה" },
      status: { pending: "ממתין", approved: "אושר", declined: "נדחה", allStatuses: "כל הסטטוסים", allServices: "כל השירותים" },
    },
  },
  en: {
    dir: "ltr",
    langName: "English",
    nav: { home: "Who We Are", products: "Our Products", team: "Optometrists", services: "Our Services", book: "Book", contact: "Contact" },
    hero: { badge: "Welcome to MEDOPTIC", cta: "Book Appointment Now", secondary: "Browse products" },
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
      nav: { overview: "Overview", appointments: "Appointments", queueTypes: "Queue Types", products: "Products", content: "Content" },
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
      contentTabs: { hero: "Who We Are", team: "Optometrists", blocks: "Blocks", footer: "Footer" },
      status: { pending: "Pending", approved: "Approved", declined: "Declined", allStatuses: "All statuses", allServices: "All services" },
    },
  },
  ru: {
    dir: "ltr",
    langName: "Русский",
    nav: { home: "О нас", products: "Продукция", team: "Оптометристы", services: "Услуги", book: "Запись", contact: "Контакты" },
    hero: { badge: "Добро пожаловать в MEDOPTIC", cta: "Записаться сейчас", secondary: "Смотреть товары" },
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
      nav: { overview: "Обзор", appointments: "Записи", queueTypes: "Типы услуг", products: "Товары", content: "Контент" },
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
      contentTabs: { hero: "О нас", team: "Оптометристы", blocks: "Блоки", footer: "Подвал" },
      status: { pending: "Ожидает", approved: "Подтверждено", declined: "Отклонено", allStatuses: "Все статусы", allServices: "Все услуги" },
    },
  },
};

export const LOCALES: Locale[] = ["he", "en", "ru"];
export const DEFAULT_LOCALE: Locale = "he";
