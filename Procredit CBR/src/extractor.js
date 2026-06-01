// CBR Extraction Engine
// LLM (Claude): CRIF, Namescan, NFIS, CIC summary
// Python server (pdfplumber): CIC facility detail pages via /api/extract-cic

import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const CHUNK_SIZE         = 20000;
const MAX_CHUNKS_SUMMARY = 5;

// ── PDF reader ────────────────────────────────────────────────────────────────

export async function filesToText(fileOrArr) {
  if (!fileOrArr) return "";
  const arr = Array.isArray(fileOrArr) ? fileOrArr : [fileOrArr];
  if (!arr.length) return "";
  const texts = await Promise.all(arr.map(fileToText));
  return texts.filter(Boolean).join("\n\n--- NEXT DOCUMENT ---\n\n");
}

export async function quickExtractMeta(file) {
  const text = await fileToText(file);
  const top  = text.slice(0, 4000);
  let borrower   = null;
  let reportDate = null;

  // GIS: company name appears right after "GENERAL INFORMATION SHEET" heading
  const gisM = top.match(/GENERAL\s+INFORMATION\s+SHEET[\s\S]{0,200}?\n([A-Z][A-Z0-9\s,.()\-/'&]{6,80}(?:CORP(?:ORATION)?|INC(?:ORPORATED)?|TRADING|ENTERPRISES?|COMPANY|CO\.|LTD|LLC)\.?)\s*\n/i);
  if (gisM) borrower = gisM[1].trim().replace(/\s+/g, " ");

  const nfisM = top.match(/SUBJECT\s+NAME\s*:\s*([A-Z][A-Z\s,.()\-/&']{4,80})/);
  if (!borrower && nfisM) borrower = nfisM[1].trim().replace(/\s+/g, " ");

  if (!borrower) {
    const crifM = top.match(/^([A-Z][A-Z\s,.()\-/'&]{8,70}(?:CORP(?:ORATION)?|INC(?:ORPORATED)?|TRADING|ENTERPRISES?|COMPANY|CO\.|LTD|LLC)\.?)\s*$/m);
    if (crifM) borrower = crifM[1].trim();
  }
  if (!borrower) {
    const nsRow = top.match(/^([A-Z][A-Z\s,.()\-/'&]{8,70})\s+>=\s*50%/m);
    if (nsRow) borrower = nsRow[1].trim();
  }
  if (!borrower) {
    const cicM = top.match(/Dear\s+([A-Z][A-Z\s]{5,40}?)[\r\n]/);
    if (cicM) borrower = cicM[1].trim();
  }

  const datePats = [
    /Issued on[:\s]*(\d{1,2}[-\s]\w+[-\s]\d{4})/i,
    /Requested on[:\s]*(\d{1,2}[-\s]\w+[-\s]\d{4})/i,
    /Inquired on[:\s]*(\d{2}\/\d{2}\/\d{4})/i,
    /Report Date[:\s]*(\w+\s+\d{1,2},?\s+\d{4})/i,
    /Date:\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
  ];
  for (const p of datePats) {
    const m = top.match(p);
    if (m?.[1]) { reportDate = m[1].trim(); break; }
  }

  return { borrower, reportDate };
}

export async function fileToText(file) {
  if (!file) return "";
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) return await file.text();

  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page    = await pdf.getPage(p);
      const content = await page.getTextContent();
      let lastY = null;
      for (const item of content.items) {
        if (item.str === undefined) continue;
        const y = item.transform?.[5];
        if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 3) text += "\n";
        text += item.str + " ";
        if (y !== undefined) lastY = y;
      }
      text += "\n";
    }
    return text;
  } catch (e) {
    console.warn("pdfjs-dist failed, falling back to file.text():", e);
    try { return await file.text(); } catch { return ""; }
  }
}

// ── Python text extractor (pdfplumber — better quality than pdfjs-dist) ───────
// Sends a PDF to extractor.py and gets back clean text. Falls back to pdfjs-dist
// automatically if the Python server is unavailable or returns an error.

async function fileToTextPython(file) {
  if (!file) return "";
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) return await file.text();  // non-PDF: read directly

  try {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/extract-text", { method: "POST", body: fd });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (data.text?.trim()) return data.text;
    throw new Error("empty response");
  } catch (e) {
    console.warn(`[text] Python extractor failed for ${file.name} — falling back to pdfjs-dist:`, e.message);
    return await fileToText(file);
  }
}

async function filesToTextPython(fileOrArr) {
  if (!fileOrArr) return "";
  const arr = Array.isArray(fileOrArr) ? fileOrArr : [fileOrArr];
  if (!arr.length) return "";
  const texts = await Promise.all(arr.map(fileToTextPython));
  return texts.filter(Boolean).join("\n\n--- NEXT DOCUMENT ---\n\n");
}

// ── Claude helper ─────────────────────────────────────────────────────────────

async function claudeComplete(prompt) {
  const res = await fetch("/api/complete", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`/api/complete ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.text;
}

async function claudeJSON(prompt) {
  let raw = "";
  try {
    raw = await claudeComplete(prompt);
    const stripped = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "");
    // Walk the string to find the first balanced top-level JSON object
    let depth = 0, start = -1;
    for (let i = 0; i < stripped.length; i++) {
      if (stripped[i] === "{") { if (depth++ === 0) start = i; }
      else if (stripped[i] === "}") {
        if (--depth === 0 && start !== -1) return JSON.parse(stripped.slice(start, i + 1));
      }
    }
    console.warn("[claudeJSON] No balanced JSON found. Raw:", raw.slice(0, 400));
    return null;
  } catch (e) {
    console.warn("[claudeJSON] Parse error:", e.message, "| Raw:", raw.slice(0, 400));
    return null;
  }
}

function chunks(text, size, maxChunks) {
  const out = [];
  for (let i = 0; i < text.length && out.length < maxChunks; i += size) out.push(text.slice(i, i + size));
  return out;
}

// ── Merge helpers ─────────────────────────────────────────────────────────────

function mergeSubjects(a, b) {
  const map = {};
  for (const s of [...a, ...b]) {
    const key = (s.name || "").toUpperCase().trim();
    if (!key) continue;
    if (!map[key]) { map[key] = { ...s, items: [...(s.items || [])] }; }
    else { map[key].items.push(...(s.items || [])); if (s.hit) map[key].hit = true; }
  }
  return Object.values(map);
}

function dedupFacilities(arr) {
  const seen = new Set();
  return arr.filter((f) => {
    const k = `${f.subject}|${f.lender}|${f.contract}|${f.start}`;
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

function mergeFacilitiesResult(a, b) {
  return {
    installments:    dedupFacilities([...(a.installments    || []), ...(b.installments    || [])]),
    nonInstallments: dedupFacilities([...(a.nonInstallments || []), ...(b.nonInstallments || [])]),
    creditCards:     dedupFacilities([...(a.creditCards     || []), ...(b.creditCards     || [])]),
  };
}

// ── Python CIC extractor ──────────────────────────────────────────────────────

async function extractCICPython(fileOrArr) {
  const arr      = Array.isArray(fileOrArr) ? fileOrArr : fileOrArr ? [fileOrArr] : [];
  const pdfFiles = arr.filter((f) => f && (f.type === "application/pdf" || /\.pdf$/i.test(f.name)));
  if (!pdfFiles.length) return null;

  let result = { installments: [], nonInstallments: [], creditCards: [] };
  for (const file of pdfFiles) {
    try {
      const fd  = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-cic", { method: "POST", body: fd });
      if (!res.ok) { console.warn(`[Python extractor] HTTP ${res.status} for ${file.name}`); continue; }
      const data = await res.json();
      if (data.error) { console.warn("[Python extractor]", data.error); continue; }
      result = mergeFacilitiesResult(result, data);
    } catch (e) {
      console.warn(`[Python extractor] Failed for ${file.name}:`, e);
    }
  }
  const hasAny = result.installments.length || result.nonInstallments.length || result.creditCards.length;
  return hasAny ? result : null;
}

// ── LLM extractors ────────────────────────────────────────────────────────────

async function extractNFIS(text, hint) {
  if (!text) return null;
  let subjects = [];
  for (const chunk of chunks(text, CHUNK_SIZE, MAX_CHUNKS_SUMMARY)) {
    const data = await claudeJSON(`You are extracting NFIS (Negative Files Information System) data from a Philippine credit bureau document.
Return ONLY a JSON object — no prose, no markdown:
{ "subjects": [ { "name": "string", "role": "string", "hit": true|false, "items": [ { "provider": "string", "amount": "string", "remarks": "string", "conclusion": "string (W-OFF/CLOSED/PAST DUE/CURRENT/—)" } ] } ] }
Rules: hit=true if subject has any negative entry. Return {"subjects":[]} if no NFIS data found.
Borrower context: ${hint || "(none)"}
--- CHUNK ---\n${chunk}\n--- END ---\nReturn JSON only.`);
    if (data?.subjects?.length) subjects = mergeSubjects(subjects, data.subjects);
  }
  return subjects.length ? { subjects } : null;
}

async function extractCICSummary(text, hint) {
  if (!text) return null;
  let subjects = [];
  for (const chunk of chunks(text, CHUNK_SIZE, MAX_CHUNKS_SUMMARY)) {
    const data = await claudeJSON(`You are extracting CIC delinquency SUMMARY data from a Philippine credit bureau document.
Return ONLY a JSON object — no prose, no markdown:
{ "subjects": [ { "name": "string", "role": "string", "hit": true|false, "items": [ { "provider": "string", "amount": "string", "remarks": "string", "conclusion": "string (CURRENT/PAST DUE/CLOSED/W-OFF)" } ] } ] }
Rules: hit=true if any delinquency exists. Return {"subjects":[]} if no CIC summary data found.
Borrower context: ${hint || "(none)"}
--- CHUNK ---\n${chunk}\n--- END ---\nReturn JSON only.`);
    if (data?.subjects?.length) subjects = mergeSubjects(subjects, data.subjects);
  }
  return subjects.length ? { subjects } : null;
}

// LLM facility fallback — only runs when Python server is unavailable.
// Capped at MAX_CHUNKS_SUMMARY to bound worst-case API call count.
async function extractFacilitiesLLM(text, hint) {
  if (!text) return null;
  let result = { installments: [], nonInstallments: [], creditCards: [] };
  for (const chunk of chunks(text, CHUNK_SIZE, MAX_CHUNKS_SUMMARY)) {
    const data = await claudeJSON(`You are extracting all credit facility transactions from a Philippine CIC document.
Return ONLY a JSON object — no prose, no markdown:
{
  "installments": [ { "subject": "string", "lender": "string", "contract": "string", "amount": "e.g. P5,000,000", "start": "e.g. MAY '25", "end": "e.g. JUN '30 or —", "status": "CURRENT/CLOSED/PAST DUE/CLOSED IN ADV.", "settled": "date or —" } ],
  "nonInstallments": [ { "subject": "string", "lender": "string", "contract": "string", "limit": "e.g. P500,000", "start": "string", "end": "string", "status": "string", "settled": "—" } ],
  "creditCards": [ { "subject": "string", "lender": "string", "contract": "CREDIT CARD", "limit": "string", "start": "string", "end": "string", "status": "string", "settled": "—" } ]
}
Borrower context: ${hint || "(none)"}
--- CHUNK ---\n${chunk}\n--- END ---\nReturn JSON only.`);
    if (data) result = mergeFacilitiesResult(result, data);
  }
  const hasAny = result.installments.length || result.nonInstallments.length || result.creditCards.length;
  return hasAny ? result : null;
}

async function extractCRIF(text, hint) {
  if (!text) return null;
  let merged = {};
  for (const chunk of chunks(text, CHUNK_SIZE, 2)) {
    const data = await claudeJSON(`Extract the PRIMARY SUBJECT company's corporate data from a CRIF dossier issued for a Philippine company.
IMPORTANT: The "company" field must be the main borrower/subject entity whose dossier this is — the large heading name at the top of the document. Do NOT use names of individual shareholders, officers, creditors, or related parties.
Return ONLY JSON:
{"company":"","secReg":"","legalForm":"","status":"","tin":"","paidUpCapital":"","employees":0,"lineOfBusiness":"","activityStart":0,"principal":"","issued":"","litigation":"","fin2024":[{"label":"","val":""}],"shareholders":[{"name":"","gisRole":"","crifRole":"","shares":"","pct":"","tin":""}]}
Only include fields actually found. Borrower context: ${hint || "(none)"}
--- CHUNK ---\n${chunk}\n--- END ---\nReturn JSON only.`);
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        const empty    = !merged[k] || (Array.isArray(merged[k]) && !merged[k].length);
        const hasValue = Array.isArray(v) ? v.length > 0 : (v !== "" && v !== null && v !== undefined && v !== 0);
        if (empty && hasValue) merged[k] = v;
      }
    }
  }
  return Object.keys(merged).length ? merged : null;
}

async function extractGIS(text, hint) {
  if (!text) return null;
  let merged = {};
  for (const chunk of chunks(text, CHUNK_SIZE, 2)) {
    const data = await claudeJSON(`Extract data from a Philippine SEC General Information Sheet (GIS).
The "company" field must be the exact registered company name — it typically appears as the large heading immediately below "GENERAL INFORMATION SHEET" or as "Name of Corporation/Partnership".
Return ONLY JSON:
{"company":"","secReg":"","tin":"","address":"","lineOfBusiness":"","authorizedCapital":"","subscribedCapital":"","paidUpCapital":"","issueDate":"","officers":[{"name":"","title":""}],"shareholders":[{"name":"","shares":"","pct":"","nationality":""}]}
Only include fields actually found in this document. Borrower context: ${hint || "(none)"}
--- CHUNK ---\n${chunk}\n--- END ---\nReturn JSON only.`);
    if (data) {
      for (const [k, v] of Object.entries(data)) {
        const empty    = !merged[k] || (Array.isArray(merged[k]) && !merged[k].length);
        const hasValue = Array.isArray(v) ? v.length > 0 : (v !== "" && v !== null && v !== undefined);
        if (empty && hasValue) merged[k] = v;
      }
    }
  }
  return Object.keys(merged).length ? merged : null;
}

async function extractNamescan(text, hint) {
  if (!text) return null;
  const data = await claudeJSON(`Extract Namescan.io screening results from a Philippine sanctions/PEP/adverse-media document.
Return ONLY JSON:
{"subjects":[{"subject":"","scanId":"","date":"","sanctionsPep":"","adverse":"","verdict":""}],"adverseMedia":[{"source":"","finding":"","date":"","assessment":""}]}
Return {"subjects":[],"adverseMedia":[]} if no data found. Borrower context: ${hint || "(none)"}
--- DOCUMENT ---\n${text.slice(0, CHUNK_SIZE)}\n--- END ---\nReturn JSON only.`);
  return data?.subjects?.length ? data : null;
}

async function generateSummary(extracted, meta) {
  // Compact JSON (no indentation) + small facility sample keeps the context
  // well under 8 000 chars so it never gets sliced mid-object.
  const ctx = JSON.stringify({
    nfis: extracted.nfis,
    cic:  extracted.cic,
    crif: extracted.crif,
    gis:  extracted.gis,
    namescan: extracted.namescan,
    facilitySample: {
      installments:    (extracted.facilities?.installments    || []).slice(0, 5),
      nonInstallments: (extracted.facilities?.nonInstallments || []).slice(0, 3),
      creditCards:     (extracted.facilities?.creditCards     || []).slice(0, 5),
    },
    borrower: meta.borrower,
    notes: meta.notes,
  });

  return await claudeJSON(`You are a senior credit analyst at ProCredit Financing Corp in the Philippines.
Based on the extracted CBR data below, generate a structured JSON summary.
IMPORTANT: Always return a complete, valid JSON object — even if data is limited, use "Insufficient data" or 1 as defaults. Never return prose or an explanation instead of JSON.
Return ONLY a JSON object — no prose, no markdown, no code fences:
{
  "estAnnRev": "Total Revenue from fin2024 or empty string",
  "riskRating": 1,
  "riskTier": "HIGH / MEDIUM / LOW",
  "riskLine": "one-sentence summary of the primary risk driver",
  "summaryFindings": ["one paragraph per subject — corporate entity first, then each principal"],
  "actionPlan": ["3-5 priority action items for Credit Ops, most urgent first"],
  "rationale": ["concise bullets justifying the risk rating, 3-6 items"],
  "threeWay": [
    { "dp": "data point label", "gis": "GIS/SEC value", "crif": "CRIF value", "cbr": "CIC/CBR value", "verdict": "MATCH / MISMATCH / CONSISTENT / ADVERSE MEDIA / OLD NFIS HIT / SETTLED / etc." }
  ]
}

Risk rating scale (integer 1-5):
5 = multiple material findings — adverse media + active delinquencies within 24 months
4 = significant — adverse media OR multiple active delinquencies within 24 months
3 = moderate — minor or isolated delinquencies, or old negative files
2 = minimal — only historical settled negatives, nothing recent
1 = clean — no negative findings whatsoever

threeWay must include a row for each: Legal Company Name, SEC Reg, each principal's role, Paid-up Capital, Total Assets/Financials, Litigation, NFIS hit per principal, Namescan screening per entity.
Use the GIS data (if present) to populate the "gis" column with actual SEC-filed values instead of "N/A".

Analyst notes: ${meta.notes || "(none)"}
--- EXTRACTED DATA ---
${ctx}
--- END ---
Return JSON only.`);
}

// ── Normalizers ───────────────────────────────────────────────────────────────

function normalizeSubjects(subjects) {
  return (subjects || []).map((s) => ({
    ...s, hit: Boolean(s.hit),
    items: (s.items || []).map((it) => ({
      ...it,
      conclusionType:
        /past.?due|w-?off|write.?off/i.test(it.conclusion) ? "red"   :
        /closed|settled/i.test(it.conclusion)               ? "slate" :
        /current/i.test(it.conclusion)                      ? "amber" : "slate",
    })),
  }));
}

function normalizeNamescan(subjects) {
  return (subjects || []).map((s) => ({ ...s, verdictType: /clear/i.test(s.verdict) ? "green" : "red" }));
}

function normalizeAdverseMedia(items) {
  return (items || []).map((it) => ({
    ...it,
    assessmentType:
      /material/i.test(it.assessment)   ? "red"   :
      /corroborat/i.test(it.assessment) ? "amber" : "green",
  }));
}

function normalizeThreeWay(rows) {
  return (rows || []).map((r) => ({
    ...r,
    verdictType:
      /mismatch|adverse|hit/i.test(r.verdict)       ? "red"   :
      /old|settled|warn|inconsist/i.test(r.verdict) ? "amber" : "green",
  }));
}

// Builds CIC delinquency summary from Python-extracted facility data.
// Used when extractCICSummary LLM returns null even after pdfplumber text.
function buildCICSummaryFromFacilities(facilitiesData) {
  const all = [
    ...(facilitiesData?.installments    || []),
    ...(facilitiesData?.nonInstallments || []),
    ...(facilitiesData?.creditCards     || []),
  ];
  if (!all.length) return null;

  const bySubject = {};
  for (const f of all) {
    const key = (f.subject || "UNKNOWN").toUpperCase().trim();
    if (!bySubject[key]) bySubject[key] = { name: key, role: "", hit: false, items: [] };
    if (/past.?due|w.?off/i.test(f.status)) {
      bySubject[key].hit = true;
      bySubject[key].items.push({
        provider:   f.lender   || "—",
        amount:     f.amount   || f.limit || "—",
        remarks:    `${f.start || "—"} – ${f.status}`,
        conclusion: f.status,
      });
    }
  }

  const subjects = Object.values(bySubject);
  return subjects.length ? { subjects } : null;
}

// Builds a basic summary when generateSummary LLM call returns null.
function buildSummaryFallback(nfisData, cicData, crifData, namescanData, facilitiesData, borrower) {
  let riskRating = 1;
  const rationale  = [];
  const actionPlan = [];

  const nfisHits = (nfisData?.subjects || []).filter((s) => s.hit);
  if (nfisHits.length) {
    riskRating = Math.max(riskRating, 3);
    const total = nfisHits.reduce((n, s) => n + (s.items?.length || 0), 0);
    rationale.push(`NFIS: ${nfisHits.map((s) => s.name).join(", ")} — ${total} negative file entr${total === 1 ? "y" : "ies"}`);
    actionPlan.push("Obtain NFIS clearance documentation for all flagged subjects");
  }

  const cicPastDue = (cicData?.subjects || [])
    .flatMap((s) => s.items || [])
    .filter((i) => /past.?due|w.?off/i.test(i.conclusion));
  if (cicPastDue.length) {
    riskRating = Math.max(riskRating, 4);
    rationale.push(`CIC: ${cicPastDue.length} past-due / written-off account${cicPastDue.length > 1 ? "s" : ""}`);
    actionPlan.push("Request SOA and clearance certificates for all delinquent CIC accounts");
  }

  if (crifData?.litigation && !/negative|none|clear/i.test(crifData.litigation)) {
    riskRating = Math.max(riskRating, 3);
    rationale.push(`CRIF litigation: ${crifData.litigation}`);
    actionPlan.push("Obtain court clearance / litigation docs from borrower");
  }

  const adverseHits = (namescanData?.subjects || []).filter((s) => !/clear/i.test(s.verdict));
  if (adverseHits.length) {
    riskRating = Math.max(riskRating, 4);
    rationale.push(`Namescan: ${adverseHits.length} subject${adverseHits.length > 1 ? "s" : ""} with adverse media or sanctions hit`);
    actionPlan.push("Request written clarification on adverse media findings before credit approval");
  }

  const total = (facilitiesData?.installments?.length || 0)
    + (facilitiesData?.nonInstallments?.length || 0)
    + (facilitiesData?.creditCards?.length || 0);

  if (!rationale.length) {
    rationale.push(`No material delinquencies across ${total} reported CIC facilit${total === 1 ? "y" : "ies"}`);
    actionPlan.push("Proceed with standard credit evaluation");
    actionPlan.push("Confirm borrower identity and SEC registration with GIS on file");
  }

  const riskTier = riskRating >= 4 ? "HIGH" : riskRating >= 3 ? "MEDIUM" : "LOW";
  const riskLine = rationale[0];

  return {
    riskRating,
    riskTier,
    riskLine,
    summaryFindings: [
      `${borrower || "BORROWER"}: Risk ${riskRating}/5 (${riskTier}). ${rationale.join(". ")}. Total CIC accounts on record: ${total}.`,
    ],
    actionPlan,
    rationale,
  };
}

// Builds a basic three-way table from structured GIS + CRIF data.
// Used as a fallback when the LLM summary step returns an empty threeWay.
function buildThreeWayFallback(gisData, crifData, borrower) {
  if (!crifData && !gisData) return [];

  const g = gisData  || {};
  const c = crifData || {};

  // Normalise a value before comparison — strips common format differences.
  const norm = (s) => {
    if (!s) return "";
    return s.toString().trim()
      .replace(/^SEC\s+/i, "")               // "SEC A199711126" → "A199711126"
      .replace(/\s*(PHP|PESO|USD)\s*/gi, "")  // "20,000,000.00 PHP" → "20,000,000.00"
      .replace(/,/g, "")                      // strip thousands separators
      .toLowerCase();
  };

  // Keyword-overlap ratio between two strings (ignores short/stop words).
  const overlapRatio = (a, b) => {
    const words = (s) => new Set(s.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const wA = words(a), wB = words(b);
    if (!wA.size || !wB.size) return 0;
    const common = [...wA].filter((w) => wB.has(w)).length;
    return common / Math.max(wA.size, wB.size);
  };

  // Standard row — exact (normalised) comparison.
  const row = (dp, gisVal, crifVal, cbrVal) => {
    const hasG = gisVal  != null && gisVal  !== "" && gisVal  !== "—";
    const hasC = crifVal != null && crifVal !== "" && crifVal !== "—";
    const hasB = cbrVal  != null && cbrVal  !== "" && cbrVal  !== "—";

    let verdict, verdictType;
    if (hasG && hasC) {
      const match = norm(gisVal) === norm(crifVal);
      verdict     = match ? "MATCH"    : "MISMATCH";
      verdictType = match ? "green"    : "red";
    } else if (!hasG && hasC && hasB) {
      const match = norm(crifVal) === norm(cbrVal);
      verdict     = match ? "CONSISTENT" : "CBR MISMATCH";
      verdictType = match ? "green"      : "red";
    } else if (hasC || hasG) {
      verdict = "CONSISTENT"; verdictType = "green";
    } else {
      verdict = "N/A"; verdictType = "slate";
    }
    return { dp, gis: gisVal || "N/A", crif: crifVal || "N/A", cbr: cbrVal || "—", verdict, verdictType };
  };

  // Fuzzy row — used for free-text fields (e.g. Line of Business) where exact
  // phrasing differs but the content is semantically equivalent.
  const rowFuzzy = (dp, gisVal, crifVal, cbrVal) => {
    const r = row(dp, gisVal, crifVal, cbrVal);
    if (r.verdict === "MISMATCH" && gisVal && crifVal) {
      const ratio = overlapRatio(gisVal, crifVal);
      if (ratio >= 0.25) {
        // Substantial keyword overlap → same activity, just different wording
        r.verdict     = "SIMILAR / CONSISTENT";
        r.verdictType = "green";
      } else {
        // Low overlap → genuinely different activities; flag for review, not hard mismatch
        r.verdict     = "REVIEW — DIFFERENT DESCRIPTION";
        r.verdictType = "amber";
      }
    }
    return r;
  };

  return [
    row(     "Legal Company Name",   g.company,           c.company,        borrower || "—"),
    row(     "SEC Registration No.", g.secReg,            c.secReg,         "—"),
    row(     "TIN",                  g.tin,               c.tin,            "—"),
    row(     "Legal Form",           null,                c.legalForm,      "—"),
    row(     "Status",               null,                c.status,         "—"),
    row(     "Paid-up Capital",      g.paidUpCapital,     c.paidUpCapital,  "—"),
    row(     "Auth. Capital",        g.authorizedCapital, null,             "—"),
    row(     "Principal / CEO",      null,                c.principal,      "—"),
    rowFuzzy("Line of Business",     g.lineOfBusiness,    c.lineOfBusiness, "—"),
    row(     "Litigation",           null,                c.litigation,     "—"),
  ].filter((r) => r.gis !== "N/A" || r.crif !== "N/A");
}

function emptyReport(borrower, reportDate) {
  return {
    meta: { borrower: borrower || "", reportDate: reportDate || "", estAnnRev: "", riskRating: 0, riskTier: "", riskLine: "" },
    nfis: [], cic: [],
    gis: null,
    crif: { issued: "", litigation: "", company: borrower || "", secReg: "", legalForm: "", status: "", tin: "", paidUpCapital: "", employees: 0, lineOfBusiness: "", activityStart: 0, principal: "", fin2024: [], shareholders: [] },
    threeWay: [], namescan: [], adverseMedia: [], summaryFindings: [], actionPlan: [], rationale: [],
    signoff: [{ role: "Prepared by", who: "", title: "" }, { role: "Follow-up by", who: "", title: "" }, { role: "Approved by", who: "Adnan Agha", title: "Chief Executive Officer" }],
    facilities: { installments: [], nonInstallments: [], creditCards: [] },
  };
}

// ── Main entry point ──────────────────────────────────────────────────────────

export async function extractAll(files, meta, onStep) {
  const step = (i, label) => onStep?.(i, label);
  const hint = meta.borrower || "";

  // Phase 1 — extract text via pdfplumber (Python) for all docs + CIC facilities in parallel.
  // pdfplumber gives significantly cleaner text than pdfjs-dist, especially for large CIC PDFs.
  // Falls back to pdfjs-dist automatically per file if the Python server is unavailable.
  step(0, "Reading documents & extracting CIC via Python");
  const [[nfisText, cicText, crifText, namescanText, gisText], pythonFacilities] = await Promise.all([
    Promise.all([
      filesToTextPython(files.nfis),
      filesToTextPython(files.cic),
      filesToTextPython(files.crif),
      filesToTextPython(files.namescan),
      filesToTextPython(files.gis),
    ]),
    extractCICPython(files.cic),
  ]);

  // Phase 2 — all LLM source extractions run in parallel.
  // LLM facility extraction only fires when Python found nothing.
  step(1, "Extracting GIS · NFIS · CIC · CRIF · Namescan in parallel");
  const [nfisData, cicData, crifData, namescanData, gisData, llmFacilities] = await Promise.all([
    extractNFIS(nfisText, hint),
    extractCICSummary(cicText, hint),
    extractCRIF(crifText, hint),
    extractNamescan(namescanText, hint),
    extractGIS(gisText, hint),
    !pythonFacilities && cicText ? extractFacilitiesLLM(cicText, hint) : Promise.resolve(null),
  ]);

  const facilitiesData = pythonFacilities || llmFacilities;

  console.group("[CBR] Extraction results");
  console.log("GIS company:", gisData?.company ?? "(null)");
  console.log("NFIS:", nfisData?.subjects?.length ?? 0, "subjects");
  console.log("CIC:", cicData?.subjects?.length ?? 0, "subjects");
  console.log("CRIF company:", crifData?.company ?? "(null)");
  console.log("Namescan:", namescanData?.subjects?.length ?? 0, "subjects");
  console.log("Facilities:", facilitiesData
    ? `${facilitiesData.installments.length}i / ${facilitiesData.nonInstallments.length}n / ${facilitiesData.creditCards.length}cc (${pythonFacilities ? "Python" : "LLM"})`
    : "(null — no CIC uploaded or both extractors returned nothing)");
  console.groupEnd();

  // Phase 3 — summary depends on all phase 2 results
  step(2, "Generating summary, risk rating & three-way reconciliation");
  const summaryData = await generateSummary(
    { nfis: nfisData, cic: cicData, crif: crifData, gis: gisData, namescan: namescanData, facilities: facilitiesData }, meta
  );

  if (!summaryData) console.warn("[CBR] generateSummary returned null — check DevTools for [claudeJSON] errors above");

  step(3, "Assembling CBR report");

  const report = emptyReport(meta.borrower || crifData?.company || "", meta.reportDate || "");

  if (nfisData?.subjects?.length)        report.nfis         = normalizeSubjects(nfisData.subjects);

  // CIC summary: prefer LLM result; fall back to facility-derived summary
  const cicSummary = cicData ?? buildCICSummaryFromFacilities(facilitiesData);
  if (cicSummary?.subjects?.length) {
    report.cic = normalizeSubjects(cicSummary.subjects);
    if (!cicData) console.info("[CBR] CIC summary: using facility-derived fallback");
  }
  if (gisData)                            report.gis          = gisData;
  if (crifData)                           Object.assign(report.crif, crifData);
  if (report.crif.company && !report.meta.borrower) report.meta.borrower = report.crif.company;
  if (namescanData?.subjects?.length)    report.namescan     = normalizeNamescan(namescanData.subjects);
  if (namescanData?.adverseMedia?.length) report.adverseMedia = normalizeAdverseMedia(namescanData.adverseMedia);
  if (facilitiesData)                     report.facilities   = facilitiesData;

  if (summaryData) {
    if (summaryData.estAnnRev)               report.meta.estAnnRev  = summaryData.estAnnRev;
    if (summaryData.riskRating)              report.meta.riskRating = summaryData.riskRating;
    if (summaryData.riskTier)                report.meta.riskTier   = summaryData.riskTier;
    if (summaryData.riskLine)                report.meta.riskLine   = summaryData.riskLine;
    if (summaryData.summaryFindings?.length) report.summaryFindings = summaryData.summaryFindings;
    if (summaryData.actionPlan?.length)      report.actionPlan      = summaryData.actionPlan;
    if (summaryData.rationale?.length)       report.rationale       = summaryData.rationale;
    if (summaryData.threeWay?.length)        report.threeWay        = normalizeThreeWay(summaryData.threeWay);
  }

  // If the LLM summary is missing or empty, fill it programmatically from structured data.
  if (!report.meta.riskRating || !report.summaryFindings.length) {
    const fb = buildSummaryFallback(nfisData, cicData, crifData, namescanData, facilitiesData, report.meta.borrower);
    if (!report.meta.riskRating)        report.meta.riskRating = fb.riskRating;
    if (!report.meta.riskTier)          report.meta.riskTier   = fb.riskTier;
    if (!report.meta.riskLine)          report.meta.riskLine   = fb.riskLine;
    if (!report.summaryFindings.length) report.summaryFindings = fb.summaryFindings;
    if (!report.actionPlan.length)      report.actionPlan      = fb.actionPlan;
    if (!report.rationale.length)       report.rationale       = fb.rationale;
    console.info("[CBR] Summary: using programmatic fallback (LLM returned null or empty)");
  }

  // If the LLM three-way is empty, build it programmatically from GIS + CRIF.
  if (!report.threeWay.length && (gisData || crifData)) {
    report.threeWay = buildThreeWayFallback(gisData, crifData, report.meta.borrower);
    console.info("[CBR] Three-way: using programmatic fallback (%d rows)", report.threeWay.length);
  }

  return report;
}
