"use client";

// Public self-service cancel page, linked from the confirmation/reminder
// SMS and emails. The appointment UUID in the URL is the capability — the
// page shows only the slot time, never personal details.

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { Logo } from "@/components/ui/Logo";
import { BUSINESS_TZ } from "@/lib/schedule";

type State = "loading" | "confirm" | "cancelled" | "gone" | "error";

export default function CancelPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const [state, setState] = useState<State>("loading");
  const [when, setWhen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/appointments/${id}/self`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const appt = d.appointment;
        if (appt.appointmentAt) {
          setWhen(
            new Date(appt.appointmentAt).toLocaleString(locale, {
              timeZone: BUSINESS_TZ,
              weekday: "long",
              day: "2-digit",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
        }
        setState(appt.status === "declined" ? "gone" : "confirm");
      })
      .catch(() => setState("error"));
  }, [id, locale]);

  async function cancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${id}/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error();
      setState("cancelled");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-white p-8 text-center shadow-card">
        <span className="inline-flex justify-center">
          <Logo className="h-16 w-auto" />
        </span>

        {state === "loading" && (
          <div className="mt-8 flex justify-center">
            <span className="size-6 animate-spin rounded-full border-2 border-line border-t-brand" />
          </div>
        )}

        {state === "confirm" && (
          <>
            <h1 className="mt-6 text-2xl font-extrabold text-ink">{t.booking.cancelQ}</h1>
            {when && (
              <p className="mt-4 rounded-2xl bg-brand-50 px-5 py-3 text-lg font-bold text-brand-dark">{when}</p>
            )}
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="mt-8 inline-flex h-14 w-full items-center justify-center rounded-xl bg-rose-600 px-6 text-lg font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {t.booking.cancelYes}
            </button>
            <a href="/" className="mt-4 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.cancelBack}
            </a>
          </>
        )}

        {(state === "cancelled" || state === "gone") && (
          <>
            <span className="mx-auto mt-6 grid size-16 place-items-center rounded-full bg-rose-100 text-3xl text-rose-600">✕</span>
            <h1 className="mt-5 text-2xl font-extrabold text-ink">{t.booking.cancelledTitle}</h1>
            <a href="/#book" className="mt-6 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.bookAnother}
            </a>
          </>
        )}

        {state === "error" && (
          <>
            <h1 className="mt-6 text-xl font-extrabold text-ink">{t.booking.errors.generic}</h1>
            <a href="/" className="mt-6 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.cancelBack}
            </a>
          </>
        )}
      </div>
    </main>
  );
}
