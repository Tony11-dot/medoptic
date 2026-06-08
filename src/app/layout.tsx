import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ToastProvider } from "@/components/ui/Toast";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // lang/dir start at Hebrew (default) and are updated client-side by the
  // LanguageProvider; suppressHydrationWarning avoids a mismatch warning.
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning className={rubik.variable}>
      <body>
        <LanguageProvider>
          <ToastProvider>{children}</ToastProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
