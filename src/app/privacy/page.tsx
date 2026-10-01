"use client";

import { LegalPage, type LegalSection } from "@/components/site/LegalPage";

const TITLE = { he: "מדיניות פרטיות", en: "Privacy Policy", ru: "Политика конфиденциальности" };

const SECTIONS: LegalSection[] = [
  {
    heading: { he: "מי אנחנו", en: "Who we are", ru: "Кто мы" },
    body: [
      {
        he: "מדיניות זו נוגעת לאתר של MEDOPTIC – חנות אופטיקה ומרפאת בדיקות ראייה ביקנעם עילית, ומסבירה איזה מידע אישי אנו אוספים דרך האתר, לשם מה, וכיצד אנו שומרים עליו.",
        en: "This policy covers the website of MEDOPTIC – an optical store and eye-exam clinic in Yokne'am Illit – and explains what personal information we collect through the site, why, and how we protect it.",
        ru: "Эта политика относится к сайту MEDOPTIC — оптики и кабинета проверки зрения в Йокнеам-Иллит — и объясняет, какие персональные данные мы собираем через сайт, зачем и как мы их защищаем.",
      },
    ],
  },
  {
    heading: { he: "המידע שאנו אוספים", en: "Information we collect", ru: "Какие данные мы собираем" },
    body: [
      {
        he: "בעת קביעת תור: שם פרטי ושם משפחה, מספר טלפון, כתובת אימייל (לא חובה), סוג השירות, מועד התור, הערות שבחרתם לכתוב, וערוץ התזכורת המועדף עליכם (SMS או אימייל).",
        en: "When you book an appointment: your first and last name, phone number, email address (optional), the service, the appointment time, any notes you choose to add, and your preferred reminder channel (SMS or email).",
        ru: "При записи на приём: имя и фамилия, номер телефона, адрес электронной почты (по желанию), выбранная услуга, время приёма, ваши комментарии и предпочтительный способ напоминания (SMS или email).",
      },
      {
        he: "מסירת המידע אינה חובה על פי חוק, אך בלי שם וטלפון לא נוכל לקבוע לכם תור.",
        en: "You are not legally required to give us this information, but we cannot book an appointment without a name and phone number.",
        ru: "Закон не обязывает вас предоставлять эти данные, но без имени и телефона мы не сможем вас записать.",
      },
      {
        he: "במרפאה: תוצאות בדיקות ראייה ומרשמים נשמרים בתיק לקוח המזוהה במספר תעודת זהות ותאריך לידה. מידע זה מוזן על ידי הצוות בלבד ואינו נגיש לציבור.",
        en: "At the clinic: eye-exam results and prescriptions are kept in a customer file identified by national ID number and date of birth. This information is entered by our staff only and is never publicly accessible.",
        ru: "В клинике: результаты проверки зрения и рецепты хранятся в карте клиента, привязанной к номеру удостоверения личности и дате рождения. Эти данные вносит только наш персонал, и они не доступны публично.",
      },
    ],
  },
  {
    heading: { he: "כיצד אנו משתמשים במידע", en: "How we use this information", ru: "Как мы используем данные" },
    body: [
      {
        he: "אנו משתמשים במידע אך ורק כדי לנהל את התורים שלכם, לשלוח אישורים, תזכורות והודעות על שינויים או ביטולים, לתת לכם שירות אופטי ורפואי מתאים, וליצור איתכם קשר בנוגע לביקור. איננו מוכרים את המידע ואיננו משתמשים בו לפרסום.",
        en: "We use the information solely to manage your appointments, send confirmations, reminders and notices of changes or cancellations, provide you with the right optical and eye-care service, and contact you about your visit. We never sell your information or use it for advertising.",
        ru: "Мы используем данные только для управления вашими записями, отправки подтверждений, напоминаний и уведомлений об изменениях или отменах, оказания подходящих оптических услуг и связи с вами по поводу визита. Мы не продаём ваши данные и не используем их для рекламы.",
      },
    ],
  },
  {
    heading: { he: "שיתוף עם צדדים שלישיים", en: "Sharing with third parties", ru: "Передача третьим лицам" },
    body: [
      {
        he: "המידע נשמר אצל ספקי אחסון ושירותי ענן, ונשלח דרך ספקי אימייל ו-SMS לצורך הודעות על התור בלבד. המפה באתר מוטמעת מ-Google Maps, הכפופה למדיניות הפרטיות של Google. לא נמסור מידע לגורם אחר, אלא אם נדרש לכך על פי חוק.",
        en: "Information is stored with hosting and cloud providers, and passed to email and SMS providers only to deliver appointment messages. The map on the site is embedded from Google Maps, which is subject to Google's privacy policy. We will not disclose your information to anyone else unless required by law.",
        ru: "Данные хранятся у провайдеров хостинга и облачных сервисов и передаются сервисам email и SMS только для отправки сообщений о записи. Карта на сайте встроена из Google Maps и подпадает под политику конфиденциальности Google. Мы не раскрываем ваши данные никому другому, если этого не требует закон.",
      },
    ],
  },
  {
    heading: { he: "אבטחה ושמירת מידע", en: "Security and retention", ru: "Безопасность и хранение" },
    body: [
      {
        he: "הגישה למערכת הניהול מוגנת בסיסמה ומוגבלת לצוות MEDOPTIC. פרטי תורים נשמרים כל עוד הם נחוצים לניהול השירות, ותיקים רפואיים נשמרים בהתאם לדרישות החוק.",
        en: "Access to the admin system is password-protected and limited to MEDOPTIC staff. Appointment details are kept only as long as needed to run the service, and clinical records are kept as required by law.",
        ru: "Доступ к системе управления защищён паролем и ограничен персоналом MEDOPTIC. Данные о записях хранятся столько, сколько нужно для работы сервиса, а медицинские записи — в соответствии с требованиями закона.",
      },
    ],
  },
  {
    heading: { he: "הזכויות שלכם", en: "Your rights", ru: "Ваши права" },
    body: [
      {
        he: "בהתאם לחוק הגנת הפרטיות, התשמ״א–1981, אתם רשאים לעיין במידע השמור עליכם ולבקש לתקן או למחוק אותו. לכל בקשה או שאלה ניתן לפנות אלינו בטלפון 050-965-2008 או באימייל Medoptic24@gmail.com.",
        en: "Under the Israeli Privacy Protection Law, 1981, you may review the information we hold about you and ask us to correct or delete it. For any request or question, contact us at 050-965-2008 or Medoptic24@gmail.com.",
        ru: "В соответствии с израильским Законом о защите частной жизни 1981 года вы можете ознакомиться с хранящимися о вас данными и попросить исправить или удалить их. По любым вопросам обращайтесь: 050-965-2008 или Medoptic24@gmail.com.",
      },
    ],
  },
  {
    heading: { he: "בעל השליטה במידע", en: "Data controller", ru: "Ответственный за данные" },
    body: [
      {
        he: "בעל השליטה במאגר המידע הוא MEDOPTIC, רחוב התעשייה 1, יקנעם עילית. האחראי לפניות בנושא פרטיות: סאמר נאסר, Medoptic24@gmail.com, טלפון 050-965-2008. אנו משיבים לבקשות תוך 30 יום.",
        en: "The data controller is MEDOPTIC, 1 HaTa'asiya St, Yokne'am Illit. Privacy requests are handled by Samer Nasser, Medoptic24@gmail.com, phone 050-965-2008. We respond to requests within 30 days.",
        ru: "Ответственный за базу данных — MEDOPTIC, ул. ха-Таасия 1, Йокнеам-Илит. Запросы о конфиденциальности рассматривает Самер Нассер, Medoptic24@gmail.com, телефон 050-965-2008. Мы отвечаем на запросы в течение 30 дней.",
      },
    ],
  },
];

export default function PrivacyPage() {
  return <LegalPage title={TITLE} sections={SECTIONS} />;
}
