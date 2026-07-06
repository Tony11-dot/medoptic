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
    essays: string;
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
    readMore: string;
    readLess: string;
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
    writeReview: string;
    formTitle: string;
    formName: string;
    formRating: string;
    formText: string;
    formSubmit: string;
    formSubmitting: string;
    formSuccess: string;
    formError: string;
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
    submitHint: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    bookAnother: string;
    cancel: string;
    cancelledTitle: string;
    /* Built-in hour system (slot picker) */
    continueToTime: string;
    stepTime: string;
    back: string;
    chooseDay: string;
    chooseHour: string;
    loadingSlots: string;
    noSlotsDay: string;
    noSlotsAtAll: string;
    slotTaken: string;
    tooMany: string;
    yourSlot: string;
    durationLabel: string;
    minutesShort: string;
    closed: string;
    full: string;
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
  /** Localized weekday names, Sunday first (index 0 = Sunday). */
  weekdaysShort: string[];
  weekdaysLong: string[];
  admin: {
    loading: string;
    viewSite: string;
    signOut: string;
    save: string;
    saving: string;
    refresh: string;
    actions: { approve: string; decline: string; add: string; edit: string; delete: string; cancel: string; search: string };
    nav: { overview: string; appointments: string; schedule: string; tests: string; queueTypes: string; products: string; content: string; sections: string; settings: string };
    tests: {
      title: string;
      subtitle: string;
      newTest: string;
      editTest: string;
      date: string;
      firstName: string;
      lastName: string;
      idNumber: string;
      previousRx: string;
      currentRx: string;
      notes: string;
      none: string;
      saved: string;
      print: string;
      deleteWarn: string;
      required: string;
      back: string;
      searchHint: string;
    };
    schedule: {
      title: string;
      subtitle: string;
      openingTitle: string;
      openingHint: string;
      addRule: string;
      daysLabel: string;
      start: string;
      end: string;
      windowLabel: string;
      windowHint: string;
      durationsTitle: string;
      durationsHint: string;
      minutes: string;
      footerNote: string;
      noRules: string;
      invalidRule: string;
      saved: string;
    };
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
    contentTabs: { hero: string; gallery: string; team: string; services: string; reviews: string; essays: string; blocks: string; footer: string; backgrounds: string; layout: string };
    essay: { subtitle: string; titleField: string; bodyField: string; add: string; remove: string; none: string };
    bg: { subtitle: string };
    preview: { label: string };
    toasts: { saved: string; saveError: string };
    imageUpload: { upload: string; replace: string; remove: string; uploading: string; failed: string };
    positioner: { label: string; hint: string; reset: string; frameShape: string; align: string };
    sections: { subtitle: string; tip: string; shown: string; hidden: string; showHint: string; hideHint: string; moveUp: string; moveDown: string };
    prod: {
      colImage: string;
      colName: string;
      colCategory: string;
      colPrice: string;
      colActions: string;
      none: string;
      addTitle: string;
      editTitle: string;
      nameLabel: string;
      descLabel: string;
      priceLabel: string;
      priceHint: string;
      categoryLabel: string;
      saveProduct: string;
      deleteTitle: string;
      deleteConfirmPre: string;
      deleteConfirmPost: string;
      nameRequired: string;
      updated: string;
      added: string;
      saveError: string;
      deleted: string;
      deleteError: string;
    };
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
      typed: string;
      googlePhoto: string;
      googlePhotoHint: string;
      visible: string;
      pending: string;
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
      hoursAuto: string;
      socialLinks: string;
      addLink: string;
      linkLabel: string;
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
      gallery: string;
      galleryHint: string;
      addPhoto: string;
      detailBg: string;
      detailBgHint: string;
      cover: string;
      coverHint: string;
      setCover: string;
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
      duration: string;
      viewList: string;
      viewGrid: string;
      more: string;
      dayNone: string;
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
    nav: { home: "מי אנחנו", products: "המוצרים שלנו", gallery: "גלריה", team: "האופטומטריסטים", services: "השירותים שלנו", reviews: "ביקורות", essays: "מאמרים", book: "קביעת תור", contact: "צור קשר" },
    hero: { badge: "ברוכים הבאים ל-MEDOPTIC", cta: "קביעת תור עכשיו", secondary: "לגלריה" },
    gallery: { eyebrow: "הצצה אלינו", heading: "גלריה", subheading: "רגעים, מוצרים והאווירה אצלנו בחנות." },
    services: { eyebrow: "מה אנחנו מציעים", heading: "השירותים שלנו", subheading: "בחרו את השירות המתאים לכם וקבעו תור בקלות.", book: "קביעת תור", readMore: "קרא עוד", readLess: "הצג פחות", empty: "אין שירותים זמינים כרגע." },
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
      writeReview: "כתיבת ביקורת",
      formTitle: "שתפו את החוויה שלכם",
      formName: "השם שלכם",
      formRating: "דירוג",
      formText: "הביקורת שלכם",
      formSubmit: "שליחה",
      formSubmitting: "שולח…",
      formSuccess: "תודה! הביקורת תופיע לאחר אישור.",
      formError: "השליחה נכשלה. נסו שוב.",
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
      submit: "אישור וקביעת התור",
      submitHint: "בחרו יום ושעה — והתור שלכם נקבע מיד.",
      submitting: "קובע את התור…",
      successTitle: "התור נקבע!",
      successBody: "שלחנו לכם אישור, ונזכיר לכם יום לפני התור.",
      bookAnother: "קביעת תור נוסף",
      cancel: "ביטול התור",
      cancelledTitle: "התור בוטל",
      continueToTime: "המשך לבחירת יום ושעה",
      stepTime: "בחירת יום ושעה",
      back: "חזרה לפרטים",
      chooseDay: "באיזה יום נוח לכם?",
      chooseHour: "באיזו שעה?",
      loadingSlots: "טוען שעות פנויות…",
      noSlotsDay: "אין שעות פנויות ביום זה",
      noSlotsAtAll: "אין כרגע תורים פנויים. חייגו אלינו ונשמח לעזור.",
      slotTaken: "השעה הזו נתפסה הרגע — בחרו שעה אחרת.",
      tooMany: "כבר יש מספר תורים פעילים על מספר הטלפון הזה. לתיאום נוסף חייגו אלינו.",
      yourSlot: "התור שלכם",
      durationLabel: "משך התור",
      minutesShort: "דק׳",
      closed: "סגור",
      full: "מלא",
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
    weekdaysShort: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"],
    weekdaysLong: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    admin: {
      loading: "טוען…",
      viewSite: "צפייה באתר",
      signOut: "התנתקות",
      save: "שמירת שינויים",
      saving: "שומר…",
      refresh: "רענון",
      actions: { approve: "אישור", decline: "דחייה", add: "הוספה", edit: "עריכה", delete: "מחיקה", cancel: "ביטול", search: "חיפוש" },
      nav: { overview: "סקירה", appointments: "תורים", schedule: "יומן ושעות", tests: "מרשמים", queueTypes: "סוגי תורים", products: "מוצרים", content: "תוכן", sections: "מקטעים", settings: "הגדרות" },
      tests: {
        title: "בדיקות עיניים ומרשמים",
        subtitle: "תיעוד בדיקות, חיפוש לפי שם או תעודת זהות, והדפסת מרשם.",
        newTest: "בדיקה חדשה",
        editTest: "עריכת בדיקה",
        date: "תאריך הבדיקה",
        firstName: "שם פרטי",
        lastName: "שם משפחה",
        idNumber: "תעודת זהות",
        previousRx: "מרשם קודם",
        currentRx: "מרשם",
        notes: "הערות",
        none: "אין עדיין בדיקות. צרו בדיקה חדשה.",
        saved: "הבדיקה נשמרה",
        print: "הדפסה / PDF",
        deleteWarn: "למחוק את הבדיקה הזו? הפעולה אינה הפיכה.",
        required: "יש למלא תאריך, שם פרטי, שם משפחה ותעודת זהות.",
        back: "חזרה לרשימה",
        searchHint: "חיפוש לפי שם או תעודת זהות…",
      },
      schedule: {
        title: "יומן ושעות פתיחה",
        subtitle: "הגדירו מתי אפשר לקבוע תורים — הלקוחות יראו רק שעות פנויות.",
        openingTitle: "שעות פתיחה",
        openingHint: "בחרו ימים וטווח שעות. אפשר להוסיף כמה שורות (למשל שישי בנפרד).",
        addRule: "הוספת שורה",
        daysLabel: "ימים",
        start: "משעה",
        end: "עד שעה",
        windowLabel: "כמה ימים קדימה אפשר לקבוע תור",
        windowHint: "לקוחות יוכלו לבחור מועד רק בטווח הזה.",
        durationsTitle: "משך תור לכל שירות",
        durationsHint: "כמה דקות תופס כל תור — המערכת שומרת את הזמן הזה אוטומטית ביומן.",
        minutes: "דקות",
        footerNote: "שעות הפתיחה מתעדכנות אוטומטית בתחתית האתר (הפוטר).",
        noRules: "אין שעות פתיחה מוגדרות — הוסיפו שורה כדי שלקוחות יוכלו לקבוע תור.",
        invalidRule: "בכל שורה יש לבחור לפחות יום אחד ושעת התחלה מוקדמת משעת הסיום.",
        saved: "היומן נשמר",
      },
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
      contentTabs: { hero: "מי אנחנו", gallery: "גלריה", team: "אופטומטריסטים", services: "שירותים", reviews: "ביקורות", essays: "מאמרים", blocks: "בלוקים", footer: "כותרת תחתונה", backgrounds: "רקעים", layout: "סדר" },
      essay: { subtitle: "הוסיפו מקטעי טקסט עם תמונת רקע.", titleField: "כותרת", bodyField: "טקסט", add: "הוספת מאמר", remove: "הסרה", none: "אין מאמרים עדיין." },
      bg: { subtitle: "העלו תמונת רקע לכל מקטע. התמונה תופיע מטושטשת מאחורי התוכן." },
      preview: { label: "תצוגה חיה — מתעדכנת בעת שמירה" },
      toasts: { saved: "נשמר — באתר עכשיו", saveError: "השמירה נכשלה" },
      imageUpload: { upload: "העלאת תמונה", replace: "החלפת תמונה", remove: "הסרה", uploading: "מעלה…", failed: "ההעלאה נכשלה" },
      positioner: { label: "מיקום התמונה", hint: "גררו את התמונה כדי למסגר אותה", reset: "איפוס", frameShape: "צורת המסגרת:", align: "יישור:" },
      sections: {
        subtitle: "הצגה/הסתרה של מקטעים ושינוי הסדר. זה משפיע גם על העמוד וגם על לשוניות הניווט.",
        tip: "טיפ: הסתרת קביעת תור או צור קשר מסירה מהאתר את טופס קביעת התור / פרטי הקשר — בדרך כלל כדאי להשאיר אותם מוצגים.",
        shown: "מוצג",
        hidden: "מוסתר",
        showHint: "מוסתר — לחצו כדי להציג",
        hideHint: "מוצג — לחצו כדי להסתיר",
        moveUp: "העברה למעלה",
        moveDown: "העברה למטה",
      },
      prod: {
        colImage: "תמונה",
        colName: "שם",
        colCategory: "קטגוריה",
        colPrice: "מחיר",
        colActions: "פעולות",
        none: "אין מוצרים עדיין.",
        addTitle: "הוספת מוצר",
        editTitle: "עריכת מוצר",
        nameLabel: "שם",
        descLabel: "תיאור",
        priceLabel: "מחיר (₪)",
        priceHint: "0 = \"לפרטים בחנות\"",
        categoryLabel: "קטגוריה",
        saveProduct: "שמירת מוצר",
        deleteTitle: "מחיקת מוצר",
        deleteConfirmPre: "למחוק את ",
        deleteConfirmPost: "? לא ניתן לבטל פעולה זו.",
        nameRequired: "נא להזין שם מוצר",
        updated: "המוצר עודכן",
        added: "המוצר נוסף",
        saveError: "שמירת המוצר נכשלה",
        deleted: "המוצר נמחק",
        deleteError: "מחיקת המוצר נכשלה",
      },
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
        typed: "ביקורת כתובה",
        googlePhoto: "צילום מגוגל",
        googlePhotoHint: "העלו צילום מסך של ביקורת מגוגל. הוא יוצג כפי שהוא, בלי טקסט.",
        visible: "מוצג באתר",
        pending: "ממתין לאישור",
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
        hoursAuto: "שעות הפעילות בפוטר מתעדכנות אוטומטית מתוך ניהול ← יומן ושעות.",
        socialLinks: "רשתות חברתיות",
        addLink: "הוספת קישור",
        linkLabel: "שם הקישור",
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
        gallery: "תמונות נוספות",
        galleryHint: "מוצגות כקרוסלה במסך המלא של השירות",
        addPhoto: "הוספת תמונה",
        detailBg: "רקע מסך מלא",
        detailBgHint: "מוצג במסך מלא בלחיצה על הכרטיס",
        cover: "התמונה הראשית",
        coverHint: "מוצגת על הכרטיס בעמוד",
        setCover: "קבע כראשית",
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
        duration: "משך",
        viewList: "רשימה",
        viewGrid: "יומן",
        more: "עוד",
        dayNone: "אין תורים ביום זה.",
        setTime: "עדכון מועד",
        setTimeDesc: "עדכון ידני של מועד התור — הלקוח יקבל הודעה עם המועד החדש.",
        dateTime: "תאריך ושעה",
        dateTimeHint: "הלקוח כבר בחר מועד באתר; שנו כאן רק אם צריך להזיז את התור.",
      },
    },
  },
  en: {
    dir: "ltr",
    langName: "English",
    nav: { home: "Who We Are", products: "Our Products", gallery: "Gallery", team: "Optometrists", services: "Our Services", reviews: "Reviews", essays: "Essays", book: "Book", contact: "Contact" },
    hero: { badge: "Welcome to MEDOPTIC", cta: "Book Appointment Now", secondary: "See gallery" },
    gallery: { eyebrow: "A look inside", heading: "Gallery", subheading: "Moments, frames and the atmosphere at our store." },
    services: { eyebrow: "What we offer", heading: "Our Services", subheading: "Choose the service that fits you and book in a few taps.", book: "Book this", readMore: "Read more", readLess: "Show less", empty: "No services available right now." },
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
      writeReview: "Write a review",
      formTitle: "Share your experience",
      formName: "Your name",
      formRating: "Rating",
      formText: "Your review",
      formSubmit: "Send",
      formSubmitting: "Sending…",
      formSuccess: "Thank you! Your review will appear after approval.",
      formError: "Couldn't send. Please try again.",
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
      submit: "Confirm & book",
      submitHint: "Pick a day and time — your appointment is booked instantly.",
      submitting: "Booking…",
      successTitle: "Appointment booked!",
      successBody: "We've sent you a confirmation, and we'll remind you the day before.",
      bookAnother: "Book another",
      cancel: "Cancel appointment",
      cancelledTitle: "Appointment cancelled",
      continueToTime: "Continue to pick a day & time",
      stepTime: "Pick a day & time",
      back: "Back to details",
      chooseDay: "Which day suits you?",
      chooseHour: "What time?",
      loadingSlots: "Loading available times…",
      noSlotsDay: "No free times on this day",
      noSlotsAtAll: "No free appointments right now. Give us a call and we'll help.",
      slotTaken: "That time was just taken — please pick another.",
      tooMany: "This phone number already has several active bookings. Please call us to arrange more.",
      yourSlot: "Your appointment",
      durationLabel: "Duration",
      minutesShort: "min",
      closed: "Closed",
      full: "Full",
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
    weekdaysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    weekdaysLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    admin: {
      loading: "Loading…",
      viewSite: "View site",
      signOut: "Sign out",
      save: "Save changes",
      saving: "Saving…",
      refresh: "Refresh",
      actions: { approve: "Approve", decline: "Decline", add: "Add", edit: "Edit", delete: "Delete", cancel: "Cancel", search: "Search" },
      nav: { overview: "Overview", appointments: "Appointments", schedule: "Schedule", tests: "Prescriptions", queueTypes: "Queue Types", products: "Products", content: "Content", sections: "Sections", settings: "Settings" },
      tests: {
        title: "Eye tests & prescriptions",
        subtitle: "Record tests, search by name or ID, and print prescriptions.",
        newTest: "New test",
        editTest: "Edit test",
        date: "Test date",
        firstName: "First name",
        lastName: "Last name",
        idNumber: "ID number",
        previousRx: "Previous prescription",
        currentRx: "Prescription",
        notes: "Notes",
        none: "No tests yet. Create a new one.",
        saved: "Test saved",
        print: "Print / PDF",
        deleteWarn: "Delete this test? This cannot be undone.",
        required: "Date, first name, last name and ID number are required.",
        back: "Back to list",
        searchHint: "Search by name or ID…",
      },
      schedule: {
        title: "Schedule & opening hours",
        subtitle: "Define when appointments can be booked — customers only see free slots.",
        openingTitle: "Opening hours",
        openingHint: "Pick days and an hour range. Add several rows (e.g. Friday separately).",
        addRule: "Add row",
        daysLabel: "Days",
        start: "From",
        end: "Until",
        windowLabel: "How many days ahead can be booked",
        windowHint: "Customers can only pick a slot within this range.",
        durationsTitle: "Appointment duration per service",
        durationsHint: "How many minutes each appointment takes — the system reserves this time automatically.",
        minutes: "minutes",
        footerNote: "Opening hours update automatically in the site footer.",
        noRules: "No opening hours defined — add a row so customers can book.",
        invalidRule: "Each row needs at least one day and a start time before the end time.",
        saved: "Schedule saved",
      },
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
      contentTabs: { hero: "Who We Are", gallery: "Gallery", team: "Optometrists", services: "Services", reviews: "Reviews", essays: "Essays", blocks: "Blocks", footer: "Footer", backgrounds: "Backgrounds", layout: "Layout" },
      essay: { subtitle: "Add blocks of text over a background image.", titleField: "Title", bodyField: "Text", add: "Add essay", remove: "Remove", none: "No essays yet." },
      bg: { subtitle: "Upload a background image for any section. It appears softly behind the content." },
      preview: { label: "Live preview — updates when you Save" },
      toasts: { saved: "Saved — live on the site", saveError: "Could not save" },
      imageUpload: { upload: "Upload image", replace: "Replace image", remove: "Remove", uploading: "Uploading…", failed: "Upload failed" },
      positioner: { label: "Reposition photo", hint: "drag the image to frame it", reset: "Reset", frameShape: "Frame shape:", align: "Align:" },
      sections: {
        subtitle: "Show/hide sections and reorder them. This controls both the page and the nav tabs.",
        tip: "Tip: hiding Booking or Contact removes the booking form / contact details from the site — usually keep those on.",
        shown: "Shown",
        hidden: "Hidden",
        showHint: "Hidden — tap to show",
        hideHint: "Shown — tap to hide",
        moveUp: "Move up",
        moveDown: "Move down",
      },
      prod: {
        colImage: "Image",
        colName: "Name",
        colCategory: "Category",
        colPrice: "Price",
        colActions: "Actions",
        none: "No products yet.",
        addTitle: "Add product",
        editTitle: "Edit product",
        nameLabel: "Name",
        descLabel: "Description",
        priceLabel: "Price (₪)",
        priceHint: "0 = \"ask in store\"",
        categoryLabel: "Category",
        saveProduct: "Save product",
        deleteTitle: "Delete product",
        deleteConfirmPre: "Delete ",
        deleteConfirmPost: "? This cannot be undone.",
        nameRequired: "Please enter a product name",
        updated: "Product updated",
        added: "Product added",
        saveError: "Could not save product",
        deleted: "Product deleted",
        deleteError: "Could not delete product",
      },
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
        typed: "Typed review",
        googlePhoto: "Google photo",
        googlePhotoHint: "Upload a screenshot of a Google review. It's shown as-is, with no text.",
        visible: "Shown on site",
        pending: "Pending approval",
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
        hoursAuto: "Footer opening hours update automatically from Admin → Schedule.",
        socialLinks: "Social links",
        addLink: "Add link",
        linkLabel: "Link label",
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
        gallery: "More photos",
        galleryHint: "shown as a carousel in the full-screen detail view",
        addPhoto: "Add photo",
        detailBg: "Detail background",
        detailBgHint: "shown full-screen when the card is tapped",
        cover: "Cover photo",
        coverHint: "the face shown on the card",
        setCover: "Make cover",
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
        duration: "Duration",
        viewList: "List",
        viewGrid: "Calendar",
        more: "more",
        dayNone: "No appointments on this day.",
        setTime: "Reschedule",
        setTimeDesc: "Manually change the appointment time — the customer is notified with the new time.",
        dateTime: "Date & time",
        dateTimeHint: "The customer already picked a time on the site; change it here only to move the appointment.",
      },
    },
  },
  ru: {
    dir: "ltr",
    langName: "Русский",
    nav: { home: "О нас", products: "Продукция", gallery: "Галерея", team: "Оптометристы", services: "Услуги", reviews: "Отзывы", essays: "Статьи", book: "Запись", contact: "Контакты" },
    hero: { badge: "Добро пожаловать в MEDOPTIC", cta: "Записаться сейчас", secondary: "Смотреть галерею" },
    gallery: { eyebrow: "Загляните к нам", heading: "Галерея", subheading: "Моменты, оправы и атмосфера нашего магазина." },
    services: { eyebrow: "Что мы предлагаем", heading: "Наши услуги", subheading: "Выберите подходящую услугу и запишитесь за пару касаний.", book: "Записаться", readMore: "Подробнее", readLess: "Свернуть", empty: "Сейчас нет доступных услуг." },
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
      writeReview: "Написать отзыв",
      formTitle: "Поделитесь впечатлениями",
      formName: "Ваше имя",
      formRating: "Оценка",
      formText: "Ваш отзыв",
      formSubmit: "Отправить",
      formSubmitting: "Отправка…",
      formSuccess: "Спасибо! Отзыв появится после проверки.",
      formError: "Не удалось отправить. Попробуйте снова.",
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
      submit: "Подтвердить запись",
      submitHint: "Выберите день и время — запись подтверждается сразу.",
      submitting: "Записываем…",
      successTitle: "Вы записаны!",
      successBody: "Мы отправили подтверждение и напомним за день до приёма.",
      bookAnother: "Записаться ещё раз",
      cancel: "Отменить запись",
      cancelledTitle: "Запись отменена",
      continueToTime: "Далее: выбрать день и время",
      stepTime: "Выбор дня и времени",
      back: "Назад к данным",
      chooseDay: "Какой день вам удобен?",
      chooseHour: "Во сколько?",
      loadingSlots: "Загружаем свободное время…",
      noSlotsDay: "В этот день нет свободного времени",
      noSlotsAtAll: "Сейчас нет свободных мест. Позвоните нам — мы поможем.",
      slotTaken: "Это время только что заняли — выберите другое.",
      tooMany: "На этот номер телефона уже есть несколько активных записей. Позвоните нам, чтобы записаться ещё.",
      yourSlot: "Ваша запись",
      durationLabel: "Длительность",
      minutesShort: "мин",
      closed: "Закрыто",
      full: "Занято",
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
    weekdaysShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    weekdaysLong: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
    admin: {
      loading: "Загрузка…",
      viewSite: "Открыть сайт",
      signOut: "Выйти",
      save: "Сохранить",
      saving: "Сохранение…",
      refresh: "Обновить",
      actions: { approve: "Подтвердить", decline: "Отклонить", add: "Добавить", edit: "Изменить", delete: "Удалить", cancel: "Отмена", search: "Поиск" },
      nav: { overview: "Обзор", appointments: "Записи", schedule: "Расписание", tests: "Рецепты", queueTypes: "Типы услуг", products: "Товары", content: "Контент", sections: "Разделы", settings: "Настройки" },
      tests: {
        title: "Проверки зрения и рецепты",
        subtitle: "Записывайте проверки, ищите по имени или номеру ID и печатайте рецепты.",
        newTest: "Новая проверка",
        editTest: "Редактировать",
        date: "Дата проверки",
        firstName: "Имя",
        lastName: "Фамилия",
        idNumber: "Номер ID",
        previousRx: "Предыдущий рецепт",
        currentRx: "Рецепт",
        notes: "Примечания",
        none: "Пока нет проверок. Создайте новую.",
        saved: "Проверка сохранена",
        print: "Печать / PDF",
        deleteWarn: "Удалить эту проверку? Действие необратимо.",
        required: "Обязательны дата, имя, фамилия и номер ID.",
        back: "К списку",
        searchHint: "Поиск по имени или номеру ID…",
      },
      schedule: {
        title: "Расписание и часы работы",
        subtitle: "Определите, когда можно записаться — клиенты видят только свободные слоты.",
        openingTitle: "Часы работы",
        openingHint: "Выберите дни и диапазон часов. Можно добавить несколько строк (например, пятницу отдельно).",
        addRule: "Добавить строку",
        daysLabel: "Дни",
        start: "С",
        end: "До",
        windowLabel: "На сколько дней вперёд можно записаться",
        windowHint: "Клиенты смогут выбрать время только в этом диапазоне.",
        durationsTitle: "Длительность приёма по услугам",
        durationsHint: "Сколько минут занимает приём — система автоматически резервирует это время.",
        minutes: "минут",
        footerNote: "Часы работы автоматически обновляются в подвале сайта.",
        noRules: "Часы работы не заданы — добавьте строку, чтобы клиенты могли записаться.",
        invalidRule: "В каждой строке выберите хотя бы один день; время начала должно быть раньше конца.",
        saved: "Расписание сохранено",
      },
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
      contentTabs: { hero: "О нас", gallery: "Галерея", team: "Оптометристы", services: "Услуги", reviews: "Отзывы", essays: "Статьи", blocks: "Блоки", footer: "Подвал", backgrounds: "Фоны", layout: "Порядок" },
      essay: { subtitle: "Добавьте блоки текста на фоновом изображении.", titleField: "Заголовок", bodyField: "Текст", add: "Добавить статью", remove: "Удалить", none: "Пока нет статей." },
      bg: { subtitle: "Загрузите фоновое изображение для раздела. Оно появится мягко за контентом." },
      preview: { label: "Живой предпросмотр — обновляется при сохранении" },
      toasts: { saved: "Сохранено — опубликовано на сайте", saveError: "Не удалось сохранить" },
      imageUpload: { upload: "Загрузить фото", replace: "Заменить фото", remove: "Удалить", uploading: "Загрузка…", failed: "Не удалось загрузить" },
      positioner: { label: "Положение фото", hint: "перетащите изображение, чтобы кадрировать", reset: "Сброс", frameShape: "Форма рамки:", align: "Выравнивание:" },
      sections: {
        subtitle: "Показать/скрыть разделы и изменить их порядок. Это влияет и на страницу, и на вкладки навигации.",
        tip: "Совет: скрытие записи или контактов убирает с сайта форму записи / контактные данные — обычно их лучше оставить включёнными.",
        shown: "Показан",
        hidden: "Скрыт",
        showHint: "Скрыт — нажмите, чтобы показать",
        hideHint: "Показан — нажмите, чтобы скрыть",
        moveUp: "Вверх",
        moveDown: "Вниз",
      },
      prod: {
        colImage: "Фото",
        colName: "Название",
        colCategory: "Категория",
        colPrice: "Цена",
        colActions: "Действия",
        none: "Пока нет товаров.",
        addTitle: "Добавить товар",
        editTitle: "Изменить товар",
        nameLabel: "Название",
        descLabel: "Описание",
        priceLabel: "Цена (₪)",
        priceHint: "0 = «уточнить в магазине»",
        categoryLabel: "Категория",
        saveProduct: "Сохранить товар",
        deleteTitle: "Удалить товар",
        deleteConfirmPre: "Удалить ",
        deleteConfirmPost: "? Это действие нельзя отменить.",
        nameRequired: "Введите название товара",
        updated: "Товар обновлён",
        added: "Товар добавлен",
        saveError: "Не удалось сохранить товар",
        deleted: "Товар удалён",
        deleteError: "Не удалось удалить товар",
      },
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
        typed: "Текстовый отзыв",
        googlePhoto: "Скриншот Google",
        googlePhotoHint: "Загрузите скриншот отзыва из Google. Он показывается как есть, без текста.",
        visible: "Показывать на сайте",
        pending: "Ожидает одобрения",
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
        hoursAuto: "Часы работы в подвале обновляются автоматически из раздела Админ → Расписание.",
        socialLinks: "Соцсети",
        addLink: "Добавить ссылку",
        linkLabel: "Название ссылки",
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
        gallery: "Дополнительные фото",
        galleryHint: "показываются каруселью на полноэкранной странице услуги",
        addPhoto: "Добавить фото",
        detailBg: "Полноэкранный фон",
        detailBgHint: "показывается на весь экран при нажатии на карточку",
        cover: "Главное фото",
        coverHint: "показывается на карточке",
        setCover: "Сделать главным",
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
        duration: "Длительность",
        viewList: "Список",
        viewGrid: "Календарь",
        more: "ещё",
        dayNone: "В этот день нет записей.",
        setTime: "Перенести",
        setTimeDesc: "Ручное изменение времени приёма — клиент получит уведомление с новым временем.",
        dateTime: "Дата и время",
        dateTimeHint: "Клиент уже выбрал время на сайте; меняйте здесь только чтобы перенести приём.",
      },
    },
  },
};

export const LOCALES: Locale[] = ["he", "en", "ru"];
export const DEFAULT_LOCALE: Locale = "he";
