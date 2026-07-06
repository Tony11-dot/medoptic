"use client";

// Printable prescription sheets for a patient. `?exams=id1,id2` prints those
// tests (each on its own page); with no param, prints every test in the folder.
// Opens the print dialog automatically ("Save as PDF" exports).

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { RX_FIELDS, type EyeExam, type Patient, type RxResult, type SiteContent } from "@/lib/types";
import { cn } from "@/lib/cn";

const fmtDate = (d?: string) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return y && m && day ? `${day}/${m}/${y}` : d;
};

export default function PrintPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [exams, setExams] = useState<EyeExam[]>([]);
  const [footer, setFooter] = useState<SiteContent["footer"] | null>(null);
  const [error, setError] = useState(false);
  const printedOnce = useRef(false);

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("exams");
    const ids = wanted ? wanted.split(",").filter(Boolean) : null;
    Promise.all([
      fetch(`/api/patients/${id}`).then((r) => (r.ok ? r.json() : Promise.reject(r.status))),
      fetch("/api/content").then((r) => (r.ok ? r.json() : { content: null })),
    ])
      .then(([p, c]) => {
        const pat: Patient = p.patient;
        setPatient(pat);
        setFooter(c.content?.footer ?? null);
        // Keep folder order; fall back to all tests if none matched.
        const chosen = ids ? pat.exams.filter((e) => ids.includes(e.id)) : pat.exams;
        setExams(chosen.length ? chosen : pat.exams);
      })
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    if (patient && exams.length && !printedOnce.current) {
      printedOnce.current = true;
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [patient, exams]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center text-muted" dir="rtl">
        <p>לא ניתן לטעון את הבדיקה — יש להתחבר לניהול. <a className="font-bold text-brand-dark underline" href="/admin/login">כניסה</a></p>
      </div>
    );
  }
  if (!patient || exams.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center text-muted" dir="rtl">
        <span className="size-5 animate-spin rounded-full border-2 border-line border-t-brand" />
      </div>
    );
  }

  const hebrewAddress =
    footer?.address?.he && /[֐-׿]/.test(footer.address.he) ? footer.address.he : "התעשייה 1, יוקנעם עילית";

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#111825]">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>

      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-surface px-6 py-3">
        <a href="/admin/tests" className="text-sm font-semibold text-brand-dark hover:underline">← חזרה למרשמים</a>
        <span className="text-sm font-semibold text-muted">{exams.length} בדיקות</span>
        <button type="button" onClick={() => window.print()} className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-dark">
          🖨 הדפסה / שמירה כ-PDF
        </button>
      </div>

      {exams.map((exam, i) => (
        <section
          key={exam.id}
          className={cn(
            "mx-auto max-w-[190mm] px-8 py-10 print:px-[14mm] print:pb-[14mm] print:pt-[16mm]",
            i > 0 && "mt-6 border-t-8 border-surface print:mt-0 print:border-0 print:break-before-page",
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="pt-3 text-base font-semibold leading-7">
              <div>תאריך: <span dir="ltr">{fmtDate(exam.date)}</span></div>
              {patient.birthDate && <div>תאריך לידה: <span dir="ltr">{fmtDate(patient.birthDate)}</span></div>}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-web.png" alt="MEDOPTIC" className="h-24 w-auto" />
            <div className="max-w-44 pt-3 text-end text-sm font-medium leading-6 text-[#39424f]">
              <div className="whitespace-pre-line">{hebrewAddress}</div>
              {footer?.phone && <div dir="ltr">{footer.phone}</div>}
            </div>
          </div>

          {/* Patient */}
          <div className="mt-12 space-y-3 text-lg">
            <div>שם: <span className="inline-block min-w-48 border-b-2 border-[#111825] px-2 font-bold">{patient.firstName} {patient.lastName}</span></div>
            <div>תעודת זהות: <span dir="ltr" className="inline-block min-w-40 border-b-2 border-[#111825] px-2 text-start font-bold">{patient.idNumber}</span></div>
          </div>

          {/* Results */}
          {exam.results.map((r) => (
            <div key={r.id} className="mt-12">
              {r.label && <h2 className="mb-2 text-base font-bold text-[#39424f]">{r.label}</h2>}
              <RxPrint result={r} />
            </div>
          ))}

          {/* Notes */}
          <div className="mt-14 text-lg">הערות: <span className="font-bold">{exam.notes || ""}</span></div>

          {/* Signature */}
          <div className="mt-24 flex items-end justify-between gap-8 text-lg">
            <div>חתימה וחותמת:<span className="ms-3 inline-block w-64 border-b-2 border-[#111825]" /></div>
            <div className="text-base text-[#39424f]">תאריך: <span dir="ltr">{fmtDate(exam.date)}</span></div>
          </div>
        </section>
      ))}
    </div>
  );
}

function RxPrint({ result }: { result: RxResult }) {
  const table = result.table;
  return (
    <div dir="ltr">
      <table className="w-full border-separate border-spacing-1.5">
        <thead>
          <tr>
            <th className="w-10" aria-label="eye" />
            {RX_FIELDS.map((f) => (
              <th key={f} className="pb-1 text-center text-sm font-bold tracking-wide text-[#39424f]">{f === "h" ? "H" : f.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(["od", "os"] as const).map((eye) => (
            <tr key={eye}>
              <td className="pe-1 text-lg font-extrabold">{eye.toUpperCase()}</td>
              {RX_FIELDS.map((f) => (
                <td key={f}>
                  <div className="grid h-12 min-w-14 place-items-center rounded-md border-2 border-[#9aa3af] px-1 text-center text-base font-bold">{table[eye][f] ?? ""}</div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
