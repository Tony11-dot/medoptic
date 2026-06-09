"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", key: "overview", icon: "▦" },
  { href: "/admin/queue", key: "appointments", icon: "🗓" },
  { href: "/admin/content", key: "content", icon: "✎" },
  { href: "/admin/sections", key: "sections", icon: "≣" },
  { href: "/admin/settings", key: "settings", icon: "⚙" },
] as const;

type AuthState = "loading" | "authed" | "denied";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [auth, setAuth] = useState<AuthState>("loading");

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.authed) setAuth("authed");
        else {
          setAuth("denied");
          router.replace("/admin/login");
        }
      })
      .catch(() => active && setAuth("denied"));
    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (auth !== "authed") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-muted">
          <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
          {t.admin.loading}
        </div>
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex">
        <Link href="/admin" className="px-2">
          <Logo />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(item.href) ? "bg-brand text-white shadow-sm" : "text-ink/70 hover:bg-surface",
              )}
            >
              <span aria-hidden className="text-base">{item.icon}</span>
              {t.admin.nav[item.key]}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1">
          <div className="px-1 pb-2">
            <LanguageSwitcher />
          </div>
          <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-surface">
            <span aria-hidden>↗</span> {t.admin.viewSite}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <span aria-hidden>⎋</span> {t.admin.signOut}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-line bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button type="button" onClick={logout} className="text-sm font-semibold text-rose-600">
              {t.admin.signOut}
            </button>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                isActive(item.href) ? "bg-brand text-white" : "text-ink/70",
              )}
            >
              {t.admin.nav[item.key]}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
