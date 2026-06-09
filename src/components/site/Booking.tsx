"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { useToast } from "@/components/ui/Toast";
import type { ReminderChannel, Service } from "@/lib/types";
import { isValidEmail, isValidPhone } from "@/lib/validation";
import { schedulingUrl } from "@/lib/config";
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
  const { t, pick } = useI18n();
  const toast = useToast();
  const [done, setDone] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  // The prefilled calendar link shown on the success screen (popup fallback).
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null);
  // Self-service after booking: store the time they picked, or cancel.
  const [apptId, setApptId] = useState<string | null>(null);
  const [timeValue, setTimeValue] = useState("");
  const [timeSaved, setTimeSaved] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [selfBusy, setSelfBusy] = useState(false);

  async function saveSelfTime() {
    if (!apptId || !timeValue) return;
    setSelfBusy(true);
    try {
      const res = await fetch(`/api/appointments/${apptId}/self`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "schedule", appointmentAt: timeValue }),
      });
      if (!res.ok) throw new Error();
      setTimeSaved(true);
    } catch {
      toast.error(t.booking.errors.generic);
    } finally {
      setSelfBusy(false);
    }
  }

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
    setApptId(null);
    setTimeValue("");
    setTimeSaved(false);
    setCancelled(false);
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { firstName: "", lastName: "", phone: "", service: "", email: "", notes: "", reminderChannels: ["sms"] },
  });

  const reminders = watch("reminderChannels") ?? [];
  const toggleReminder = (c: ReminderChannel) =>
    setValue("reminderChannels", reminders.includes(c) ? reminders.filter((x) => x !== c) : [...reminders, c]);

  const onSubmit = handleSubmit(async (values) => {
    // Open the calendar (prefilled) first, in the user gesture, so the customer
    // can pick a time — then record the request.
    const url = schedulingUrl(values);
    setCalendarUrl(url);
    const win = window.open(url, "_blank", "noopener,noreferrer");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("request failed");
      const data = await res.json().catch(() => null);
      setApptId(data?.appointment?.id ?? null);
      void win;
      setDone(true);
      reset();
    } catch {
      toast.error(t.booking.errors.generic);
    }
  });

  const errId = (name: keyof FormValues) => (errors[name] ? `${name}-error` : undefined);

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
          <div className="pointer-events-none absolute -bottom-16 -end-16 size-56 rounded-full bg-white/10 blur-2xl" />
        </motion.div>

        {/* Right: form / success */}
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
                    <p className="mt-3 max-w-sm text-lg text-ink/80">{t.booking.successBody}</p>

                    {/* Calendar opened automatically; this is the popup fallback. */}
                    <a
                      href={calendarUrl ?? schedulingUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex h-16 w-full max-w-sm items-center justify-center gap-3 rounded-2xl bg-brand px-8 text-xl font-extrabold text-white shadow-[0_12px_34px_rgba(0,102,204,0.32)] transition hover:-translate-y-0.5 hover:bg-brand-dark"
                    >
                      <span aria-hidden className="text-2xl">📅</span>
                      {t.booking.pickTimeCta}
                    </a>
                    <p className="mt-3 max-w-xs text-sm text-muted">{t.booking.pickTimeHelp}</p>

                    {/* Enter the time you picked → saved straight to the system */}
                    <div className="mt-5 w-full max-w-sm rounded-2xl border border-line bg-surface p-4 text-start">
                      {timeSaved ? (
                        <p className="text-sm font-bold text-emerald-700">{t.booking.timeSaved}</p>
                      ) : (
                        <>
                          <label className="block">
                            <span className="mb-1.5 block text-sm font-semibold text-ink">{t.booking.enterTimeLabel}</span>
                            <input
                              type="datetime-local"
                              value={timeValue}
                              onChange={(e) => setTimeValue(e.target.value)}
                              className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={saveSelfTime}
                            disabled={!timeValue || selfBusy}
                            className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-base font-bold text-white transition hover:bg-brand-dark disabled:opacity-50"
                          >
                            {selfBusy ? t.booking.enterTimeSaving : t.booking.enterTimeSave}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Strong reminder — hidden once they've entered a time */}
                    {!timeSaved && (
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-5 w-full max-w-sm rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800"
                      >
                        {t.booking.warnPickTime}
                      </motion.p>
                    )}

                    <button
                      type="button"
                      onClick={bookAnother}
                      className="mt-6 text-base font-semibold text-brand-dark underline-offset-2 hover:underline"
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
            ) : (
              <motion.form
                key="form"
                onSubmit={onSubmit}
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
                  disabled={isSubmitting}
                  className="mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-lg font-bold text-white shadow-[0_10px_28px_rgba(0,102,204,0.28)] transition hover:bg-brand-dark disabled:opacity-60 sm:col-span-2"
                >
                  <span aria-hidden className="text-xl">📅</span>
                  {isSubmitting ? t.booking.submitting : t.booking.submitPickTime}
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
