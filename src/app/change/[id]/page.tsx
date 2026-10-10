"use client";

// Public self-service "change date" page, linked from the confirmation/reminder
// SMS and emails next to the cancel link. The appointment UUID in the URL is
// the capability — the page shows only slot times, never personal details.

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { SlotPicker, useDateLabels } from "@/components/site/SlotPicker";
import { BUSINESS_TZ, type DayAvailability, type Slot } from "@/lib/schedule";

type State = "loading" | "pick" | "changed" | "locked" | "gone" | "error";

export default function ChangePage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useI18n();
  const { fullDate } = useDateLabels();
  const [state, setState] = useState<State>("loading");
  const [current, setCurrent] = useState<string | null>(null);
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const formatWhen = useCallback(
    (iso: string) =>
      new Date(iso).toLocaleString(locale, {
        timeZone: BUSINESS_TZ,
        weekday: "long",
        day: "2-digit",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  const loadSlots = useCallback(async () => {
    setDays(null);
    setSelectedSlot(null);
    try {
      const res = await fetch(`/api/availability?appt=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error();
      setDays((await res.json()).days ?? []);
    } catch {
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetch(`/api/appointments/${id}/self`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const appt = d.appointment;
        setCurrent(appt.appointmentAt);
        if (appt.status === "declined") return setState("gone");
        if (!appt.canChange) return setState("locked");
        setState("pick");
        loadSlots();
      })
      .catch((status) => setState(status === 404 ? "gone" : "error"));
  }, [id, loadSlots]);

  async function confirm() {
    if (!selectedSlot) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/appointments/${id}/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", appointmentAt: selectedSlot.iso }),
      });
      if (res.status === 409) {
        // Someone grabbed that slot first — refresh the grid and re-pick.
        setNotice(t.booking.slotTaken);
        await loadSlots();
        return;
      }
      if (res.status === 403) return setState("locked");
      if (!res.ok) throw new Error();
      setCurrent((await res.json()).appointmentAt);
      setState("changed");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  }

  const selectedDayData = days?.find((d) => d.date === selectedDay) ?? null;
  const anySlots = (days ?? []).some((d) => d.slots.length > 0);

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-line bg-white p-6 shadow-card md:p-8">
        <span className="flex justify-center">
          <Logo className="h-16 w-auto" />
        </span>

        {state === "loading" && (
          <div className="mt-8 flex justify-center">
            <span className="size-6 animate-spin rounded-full border-2 border-line border-t-brand" />
          </div>
        )}

        {state === "pick" && (
          <>
            <h1 className="mt-6 text-center text-2xl font-extrabold text-ink">{t.booking.changeTitle}</h1>
            {current && (
              <p className="mt-3 text-center text-base text-muted">
                {t.booking.changeCurrent}: <span className="font-bold text-ink">{formatWhen(current)}</span>
              </p>
            )}
            <SlotPicker
              days={days}
              selectedDay={selectedDay}
              selectedSlot={selectedSlot}
              onDay={(date) => {
                setSelectedDay(date);
                setSelectedSlot(null);
              }}
              onSlot={setSelectedSlot}
            />
            {notice && (
              <p role="alert" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-800">
                {notice}
              </p>
            )}
            {anySlots && (
              <button
                type="button"
                onClick={confirm}
                disabled={!selectedSlot || busy}
                className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-[0_10px_28px_rgba(0,102,204,0.28)] transition hover:bg-brand-dark disabled:opacity-50"
              >
                <span aria-hidden className="text-xl">🗓</span>
                {busy ? t.booking.submitting : t.booking.changeConfirm}
              </button>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-base">
              <Link href="/" className="font-semibold text-brand-dark underline-offset-2 hover:underline">
                {t.booking.cancelBack}
              </Link>
              <Link href={`/cancel/${id}`} className="text-sm font-medium text-rose-600 underline-offset-2 hover:underline">
                {t.booking.cancel}
              </Link>
            </div>
          </>
        )}

        {state === "changed" && (
          <div className="text-center">
            <span className="mx-auto mt-6 grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</span>
            <h1 className="mt-5 text-2xl font-extrabold text-ink">{t.booking.changedTitle}</h1>
            {selectedSlot && selectedDayData ? (
              <p className="mt-4 rounded-2xl bg-brand-50 px-5 py-3 text-lg font-bold text-brand-dark">
                {fullDate(selectedDayData.date, selectedDayData.weekday)} · {selectedSlot.label}
              </p>
            ) : (
              current && (
                <p className="mt-4 rounded-2xl bg-brand-50 px-5 py-3 text-lg font-bold text-brand-dark">{formatWhen(current)}</p>
              )
            )}
            <p className="mt-3 text-base text-ink/80">{t.booking.successBody}</p>
            <Link href="/" className="mt-6 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.cancelBack}
            </Link>
          </div>
        )}

        {state === "locked" && (
          <div className="text-center">
            <h1 className="mt-6 text-xl font-extrabold text-ink">{t.booking.changeLimit}</h1>
            {current && (
              <p className="mt-4 rounded-2xl bg-brand-50 px-5 py-3 text-lg font-bold text-brand-dark">{formatWhen(current)}</p>
            )}
            <Link href="/#contact" className="mt-6 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.cancelBack}
            </Link>
          </div>
        )}

        {state === "gone" && (
          <div className="text-center">
            <span className="mx-auto mt-6 grid size-16 place-items-center rounded-full bg-rose-100 text-3xl text-rose-600">✕</span>
            <h1 className="mt-5 text-2xl font-extrabold text-ink">{t.booking.cancelledTitle}</h1>
            <Link href="/#book" className="mt-6 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.bookAnother}
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
            <h1 className="mt-6 text-xl font-extrabold text-ink">{t.booking.errors.generic}</h1>
            <Link href="/" className="mt-6 block text-base font-semibold text-brand-dark underline-offset-2 hover:underline">
              {t.booking.cancelBack}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
