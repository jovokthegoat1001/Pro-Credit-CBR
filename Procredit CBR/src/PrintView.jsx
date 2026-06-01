import React from "react";

// ── Design tokens matching the ProCredit CBR template ─────────────────────────
const HDR = "#1C3557";   // dark navy — top header / section dividers
const SEC = "#1F618D";   // medium blue — NFIS/CIC/CRIF section headers
const COL = "#2471A3";   // column header blue
const SBJ = "#D6EAF8";   // subject name row tint
const ALT = "#EBF5FB";   // alternating data row tint
const BDR = "1px solid #AEB6BF";
const FF  = '"Calibri","Arial",sans-serif';
const FS  = "7.5pt";
const LP  = "3px 6px";   // standard cell padding

// ── Style helpers ─────────────────────────────────────────────────────────────
const td = (o = {}) => ({
  fontFamily: FF, fontSize: FS, padding: LP,
  border: BDR, verticalAlign: "top", color: "#1B2631",
  wordBreak: "break-word", overflowWrap: "break-word",
  ...o,
});
const th = (o = {}) => ({
  ...td(), background: COL, color: "#fff", fontWeight: "bold",
  fontSize: "6.5pt", textTransform: "uppercase", letterSpacing: ".03em",
  verticalAlign: "middle", ...o,
});
const secHdr = (o = {}) => ({
  ...td(), background: SEC, color: "#fff", fontWeight: "bold",
  textAlign: "center", fontSize: "13pt", verticalAlign: "middle", ...o,
});
const darkHdr = (o = {}) => ({
  ...th(), background: HDR, fontSize: "7.5pt", padding: "5px 8px", ...o,
});

// Red bg + white text for flagged cells; green/grey tint for neutral/good.
const FLAG  = { background: "#C0392B", color: "#fff", fontWeight: "bold" };
const GOOD  = { color: "#1E8449" };
const GREY  = { color: "#626567" };
const AMBER = { background: "#E67E22", color: "#fff", fontWeight: "bold" };

const conclusionColor = (c = "") => {
  const trimmed = c.trim();
  // Exact status → hard red
  if (/^(w[\s-]?off|write[\s-]?off)$/i.test(trimmed)) return FLAG;
  if (/^past[\s-]?due$/i.test(trimmed))                return FLAG;
  // Advisory text mentioning delinquency → softer amber
  if (/w.?off|write.?off/i.test(c)) return AMBER;
  if (/past.?due/i.test(c))         return AMBER;
  if (/closed/i.test(c))            return GREY;
  if (/current/i.test(c))           return GOOD;
  return {};
};
const statusColor = (s = "") => {
  if (/past.?due|w.?off/i.test(s)) return FLAG;
  if (/closed/i.test(s))           return GREY;
  if (/current/i.test(s))          return GOOD;
  return {};
};
const verdictColor = (v = "") => {
  if (!v) return {};

  // ── Step 1: negation phrases — never flag these ──────────────────────────
  // Catches "no adverse", "no derogatory", "routine listing", "appears administrative", etc.
  if (/no adverse|no negative|no derogatory|no criminal|no sanction|no enforcement|no.*find/i.test(v)) return {};
  if (/routine|administrative|appears administrative|benign|standard notation/i.test(v)) return {};

  // ── Step 2: amber — needs review but not critical ────────────────────────
  if (/corroborat|review.*differ|different.*description/i.test(v)) return AMBER;

  // ── Step 3: clear positive ───────────────────────────────────────────────
  if (/\bclear\b|\bconsistent\b|\bmatch\b|\bsettled\b|\bsimilar\b|\bnegative\b/i.test(v)) return GOOD;

  // ── Step 4: red flags — only reached when NOT negated above ─────────────
  if (/\bmismatch\b|cbr mismatch|\bunresolved\b|\bmaterial\b|\badverse\b|\bhit\b/i.test(v)) return FLAG;

  return {};
};

// ── Reusable table wrapper ─────────────────────────────────────────────────────
// tableLayout:"fixed" enforces declared column widths so long text wraps rather than overflows.
function T({ children, mb = 6 }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: mb, tableLayout: "fixed" }}>
      <tbody>{children}</tbody>
    </table>
  );
}

// ── NFIS / CIC delinquency block ──────────────────────────────────────────────
function DelinquencyBlock({ label, subjects }) {
  return (
    <T>
      {/* Section header */}
      <tr>
        <td style={secHdr({ width: "18%", fontSize: "14pt", padding: "6px 8px" })}>{label}</td>
        <td style={th({ width: "25%" })}>SUBJECT</td>
        <td style={th({ width: "38%", textAlign: "center" })}>HIT STATUS</td>
        <td style={th({ width: "19%" })}>CONCLSN</td>
      </tr>

      {subjects.map((s, si) => (
        <React.Fragment key={si}>
          {/* Subject name row — neutral bg; only the HIT cell turns red when hit */}
          <tr style={{ background: SBJ }}>
            <td style={td({ background: SBJ, fontWeight: "bold", textTransform: "uppercase" })}>
              {s.name}{s.role ? ` (${s.role.toUpperCase()})` : ""}
            </td>
            <td colSpan={2} style={td({
              background:  s.hit ? "#C0392B" : SBJ,
              color:       s.hit ? "#fff"    : "#1B2631",
              textAlign:   "center",
              fontWeight:  "bold",
            })}>
              {s.hit ? "TRUE" : "FALSE"}
            </td>
            <td style={td({ background: SBJ })} />
          </tr>
          {/* Column sub-headers */}
          <tr>
            <td style={th()}>PROVIDER</td>
            <td style={th()}>PRIN./PDO AMT</td>
            <td style={th()}>DPD / REMARKS</td>
            <td style={th()}>CONCLSN</td>
          </tr>
          {/* Data rows */}
          {(s.items || []).length === 0 ? (
            <tr><td colSpan={4} style={td({ color: "#888", fontStyle: "italic" })}>No entries.</td></tr>
          ) : (s.items || []).map((it, ii) => (
            <tr key={ii} style={{ background: ii % 2 === 0 ? "#fff" : ALT }}>
              <td style={td()}>{it.provider}</td>
              <td style={td()}>{it.amount}</td>
              <td style={td()}>{it.remarks}</td>
              <td style={{ ...td(), ...conclusionColor(it.conclusion) }}>{it.conclusion}</td>
            </tr>
          ))}
        </React.Fragment>
      ))}
    </T>
  );
}

// ── Facilities sub-table ───────────────────────────────────────────────────────
function FacilityTable({ label, rows, amtKey }) {
  if (!rows?.length) return null;
  return (
    <T mb={10}>
      <tr><td colSpan={8} style={darkHdr({ textAlign: "center", fontSize: "8pt" })}>{label}</td></tr>
      <tr>
        <td style={th({ width: "13%" })}>SUBJECT</td>
        <td style={th({ width: "14%" })}>LENDER</td>
        <td style={th({ width: "16%" })}>CONTRACT TYPE</td>
        <td style={th({ width: "12%", textAlign: "right" })}>FINANCED / CREDIT AMT</td>
        <td style={th({ width: "9%" })}>START DATE</td>
        <td style={th({ width: "9%" })}>END DATE</td>
        <td style={th({ width: "14%" })}>STATUS</td>
        <td style={th({ width: "13%" })}>SETTLED DATE</td>
      </tr>
      {rows.map((r, i) => (
        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
          <td style={td()}>{r.subject}</td>
          <td style={td()}>{r.lender}</td>
          <td style={td()}>{r.contract}</td>
          <td style={td({ textAlign: "right" })}>{r[amtKey]}</td>
          <td style={td()}>{r.start}</td>
          <td style={td()}>{r.end === "—" ? "-" : r.end}</td>
          <td style={{ ...td(), ...statusColor(r.status) }}>{r.status}</td>
          <td style={td()}>{r.settled === "—" ? "-" : r.settled}</td>
        </tr>
      ))}
    </T>
  );
}

// ── Main print component ───────────────────────────────────────────────────────
export default function PrintView({ data }) {
  const {
    meta = {}, nfis = [], cic = [], crif = {},
    gis = null,
    threeWay = [], namescan = [], adverseMedia = [],
    summaryFindings = [], actionPlan = [], rationale = [],
    signoff = [], facilities = {},
  } = data;

  const installs    = facilities.installments    || [];
  const nonInstalls = facilities.nonInstallments || [];
  const cards       = facilities.creditCards     || [];

  return (
    <div id="print-view" style={{ fontFamily: FF, fontSize: FS, color: "#1B2631", background: "#fff", lineHeight: 1.35 }}>

      {/* ══════════════════ PAGE 1 ══════════════════════════════════════════════ */}

      {/* ── Top borrower header ── */}
      <T mb={6}>
        <tr style={{ background: HDR }}>
          <td style={td({ background: HDR, color: "#fff", fontWeight: "bold", width: "10%", fontSize: "6.5pt", textTransform: "uppercase" })}>BORROWER</td>
          <td style={td({ background: HDR, color: "#fff", fontWeight: "bold", width: "40%", fontSize: "8.5pt", textTransform: "uppercase" })}>{meta.borrower}</td>
          <td style={td({ background: HDR, color: "#fff", fontWeight: "bold", width: "10%", fontSize: "6.5pt", textTransform: "uppercase" })}>REPORT DATE</td>
          <td style={td({ background: HDR, color: "#fff", fontSize: "7.5pt" })}>{(meta.reportDate || "").toUpperCase()}</td>
        </tr>
        <tr style={{ background: HDR }}>
          <td style={td({ background: HDR, color: "#fff", fontWeight: "bold", fontSize: "6.5pt", textTransform: "uppercase" })}>EST. ANN. REV</td>
          <td style={td({ background: HDR, color: "#fff", fontSize: "7.5pt" })}>{meta.estAnnRev || "-"}</td>
          <td style={td({ background: HDR, color: "#fff", fontWeight: "bold", fontSize: "6.5pt", textTransform: "uppercase" })}>LINK</td>
          <td style={td({ background: HDR, color: "#fff", fontSize: "7.5pt" })}>-</td>
        </tr>
      </T>

      {/* ── Section 1 title bar ── */}
      <div style={{ background: HDR, color: "#fff", textAlign: "center", padding: "5px 8px", fontWeight: "bold", fontSize: "8.5pt", textTransform: "uppercase", marginBottom: 6, letterSpacing: ".05em" }}>
        SECTION 1 — CREDIT BUREAU REPORT REVIEW / DELINQUENCY HISTORY
      </div>

      {/* ── GIS (if uploaded) ── */}
      {gis && (
        <T mb={6}>
          <tr>
            <td colSpan={6} style={darkHdr({ textAlign: "center", fontSize: "8pt" })}>
              GIS (SEC GENERAL INFORMATION SHEET) — {gis.company}
              {gis.issueDate ? `  ·  Filed: ${gis.issueDate}` : ""}
            </td>
          </tr>
          <tr>
            <td style={th()}>SEC REG NO.</td><td style={td()}>{gis.secReg}</td>
            <td style={th()}>TIN</td><td style={td()}>{gis.tin}</td>
            <td style={th()}>PAID-UP CAPITAL</td><td style={td()}>{gis.paidUpCapital}</td>
          </tr>
          <tr>
            <td style={th()}>AUTH. CAPITAL</td><td style={td()}>{gis.authorizedCapital}</td>
            <td style={th()}>SUBSCRIBED</td><td style={td()}>{gis.subscribedCapital}</td>
            <td style={th()}>LINE OF BUSINESS</td><td style={td()}>{gis.lineOfBusiness}</td>
          </tr>
          {gis.officers?.length > 0 && <>
            <tr><td colSpan={6} style={th({ background: SEC })}>OFFICERS &amp; DIRECTORS</td></tr>
            <tr><td style={th({ width: "50%" })}>NAME</td><td colSpan={5} style={th()}>TITLE / ROLE</td></tr>
            {gis.officers.map((o, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
                <td style={td({ fontWeight: "bold" })}>{o.name}</td>
                <td colSpan={5} style={td()}>{o.title}</td>
              </tr>
            ))}
          </>}
          {gis.shareholders?.length > 0 && <>
            <tr><td colSpan={6} style={th({ background: SEC })}>SHAREHOLDERS</td></tr>
            <tr>
              <td style={th({ width: "40%" })}>NAME</td>
              <td style={th()}>NATIONALITY</td>
              <td colSpan={2} style={th({ textAlign: "right" })}>SHARES</td>
              <td colSpan={2} style={th({ textAlign: "right" })}>%</td>
            </tr>
            {gis.shareholders.map((s, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
                <td style={td({ fontWeight: "bold" })}>{s.name}</td>
                <td style={td()}>{s.nationality}</td>
                <td colSpan={2} style={td({ textAlign: "right" })}>{s.shares}</td>
                <td colSpan={2} style={td({ textAlign: "right" })}>{s.pct}</td>
              </tr>
            ))}
          </>}
        </T>
      )}

      {/* ── NFIS ── */}
      {nfis.length > 0 && <DelinquencyBlock label="NFIS" subjects={nfis} />}

      {/* ── CIC ── */}
      {cic.length > 0 && <DelinquencyBlock label="CIC" subjects={cic} />}

      {/* ── CRIF ── */}
      <T mb={6}>
        {/* CRIF header */}
        <tr>
          <td colSpan={3} style={td({ background: SEC, color: "#fff", fontWeight: "bold", fontSize: "8pt", textTransform: "uppercase" })}>
            CRIF RPT — {crif.company}
          </td>
          <td style={td({ background: SEC, color: "#fff", fontWeight: "bold", fontSize: "7pt", textAlign: "center" })}>
            ISSUED: {(crif.issued || "").toUpperCase()}
          </td>
          <td style={td({ background: SEC, color: "#fff", fontWeight: "bold", fontSize: "7pt", textAlign: "center" })}>
            LITIGATION
          </td>
          <td style={td({ background: SEC, color: "#fff", fontWeight: "bold", fontSize: "8pt", textAlign: "center", textTransform: "uppercase" })}>
            {crif.litigation || "N/A"}
          </td>
        </tr>
        {/* Row 1 */}
        <tr>
          <td style={th()}>SEC REG NO.</td>
          <td style={td()}>{crif.secReg}</td>
          <td style={th()}>LEGAL FORM</td>
          <td style={td()}>{crif.legalForm}</td>
          <td style={th()}>STATUS</td>
          <td style={td({ fontWeight: "bold", color: /active/i.test(crif.status) ? "#1E8449" : "#C0392B" })}>{crif.status}</td>
        </tr>
        {/* Row 2 */}
        <tr>
          <td style={th()}>TIN</td>
          <td style={td()}>{crif.tin}</td>
          <td style={th()}>PAID-UP CAPITAL</td>
          <td style={td()}>{crif.paidUpCapital}</td>
          <td style={th()}>EMPLOYEES</td>
          <td style={td()}>{crif.employees}</td>
        </tr>
        {/* Row 3 */}
        <tr>
          <td style={th()}>LINE OF BUSINESS</td>
          <td colSpan={3} style={td()}>{crif.lineOfBusiness}</td>
          <td style={th()}>ACTIVITY START</td>
          <td style={td()}>{crif.activityStart}</td>
        </tr>
        {/* Row 4 */}
        <tr>
          <td style={th()}>PRINCIPAL</td>
          <td colSpan={5} style={td()}>{crif.principal}</td>
        </tr>
        {/* Financials */}
        <tr>
          <td colSpan={6} style={darkHdr({ textAlign: "center" })}>
            2024 FINANCIAL HIGHLIGHTS (SOURCE: CRIF / 2024 FS)
          </td>
        </tr>
        <tr>
          {(crif.fin2024?.length ? crif.fin2024.slice(0, 3) : []).flatMap((f, i) => [
            <td key={`l${i}`} style={th()}>{f.label?.toUpperCase()}</td>,
            <td key={`v${i}`} style={td({ fontWeight: "bold" })}>{f.val}</td>,
          ])}
          {Array(Math.max(0, 3 - (crif.fin2024?.length || 0))).fill(null).flatMap((_, i) => [
            <td key={`el${i}`} style={th()} />,
            <td key={`ev${i}`} style={td()} />,
          ])}
        </tr>
        {/* Shareholders */}
        <tr>
          <td colSpan={6} style={darkHdr({ textAlign: "center" })}>
            SHAREHOLDERS &amp; OFFICERS | GIS (SEC) vs. CRIF
          </td>
        </tr>
        <tr>
          <td style={th()}>NAME</td>
          <td style={th()}>GIS TITLE / BOARD ROLE</td>
          <td style={th()}>CRIF TITLE</td>
          <td style={th({ textAlign: "right" })}>SHARES (PHP)</td>
          <td style={th({ textAlign: "right" })}>% (GIS)</td>
          <td style={th()}>TIN</td>
        </tr>
        {(crif.shareholders || []).map((s, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
            <td style={td({ fontWeight: "bold" })}>{s.name}</td>
            <td style={td()}>{s.gisRole}</td>
            <td style={td()}>{s.crifRole}</td>
            <td style={td({ textAlign: "right" })}>{s.shares}</td>
            <td style={td({ textAlign: "right" })}>{s.pct}</td>
            <td style={td()}>{s.tin}</td>
          </tr>
        ))}
      </T>

      {/* ── Three-way match ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "16%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "19%" }} />
          <col style={{ width: "27%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={5} style={darkHdr({ textAlign: "center", fontSize: "8pt" })}>
              THREE-WAY DATA MATCH CHECK — GIS (SEC) vs. CRIF vs. CBR TEMPLATE
            </td>
          </tr>
          <tr>
            <td style={th()}>DATA POINT</td>
            <td style={th()}>GIS / SEC FILING</td>
            <td style={th()}>CRIF REPORT</td>
            <td style={th()}>CBR TEMPLATE</td>
            <td style={th()}>VERDICT</td>
          </tr>
          {threeWay.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
              <td style={td({ fontWeight: "bold" })}>{r.dp}</td>
              <td style={td()}>{r.gis}</td>
              <td style={td()}>{r.crif}</td>
              <td style={td()}>{r.cbr}</td>
              <td style={{ ...td(), ...verdictColor(r.verdict) }}>{r.verdict}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Namescan ── */}
      {/* colgroup pins widths so the CONCLSN column never overflows regardless of text length */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "9%"  }} />
          <col style={{ width: "9%"  }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "24%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td colSpan={6} style={darkHdr({ textAlign: "center" })}>
              NAMESCAN (Namescan.io — Emerald Dataset)
            </td>
          </tr>
          <tr>
            <td style={th()}>SUBJECT</td>
            <td style={th()}>SCAN ID</td>
            <td style={th()}>DATE</td>
            <td style={th()}>SANCTIONS / PEP</td>
            <td style={th()}>ADVERSE MEDIA</td>
            <td style={th()}>CONCLSN</td>
          </tr>
          {namescan.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
              <td style={td({ fontWeight: "bold" })}>{r.subject}</td>
              <td style={td()}>{r.scanId}</td>
              <td style={td()}>{r.date}</td>
              <td style={td()}>{r.sanctionsPep}</td>
              <td style={td()}>{r.adverse}</td>
              <td style={{ ...td(), ...verdictColor(r.verdict) }}>{r.verdict}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Adverse media detail ── */}
      {adverseMedia?.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 6, tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "38%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "32%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td colSpan={4} style={darkHdr({ textAlign: "center" })}>
                ■ ADVERSE MEDIA DETAIL — {meta.borrower} (requires borrower clarification)
              </td>
            </tr>
            <tr>
              <td style={th()}>SOURCE</td>
              <td style={th()}>FINDING</td>
              <td style={th()}>DATE</td>
              <td style={th()}>ASSESSMENT</td>
            </tr>
            {adverseMedia.map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : ALT }}>
                <td style={td()}>{a.source}</td>
                <td style={td()}>{a.finding}</td>
                <td style={td()}>{a.date}</td>
                <td style={{ ...td(), ...verdictColor(a.assessment) }}>{a.assessment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ══════════════════ PAGE 2 ══════════════════════════════════════════════ */}
      <div style={{ pageBreakBefore: "always" }} />

      {/* ── Summary / Action Plan / Rationale ── */}
      <T mb={0}>
        <tr>
          <td style={darkHdr({ textAlign: "center", width: "33.3%" })}>SUMMARY FINDINGS</td>
          <td style={darkHdr({ textAlign: "center", width: "33.3%" })}>SUMMARY OF ACTION PLAN</td>
          <td style={darkHdr({ textAlign: "center", width: "33.3%" })}>RATIONALE</td>
        </tr>
        <tr>
          <td style={td({ verticalAlign: "top", fontSize: "7pt", padding: "6px 8px" })}>
            {meta.riskRating > 0 && (
              <div style={{ fontWeight: "bold", marginBottom: 5, fontSize: "7.5pt" }}>
                RISK RATING: {meta.riskRating}/5 – {meta.riskTier} {meta.riskLine}
              </div>
            )}
            {summaryFindings.map((s, i) => (
              <div key={i} style={{ marginBottom: 4, textAlign: "justify" }}>{s}</div>
            ))}
          </td>
          <td style={td({ verticalAlign: "top", fontSize: "7pt", padding: "6px 8px" })}>
            {actionPlan.map((a, i) => (
              <div key={i} style={{ marginBottom: 4, textAlign: "justify" }}>{a}</div>
            ))}
          </td>
          <td style={td({ verticalAlign: "top", fontSize: "7pt", padding: "6px 8px" })}>
            {rationale.map((r, i) => (
              <div key={i} style={{ marginBottom: 3 }}>• {r}</div>
            ))}
          </td>
        </tr>
      </T>

      {/* ── Follow-up results ── */}
      <T mb={0}>
        <tr>
          <td colSpan={3} style={darkHdr({ textAlign: "center" })}>FOLLOW-UP RESULTS</td>
        </tr>
        <tr>
          <td colSpan={3} style={td({ padding: "8px", fontSize: "7pt", fontStyle: "italic", color: "#666" })}>
            (Pending borrower response)
          </td>
        </tr>
      </T>

      {/* ── Sign-off — matches template: label / signature line / name / title ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0, tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "33.33%" }} />
          <col style={{ width: "33.33%" }} />
          <col style={{ width: "33.34%" }} />
        </colgroup>
        <tbody>
          {/* Row 1 — Role labels */}
          <tr>
            {(signoff.length ? signoff : [{role:"Prepared by"},{role:"Follow-up by"},{role:"Approved by"}]).map((s, i) => (
              <td key={i} style={td({ fontWeight: "bold", fontSize: "7pt", textTransform: "uppercase", letterSpacing: ".06em", paddingBottom: "20px", textAlign: "center", border: "none" })}>
                {(s.role || "").toUpperCase()}:
              </td>
            ))}
          </tr>
          {/* Row 2 — Signature line */}
          <tr>
            {(signoff.length ? signoff : [{},{},{}]).map((s, i) => (
              <td key={i} style={{ padding: "0 20px", border: "none" }}>
                <div style={{ borderBottom: "1px solid #1B2631", height: 1, marginBottom: 4 }} />
              </td>
            ))}
          </tr>
          {/* Row 3 — Name + Title */}
          <tr>
            {(signoff.length ? signoff : [{},{},{}]).map((s, i) => (
              <td key={i} style={td({ textAlign: "center", paddingTop: "4px", border: "none" })}>
                {s.who && (
                  <div style={{ fontWeight: "bold", fontSize: "7.5pt", textTransform: "uppercase" }}>
                    {s.who}
                  </div>
                )}
                {s.title && (
                  <div style={{ fontSize: "6.5pt", textTransform: "uppercase", color: "#444", marginTop: 1 }}>
                    {s.title}
                  </div>
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* ══════════════════ PAGE 3 ══════════════════════════════════════════════ */}
      <div style={{ pageBreakBefore: "always" }} />

      {/* ── Section 2 title bar ── */}
      <div style={{ background: HDR, color: "#fff", textAlign: "center", padding: "5px 8px", fontWeight: "bold", fontSize: "8.5pt", textTransform: "uppercase", marginBottom: 6, letterSpacing: ".05em" }}>
        SECTION 2 — CREDIT BUREAU REPORT CREDIT SUMMARY / ALL REPORTED FACILITIES
      </div>

      <FacilityTable label="INSTALLMENTS"    rows={installs}    amtKey="amount" />
      <FacilityTable label="NON-INSTALLMENTS" rows={nonInstalls} amtKey="limit"  />
      <FacilityTable label="CREDIT CARDS"    rows={cards}       amtKey="limit"  />

    </div>
  );
}
