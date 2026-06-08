"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Appointment } from "@/lib/types";

interface Stats {
  thisMonth: number;
  totalAppointments: number;
}

export default function AdminOverview() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Appointment[]>([]);

  useEffect(() => {
    fetch("/api/appointments")
      .then((r) => (r.ok ? r.json() : { appointments: [] }))
      .then((a) => {
        const appts: Appointment[] = a.appointments ?? [];
        const now = new Date();
        const thisMonth = appts.filter(
          (x) =>
            new Date(x.createdAt).getMonth() === now.getMonth() &&
            new Date(x.createdAt).getFullYear() === now.getFullYear(),
        ).length;
        setStats({ thisMonth, totalAppointments: appts.length });
        setRecent(appts.slice(0, 5));
      });
  }, []);

  const cards = [
    { label: t.admin.overview.total, value: stats?.totalAppointments, accent: "from-brand to-brand-dark", href: "/admin/queue" },
    { label: t.admin.overview.thisMonth, value: stats?.thisMonth, accent: "from-emerald-400 to-emerald-500", href: "/admin/queue" },
  ];

  return (
    <AdminShell>
      <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.overview}</h1>
      <p className="mt-1 text-sm text-muted">{t.admin.titles.overviewSub}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Link
              href={c.href}
              className="block rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className={`inline-block size-9 rounded-xl bg-gradient-to-br ${c.accent}`} />
              <p className="mt-4 text-3xl font-extrabold text-ink">
                {c.value ?? <span className="text-line">—</span>}
              </p>
              <p className="mt-1 text-sm text-muted">{c.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">{t.admin.overview.latest}</h2>
          <Link href="/admin/queue" className="text-sm font-semibold text-brand hover:underline">
            {t.admin.overview.viewAll} →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t.admin.overview.none}</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-ink">
                  {a.firstName} {a.lastName}
                </span>
                <span className="text-muted" dir="ltr">{a.phone}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[a.status]}`}>
                  {t.admin.status[a.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

const STATUS_BADGE = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-rose-100 text-rose-700",
} as const;
