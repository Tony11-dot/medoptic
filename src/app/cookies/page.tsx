"use client";

import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

const TITLE = { he: "מדיניות עוגיות", en: "Cookie Policy", ru: "Политика использования cookie" };

const SECTIONS: LegalSection[] = [
  {
    heading: { he: "מהן עוגיות?", en: "What are cookies?", ru: "Что такое cookie?" },
    body: [
      {
        he: "עוגיות (Cookies) ואחסון מקומי הם קבצים קטנים שהדפדפן שומר במכשיר שלכם, כדי שהאתר יזכור הגדרות בין ביקורים.",
        en: "Cookies and local storage are small pieces of data your browser keeps on your device so a website can remember settings between visits.",
        ru: "Cookie и локальное хранилище — это небольшие данные, которые браузер сохраняет на вашем устройстве, чтобы сайт запоминал настройки между посещениями.",
      },
    ],
  },
  {
    heading: { he: "במה אנו משתמשים", en: "What we use", ru: "Что мы используем" },
    body: [
      {
        he: "העדפות: שפת האתר והגדרות הנגישות שבחרתם (גודל טקסט, ניגודיות וכו׳) נשמרות באחסון המקומי של הדפדפן בלבד.",
        en: "Preferences: the site language and the accessibility settings you choose (text size, contrast, etc.) are saved in your browser's local storage only.",
        ru: "Настройки: язык сайта и выбранные параметры доступности (размер текста, контраст и т. д.) сохраняются только в локальном хранилище браузера.",
      },
      {
        he: "עוגייה חיונית: עוגיית התחברות מאובטחת לצוות בלבד, המשמשת לכניסה למערכת הניהול. מבקרים רגילים לא מקבלים אותה.",
        en: "Essential cookie: a secure sign-in cookie used by staff only to access the admin system. Regular visitors never receive it.",
        ru: "Необходимый cookie: защищённый cookie входа, который используется только персоналом для доступа к системе управления. Обычные посетители его не получают.",
      },
      {
        he: "צד שלישי: המפה המוטמעת של Google Maps עשויה להציב עוגיות משלה, בהתאם למדיניות של Google.",
        en: "Third party: the embedded Google Maps map may set its own cookies, under Google's policies.",
        ru: "Третьи стороны: встроенная карта Google Maps может устанавливать собственные cookie в соответствии с политикой Google.",
      },
    ],
  },
  {
    heading: { he: "מה איננו עושים", en: "What we don't do", ru: "Чего мы не делаем" },
    body: [
      {
        he: "איננו משתמשים בעוגיות פרסום או מעקב, ואיננו בונים פרופילים של מבקרים.",
        en: "We don't use advertising or tracking cookies, and we don't build visitor profiles.",
        ru: "Мы не используем рекламные или отслеживающие cookie и не создаём профили посетителей.",
      },
    ],
  },
  {
    heading: { he: "ניהול העדפות", en: "Managing your preferences", ru: "Управление настройками" },
    body: [
      {
        he: "ניתן למחוק או לחסום עוגיות ואחסון מקומי בהגדרות הדפדפן בכל עת. האתר ימשיך לעבוד, אך ההעדפות שלכם לא יישמרו.",
        en: "You can clear or block cookies and local storage in your browser settings at any time. The site will keep working, but your preferences won't be remembered.",
        ru: "Вы можете в любой момент удалить или заблокировать cookie и локальное хранилище в настройках браузера. Сайт продолжит работать, но ваши настройки не будут сохраняться.",
      },
    ],
  },
];

export default function CookiesPage() {
  return <LegalPage title={TITLE} sections={SECTIONS} />;
}
