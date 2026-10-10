"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { DayAvailability, Slot } from "@/lib/schedule";
import { cn } from "@/lib/cn";

// Localized labels for a "YYYY-MM-DD" business-tz calendar date.
export function useDateLabels() {
  const { t, locale } = useI18n();
  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }),
    [locale],
  );
  const dayNum = (date: string) => Number(date.slice(8, 10));
  const monthName = (date: string) => monthFmt.format(new Date(`${date}T12:00:00Z`));
  const fullDate = (date: string, weekday: number) =>
    `${t.weekdaysLong[weekday]}, ${dayNum(date)} ${monthName(date)}`;
  return { dayNum, monthName, fullDate };
}

// The cinema-style day + hour grid shared by the booking form and the
// self-service "change date" page. `days === null` means still loading.
export function SlotPicker({
  days,
  selectedDay,
  selectedSlot,
  onDay,
  onSlot,
}: {
  days: DayAvailability[] | null;
  selectedDay: string | null;
  selectedSlot: Slot | null;
  onDay: (date: string) => void;
  onSlot: (slot: Slot) => void;
}) {
  const { t } = useI18n();
  const { dayNum, monthName, fullDate } = useDateLabels();
  const selectedDayData = days?.find((d) => d.date === selectedDay) ?? null;

  if (days === null) {
    return (
      <div className="flex items-center gap-3 py-14 text-muted">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
        {t.booking.loadingSlots}
      </div>
    );
  }
  if (!days.some((d) => d.slots.length > 0)) {
    return <p className="py-14 text-center text-lg text-muted">{t.booking.noSlotsAtAll}</p>;
  }

  return (
    <>
      {/* Day picker — open days light up, closed/full days are off */}
      <p className="mt-5 text-base font-bold text-ink">{t.booking.chooseDay}</p>
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((d) => {
          const enabled = d.slots.length > 0;
          const active = selectedDay === d.date;
          return (
            <button
              key={d.date}
              type="button"
              disabled={!enabled}
              onClick={() => onDay(d.date)}
              aria-pressed={active ? "true" : "false"}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center rounded-xl border-2 px-1 py-2 transition",
                active
                  ? "border-brand bg-brand text-white shadow-md"
                  : enabled
                    ? "border-brand-200 bg-brand-50/60 text-brand-dark hover:border-brand"
                    : "cursor-not-allowed border-line bg-surface text-ink/30",
              )}
            >
              <span className="text-xs font-semibold">{t.weekdaysShort[d.weekday]}</span>
              <span className="text-lg font-extrabold leading-tight">{dayNum(d.date)}</span>
              <span className="text-[10px] font-medium">
                {enabled ? monthName(d.date) : d.open ? t.booking.full : t.booking.closed}
              </span>
            </button>
          );
        })}
      </div>

      {/* Hour picker — taken slots simply aren't offered (cinema-style) */}
      {selectedDayData && (
        <>
          <p className="mt-6 text-base font-bold text-ink">{t.booking.chooseHour}</p>
          {selectedDayData.slots.length === 0 ? (
            <p className="mt-2 text-muted">{t.booking.noSlotsDay}</p>
          ) : (
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {selectedDayData.slots.map((s) => {
                const active = selectedSlot?.iso === s.iso;
                return (
                  <button
                    key={s.iso}
                    type="button"
                    onClick={() => onSlot(s)}
                    aria-pressed={active ? "true" : "false"}
                    className={cn(
                      "h-12 rounded-xl border-2 text-base font-bold transition",
                      active
                        ? "border-brand bg-brand text-white shadow-md"
                        : "border-line bg-white text-ink hover:border-brand-200",
                    )}
                    dir="ltr"
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Confirm */}
      {selectedSlot && selectedDayData && (
        <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-center">
          <p className="text-sm font-semibold text-muted">{t.booking.yourSlot}</p>
          <p className="mt-1 text-xl font-extrabold text-brand-dark">
            {fullDate(selectedDayData.date, selectedDayData.weekday)} · {selectedSlot.label}
          </p>
        </div>
      )}
    </>
  );
}
