import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AccessibilityWidget } from "@/components/ui/AccessibilityWidget";

// Rubik covers Latin, Hebrew and Cyrillic — one family for all three languages.
const rubik = Rubik({
  subsets: ["latin", "hebrew", "cyrillic"],
  variable: "--font-rubik",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MEDOPTIC",
  description:
    "MEDOPTIC: precise eye exams and a curated eyewear collection. Book your appointment online.",
};

// Re-applies saved accessibility preferences before first paint, so returning
// visitors never see a flash back to default contrast/text size on load.
const A11Y_INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("medoptic.a11y")||"{}");var c=document.documentElement.classList;var steps=[100,110,120,130];if(p.fontStep)document.documentElement.style.fontSize=(steps[p.fontStep]||100)+"%";if(p.contrast)c.add("a11y-contrast");if(p.grayscale)c.add("a11y-grayscale");if(p.underline)c.add("a11y-underline");if(p.reduceMotion)c.add("a11y-reduce-motion");}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // lang/dir start at Hebrew (default) and are updated client-side by the
  // LanguageProvider; suppressHydrationWarning avoids a mismatch warning.
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={rubik.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_INIT_SCRIPT }} />
      </head>
      <body>
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
          <AccessibilityWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
