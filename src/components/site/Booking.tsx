"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { ReminderChannel, Service } from "@/lib/types";
// The /api/availability response shape comes straight from the shared slot
// engine, so the picker can never drift from what the server returns.
import type { DayAvailability, Slot } from "@/lib/schedule";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { SectionBg } from "./SectionBg";
import { cn } from "@/lib/cn";

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  service: string;
  email: string;
  notes: string;
  reminderChannels: ReminderChannel[];
}

export function Booking({ bg }: { bg?: string }) {
  const { t, pick, locale } = useI18n();
  const toast = useToast();
  const [step, setStep] = useState<"details" | "time">("details");
  const [done, setDone] = useState(false);
  const [services, setServices] = useState<Service[]>([]);

  // The hour grid for the chosen service.
  const [days, setDays] = useState<DayAvailability[] | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Self-service after booking: let the customer cancel their appointment.
  const [apptId, setApptId] = useState<string | null>(null);
  const [bookedSlot, setBookedSlot] = useState<(Slot & { date: string; weekday: number }) | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [selfBusy, setSelfBusy] = useState(false);

  async function cancelBooking() {
    if (!apptId) return;
    setSelfBusy(true);
    try {
      const res = await fetch(`/api/appointments/${apptId}/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error();
      setCancelled(true);
    } catch {
      toast.error(t.booking.errors.generic);
    } finally {
      setSelfBusy(false);
    }
  }

  function bookAnother() {
    setDone(false);
    setStep("details");
    setApptId(null);
    setBookedSlot(null);
    setCancelled(false);
    setSelectedDay(null);
    setSelectedSlot(null);
    setDays(null);
  }

  // Service / queue types are managed in the admin panel — load them live so
  // the booking form always reflects what's currently offered.
  useEffect(() => {
    fetch("/api/services")
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([]));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { firstName: "", lastName: "", phone: "", service: "", email: "", notes: "", reminderChannels: ["sms"] },
  });

  const reminders = watch("reminderChannels") ?? [];
  const toggleReminder = (c: ReminderChannel) =>
    setValue("reminderChannels", reminders.includes(c) ? reminders.filter((x) => x !== c) : [...reminders, c]);

  const chosenServiceId = watch("service");
  const chosenService = services.find((s) => s.id === chosenServiceId);

  // Load (or refresh) the free-slot grid for the chosen service.
  const loadAvailability = useCallback(async (serviceId: string) => {
    setDays(null);
    try {
      const res = await fetch(`/api/availability?service=${encodeURIComponent(serviceId)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDays(data.days ?? []);
      setDuration(data.durationMinutes ?? null);
    } catch {
      setDays([]);
      toast.error(t.booking.errors.generic);
    }
  }, [toast, t]);

  // Step 1 -> step 2: validate the detail fields, then open the hour picker.
  async function continueToTime() {
    const ok = await trigger(["firstName", "lastName", "phone", "service", "email"]);
    if (!ok) return;
    setSelectedDay(null);
    setSelectedSlot(null);
    setStep("time");
    await loadAvailability(getValues("service"));
  }

  const selectedDayData = useMemo(
    () => days?.find((d) => d.date === selectedDay) ?? null,
    [days, selectedDay],
  );

  // Localized labels for a "YYYY-MM-DD" business-tz calendar date.
  const dayNum = (date: string) => Number(date.slice(8, 10));
  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }),
    [locale],
  );
  const monthName = (date: string) => monthFmt.format(new Date(`${date}T12:00:00Z`));
  const fullDate = (date: string, weekday: number) =>
    `${t.weekdaysLong[weekday]}, ${dayNum(date)} ${monthName(date)}`;

  const submitBooking = handleSubmit(async (values) => {
    if (!selectedSlot || !selectedDayData) return;
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, appointmentAt: selectedSlot.iso }),
      });
      if (res.status === 409 || res.status === 422) {
        // Cinema-style: the seat was grabbed first, or the slot slid into the
        // past while the form sat open — refresh the grid and re-pick.
        toast.error(t.booking.slotTaken);
        setSelectedSlot(null);
        await loadAvailability(values.service);
        return;
      }
      if (res.status === 429) {
        // Per-phone booking cap (or rate limit) — tell them to call instead.
        toast.error(t.booking.tooMany);
        return;
      }
      if (!res.ok) throw new Error("request failed");
      const data = await res.json().catch(() => null);
      setApptId(data?.appointment?.id ?? null);
      setBookedSlot({ ...selectedSlot, date: selectedDayData.date, weekday: selectedDayData.weekday });
      setDone(true);
      reset();
    } catch {
      toast.error(t.booking.errors.generic);
    }
  });

  const errId = (name: keyof FormValues) => (errors[name] ? `${name}-error` : undefined);
  const anySlots = (days ?? []).some((d) => d.slots.length > 0);

  return (
    <section id="book" className={`relative scroll-mt-20 overflow-hidden bg-surface py-20 md:py-28 ${bg ? "flex min-h-screen flex-col justify-center" : ""}`}>
      <SectionBg url={bg} />
      <div className="container-x grid items-stretch gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: invitation panel */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl brand-gradient-animated p-8 text-white md:p-10"
        >
          <span className="inline-block rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
            {t.booking.eyebrow}
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight md:text-4xl">{t.booking.heading}</h2>
          <p className="mt-4 max-w-md text-white/85">{t.booking.subheading}</p>
          <ul className="mt-8 space-y-3 text-sm">
            {services.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-white/20 text-xs">✓</span>
                {pick(s.label)}
              </li>
            ))}
          </ul>
          <div className="pointer-events-none absolute -bottom-16 -inset-e-16 size-56 rounded-full bg-white/10 blur-2xl" />
        </motion.div>

        {/* Right: details form -> hour picker -> success */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-line bg-white p-6 shadow-card md:p-8"
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-full flex-col items-center justify-center py-10 text-center"
              >
                {cancelled ? (
                  <>
                    <span className="grid size-16 place-items-center rounded-full bg-rose-100 text-3xl text-rose-600">✕</span>
                    <h3 className="mt-5 text-3xl font-extrabold text-ink">{t.booking.cancelledTitle}</h3>
                    <button
                      type="button"
                      onClick={bookAnother}
                      className="mt-6 text-base font-semibold text-brand-dark underline-offset-2 hover:underline"
                    >
                      {t.booking.bookAnother}
                    </button>
                  </>
                ) : (
                  <>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="grid size-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600"
                    >
                      ✓
                    </motion.span>
                    <h3 className="mt-5 text-3xl font-extrabold text-ink">{t.booking.successTitle}</h3>
                    {bookedSlot && (
                      <p className="mt-4 rounded-2xl bg-brand-50 px-6 py-3 text-xl font-bold text-brand-dark">
                        {fullDate(bookedSlot.date, bookedSlot.weekday)} · {bookedSlot.label}
                      </p>
                    )}
                    <p className="mt-3 max-w-sm text-lg text-ink/80">{t.booking.successBody}</p>

                    <button
                      type="button"
                      onClick={bookAnother}
                      className="mt-8 text-base font-semibold text-brand-dark underline-offset-2 hover:underline"
                    >
                      {t.booking.bookAnother}
                    </button>
                    <button
                      type="button"
                      onClick={cancelBooking}
                      disabled={selfBusy}
                      className="mt-2 text-sm font-medium text-rose-600 underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      {t.booking.cancel}
                    </button>
                  </>
                )}
              </motion.div>
            ) : step === "time" ? (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-2xl font-extrabold text-ink">{t.booking.stepTime}</h3>
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="text-sm font-semibold text-brand-dark underline-offset-2 hover:underline"
                  >
                    ← {t.booking.back}
                  </button>
                </div>
                {chosenService && duration != null && (
                  <p className="mt-1 text-base text-muted">
                    {pick(chosenService.label)} · {t.booking.durationLabel}: {duration} {t.booking.minutesShort}
                  </p>
                )}

                {days === null ? (
                  <div className="flex items-center gap-3 py-14 text-muted">
                    <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
                    {t.booking.loadingSlots}
                  </div>
                ) : !anySlots ? (
                  <p className="py-14 text-center text-lg text-muted">{t.booking.noSlotsAtAll}</p>
                ) : (
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
                            onClick={() => {
                              setSelectedDay(d.date);
                              setSelectedSlot(null);
                            }}
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
                                  onClick={() => setSelectedSlot(s)}
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
                    <button
                      type="button"
                      onClick={submitBooking}
                      disabled={!selectedSlot || isSubmitting}
                      className="mt-4 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-[0_10px_28px_rgba(0,102,204,0.28)] transition hover:bg-brand-dark disabled:opacity-50"
                    >
                      <span aria-hidden className="text-xl">🗓</span>
                      {isSubmitting ? t.booking.submitting : t.booking.submit}
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  continueToTime();
                }}
                noValidate
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4 sm:grid-cols-2"
              >
                <Field label={t.booking.firstName} error={errors.firstName && t.booking.errors.required} errId={errId("firstName")}>
                  <input
                    {...register("firstName", { required: true })}
                    aria-invalid={!!errors.firstName}
                    aria-describedby={errId("firstName")}
                    className={inputCls(!!errors.firstName)}
                  />
                </Field>

                <Field label={t.booking.lastName} error={errors.lastName && t.booking.errors.required} errId={errId("lastName")}>
                  <input
                    {...register("lastName", { required: true })}
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errId("lastName")}
                    className={inputCls(!!errors.lastName)}
                  />
                </Field>

                <Field
                  label={t.booking.phone}
                  error={errors.phone && (errors.phone.type === "required" ? t.booking.errors.required : t.booking.errors.phone)}
                  errId={errId("phone")}
                >
                  <input
                    type="tel"
                    dir="ltr"
                    {...register("phone", { required: true, validate: (v) => isValidPhone(v) })}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errId("phone")}
                    className={inputCls(!!errors.phone)}
                  />
                </Field>

                <Field label={t.booking.service} error={errors.service && t.booking.errors.required} errId={errId("service")}>
                  <select
                    {...register("service", { required: true })}
                    aria-invalid={!!errors.service}
                    aria-describedby={errId("service")}
                    className={cn(inputCls(!!errors.service), "appearance-none bg-white")}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {t.booking.servicePlaceholder}
                    </option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {pick(s.label)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field className="sm:col-span-2" label={t.booking.emailOptional} error={errors.email && t.booking.errors.email} errId={errId("email")}>
                  <input
                    type="email"
                    dir="ltr"
                    {...register("email", { validate: (v) => !v || isValidEmail(v) })}
                    aria-invalid={!!errors.email}
                    aria-describedby={errId("email")}
                    className={inputCls(!!errors.email)}
                  />
                </Field>

                <Field className="sm:col-span-2" label={t.booking.notesOptional}>
                  <textarea
                    rows={3}
                    {...register("notes")}
                    className={cn(
                      "w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition",
                      "resize-none focus:border-brand focus:ring-4 focus:ring-brand/10",
                    )}
                  />
                </Field>

                {/* Reminder channels — pick one or both (multi-select) */}
                <div className="sm:col-span-2">
                  <span className="mb-2 block text-base font-semibold text-ink">{t.booking.reminderLabel}</span>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { v: "sms" as const, label: t.booking.reminderSms, icon: "💬" },
                      { v: "email" as const, label: t.booking.reminderEmail, icon: "✉️" },
                    ]).map((opt) => {
                      const on = reminders.includes(opt.v);
                      return (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => toggleReminder(opt.v)}
                          aria-pressed={on ? "true" : "false"}
                          className={cn(
                            "flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-lg font-bold transition",
                            on
                              ? "border-brand bg-brand-50 text-brand-dark"
                              : "border-line bg-white text-ink/70 hover:border-brand-200",
                          )}
                        >
                          <span aria-hidden className="grid size-5 place-items-center rounded-md border border-current text-xs">
                            {on ? "✓" : ""}
                          </span>
                          <span aria-hidden className="text-xl">{opt.icon}</span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-[0_10px_28px_rgba(0,102,204,0.28)] transition hover:bg-brand-dark sm:col-span-2"
                >
                  <span aria-hidden className="text-xl">🗓</span>
                  {t.booking.continueToTime}
                </button>
                <p className="-mt-1 text-center text-sm text-muted sm:col-span-2">{t.booking.submitHint}</p>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-ink outline-none transition",
    "focus:border-brand focus:ring-4 focus:ring-brand/10",
    invalid ? "border-rose-400 focus:border-rose-400 focus:ring-rose-100" : "border-line",
  );
}

function Field({
  label,
  error,
  errId,
  className,
  children,
}: {
  label: string;
  error?: string | false;
  errId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error && (
        <span id={errId} className="mt-1 block text-xs font-medium text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}
