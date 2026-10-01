"use client";

import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

const TITLE = { he: "הצהרת נגישות", en: "Accessibility Statement", ru: "Заявление о доступности" };

const SECTIONS: LegalSection[] = [
  {
    heading: { he: "המחויבות שלנו", en: "Our commitment", ru: "Наши обязательства" },
    body: [
      {
        he: "MEDOPTIC רואה חשיבות רבה בהנגשת האתר והמרפאה לכלל האנשים, לרבות אנשים עם מוגבלות. פעלנו להתאים את האתר לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע\"ג-2013, ולתקן הישראלי ת\"י 5568, המבוסס על הנחיות WCAG 2.0 ברמה AA.",
        en: "MEDOPTIC is committed to making its website and clinic accessible to everyone, including people with disabilities. We have worked to bring the site in line with the Equal Rights for Persons with Disabilities (Service Accessibility Adjustments) Regulations, 2013, and Israeli Standard IS 5568, which is based on the WCAG 2.0 guidelines at level AA.",
        ru: "MEDOPTIC стремится сделать сайт и клинику доступными для всех, включая людей с инвалидностью. Мы работали над приведением сайта в соответствие с Правилами о равных правах людей с инвалидностью (адаптация услуг), 2013, и израильским стандартом IS 5568, основанным на рекомендациях WCAG 2.0 уровня AA.",
      },
    ],
  },
  {
    heading: { he: "מה עשינו באתר", en: "What we have done", ru: "Что сделано на сайте" },
    body: [
      {
        he: "האתר זמין בעברית, באנגלית וברוסית עם כיווניות נכונה לכל שפה; ניתן לנווט בו ולקבוע תור באמצעות המקלדת; לתמונות יש טקסט חלופי; שדות הטופס מתויגים; והאתר מותאם לטלפונים, להגדלת מסך ולהגדרת \"צמצום תנועה\" של מערכת ההפעלה.",
        en: "The site is available in Hebrew, English and Russian with the correct text direction for each; you can navigate it and book an appointment by keyboard; images have text alternatives; form fields are labelled; and the site adapts to phones, screen zoom and your system's \"reduce motion\" setting.",
        ru: "Сайт доступен на иврите, английском и русском с правильным направлением текста; по нему можно перемещаться и записываться на приём с клавиатуры; у изображений есть текстовые описания; поля формы подписаны; сайт адаптирован для телефонов, увеличения экрана и системной настройки «уменьшить движение».",
      },
    ],
  },
  {
    heading: { he: "מגבלות ידועות", en: "Known limitations", ru: "Известные ограничения" },
    body: [
      {
        he: "ייתכן שחלק מהתמונות והתכנים שמתעדכנים מעת לעת אינם נגישים במלואם. אם נתקלתם בקושי, נשמח לקבוע לכם תור או למסור מידע בטלפון.",
        en: "Some images and content that are updated from time to time may not be fully accessible. If anything is hard to use, we will gladly book your appointment or give you the information by phone.",
        ru: "Некоторые периодически обновляемые изображения и материалы могут быть доступны не полностью. Если что-то неудобно, мы с радостью запишем вас или ответим на вопросы по телефону.",
      },
    ],
  },
  {
    heading: { he: "רכז הנגישות", en: "Accessibility coordinator", ru: "Координатор по доступности" },
    body: [
      {
        he: "להערות, בקשות או מידע על הסדרי הנגישות במרפאה: סאמר נאסר, Medoptic24@gmail.com, טלפון 050-965-2008. נא לציין את העמוד ואת הבעיה, ונחזור אליכם בהקדם.",
        en: "For feedback, requests or information about accessibility at the clinic: Samer Nasser, Medoptic24@gmail.com, phone 050-965-2008. Please mention the page and the problem, and we will get back to you soon.",
        ru: "Для отзывов, запросов или информации о доступности клиники: Самер Нассер, Medoptic24@gmail.com, телефон 050-965-2008. Пожалуйста, укажите страницу и проблему, и мы скоро свяжемся с вами.",
      },
    ],
  },
];

export default function AccessibilityPage() {
  return <LegalPage title={TITLE} sections={SECTIONS} />;
}
