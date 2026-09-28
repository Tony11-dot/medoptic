"use client";

import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

const TITLE = { he: "תנאי שימוש", en: "Terms of Use", ru: "Условия использования" };

const SECTIONS: LegalSection[] = [
  {
    heading: { he: "כללי", en: "General", ru: "Общие положения" },
    body: [
      {
        he: "השימוש באתר MEDOPTIC מהווה הסכמה לתנאים אלה. אם אינכם מסכימים להם, אנא הימנעו משימוש באתר.",
        en: "Using the MEDOPTIC website means you accept these terms. If you do not agree, please do not use the site.",
        ru: "Пользуясь сайтом MEDOPTIC, вы принимаете эти условия. Если вы с ними не согласны, пожалуйста, не используйте сайт.",
      },
    ],
  },
  {
    heading: { he: "קביעת תורים", en: "Booking appointments", ru: "Запись на приём" },
    body: [
      {
        he: "בקשת תור דרך האתר כפופה לאישור המרפאה. נא למסור פרטים נכונים ומלאים. ניתן לבטל או לשנות תור דרך הקישור שנשלח אליכם או בטלפון, ונבקש לעשות זאת מוקדם ככל האפשר כדי לפנות את המקום ללקוחות אחרים.",
        en: "An appointment requested through the site is subject to confirmation by the clinic. Please provide accurate and complete details. You can cancel or reschedule through the link we send you or by phone — please do so as early as possible so the slot can go to someone else.",
        ru: "Запись через сайт подлежит подтверждению клиникой. Пожалуйста, указывайте точные и полные данные. Отменить или перенести приём можно по ссылке из нашего сообщения или по телефону — просим делать это как можно раньше, чтобы время смог занять другой клиент.",
      },
    ],
  },
  {
    heading: { he: "מידע באתר", en: "Information on the site", ru: "Информация на сайте" },
    body: [
      {
        he: "התכנים באתר, לרבות מאמרים ומידע על מוצרים ושירותים, נועדו למידע כללי בלבד ואינם מחליפים בדיקה או ייעוץ מקצועי. מחירים, מוצרים ושעות פעילות עשויים להשתנות ללא הודעה מוקדמת.",
        en: "Content on the site, including articles and product and service information, is for general information only and is no substitute for a professional examination or advice. Prices, products and opening hours may change without notice.",
        ru: "Материалы сайта, включая статьи и сведения о товарах и услугах, носят общий информационный характер и не заменяют профессиональную проверку или консультацию. Цены, ассортимент и часы работы могут меняться без предупреждения.",
      },
    ],
  },
  {
    heading: { he: "קניין רוחני", en: "Intellectual property", ru: "Интеллектуальная собственность" },
    body: [
      {
        he: "כל התכנים באתר – טקסטים, תמונות, לוגו ועיצוב – שייכים ל-MEDOPTIC או לבעלי הזכויות בהם, ואין להעתיקם או להשתמש בהם ללא אישור בכתב.",
        en: "All content on the site — text, images, logo and design — belongs to MEDOPTIC or its respective owners and may not be copied or used without written permission.",
        ru: "Все материалы сайта — тексты, изображения, логотип и дизайн — принадлежат MEDOPTIC или соответствующим правообладателям и не могут копироваться или использоваться без письменного разрешения.",
      },
    ],
  },
  {
    heading: { he: "הגבלת אחריות", en: "Limitation of liability", ru: "Ограничение ответственности" },
    body: [
      {
        he: "אנו עושים מאמץ לשמור על האתר זמין ומדויק, אך איננו מתחייבים שיפעל ללא תקלות. MEDOPTIC לא תישא באחריות לנזק עקיף הנובע מהשימוש באתר או מהסתמכות על המידע שבו.",
        en: "We work to keep the site available and accurate but cannot guarantee it will be error-free. MEDOPTIC is not liable for indirect damage arising from use of the site or reliance on its content.",
        ru: "Мы стараемся поддерживать сайт доступным и точным, но не гарантируем его безошибочную работу. MEDOPTIC не несёт ответственности за косвенный ущерб, связанный с использованием сайта или его материалов.",
      },
    ],
  },
  {
    heading: { he: "דין וסמכות שיפוט", en: "Governing law", ru: "Применимое право" },
    body: [
      {
        he: "על תנאים אלה חלים דיני מדינת ישראל, וסמכות השיפוט הבלעדית נתונה לבתי המשפט המוסמכים בישראל. לשאלות: 050-965-2008 או Medoptic24@gmail.com.",
        en: "These terms are governed by the laws of the State of Israel, and the competent Israeli courts have exclusive jurisdiction. Questions: 050-965-2008 or Medoptic24@gmail.com.",
        ru: "Эти условия регулируются законодательством Государства Израиль; исключительная юрисдикция принадлежит компетентным судам Израиля. Вопросы: 050-965-2008 или Medoptic24@gmail.com.",
      },
    ],
  },
];

export default function TermsPage() {
  return <LegalPage title={TITLE} sections={SECTIONS} />;
}
