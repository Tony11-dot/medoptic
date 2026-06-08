"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import type { Appointment, Product } from "@/lib/types";

interface Stats {
  pending: number;
  approvedThisMonth: number;
  totalProducts: number;
  totalAppointments: number;
}

export default function AdminOverview() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Appointment[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => (r.ok ? r.json() : { appointments: [] })),
      fetch("/api/products").then((r) => r.json()),
    ]).then(([a, p]) => {
      const appts: Appointment[] = a.appointments ?? [];
      const products: Product[] = p.products ?? [];
      const now = new Date();
      const approvedThisMonth = appts.filter(
        (x) =>
          x.status === "approved" &&
          x.decisionAt &&
          new Date(x.decisionAt).getMonth() === now.getMonth() &&
          new Date(x.decisionAt).getFullYear() === now.getFullYear(),
      ).length;
      setStats({
        pending: appts.filter((x) => x.status === "pending").length,
        approvedThisMonth,
        totalProducts: products.length,
        totalAppointments: appts.length,
      });
      setRecent(appts.slice(0, 5));
    });
  }, []);

  const cards = [
    { label: "Pending requests", value: stats?.pending, accent: "from-amber-400 to-amber-500", href: "/admin/queue" },
    { label: "Approved this month", value: stats?.approvedThisMonth, accent: "from-emerald-400 to-emerald-500", href: "/admin/queue" },
    { label: "Products", value: stats?.totalProducts, accent: "from-brand to-brand-dark", href: "/admin/products" },
    { label: "Total appointments", value: stats?.totalAppointments, accent: "from-violet-400 to-violet-500", href: "/admin/queue" },
  ];

  return (
    <AdminShell>
      <h1 className="text-2xl font-extrabold text-ink">{t.admin.titles.overview}</h1>
      <p className="mt-1 text-sm text-muted">{t.admin.titles.overviewSub}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <h2 className="font-bold text-ink">Latest requests</h2>
          <Link href="/admin/queue" className="text-sm font-semibold text-brand hover:underline">
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No appointments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium text-ink">
                  {a.firstName} {a.lastName}
                </span>
                <span className="text-muted" dir="ltr">{a.phone}</span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

function StatusBadge({ status }: { status: Appointment["status"] }) {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    declined: "bg-rose-100 text-rose-700",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status]}`}>
      {status}
    </span>
  );
}
