// CBR Extraction Engine
// LLM extraction: CRIF, Namescan, NFIS
// Programmatic parsing: CIC facility detail pages (Detail of Installment/Non Installment/Credit Card)
// Exposes window.CBRExtractor.extractAll(files, meta, onStep) → report object.

(function () {
  const CHUNK_SIZE = 20000;
  const MAX_CHUNKS_SUMMARY   = 5;
  const MAX_CHUNKS_FACILITIES = 12;

  // ── PDF / file reader ────────────────────────────────────────────────────

  async function fileToText(file) {
    if (!file) return "";
    const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
    if (isPdf) {
      try {
        const { PDFParse } = await import(
          "https://cdn.jsdelivr.net/npm/pdf-parse@2.4.5/dist/pdf-parse/web/pdf-parse.es.js"
        );
        PDFParse.setWorker(
          "https://cdn.jsdelivr.net/npm/pdf-parse@2.4.5/dist/pdf-parse/web/pdf.worker.min.mjs"
        );
        const buf = new Uint8Array(await file.arrayBuffer());
        const parser = new PDFParse({ data: buf });
        const result = await parser.getText();
        return result.text || "";
      } catch (e) {
        console.warn("pdf-parse failed, falling back to readAsText:", e);
        try { return await file.text(); } catch { return ""; }
      }
    }
    return await file.text();
  }

  // ── Claude helper ────────────────────────────────────────────────────────

  async function claudeComplete(prompt) {
    if (typeof window.claude !== "undefined") {
      return await window.claude.complete(prompt);
    }
    const res = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error(`/api/complete ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.text;
  }

  async function claudeJSON(prompt) {
    try {
      const raw = await claudeComplete(prompt);
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch (e) {
      console.warn("Claude JSON extraction error:", e);
      return null;
    }
  }

  function chunks(text, size, maxChunks) {
    const out = [];
    for (let i = 0; i < text.length && out.length < maxChunks; i += size) {
      out.push(text.slice(i, i + size));
    }
    return out;
  }

  // ── Merge helpers ────────────────────────────────────────────────────────

  function mergeSubjects(a, b) {
    const map = {};
    for (const s of [...a, ...b]) {
      const key = (s.name || "").toUpperCase().trim();
      if (!key) continue;
      if (!map[key]) {
        map[key] = { ...s, items: [...(s.items || [])] };
      } else {
        map[key].items.push(...(s.items || []));
        if (s.hit) map[key].hit = true;
      }
    }
    return Object.values(map);
  }

  function dedupFacilities(arr) {
    const seen = new Set();
    return arr.filter((f) => {
      const k = `${f.subject}|${f.lender}|${f.contract}|${f.start}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function mergeFacilitiesResult(a, b) {
    return {
      installments:    dedupFacilities([...(a.installments    || []), ...(b.installments    || [])]),
      nonInstallments: dedupFacilities([...(a.nonInstallments || []), ...(b.nonInstallments || [])]),
      creditCards:     dedupFacilities([...(a.creditCards     || []), ...(b.creditCards     || [])]),
    };
  }

  // ── Programmatic CIC parser ───────────────────────────────────────────────
  //
  // Strictly ignores summary pages and only parses individual detail sections:
  //   "Detail of Installment N"
  //   "Detail of Non Installment N"
  //   "Detail of Credit Card N"

  function extractSubjectFromCIC(text) {
    // Try "Dear FIRSTNAME LASTNAME" block near the top (first 3000 chars)
    const top = text.slice(0, 3000);
    const dearM = top.match(/Dear\s+([A-Z][A-Z\s]{3,40}?)[\r\n]/);
    if (dearM) return dearM[1].trim();

    // Try Last Name / First Name / Middle Name fields
    const ln = top.match(/Last Name\s+([A-Z]+)/);
    const fn = top.match(/First Name\s+([A-Z]+)/);
    if (fn && ln) return `${fn[1]} ${ln[1]}`;

    // Try "SUBJECT NAME : SOMETHING"
    const sn = top.match(/SUBJECT NAME\s*:\s*([A-Z][A-Z\s,./()&-]{2,60})/);
    if (sn) return sn[1].trim();

    return "";
  }

  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

  function fmtDate(d) {
    if (!d) return "—";
    // Handle MM/DD/YYYY or DD/MM/YYYY or YYYY/MM/DD
    const parts = d.split("/");
    if (parts.length < 2) return d;
    // Try to detect format: if first part is 4 digits → YYYY/MM/DD
    if (parts[0].length === 4) {
      const [y, m] = parts;
      const idx = parseInt(m) - 1;
      if (idx >= 0 && idx < 12) return `${MONTHS[idx]} '${y.slice(2)}`;
    }
    // Otherwise assume MM/DD/YYYY
    const [m, , y] = parts;
    const idx = parseInt(m) - 1;
    if (idx >= 0 && idx < 12 && y) return `${MONTHS[idx]} '${y.slice(2)}`;
    return d;
  }

  function fmtAmount(a) {
    if (!a) return "—";
    const n = parseInt(String(a).replace(/[^0-9]/g, ""));
    if (isNaN(n) || n === 0) return "—";
    return `P${n.toLocaleString()}`;
  }

  function parseSectionField(text, ...patterns) {
    for (const p of patterns) {
      const m = text.match(p);
      const val = m?.[1]?.trim();
      if (val && val !== "-" && val !== "—") return val;
    }
    return "";
  }

  function parseCICSection(sectionText, sectionType, subject) {
    const t = sectionText;

    // Provider / Lender name — appears after "Provider Description" before "Last Update Date"
    const provider = parseSectionField(t,
      /Provider Description\s+([\w][\w\s,.()\-/'&]+?)(?:\s{2,}|\s+Last Update|\n)/m,
      /Provider Description\s*\n\s*([\w][\w\s,.()\-/'&]+?)(?:\n|$)/m,
    );

    // Contract type — between "Contract Type" and "Financed Amount" or "Credit Limit"
    const contractType = parseSectionField(t,
      /Contract Type\s+([\w][\w/\s-]+?)(?:\s{2,}|\s+(?:Financed Amount|Credit Limit|Transaction Type))/m,
    );

    // Amount / limit
    const rawAmount = parseSectionField(t,
      /(?:Financed Amount|Credit Limit)\s+([\d,]+)/m,
    );

    // Dates — CIC uses MM/DD/YYYY format
    const startDate = parseSectionField(t,
      /Contract Start Date\s+([\d/]+)/m,
      /Start Date\s+([\d/]+)/m,
    );
    const endDate = parseSectionField(t,
      /Contract End Date\s+([\d/]+)/m,
      /End Date\s+([\d/]+)/m,
    );

    // Contract phase
    const phase = parseSectionField(t,
      /Contract Phase\s+(Active|Closed in advance|Closed|Requested|Renounced|Refused)/mi,
    );

    // Overdue days line (last status)
    const overdueLine = parseSectionField(t,
      /Overdue days\s+(.+)/m,
    );

    // Determine status
    let status = "CURRENT";
    const phL = phase.toLowerCase();
    if (phL.includes("closed in advance")) status = "CLOSED IN ADV.";
    else if (phL.includes("closed"))       status = "CLOSED";

    // If still "CURRENT" but overdue line says something bad → PAST DUE
    if (status === "CURRENT" && /\d+-\d+\s*days?\s*delay|cycle\s*late|past\s*due/i.test(overdueLine)) {
      status = "PAST DUE";
    }

    const settled = (status === "CLOSED" || status === "CLOSED IN ADV.") && endDate
      ? fmtDate(endDate) : "—";

    if (!provider && !contractType) return null;

    const base = {
      subject:  subject || "SUBJECT",
      lender:   provider   || "—",
      contract: contractType || sectionType.toUpperCase(),
      start:    fmtDate(startDate),
      end:      fmtDate(endDate),
      status,
      settled,
    };

    if (sectionType === "Installment") {
      return { ...base, amount: fmtAmount(rawAmount) };
    } else {
      // Non-Installment and Credit Card both use "limit"
      return { ...base, limit: fmtAmount(rawAmount) };
    }
  }

  function parseCICFacilities(text, subjectHint) {
    if (!text) return null;

    const subject = subjectHint || extractSubjectFromCIC(text);

    // Find all "Detail of ..." section start positions.
    // The CIC report pages always start with one of these three headers.
    const detailRegex = /Detail\s+of\s+(Installment|Non\s+Installment|Credit\s+Card)\s+(\d+)/gi;
    const sections = [];
    let m;
    while ((m = detailRegex.exec(text)) !== null) {
      sections.push({
        type:  m[1].replace(/\s+/g, " "), // normalise "Non Installment"
        num:   parseInt(m[2]),
        pos:   m.index,
      });
    }

    if (!sections.length) return null;

    const installments    = [];
    const nonInstallments = [];
    const creditCards     = [];

    for (let i = 0; i < sections.length; i++) {
      const sec     = sections[i];
      const nextPos = i + 1 < sections.length ? sections[i + 1].pos : text.length;
      const chunk   = text.slice(sec.pos, nextPos);

      const parsed = parseCICSection(chunk, sec.type, subject);
      if (!parsed) continue;

      if (/^installment$/i.test(sec.type))    installments.push(parsed);
      else if (/non installment/i.test(sec.type)) nonInstallments.push(parsed);
      else                                        creditCards.push(parsed);
    }

    const hasAny = installments.length || nonInstallments.length || creditCards.length;
    return hasAny ? { installments, nonInstallments, creditCards } : null;
  }

  // ── LLM extractors (CRIF, NFIS, Namescan, CIC summary) ──────────────────

  async function extractNFIS(text, hint) {
    if (!text) return null;
    let subjects = [];
    for (const chunk of chunks(text, CHUNK_SIZE, MAX_CHUNKS_SUMMARY)) {
      const prompt = `You are extracting NFIS (Negative Files Information System) data from a Philippine credit bureau document.
Return ONLY a JSON object — no prose, no markdown:
{ "subjects": [ { "name": "string", "role": "string (e.g. PRESIDENT/VICE PRESIDENT/CORPORATE)", "hit": true|false, "items": [ { "provider": "string", "amount": "string (e.g. P55,264)", "remarks": "string (date, type, status context)", "conclusion": "string (W-OFF/CLOSED/PAST DUE/CURRENT/—)" } ] } ] }

Rules:
- hit = true if the subject has any negative entry
- Only include subjects that appear in this NFIS document
- Return { "subjects": [] } if no NFIS data found in this chunk

Borrower context: ${hint || "(none)"}
--- CHUNK ---
${chunk}
--- END ---
Return JSON only.`;
      const data = await claudeJSON(prompt);
      if (data?.subjects?.length) subjects = mergeSubjects(subjects, data.subjects);
    }
    return subjects.length ? { subjects } : null;
  }

  async function extractCICSummary(text, hint) {
    if (!text) return null;
    let subjects = [];
    for (const chunk of chunks(text, CHUNK_SIZE, MAX_CHUNKS_SUMMARY)) {
      const prompt = `You are extracting CIC (Credit Information Corporation) DELINQUENCY SUMMARY data from a Philippine credit bureau document.
Focus only on the summary section (not the individual detail pages) to extract per-subject delinquency highlights.
Return ONLY a JSON object — no prose, no markdown:
{ "subjects": [ { "name": "string", "role": "string (CORPORATE/PRESIDENT/VICE PRESIDENT/etc.)", "hit": true|false, "items": [ { "provider": "string (lender name)", "amount": "string (e.g. P5,000,000)", "remarks": "string (month/year + DPD or cycle-late info)", "conclusion": "string (CURRENT/PAST DUE/CLOSED/W-OFF)" } ] } ] }

Rules:
- Only include subjects and items explicitly found in this chunk
- hit = true if any delinquency or past-due item exists for that subject
- Return { "subjects": [] } if no CIC summary data found

Borrower context: ${hint || "(none)"}
--- CHUNK ---
${chunk}
--- END ---
Return JSON only.`;
      const data = await claudeJSON(prompt);
      if (data?.subjects?.length) subjects = mergeSubjects(subjects, data.subjects);
    }
    return subjects.length ? { subjects } : null;
  }

  // LLM fallback for facility extraction (used only if programmatic parser finds nothing)
  async function extractFacilitiesLLM(text, hint) {
    if (!text) return null;
    let result = { installments: [], nonInstallments: [], creditCards: [] };
    for (const chunk of chunks(text, CHUNK_SIZE, MAX_CHUNKS_FACILITIES)) {
      const prompt = `You are extracting all credit facility transactions from a Philippine CIC (Credit Information Corporation) document.
Return ONLY a JSON object — no prose, no markdown:
{
  "installments": [ { "subject": "string", "lender": "string", "contract": "string (e.g. TERM LOAN/VEHICLE LOAN/MORTGAGE/BUSINESS LOAN/PERSONAL LOAN)", "amount": "string (e.g. P5,000,000)", "start": "string (e.g. MAY '25)", "end": "string (e.g. JUN '30 or —)", "status": "string (CURRENT/CLOSED/PAST DUE/CLOSED IN ADV.)", "settled": "string" } ],
  "nonInstallments": [ { "subject": "string", "lender": "string", "contract": "string", "limit": "string", "start": "string", "end": "string", "status": "string", "settled": "string" } ],
  "creditCards": [ { "subject": "string", "lender": "string", "contract": "CREDIT CARD", "limit": "string", "start": "string", "end": "string", "status": "string", "settled": "string" } ]
}

Rules:
- Include every facility row — installment loans, credit lines, credit cards
- Return {"installments":[],"nonInstallments":[],"creditCards":[]} if no facilities found in this chunk
- Dates: MON 'YY (e.g. MAY '25) or — if not present

Borrower context: ${hint || "(none)"}
--- CHUNK ---
${chunk}
--- END ---
Return JSON only.`;
      const data = await claudeJSON(prompt);
      if (data) result = mergeFacilitiesResult(result, data);
    }
    const hasAny = result.installments.length || result.nonInstallments.length || result.creditCards.length;
    return hasAny ? result : null;
  }

  async function extractCRIF(text, hint) {
    if (!text) return null;
    let merged = {};
    for (const chunk of chunks(text, CHUNK_SIZE, 2)) {
      const prompt = `You are extracting corporate data from a CRIF dossier for a Philippine company.
Return ONLY a JSON object — no prose, no markdown:
{
  "company": "string (official legal name)",
  "secReg": "string (e.g. CS201415536 (11-Aug-2014))",
  "legalForm": "string (e.g. Corporation)",
  "status": "string (ACTIVE/INACTIVE)",
  "tin": "string",
  "paidUpCapital": "string (e.g. P6,875,004.00)",
  "employees": number,
  "lineOfBusiness": "string",
  "activityStart": number,
  "principal": "string (CEO/President name and title)",
  "issued": "string (report date, e.g. 13-May-2026)",
  "litigation": "string (NEGATIVE or description of findings)",
  "fin2024": [ { "label": "string (e.g. Total Revenue)", "val": "string (e.g. P388,457,855)" } ],
  "shareholders": [ { "name": "string", "gisRole": "string", "crifRole": "string", "shares": "string", "pct": "string", "tin": "string" } ]
}

Only include fields actually found. Use empty string or [] for missing data.
Borrower context: ${hint || "(none)"}
--- CHUNK ---
${chunk}
--- END ---
Return JSON only.`;
      const data = await claudeJSON(prompt);
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          const empty = !merged[k] || (Array.isArray(merged[k]) && !merged[k].length);
          const hasValue = Array.isArray(v) ? v.length > 0 : (v !== "" && v !== null && v !== undefined && v !== 0);
          if (empty && hasValue) merged[k] = v;
        }
      }
    }
    return Object.keys(merged).length ? merged : null;
  }

  async function extractNamescan(text, hint) {
    if (!text) return null;
    const chunk = text.slice(0, CHUNK_SIZE);
    const prompt = `You are extracting Namescan.io screening results from a Philippine sanctions/PEP/adverse-media screening document.
Return ONLY a JSON object — no prose, no markdown:
{
  "subjects": [ {
    "subject": "string (full name or entity scanned)",
    "scanId": "string (e.g. S2440293)",
    "date": "string (DD-Mon-YYYY)",
    "sanctionsPep": "string (e.g. FALSE — 0 matches  OR  TRUE — N matches)",
    "adverse": "string (HIT — description  OR  CLEAR — 0 results)",
    "verdict": "string (CLEAR  OR  ADVERSE MEDIA — VERIFY  OR  SANCTIONS HIT)"
  } ],
  "adverseMedia": [ {
    "source": "string (publication/platform name)",
    "finding": "string (description of adverse finding)",
    "date": "string (e.g. Feb–Mar '26)",
    "assessment": "string (MATERIAL — follow-up required  OR  CORROBORATING  OR  CLEARED)"
  } ]
}

Return { "subjects": [], "adverseMedia": [] } if no screening data found.
Borrower context: ${hint || "(none)"}
--- DOCUMENT ---
${chunk}
--- END ---
Return JSON only.`;
    const data = await claudeJSON(prompt);
    return data?.subjects?.length ? data : null;
  }

  // ── Summary / risk generation ─────────────────────────────────────────────

  async function generateSummary(extracted, meta) {
    const ctx = JSON.stringify({
      nfis:     extracted.nfis,
      cic:      extracted.cic,
      crif:     extracted.crif,
      namescan: extracted.namescan,
      facilitySample: {
        installments:    (extracted.facilities?.installments    || []).slice(0, 20),
        nonInstallments: (extracted.facilities?.nonInstallments || []).slice(0, 10),
        creditCards:     (extracted.facilities?.creditCards     || []).slice(0, 15),
      },
      borrower: meta.borrower,
      notes:    meta.notes,
    }, null, 2).slice(0, 14000);

    const prompt = `You are a credit analyst at ProCredit Financing Corp in the Philippines.
Based on the extracted CBR data below, generate a structured JSON summary.
Return ONLY a JSON object — no prose, no markdown:
{
  "estAnnRev": "string (Total Revenue from fin2024, e.g. P388,457,855 — or empty string)",
  "riskRating": number (1-5 where 5=HIGH RISK, 1=CLEAN),
  "riskTier": "string (HIGH/MEDIUM/LOW)",
  "riskLine": "string (one-sentence summary of the primary risk driver)",
  "summaryFindings": [ "string (one paragraph per subject — corporate + each principal, 3-4 items total)" ],
  "actionPlan": [ "string (3-5 priority action items for Credit Ops, most urgent first)" ],
  "rationale": [ "string (concise bullets justifying the risk rating, 3-6 items)" ],
  "threeWay": [
    { "dp": "string (data point label)", "gis": "string", "crif": "string", "cbr": "string", "verdict": "string (MATCH/MISMATCH/CONSISTENT/ADVERSE MEDIA/etc.)" }
  ]
}

Risk rating scale:
5 = multiple material findings (adverse media + active delinquencies within 24 months)
4 = significant findings (adverse media OR multiple active delinquencies)
3 = moderate findings (minor/isolated delinquencies or old negative files)
2 = minimal findings (only historical settled negatives, nothing recent)
1 = clean (no negative findings)

threeWay should reconcile: Legal Company Name, SEC Registration, each principal's role,
Paid-up Capital, Total Assets/Financials, Litigation status, NFIS hit per principal.

Analyst notes: ${meta.notes || "(none)"}

--- EXTRACTED DATA ---
${ctx}
--- END ---
Return JSON only.`;

    return await claudeJSON(prompt);
  }

  // ── Normalizers ───────────────────────────────────────────────────────────

  function normalizeSubjects(subjects) {
    return (subjects || []).map((s) => ({
      ...s,
      hit: Boolean(s.hit),
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
    return (subjects || []).map((s) => ({
      ...s,
      verdictType: /clear/i.test(s.verdict) ? "green" : "red",
    }));
  }

  function normalizeAdverseMedia(items) {
    return (items || []).map((it) => ({
      ...it,
      assessmentType:
        /material/i.test(it.assessment)    ? "red"   :
        /corroborat/i.test(it.assessment)  ? "amber" : "green",
    }));
  }

  function normalizeThreeWay(rows) {
    return (rows || []).map((r) => ({
      ...r,
      verdictType:
        /mismatch|adverse|hit/i.test(r.verdict)           ? "red"   :
        /old|settled|warn|inconsist/i.test(r.verdict)     ? "amber" : "green",
    }));
  }

  // ── Empty report skeleton ─────────────────────────────────────────────────

  function emptyReport(borrower, reportDate) {
    return {
      meta: { borrower: borrower || "", reportDate: reportDate || "", estAnnRev: "", riskRating: 0, riskTier: "", riskLine: "" },
      nfis: [], cic: [],
      crif: {
        issued: "", litigation: "", company: borrower || "",
        secReg: "", legalForm: "", status: "", tin: "",
        paidUpCapital: "", employees: 0, lineOfBusiness: "",
        activityStart: 0, principal: "", fin2024: [], shareholders: [],
      },
      threeWay: [], namescan: [], adverseMedia: [],
      summaryFindings: [], actionPlan: [], rationale: [],
      signoff: [
        { role: "Written by",    who: "", title: "" },
        { role: "Follow-up by", who: "", title: "" },
        { role: "Approved by",  who: "", title: "" },
      ],
      facilities: { installments: [], nonInstallments: [], creditCards: [] },
    };
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  /**
   * extractAll(files, meta, onStep) → Promise<CBRReport>
   *
   * files  : { nfis, cic, crif, namescan } — File objects, null if not uploaded
   * meta   : { borrower, reportDate, notes }
   * onStep : optional callback(stepIndex, stepLabel) for progress UI
   */
  async function extractAll(files, meta, onStep) {
    const step = (i, label) => onStep && onStep(i, label);
    const hint = meta.borrower || "";

    step(0, "Reading documents");
    const [nfisText, cicText, crifText, namescanText] = await Promise.all([
      fileToText(files.nfis),
      fileToText(files.cic),
      fileToText(files.crif),
      fileToText(files.namescan),
    ]);

    step(1, "Extracting NFIS — negative files");
    const nfisData = await extractNFIS(nfisText, hint);

    step(2, "Extracting CIC — credit history summary");
    const cicData = await extractCICSummary(cicText, hint);

    step(3, "Parsing CIC — facility detail pages (programmatic)");
    // Try programmatic parser first (reads Detail of Installment/Non Installment/Credit Card sections).
    // Fall back to LLM only if the programmatic parser finds nothing (e.g. non-standard PDF layout).
    let facilitiesData = parseCICFacilities(cicText, hint);
    if (!facilitiesData) {
      console.info("Programmatic CIC parser found no sections — falling back to LLM extraction.");
      facilitiesData = await extractFacilitiesLLM(cicText, hint);
    } else {
      console.info(`Programmatic CIC parser found: ${facilitiesData.installments.length} installments, ${facilitiesData.nonInstallments.length} non-installments, ${facilitiesData.creditCards.length} credit cards.`);
    }

    step(4, "Extracting CRIF — corporate dossier");
    const crifData = await extractCRIF(crifText, hint);

    step(5, "Extracting Namescan — screening results");
    const namescanData = await extractNamescan(namescanText, hint);

    step(6, "Generating summary, risk rating & three-way reconciliation");
    const summaryData = await generateSummary(
      { nfis: nfisData, cic: cicData, crif: crifData, namescan: namescanData, facilities: facilitiesData },
      meta
    );

    step(7, "Assembling CBR report");

    const report = emptyReport(
      meta.borrower || crifData?.company || "",
      meta.reportDate || ""
    );

    if (nfisData?.subjects?.length)     report.nfis     = normalizeSubjects(nfisData.subjects);
    if (cicData?.subjects?.length)      report.cic      = normalizeSubjects(cicData.subjects);
    if (crifData)                        Object.assign(report.crif, crifData);
    if (report.crif.company && !report.meta.borrower) report.meta.borrower = report.crif.company;
    if (namescanData?.subjects?.length)  report.namescan     = normalizeNamescan(namescanData.subjects);
    if (namescanData?.adverseMedia?.length) report.adverseMedia = normalizeAdverseMedia(namescanData.adverseMedia);
    if (facilitiesData)                  report.facilities   = facilitiesData;

    if (summaryData) {
      if (summaryData.estAnnRev)          report.meta.estAnnRev     = summaryData.estAnnRev;
      if (summaryData.riskRating)         report.meta.riskRating    = summaryData.riskRating;
      if (summaryData.riskTier)           report.meta.riskTier      = summaryData.riskTier;
      if (summaryData.riskLine)           report.meta.riskLine      = summaryData.riskLine;
      if (summaryData.summaryFindings?.length) report.summaryFindings = summaryData.summaryFindings;
      if (summaryData.actionPlan?.length)      report.actionPlan      = summaryData.actionPlan;
      if (summaryData.rationale?.length)       report.rationale       = summaryData.rationale;
      if (summaryData.threeWay?.length)        report.threeWay        = normalizeThreeWay(summaryData.threeWay);
    }

    return report;
  }

  window.CBRExtractor = { extractAll, fileToText, parseCICFacilities };
})();
