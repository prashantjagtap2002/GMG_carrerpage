/* eslint-disable */
// One-off parser: converts the consolidated JD text file into the
// jobs_data.json schema expected by src/data/jobs.ts.
// Run with:  node parse-jds.cjs
const fs = require("fs");

const SRC = "C:\\Users\\prash\\Downloads\\JD\\All_Job_Descriptions.txt";
const OUT = "C:\\careers-app\\src\\data\\jobs_data.json";

const raw = fs.readFileSync(SRC, "utf8");
const lines = raw.split(/\r?\n/);

// Locate every "# DOCUMENT N: filename" marker
const docStarts = [];
lines.forEach((line, i) => {
  if (/^#\s+DOCUMENT\s+\d+:/i.test(line.trim())) docStarts.push(i);
});

// Metadata / form-field lines that must be stripped from the description body
const META_PREFIXES = [
  /^Job\s*Title:/i,
  /^Job\s*Holder/i,
  /^Department:/i,
  /^Position\s*Type:/i,
  /^Reporting\s+(To|Staff):/i,
  /^Responsible\s+on\s+absence/i,
  /^(others\s*)?\(Deputy\)\s*:?\s*$/i, // wrapped "Responsible on absence ... (Deputy):" continuations
  /^Signature\b/i, // "Signature:", "Signature | ...", "Signature Signature:" form fields
  /^Date:/i,
];

// Leading bullet glyphs (incl. Wingdings/PUA from PDFs) -> normalized "○ "
const BULLET_RE = /^\s*[\u2022\u2023\u2043\u25CF\u25AA\u25E6\u0095\uF0A7\uF0B7\uF0A8\uF0FC\u2666\u25C6\uE000-\uF8FF]\s*/;

function cleanVal(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function titleFromFilename(fileName) {
  let t = fileName.replace(/\.(docx|pdf|txt)$/i, "");
  t = t.replace(/^\d+(\.\d+)?\s*Job\s*Description\s*[-\u2013\u2014]\s*/i, "");
  t = t.replace(/^Job\s*Description\s*[-\u2013\u2014]\s*/i, "");
  t = t.replace(/\s*[-\u2013\u2014]\s*$/, "").trim();
  return t;
}

function normalizeDept(d) {
  let v = cleanVal(d);
  if (/^after\s*[-]?\s*sales$/i.test(v)) v = "Aftersales";
  return v;
}

function normalizeJobType(t) {
  let v = cleanVal(t);
  if (/^full[\s-]*time$/i.test(v)) return "Full time";
  if (/^part[\s-]*time$/i.test(v)) return "Part time";
  return v;
}

const docs = [];
for (let d = 0; d < docStarts.length; d++) {
  const start = docStarts[d];
  const end = d + 1 < docStarts.length ? docStarts[d + 1] - 1 : lines.length;
  const chunk = lines.slice(start, end);

  const headerLine = chunk[0] || "";
  const fileName = headerLine.replace(/^#\s+DOCUMENT\s+\d+:\s*/i, "").trim();

  // body = everything after the header line, dropping the ##### separators
  const bodyLines = chunk.slice(1).filter((l) => !/^#{5,}/.test(l.trim()));

  // Pull title / dept / position from the metadata block (anywhere in the doc)
  let title = "";
  let department = "";
  let positionType = "";
  for (const l of bodyLines) {
    if (!title) {
      const m = l.match(/^Job\s*Title:\s*\|?\s*(.*?)\s*$/i);
      if (m) {
        const v = cleanVal(m[1]);
        if (v && !/^(xyz|na|-)$/i.test(v)) title = v;
      }
    }
    if (!department) {
      const m = l.match(/^Department:\s*\|?\s*(.*?)\s*$/i);
      if (m) department = cleanVal(m[1]);
    }
    if (!positionType) {
      const m = l.match(/^Position\s*Type:\s*\|?\s*(.*?)\s*$/i);
      if (m) positionType = cleanVal(m[1]);
    }
  }

  // Fallback: "Job Description – Title" line
  if (!title) {
    for (const l of bodyLines) {
      const m = l.match(/^Job\s*Description\s*[\u2013\u2014-]\s*(.+?)\s*$/i);
      if (m) {
        title = cleanVal(m[1]);
        break;
      }
    }
  }
  // Fallback: filename
  if (!title) title = titleFromFilename(fileName) || "Untitled Role";
  title = title.replace(/[:\s]+$/, "").trim();

  department = normalizeDept(department);
  positionType = normalizeJobType(positionType);

  // Build the cleaned description body
  const descLines = [];
  for (const l of bodyLines) {
    const trimmed = l.trim();
    if (!trimmed) continue;
    if (META_PREFIXES.some((re) => re.test(trimmed))) continue;
    if (/^Job\s*Description\s*[\u2013\u2014-]\s*.+/i.test(trimmed)) continue; // title line
    if (/^Job\s*Description:\s*$/i.test(trimmed)) continue; // bare label
    if (/^Note:\s*This document lays down/i.test(trimmed)) continue;
    if (/^Please confirm the receipt of this document/i.test(trimmed)) continue;
    if (/^Please confirm the receipt of this document and authorize/i.test(trimmed)) continue;

    let line = trimmed;
    // normalize leading bullet glyphs into "○ " sub-bullets
    if (BULLET_RE.test(line)) line = "○ " + line.replace(BULLET_RE, "");
    descLines.push(line);
  }
  let description = descLines.join("\n").replace(/\n{3,}/g, "\n\n").trim();

  docs.push({ fileName, title, department, positionType, description });
}

// ---- Deduplicate by normalized title (case-insensitive) ----
const seen = new Map();
const unique = [];
for (const d of docs) {
  const key = d.title.toLowerCase().replace(/\s+/g, " ").trim();
  if (seen.has(key)) {
    // keep the one with the longer description
    const idx = seen.get(key);
    if (d.description.length > unique[idx].description.length) unique[idx] = d;
    continue;
  }
  seen.set(key, unique.length);
  unique.push(d);
}

// ---- Build the JSON in the RawJob schema ----
function slug(s) {
  return s
    .toLowerCase()
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const usedSlugs = new Set();
const OPEN_DATE = "2026-07-01";

const jobs = unique.map((d, i) => {
  const base = slug(d.title) || `role-${i + 1}`;
  let id = base;
  let n = 2;
  while (usedSlugs.has(id)) id = `${base}-${n++}`;
  usedSlugs.add(id);

  return {
    Posting_Title: d.title,
    Job_Opening_Name: d.title,
    Job_Description: d.description,
    Industry: d.department || "General",
    City: "",
    State: "",
    Country: "India",
    Job_Type: d.positionType || "Full time",
    Work_Experience: "",
    Date_Opened: OPEN_DATE,
    id,
    Publish: true,
  };
});

fs.writeFileSync(OUT, JSON.stringify(jobs, null, 2) + "\n", "utf8");

console.log("Documents found :", docStarts.length);
console.log("Unique jobs kept :", jobs.length);
console.log("----");
jobs.forEach((j, i) =>
  console.log(`${String(i + 1).padStart(2, "0")}. [${j.Industry.padEnd(12)}] ${j.Posting_Title}  ->  ${j.id}`)
);
