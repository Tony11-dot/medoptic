"use client";

// Printable prescription sheet — matches the shop's paper form: MEDOPTIC logo,
// date, patient details, the OD/OS refraction table, notes and a signature
// line. Opens the browser print dialog automatically; "Save as PDF" there
// produces the exportable file. Deliberately rendered without the admin shell
// so the printed page is clean.

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { RX_FIELDS, type EyeTest, type RxTable, type SiteContent } from "@/lib/types";

const fmtDate = (d?: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

export default function PrintTestPage() {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<EyeTest | null>(null);
  const [footer, setFooter] = useState<SiteContent["footer"] | null>(null);
  const [error, setError] = useState(false);
  const printedOnce = useRef(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/eye-tests/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      fetch("/api/content").then((r) => (r.ok ? r.json() : { content: null })),
    ])
      .then(([t, c]) => {
        setTest(t.test);
        setFooter(c.content?.footer ?? null);
      })
      .catch(() => setError(true));
  }, [id]);

  // Pop the print dialog once everything is on the page.
  useEffect(() => {
    if (test && !printedOnce.current) {
      printedOnce.current = true;
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [test]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center text-muted" dir="rtl">
        <p>לא ניתן לטעון את הבדיקה — יש להתחבר לניהול. <a className="font-bold text-brand-dark underline" href="/admin/login">כניסה</a></p>
      </div>
    );
  }
  if (!test) {
    return (
      <div className="grid min-h-screen place-items-center text-muted" dir="rtl">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#1a2330]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 14mm; }
        }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface px-6 py-3">
        <a href="/admin/tests" className="text-sm font-semibold text-brand-dark hover:underline">← חזרה למרשמים</a>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-dark"
        >
          🖨 הדפסה / שמירה כ-PDF
        </button>
      </div>

      {/* The sheet */}
      <div className="mx-auto max-w-[190mm] px-8 py-10 print:p-0">
        {/* Header: address | logo | date */}
        <div className="flex items-start justify-between gap-4">
          <div className="pt-2 text-sm leading-6">
            <div>תאריך: <span dir="ltr" className="font-semibold">{fmtDate(test.date)}</span></div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-web.png" alt="MEDOPTIC" className="h-16 w-auto" />
          <div className="max-w-40 pt-2 text-end text-sm leading-6 text-[#46505e]">
            {footer?.address?.he && <div className="whitespace-pre-line">{footer.address.he}</div>}
            {footer?.phone && <div dir="ltr">{footer.phone}</div>}
          </div>
        </div>

        {/* Patient */}
        <div className="mt-10 space-y-2 text-base">
          <div>
            שם: <span className="border-b border-[#1a2330] px-2 font-bold">{test.firstName} {test.lastName}</span>
          </div>
          <div>
            תעודת זהות: <span dir="ltr" className="border-b border-[#1a2330] px-2 font-bold">{test.idNumber}</span>
          </div>
        </div>

        {/* Previous prescription (only if recorded) */}
        {test.previous && (
          <div className="mt-10">
            <h2 className="mb-2 text-sm font-bold text-[#46505e]">מרשם קודם</h2>
            <RxPrint table={test.previous} />
          </div>
        )}

        {/* The prescription */}
        <div className="mt-10">
          {test.previous && <h2 className="mb-2 text-sm font-bold text-[#46505e]">מרשם</h2>}
          <RxPrint table={test.current} />
        </div>

        {/* Notes */}
        <div className="mt-12 text-base">
          הערות: <span className="font-semibold">{test.notes || ""}</span>
        </div>

        {/* Signature */}
        <div className="mt-20 flex items-end justify-between gap-8 text-base">
          <div>
            חתימה וחותמת:
            <span className="ms-3 inline-block w-56 border-b border-[#1a2330]" />
          </div>
          <div className="text-sm text-[#46505e]">
            תאריך: <span dir="ltr">{fmtDate(test.date)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The boxed OD/OS table, laid out LTR exactly like the paper form. */
function RxPrint({ table }: { table: RxTable }) {
  return (
    <div dir="ltr">
      <table className="w-full border-separate border-spacing-1.5">
        <thead>
          <tr>
            <th className="w-10" />
            {RX_FIELDS.map((f) => (
              <th key={f} className="pb-1 text-center text-xs font-bold tracking-wide text-[#46505e]">
                {f === "h" ? "H" : f.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["od", "os"] as const).map((eye) => (
            <tr key={eye}>
              <td className="pe-1 text-base font-extrabold">{eye.toUpperCase()}</td>
              {RX_FIELDS.map((f) => (
                <td key={f}>
                  <div className="grid h-10 min-w-14 place-items-center rounded border border-[#c6ccd4] px-1 text-center text-sm font-semibold">
                    {table[eye][f] ?? ""}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
