"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";

export default function AdminLogin() {
  const router = useRouter();
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError(t.admin.login.wrong);
        return;
      }
      router.replace("/admin");
    } catch {
      setError(t.admin.login.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-card"
      >
        <div className="flex justify-center">
          <Logo className="h-40" />
        </div>
        <h1 className="mt-6 text-center text-2xl font-extrabold text-ink">{t.admin.login.title}</h1>
        <p className="mt-1 text-center text-sm text-muted">{t.admin.login.subtitle}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.admin.login.passwordLabel}</span>
            <div className="relative" dir="ltr">
              <input
                type={showPassword ? "text" : "password"}
                autoFocus
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-white px-3.5 pe-11 text-sm outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t.admin.login.hidePassword : t.admin.login.showPassword}
                aria-pressed={showPassword}
                className="absolute inset-y-0 inset-e-0 grid w-11 place-items-center text-ink/50 transition hover:text-ink"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 12S6 5.5 12 5.5c1.4 0 2.7.26 3.86.7M21.5 12S18 18.5 12 18.5c-1.4 0-2.7-.26-3.86-.7M4 4l16 16" />
                    <path d="M9.9 9.9a3 3 0 004.2 4.2" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t.admin.login.signingIn : t.admin.login.signIn}
          </Button>
        </form>

        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </motion.div>
    </div>
  );
}
