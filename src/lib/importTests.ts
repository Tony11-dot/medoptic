// File import for eye-test records: PowerPoint (.pptx), Excel (.xlsx) and CSV.
// The doctor kept prescriptions as one PowerPoint form per patient (labels like
// שם / תעודת זהות / תאריך and OD/OS tables with SPH…VA columns) — this module
// turns those files into candidate EyeTest records. Extraction is heuristic by
// nature, so the admin always confirms a preview before anything is saved.
import "server-only";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { RX_FIELDS, type RxEye, type RxField, type RxTable } from "./types";
import type { EyeTestInput } from "./eyeTest";

export interface ImportResult {
  tests: EyeTestInput[];
  warnings: string[];
}

const MAX_RECORDS = 500;

// ---- Small shared helpers -----------------------------------------------------

const HEBREW_RE = /[֐-׿]/;

/** dd/mm/yyyy, dd.mm.yy, yyyy-mm-dd, … -> "YYYY-MM-DD" (or null). */
function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/.exec(s);
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

/** Excel stores dates as day counts since 1899-12-30. */
function excelSerialToDate(n: number): string | null {
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null; // ~1954..2118
  const ms = Math.round((n - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

/** "סאמר נאסר" -> { firstName: "סאמר", lastName: "נאסר" }. */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

const looksLikeId = (s: string) => /^\d{5,10}$/.test(s.trim());
/** Rx cell values: -2.00, +2.75, 135, 6/6, 0.75 … */
const looksLikeRxValue = (s: string) => /^[+\-]?\d+([.,]\d+)?(\/\d+([.,]\d+)?)?$/.test(s.trim());

const emptyEye = (): RxEye => ({});
const eyeEmpty = (e: RxEye) => RX_FIELDS.every((f) => !e[f]);
const tableEmpty = (t: RxTable) => eyeEmpty(t.od) && eyeEmpty(t.os);

function blankTest(): EyeTestInput {
  return {
    date: "",
    firstName: "",
    lastName: "",
    idNumber: "",
    current: { od: emptyEye(), os: emptyEye() },
  };
}

// ---- Entry point ----------------------------------------------------------------

export async function importTestsFile(filename: string, buffer: Buffer): Promise<ImportResult> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "csv" || ext === "txt") {
    return tableToTests(parseCsv(buffer.toString("utf8")));
  }
  if (ext === "xlsx" || ext === "xlsm") {
    return tableToTests(await parseXlsx(buffer));
  }
  if (ext === "pptx") {
    return parsePptx(buffer);
  }
  if (ext === "accdb" || ext === "mdb") {
    return parseAccess(buffer);
  }
  return { tests: [], warnings: [`Unsupported file type: .${ext} (use .pptx, .xlsx, .csv or .accdb)`] };
}

// ---- Microsoft Access (.accdb / .mdb) ---------------------------------------------

/** Read every user table and run it through the same header mapping as
 * Excel/CSV — whichever tables hold test-like columns contribute records. */
async function parseAccess(buffer: Buffer): Promise<ImportResult> {
  const { default: MDBReader } = await import("mdb-reader");
  const reader = new MDBReader(buffer);

  const toCell = (v: unknown): string => {
    if (v == null) return "";
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  };

  const tests: EyeTestInput[] = [];
  const warnings: string[] = [];
  const tableNames = reader.getTableNames(); // user tables only (no MSys*)
  if (tableNames.length === 0) return { tests, warnings: ["No tables found in the database."] };

  for (const name of tableNames) {
    if (tests.length >= MAX_RECORDS) break;
    try {
      const table = reader.getTable(name);
      const columns = table.getColumnNames();
      const rows = table.getData().map((row) => columns.map((c) => toCell((row as Record<string, unknown>)[c])));
      if (rows.length === 0) continue;
      const result = tableToTests([columns, ...rows]);
      if (result.tests.length > 0) {
        tests.push(...result.tests.slice(0, MAX_RECORDS - tests.length));
        warnings.push(...result.warnings.map((w) => `${name}: ${w}`));
      }
    } catch {
      warnings.push(`Table "${name}" could not be read — skipped.`);
    }
  }
  if (tests.length === 0) {
    warnings.push(`No test-like columns recognized in any table (tables: ${tableNames.join(", ")}).`);
  }
  return { tests, warnings };
}

// ---- CSV -------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  // Detect the delimiter from the first line: comma, semicolon or tab.
  const firstLine = text.slice(0, text.indexOf("\n") + 1 || text.length);
  const delim = [",", ";", "\t"].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best, ",");

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

// ---- XLSX (zip + XML, first worksheet) --------------------------------------------

const xml = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  removeNSPrefix: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
});

const asArray = <T,>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

/** All text inside a node (concatenated <a:t>/<t> runs, any depth). */
function deepText(node: unknown, tag: string): string {
  let out = "";
  const walk = (n: unknown) => {
    if (n == null || typeof n !== "object") return;
    for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
      if (k === tag || k.endsWith(`:${tag}`)) {
        for (const t of asArray(v)) out += typeof t === "object" ? ((t as Record<string, unknown>)["#text"] ?? "") : String(t ?? "");
      } else if (typeof v === "object") {
        for (const child of asArray(v)) walk(child);
      }
    }
  };
  walk(node);
  return out;
}

async function parseXlsx(buffer: Buffer): Promise<string[][]> {
  const zip = await JSZip.loadAsync(buffer);
  const sharedFile = zip.file("xl/sharedStrings.xml");
  const shared: string[] = [];
  if (sharedFile) {
    const doc = xml.parse(await sharedFile.async("string"));
    for (const si of asArray((doc?.sst ?? {}).si)) shared.push(deepText(si, "t"));
  }

  const sheetName = Object.keys(zip.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0];
  if (!sheetName) return [];
  const doc = xml.parse(await zip.file(sheetName)!.async("string"));
  const rowsXml = asArray(doc?.worksheet?.sheetData?.row);

  const colIndex = (ref: string) => {
    let n = 0;
    for (const ch of ref) {
      if (ch >= "A" && ch <= "Z") n = n * 26 + (ch.charCodeAt(0) - 64);
      else break;
    }
    return n - 1;
  };

  const rows: string[][] = [];
  for (const r of rowsXml) {
    const cells = asArray((r as Record<string, unknown>).c);
    const row: string[] = [];
    for (const c of cells) {
      const cell = c as Record<string, unknown>;
      const idx = colIndex(String(cell["@r"] ?? ""));
      const type = String(cell["@t"] ?? "");
      let value: string;
      if (type === "s") {
        value = shared[Number(deepText(cell, "v"))] ?? "";
      } else if (type === "inlineStr") {
        value = deepText(cell, "t");
      } else {
        value = deepText(cell, "v");
        // Numeric cells that are actually dates come through as serials.
        const serial = Number(value);
        const asDate = excelSerialToDate(serial);
        if (asDate && Number.isInteger(serial)) value = asDate;
      }
      if (idx >= 0) row[idx] = value;
    }
    rows.push(Array.from(row, (v) => v ?? ""));
  }
  return rows;
}

// ---- Tabular data (CSV/XLSX) -> tests ----------------------------------------------

type ColumnKey = "date" | "birthDate" | "firstName" | "lastName" | "fullName" | "idNumber" | "notes" | `${"od" | "os"}.${RxField}` | `prev.${"od" | "os"}.${RxField}`;

// Field spellings seen in the wild, including the Access DB's truncated ones
// (PREVRSF, PREVRCY, PREVRAX, PREVRAD…).
const FIELD_ALIASES: Record<string, RxField> = {
  sph: "sph", sf: "sph", sp: "sph", sphere: "sph",
  cyl: "cyl", cy: "cyl", cylinder: "cyl",
  axis: "axis", ax: "axis",
  add: "add", ad: "add",
  pd: "pd", pl: "pd",
  prism: "prism", pr: "prism", pris: "prism",
  base: "base", ba: "base", bas: "base",
  h: "h",
  va: "va",
};

/** Map a header cell to a known column. Tolerant to Hebrew/English variants. */
function headerKey(raw: string): ColumnKey | null {
  const h = raw.trim().toLowerCase().replace(/[_\-.]/g, " ").replace(/\s+/g, " ");
  if (!h) return null;
  // Birth date first, so "תאריך לידה" isn't captured by the test-date pattern.
  if (/לידה|birth|\bdob\b|date of birth/.test(h)) return "birthDate";
  if (/(^|\s)(date|תאריך)( |$)|תאריך הבדיקה|תאריך בדיקה/.test(h)) return "date";
  if (/first ?name|שם פרטי/.test(h)) return "firstName";
  if (/last ?name|שם משפחה|family/.test(h)) return "lastName";
  if (/full ?name|patient|^name$|^שם$|שם מלא|שם הלקוח/.test(h)) return "fullName";
  if (/(^| )id( |$)|ת ?"?ז|תעודת זהות|teudat|מספר זהות/.test(h)) return "idNumber";
  if (/notes?|הערות|הערה|comment/.test(h)) return "notes";

  // Compact Access-style headers: [PREV] + R/L + field, e.g. RSPH, LCYL,
  // RVA, LH, PREVRSF, PREVLAX…
  const compact = h.replace(/\s/g, "");
  const m = /^(prev)?(r|l)([a-z]{1,8})$/.exec(compact);
  if (m && FIELD_ALIASES[m[3]]) {
    const eye = m[2] === "r" ? "od" : "os";
    return m[1] ? `prev.${eye}.${FIELD_ALIASES[m[3]]}` : `${eye}.${FIELD_ALIASES[m[3]]}`;
  }

  // Spaced style: an eye marker + a field, optionally marked "previous".
  const prev = /prev|old|קודם/.test(h);
  const eye = /\bod\b|right|ימין|r eye/.test(h) ? "od" : /\bos\b|left|שמאל|l eye/.test(h) ? "os" : null;
  if (!eye) return null;
  const field = RX_FIELDS.find((f) => new RegExp(`(^| )${f}( |$)`).test(h) || (f === "axis" && /\bax\b/.test(h)));
  if (!field) return null;
  return prev ? `prev.${eye}.${field}` : `${eye}.${field}`;
}

function tableToTests(rows: string[][]): ImportResult {
  const warnings: string[] = [];
  if (rows.length < 2) return { tests: [], warnings: ["No data rows found in the file."] };

  const headers = rows[0].map(headerKey);
  if (!headers.some(Boolean)) {
    return { tests: [], warnings: ["Could not recognize any column headers (expected e.g. name / id / date / OD SPH …)."] };
  }

  const tests: EyeTestInput[] = [];
  for (let i = 1; i < rows.length && tests.length < MAX_RECORDS; i++) {
    const t = blankTest();
    const prev: RxTable = { od: emptyEye(), os: emptyEye() };
    let fullName = "";
    for (let c = 0; c < rows[i].length; c++) {
      const key = headers[c];
      const value = (rows[i][c] ?? "").trim();
      if (!key || !value) continue;
      if (key === "date") t.date = normalizeDate(value) ?? t.date;
      else if (key === "birthDate") t.birthDate = normalizeDate(value) ?? undefined;
      else if (key === "firstName") t.firstName = value;
      else if (key === "lastName") t.lastName = value;
      else if (key === "fullName") fullName = value;
      else if (key === "idNumber") t.idNumber = value.replace(/\D/g, "");
      else if (key === "notes") t.notes = value;
      else {
        const parts = key.split(".");
        const [table, eye, field] = parts.length === 3 ? parts : ["cur", parts[0], parts[1]];
        const target = table === "prev" ? prev : t.current;
        target[eye as "od" | "os"][field as RxField] = value.slice(0, 12);
      }
    }
    if (fullName && !t.firstName && !t.lastName) Object.assign(t, splitName(fullName));
    if (!tableEmpty(prev)) t.previous = prev;
    if (!t.firstName && !t.idNumber) continue; // blank / junk row
    if (!t.date) t.date = new Date().toISOString().slice(0, 10);
    if (!t.firstName) t.firstName = "—";
    if (!t.lastName) t.lastName = "—";
    if (!t.idNumber) warnings.push(`Row ${i + 1}: missing ID number (${t.firstName} ${t.lastName}).`);
    tests.push(t);
  }
  if (rows.length - 1 > MAX_RECORDS) warnings.push(`File has more than ${MAX_RECORDS} rows — only the first ${MAX_RECORDS} were read.`);
  return { tests, warnings };
}

// ---- PPTX ---------------------------------------------------------------------------

interface Box {
  text: string;
  x: number;
  y: number;
}

/** Extract positioned text boxes + tables from one slide's XML. */
function slideBoxes(slideDoc: unknown): { boxes: Box[]; tables: string[][][] } {
  const boxes: Box[] = [];
  const tables: string[][][] = [];

  const walk = (node: unknown) => {
    if (node == null || typeof node !== "object") return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      for (const child of asArray(v)) {
        if (typeof child !== "object" || child === null) continue;
        const el = child as Record<string, unknown>;
        if (k === "p:sp") {
          const text = deepText(el["p:txBody"], "a:t").trim();
          if (text) {
            const off = (((el["p:spPr"] as Record<string, unknown>)?.["a:xfrm"] as Record<string, unknown>)?.["a:off"] ?? {}) as Record<string, unknown>;
            boxes.push({ text, x: Number(off["@x"] ?? 0), y: Number(off["@y"] ?? 0) });
          }
          continue;
        }
        if (k === "a:tbl") {
          const grid: string[][] = asArray(el["a:tr"]).map((tr) =>
            asArray((tr as Record<string, unknown>)["a:tc"]).map((tc) => deepText(tc, "a:t").trim()),
          );
          if (grid.length) tables.push(grid);
          continue;
        }
        walk(child);
      }
    }
  };
  walk(slideDoc);
  return { boxes, tables };
}

const LABEL_RE = /^(שם|שם מלא|תעודת זהות|ת"ז|תאריך|תאריך לידה|הערות|מרשם.*|od|os|sph|cyl|axis|add|pd|prism|base|h|va)\s*:?\s*$/i;

/** Reconstruct one test record from a slide's text boxes / tables. */
function slideToTest(boxes: Box[], tables: string[][][], slideNo: number, warnings: string[]): EyeTestInput | null {
  const t = blankTest();
  const all = boxes.map((b) => b.text).join("\n");

  // ID: prefer the number following the תעודת זהות label, else any 5-10 digits.
  const idNear = /תעודת זהות\s*:?\s*(\d{5,10})/.exec(all)?.[1];
  const idAny = boxes.map((b) => b.text.trim()).find(looksLikeId);
  t.idNumber = idNear ?? idAny ?? "";

  // Birth date: only when explicitly labeled (תאריך לידה / לידה).
  const birthNear = /(?:תאריך )?לידה\s*:?\s*([\d\/.\-]{6,10})/.exec(all)?.[1];
  if (birthNear) t.birthDate = normalizeDate(birthNear) ?? undefined;

  // Test date: labeled first, else any date-looking token that isn't the birth date.
  const dateNear = /תאריך(?! לידה)(?: הבדיקה)?\s*:?\s*([\d\/.\-]{6,10})/.exec(all)?.[1];
  const dateAny = boxes.map((b) => b.text.trim()).map(normalizeDate).find((d) => d && d !== t.birthDate) ?? null;
  t.date = (dateNear ? normalizeDate(dateNear) : null) ?? dateAny ?? new Date().toISOString().slice(0, 10);

  // Name: after a שם label ("שם: עליזה ביטון" possibly same box), else the first
  // Hebrew multi-word box that isn't a known label.
  const nameNear = /שם(?: מלא)?\s*:\s*([^\n\d]{2,60})/.exec(all)?.[1]?.trim();
  const nameBox = boxes
    .map((b) => b.text.trim())
    .find((s) => HEBREW_RE.test(s) && s.split(/\s+/).length >= 2 && !LABEL_RE.test(s) && !/מרשם|הערות|תעודת|תאריך/.test(s));
  const fullName = nameNear || nameBox || "";
  if (fullName) Object.assign(t, splitName(fullName));

  // Notes: text after הערה / הערות.
  const notes = /(?:הערות|הערה)\s*:?\s*([^\n]{1,200})/.exec(all)?.[1]?.trim();
  if (notes) t.notes = notes;

  // Rx values — structured tables first, spatial text boxes as fallback.
  const rxTables: RxTable[] = [];
  for (const grid of tables) {
    const parsed = gridToRx(grid);
    if (parsed) rxTables.push(parsed);
  }
  if (rxTables.length === 0) rxTables.push(...spatialRx(boxes));

  if (rxTables.length >= 2) {
    // Doctor's layout: previous prescription above, the new one below.
    t.previous = tableEmpty(rxTables[0]) ? undefined : rxTables[0];
    t.current = rxTables[rxTables.length - 1];
  } else if (rxTables.length === 1) {
    t.current = rxTables[0];
  }

  if (!t.idNumber && !t.firstName) {
    warnings.push(`Slide ${slideNo}: could not find a patient name or ID — skipped.`);
    return null;
  }
  if (!t.firstName) t.firstName = "—";
  if (!t.lastName) t.lastName = "—";
  if (tableEmpty(t.current)) warnings.push(`Slide ${slideNo}: no prescription values found (${t.firstName} ${t.lastName}).`);
  return t;
}

/** A PowerPoint table whose header row contains SPH/CYL/… and rows start OD/OS. */
function gridToRx(grid: string[][]): RxTable | null {
  const headerRow = grid.findIndex((row) => row.some((c) => /^sph$/i.test(c.trim())));
  if (headerRow === -1) return null;
  const cols = grid[headerRow].map((c) => c.trim().toLowerCase());
  const table: RxTable = { od: emptyEye(), os: emptyEye() };
  for (const row of grid.slice(headerRow + 1)) {
    const eyeCell = row.find((c) => /^(od|os)$/i.test(c.trim()));
    const eye = eyeCell?.trim().toLowerCase() as "od" | "os" | undefined;
    if (!eye) continue;
    for (let c = 0; c < row.length; c++) {
      const field = RX_FIELDS.find((f) => cols[c] === f || (f === "axis" && cols[c] === "ax"));
      const value = row[c]?.trim();
      if (field && value && looksLikeRxValue(value)) table[eye][field] = value.slice(0, 12);
    }
  }
  return tableEmpty(table) ? null : table;
}

/**
 * Loose text boxes laid out like a form: SPH…VA labels give column x-positions,
 * OD/OS labels give row y-positions; every numeric box snaps to the nearest
 * column and row. Two OD/OS row pairs -> two tables (previous above, new below).
 */
function spatialRx(boxes: Box[]): RxTable[] {
  const columns = RX_FIELDS
    .map((f) => {
      const hits = boxes.filter((b) => b.text.trim().toLowerCase() === f || (f === "h" && b.text.trim() === "H"));
      return hits.map((b) => ({ field: f, x: b.x }));
    })
    .flat();
  const rowLabels = boxes
    .filter((b) => /^(od|os)$/i.test(b.text.trim()))
    .map((b) => ({ eye: b.text.trim().toLowerCase() as "od" | "os", y: b.y }))
    .sort((a, b) => a.y - b.y);
  if (columns.length < 3 || rowLabels.length < 1) return [];

  // Group OD/OS labels into tables: a new table starts at each OD.
  const groups: { od?: number; os?: number }[] = [];
  for (const r of rowLabels) {
    const last = groups[groups.length - 1];
    if (r.eye === "od" || !last || last.os != null) groups.push({});
    groups[groups.length - 1][r.eye] = r.y;
  }

  const values = boxes.filter((b) => looksLikeRxValue(b.text.trim()) && !looksLikeId(b.text.trim()));
  const nearest = <T,>(items: T[], dist: (i: T) => number): T | null =>
    items.reduce<{ item: T | null; d: number }>(
      (acc, i) => (dist(i) < acc.d ? { item: i, d: dist(i) } : acc),
      { item: null, d: Infinity },
    ).item;

  const ROW_TOLERANCE = 400_000; // EMU (~1.1cm) — same visual row
  const tables: RxTable[] = groups.map(() => ({ od: emptyEye(), os: emptyEye() }));
  for (const v of values) {
    const col = nearest(columns, (c) => Math.abs(c.x - v.x));
    if (!col || Math.abs(col.x - v.x) > 1_500_000) continue;
    let best: { g: number; eye: "od" | "os"; d: number } | null = null;
    groups.forEach((g, gi) => {
      (["od", "os"] as const).forEach((eye) => {
        const y = g[eye];
        if (y == null) return;
        const d = Math.abs(y - v.y);
        if (!best || d < best.d) best = { g: gi, eye, d };
      });
    });
    const hit = best as { g: number; eye: "od" | "os"; d: number } | null;
    if (!hit || hit.d > ROW_TOLERANCE) continue;
    const eyeTable = tables[hit.g][hit.eye];
    if (!eyeTable[col.field]) eyeTable[col.field] = v.text.trim().slice(0, 12);
  }
  return tables.filter((t) => !tableEmpty(t));
}

async function parsePptx(buffer: Buffer): Promise<ImportResult> {
  const warnings: string[] = [];
  const zip = await JSZip.loadAsync(buffer);
  const slideNames = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(/\d+/.exec(a)![0]) - Number(/\d+/.exec(b)![0]));
  if (slideNames.length === 0) return { tests: [], warnings: ["No slides found in the presentation."] };

  const tests: EyeTestInput[] = [];
  for (let i = 0; i < slideNames.length && tests.length < MAX_RECORDS; i++) {
    try {
      const doc = xml.parse(await zip.file(slideNames[i])!.async("string"));
      const { boxes, tables } = slideBoxes(doc);
      const test = slideToTest(boxes, tables, i + 1, warnings);
      if (test) tests.push(test);
    } catch {
      warnings.push(`Slide ${i + 1}: could not be read — skipped.`);
    }
  }
  return { tests, warnings };
}
