import React, { useState as useStateR, useEffect as useEffectR } from "react";
import PrintView from "./PrintView.jsx";

// ── Shared components (unchanged) ────────────────────────────────────────────

function Badge({ kind, children, wrap }) {
  return (
    <span
      className={`badge ${kind || ""}`}
      style={wrap ? { whiteSpace: "normal", lineHeight: 1.45, textTransform: "none" } : undefined}
    >
      {children}
    </span>
  );
}

function SubjectTable({ rows }) {
  return (
    <table className="data">
      <thead>
        <tr>
          <th style={{ width: "26%" }}>Provider</th>
          <th style={{ width: "16%" }} className="num-cell">Prin. / PDO amt</th>
          <th>DPD / Remarks</th>
          <th style={{ width: "14%" }}>Conclusion</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((g, gi) => (
          <React.Fragment key={gi}>
            <tr className="subject-row">
              <td colSpan="4">
                {g.name} <span className="muted" style={{ fontWeight: 400 }}>· {g.role}</span>
                <Badge kind={g.hit ? "amber" : "green"}>HIT: {g.hit ? "TRUE" : "FALSE"}</Badge>
              </td>
            </tr>
            {g.items.map((r, ri) => (
              <tr key={ri}>
                <td>{r.provider}</td>
                <td className="num-cell">{r.amount}</td>
                <td>{r.remarks}</td>
                <td><Badge kind={r.conclusionType}>{r.conclusion}</Badge></td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function GisSection({ gis }) {
  if (!gis) return null;
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="num">GIS</span>SEC General Information Sheet</div>
        <div className="spacer"></div>
        {gis.issueDate && <span className="pill mono">Filed {gis.issueDate}</span>}
      </div>
      <div className="card-pad">
        <div className="meta-grid" style={{ marginBottom: 16 }}>
          {[
            { label: "Legal name",         val: gis.company },
            { label: "SEC Reg",            val: gis.secReg,           mono: true },
            { label: "TIN",                val: gis.tin,              mono: true },
            { label: "Paid-up Capital",    val: gis.paidUpCapital },
            { label: "Authorized Capital", val: gis.authorizedCapital },
            { label: "Subscribed Capital", val: gis.subscribedCapital },
            { label: "Line of Business",   val: gis.lineOfBusiness,   small: true },
            { label: "Address",            val: gis.address,          small: true },
          ].map((f, i) => (
            <div key={i} className="meta-cell">
              <div className="meta-label">{f.label}</div>
              <div className={`meta-val${f.mono ? " mono" : ""}`} style={f.small ? { fontSize: 13 } : {}}>{f.val || "—"}</div>
            </div>
          ))}
        </div>

        {gis.officers?.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Officers &amp; Directors</div>
            <table className="data" style={{ marginBottom: 16 }}>
              <thead><tr><th>Name</th><th>Title / Role</th></tr></thead>
              <tbody>
                {gis.officers.map((o, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{o.name}</td>
                    <td>{o.title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {gis.shareholders?.length > 0 && (
          <>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Shareholders</div>
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th><th>Nationality</th>
                  <th className="num-cell">Shares</th><th className="num-cell">%</th>
                </tr>
              </thead>
              <tbody>
                {gis.shareholders.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{s.name}</td>
                    <td>{s.nationality}</td>
                    <td className="num-cell">{s.shares}</td>
                    <td className="num-cell">{s.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

function CrifSection({ crif }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="num">CRIF</span>Corporate dossier</div>
        <div className="spacer"></div>
        <Badge kind="green">LITIGATION: {crif.litigation}</Badge>
        <span className="pill mono">Issued {crif.issued}</span>
      </div>
      <div className="card-pad">
        <div className="meta-grid" style={{ marginBottom: 18 }}>
          {[
            { label: "Legal name",       val: crif.company,          mono: false },
            { label: "SEC Reg",           val: crif.secReg,           mono: true  },
            { label: "TIN",               val: crif.tin,              mono: true  },
            { label: "Status",            val: crif.status,           mono: false },
            { label: "Line of business",  val: crif.lineOfBusiness,   mono: false, small: true },
            { label: "Principal",         val: crif.principal,        mono: false, small: true },
            { label: "Activity start",    val: crif.activityStart,    mono: true  },
            { label: "Employees",         val: crif.employees,        mono: true  },
          ].map((f, i) => (
            <div key={i} className="meta-cell">
              <div className="meta-label">{f.label}</div>
              <div className={`meta-val${f.mono ? " mono" : ""}${f.small ? "" : ""}`}
                   style={f.small ? { fontSize: 13 } : {}}>{f.val}</div>
            </div>
          ))}
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>2024 Financial highlights</div>
        <div className="meta-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}>
          {(crif.fin2024 || []).map((f, i) => (
            <div key={i} className={`meta-cell ${i === 0 ? "cool" : i === 1 ? "pos" : ""}`}>
              <div className="meta-label">{f.label}</div>
              <div className="meta-val mono" style={{
                fontSize: 18,
                color: i === 0 ? "var(--brand-blue-deep)" : i === 1 ? "var(--brand-green-deep)" : "var(--ink)"
              }}>{f.val}</div>
            </div>
          ))}
        </div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Shareholders &amp; officers · GIS vs CRIF</div>
        <div className="card" style={{ boxShadow: "none" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th><th>GIS title / board role</th><th>CRIF title</th>
                <th className="num-cell">Shares (PHP)</th><th className="num-cell">%</th><th>TIN</th>
              </tr>
            </thead>
            <tbody>
              {(crif.shareholders || []).map((s, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{s.name}</td>
                  <td>{s.gisRole}</td><td>{s.crifRole}</td>
                  <td className="num-cell">{s.shares}</td>
                  <td className="num-cell">{s.pct}</td>
                  <td>{s.tin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ThreeWayTable({ rows }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="num">Δ</span>Three-way data match · GIS vs CRIF vs CBR</div>
        <div className="spacer"></div>
        <span className="muted small">{rows.length} data point{rows.length !== 1 ? "s" : ""}</span>
      </div>
      {rows.length === 0 ? (
        <div className="card-pad" style={{ color: "var(--muted)", fontSize: 13 }}>
          No reconciliation data generated.
          <span style={{ display: "block", marginTop: 4, fontSize: 12 }}>
            This table is built by the summary step — it requires at least a CRIF document.
            If documents were uploaded and this is still empty, check the browser console for
            <code style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, margin: "0 4px" }}>[claudeJSON]</code>
            errors (usually a failed API call or malformed JSON response).
          </span>
        </div>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>Data point</th>
              <th style={{ width: "17%" }}>GIS / SEC filing</th>
              <th style={{ width: "17%" }}>CRIF report</th>
              <th style={{ width: "17%" }}>CBR template</th>
              <th style={{ width: "34%" }}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{r.dp}</td>
                <td>{r.gis}</td><td>{r.crif}</td><td>{r.cbr}</td>
                <td><Badge kind={r.verdictType} wrap>{r.verdict}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function NamescanSection({ namescan, adverseMedia }) {
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="num">NS</span>Namescan · sanctions / PEP / adverse media</div>
        <div className="spacer"></div>
        <span className="muted small">Source: Namescan.io — Emerald Dataset</span>
      </div>
      {namescan.length === 0 ? (
        <div className="card-pad" style={{ color: "var(--muted)", fontSize: 13 }}>
          No Namescan data extracted.
          <span style={{ display: "block", marginTop: 4, fontSize: 12 }}>
            Upload a Namescan.io Emerald screening PDF in the Namescan slot to populate this section.
          </span>
        </div>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th style={{ width: "22%" }}>Subject</th><th style={{ width: "9%" }}>Scan ID</th><th style={{ width: "9%" }}>Date</th>
              <th style={{ width: "14%" }}>Sanctions / PEP</th><th style={{ width: "22%" }}>Adverse media</th><th style={{ width: "24%" }}>Conclusion</th>
            </tr>
          </thead>
          <tbody>
            {namescan.map((r, i) => (
              <tr key={i}>
                <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{r.subject}</td>
                <td>{r.scanId}</td><td>{r.date}</td><td>{r.sanctionsPep}</td><td>{r.adverse}</td>
                <td><Badge kind={r.verdictType} wrap>{r.verdict}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {adverseMedia?.length > 0 && (
        <div className="card-pad" style={{ borderTop: "1px solid var(--line)" }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Adverse media detail · requires borrower clarification</div>
          <table className="data" style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", tableLayout: "fixed", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "20%" }}>Source</th>
                <th style={{ width: "38%" }}>Finding</th>
                <th style={{ width: "10%" }}>Date</th>
                <th style={{ width: "32%" }}>Assessment</th>
              </tr>
            </thead>
            <tbody>
              {adverseMedia.map((a, i) => (
                <tr key={i}>
                  <td>{a.source}</td><td>{a.finding}</td><td>{a.date}</td>
                  <td><Badge kind={a.assessmentType} wrap>{a.assessment}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const FACILITY_TABS = [
  { id: "installments",    label: "Installments",     amtLabel: "Financed amt" },
  { id: "nonInstallments", label: "Non-installments", amtLabel: "Credit limit"  },
  { id: "creditCards",     label: "Credit cards",     amtLabel: "Credit limit"  },
];

function FacilitiesSection({ facilities }) {
  const [tab, setTab] = useStateR("installments");
  const total = FACILITY_TABS.reduce((n, t) => n + (facilities[t.id]?.length || 0), 0);

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="num">02</span>All reported facilities</div>
        <div className="spacer"></div>
        <span className="muted small">{total} accounts</span>
      </div>

      {/* Tab bar — hidden when printing */}
      <div style={{ padding: "12px 22px 0" }} className="no-print">
        <div className="tabs">
          {FACILITY_TABS.map((t) => (
            <button key={t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label} · {facilities[t.id]?.length || 0}
            </button>
          ))}
        </div>
      </div>

      {/* All three panels — only active shown on screen; ALL shown when printing */}
      {FACILITY_TABS.map((t) => {
        const rows = facilities[t.id] || [];
        return (
          <div key={t.id} className={tab !== t.id ? "facility-panel-hidden" : undefined}>
            {/* Section heading visible only in print */}
            <div className="facility-print-label">{t.label} ({rows.length})</div>

            {rows.length === 0 ? (
              <div className="card-pad" style={{ color: "var(--muted)", fontSize: 13, fontStyle: "italic" }}>
                No {t.label.toLowerCase()} found.
                {total === 0 && <span> Upload a CIC document to extract facility data.</span>}
              </div>
            ) : (
              <table className="data">
                <thead>
                  <tr>
                    <th>Subject</th><th>Lender</th><th>Contract</th>
                    <th className="num-cell">{t.amtLabel}</th>
                    <th>Start</th><th>End</th><th>Status</th><th>Settled</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const tone =
                      r.status === "CURRENT"         ? "green" :
                      r.status?.startsWith("CLOSED") ? "slate" :
                      r.status === "PAST DUE"        ? "red"   : "slate";
                    return (
                      <tr key={i}>
                        <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{r.subject}</td>
                        <td>{r.lender}</td><td>{r.contract}</td>
                        <td className="num-cell">{r.amount || r.limit}</td>
                        <td>{r.start}</td><td>{r.end}</td>
                        <td><Badge kind={tone}>{r.status}</Badge></td>
                        <td>{r.settled}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RiskHero({ meta, rationale }) {
  const rated     = meta.riskRating > 0;
  const riskColor =
    meta.riskRating >= 4 ? "var(--red)"   :
    meta.riskRating >= 3 ? "var(--amber)" :
    meta.riskRating >= 1 ? "var(--green)" : "var(--muted)";

  return (
    <div className="card risk-hero">
      {/* Left dark panel — score + tier */}
      <div className="risk-block">
        <div>
          <div className="risk-label">Risk rating</div>
          <div className="risk-score" style={{ color: rated ? undefined : "rgba(255,255,255,0.3)" }}>
            {rated ? meta.riskRating : "—"}<span className="denom">/ 5</span>
          </div>
        </div>
        <div className="risk-tier" style={{ color: rated ? undefined : "rgba(255,255,255,0.35)" }}>
          {meta.riskTier || "PENDING"}
        </div>
      </div>

      {/* Right panel — risk line + rationale */}
      <div className="risk-text">
        {meta.riskLine && (
          <div style={{
            fontSize: 13.5, fontWeight: 600, color: riskColor,
            marginBottom: 14, paddingBottom: 12, borderBottom: "1px dashed var(--line)",
          }}>
            {meta.riskLine}
          </div>
        )}

        <div className="eyebrow" style={{ marginBottom: 8 }}>Rationale</div>

        {(rationale || []).length === 0 ? (
          <p className="muted small" style={{ fontStyle: "italic", margin: 0 }}>
            Rationale will appear here after extraction completes. Upload documents and click "Extract &amp; build report".
          </p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
            {rationale.map((r, i) => (
              <li key={i} style={{
                padding: "6px 0",
                borderBottom: i < rationale.length - 1 ? "1px dashed var(--line)" : "0",
                fontSize: 13.5, color: "var(--ink-2)",
              }}>
                <span style={{ color: riskColor, marginRight: 8 }}>▸</span>{r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Word export (HTML-to-Word — no external library needed) ──────────────────

async function generateWordDoc(data) {
  const e = (s) => String(s ?? "—").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

  const TH = `background:#2a75a8;color:#fff;padding:5pt 8pt;font-weight:bold;border:1px solid #aaa;font-size:8.5pt;text-align:left;`;
  const TD = `padding:4pt 8pt;border:1px solid #ccc;vertical-align:top;font-size:9pt;`;
  const TBL = `border-collapse:collapse;width:100%;margin-bottom:10pt;`;
  const H1S = `font-size:16pt;color:#2a75a8;border-bottom:2pt solid #2a75a8;padding-bottom:3pt;margin:16pt 0 6pt;font-family:Calibri,sans-serif;`;
  const H2S = `font-size:13pt;color:#1f5a83;margin:12pt 0 5pt;font-family:Calibri,sans-serif;`;
  const H3S = `font-size:11pt;color:#54616e;margin:9pt 0 4pt;font-family:Calibri,sans-serif;`;
  const PS  = `font-size:10pt;margin:0 0 5pt;font-family:Calibri,sans-serif;color:#2d3748;`;

  const tbl = (headers, rows) => {
    if (!rows?.length) return `<p style="${PS}color:#aaa;">(no data)</p>`;
    const hd = headers.map(h => `<th style="${TH}">${e(h)}</th>`).join("");
    const bd = rows.map(row =>
      `<tr>${row.map(c => `<td style="${TD}">${e(c)}</td>`).join("")}</tr>`
    ).join("");
    return `<table style="${TBL}"><thead><tr>${hd}</tr></thead><tbody>${bd}</tbody></table>`;
  };

  const riskColor = (data.meta?.riskRating || 0) >= 4 ? "#c0392b"
    : (data.meta?.riskRating || 0) >= 3 ? "#d35400" : "#27ae60";

  let b = "";

  // Title
  b += `<h1 style="font-size:22pt;color:#2a75a8;margin:0 0 3pt;font-family:Calibri,sans-serif;">CREDIT BUREAU REPORT</h1>`;
  b += `<p style="${PS}color:#6b7785;">ProCredit Financing Corp — Credit Ops · Internal Use Only</p>`;
  b += `<hr style="border:1px solid #e6eaef;margin:8pt 0;">`;

  // Borrower meta
  b += `<p style="${PS}"><b>Borrower:</b> ${e(data.meta.borrower)}</p>`;
  b += `<p style="${PS}"><b>Report Date:</b> ${e(data.meta.reportDate || "—")}</p>`;
  if (data.meta.estAnnRev) b += `<p style="${PS}"><b>Est. Annual Revenue:</b> ${e(data.meta.estAnnRev)}</p>`;

  // Risk
  b += `<p style="${PS}font-size:14pt;color:${riskColor};"><b>RISK RATING: ${e(data.meta.riskRating)}/5 — ${e(data.meta.riskTier)}</b></p>`;
  if (data.meta.riskLine) b += `<p style="${PS}font-style:italic;color:#54616e;">${e(data.meta.riskLine)}</p>`;

  if (data.rationale?.length) {
    b += `<h3 style="${H3S}">Risk Rationale</h3>`;
    b += `<ul style="${PS}">` + data.rationale.map(r => `<li>${e(r)}</li>`).join("") + `</ul>`;
  }
  if (data.summaryFindings?.length) {
    b += `<h2 style="${H2S}">SUMMARY FINDINGS</h2>`;
    data.summaryFindings.forEach(s => { b += `<p style="${PS}">${e(s)}</p>`; });
  }
  if (data.actionPlan?.length) {
    b += `<h2 style="${H2S}">ACTION PLAN</h2>`;
    b += `<ol style="${PS}">` + data.actionPlan.map(a => `<li style="margin-bottom:3pt;">${e(a)}</li>`).join("") + `</ol>`;
  }

  b += `<h1 style="${H1S}">SECTION 1 — CREDIT BUREAU REVIEW &amp; DELINQUENCY HISTORY</h1>`;

  // NFIS
  if (data.nfis?.length) {
    b += `<h2 style="${H2S}">NFIS — NEGATIVE FILES</h2>`;
    data.nfis.forEach(g => {
      b += `<p style="${PS}"><b>${e(g.name)} · ${e(g.role)} — HIT: ${g.hit ? "TRUE" : "FALSE"}</b></p>`;
      b += tbl(["Provider","Prin./PDO Amt","DPD / Remarks","Conclusion"],
        g.items.map(r => [r.provider, r.amount, r.remarks, r.conclusion]));
    });
  }

  // CIC
  if (data.cic?.length) {
    b += `<h2 style="${H2S}">CIC — CREDIT INFORMATION CORPORATION</h2>`;
    data.cic.forEach(g => {
      b += `<p style="${PS}"><b>${e(g.name)} · ${e(g.role)} — HIT: ${g.hit ? "TRUE" : "FALSE"}</b></p>`;
      b += tbl(["Provider","Prin./PDO Amt","DPD / Remarks","Conclusion"],
        g.items.map(r => [r.provider, r.amount, r.remarks, r.conclusion]));
    });
  }

  // CRIF
  if (data.crif) {
    const c = data.crif;
    b += `<h2 style="${H2S}">CRIF — CORPORATE DOSSIER</h2>`;
    b += `<p style="${PS}">Issued: ${e(c.issued)} &nbsp;·&nbsp; Litigation: ${e(c.litigation)}</p>`;
    b += tbl(["Field","Value"],[
      ["Legal Name",c.company],["SEC Registration",c.secReg],["TIN",c.tin],
      ["Legal Form",c.legalForm],["Status",c.status],["Line of Business",c.lineOfBusiness],
      ["Principal",c.principal],["Paid-up Capital",c.paidUpCapital],
      ["Employees",String(c.employees||"—")],["Activity Start",String(c.activityStart||"—")],
    ]);
    if (c.fin2024?.length) {
      b += `<h3 style="${H3S}">2024 Financial Highlights</h3>`;
      b += tbl(["Metric","Value"], c.fin2024.map(f => [f.label, f.val]));
    }
    if (c.shareholders?.length) {
      b += `<h3 style="${H3S}">Shareholders &amp; Officers — GIS vs CRIF</h3>`;
      b += tbl(["Name","GIS Role","CRIF Role","Shares (PHP)","%","TIN"],
        c.shareholders.map(s => [s.name, s.gisRole, s.crifRole, s.shares, s.pct, s.tin]));
    }
  }

  // Three-way
  if (data.threeWay?.length) {
    b += `<h2 style="${H2S}">THREE-WAY DATA MATCH — GIS vs CRIF vs CBR</h2>`;
    b += tbl(["Data Point","GIS / SEC Filing","CRIF Report","CBR Template","Verdict"],
      data.threeWay.map(r => [r.dp, r.gis, r.crif, r.cbr, r.verdict]));
  }

  // Namescan
  if (data.namescan?.length) {
    b += `<h2 style="${H2S}">NAMESCAN — SCREENING RESULTS</h2>`;
    b += tbl(["Subject","Scan ID","Date","Sanctions/PEP","Adverse Media","Verdict"],
      data.namescan.map(r => [r.subject, r.scanId, r.date, r.sanctionsPep, r.adverse, r.verdict]));
    if (data.adverseMedia?.length) {
      b += `<h3 style="${H3S}">Adverse Media Detail</h3>`;
      b += tbl(["Source","Finding","Date","Assessment"],
        data.adverseMedia.map(a => [a.source, a.finding, a.date, a.assessment]));
    }
  }

  b += `<h1 style="${H1S}">SECTION 2 — ALL REPORTED FACILITIES</h1>`;
  const FC    = ["Subject","Lender","Contract","Amount / Limit","Start","End","Status","Settled"];
  const EMPTY = `<p style="${PS}color:#aaa;font-style:italic;">(none extracted — upload a CIC document)</p>`;

  b += `<h2 style="${H2S}">INSTALLMENTS</h2>`;
  b += data.facilities?.installments?.length
    ? tbl(FC, data.facilities.installments.map(r => [r.subject, r.lender, r.contract, r.amount, r.start, r.end, r.status, r.settled]))
    : EMPTY;

  b += `<h2 style="${H2S}">NON-INSTALLMENTS / CREDIT LINES</h2>`;
  b += data.facilities?.nonInstallments?.length
    ? tbl(FC, data.facilities.nonInstallments.map(r => [r.subject, r.lender, r.contract, r.limit, r.start, r.end, r.status, r.settled]))
    : EMPTY;

  b += `<h2 style="${H2S}">CREDIT CARDS</h2>`;
  b += data.facilities?.creditCards?.length
    ? tbl(FC, data.facilities.creditCards.map(r => [r.subject, r.lender, r.contract, r.limit, r.start, r.end, r.status, r.settled]))
    : EMPTY;

  if (data.signoff?.length) {
    b += `<h2 style="${H2S}">SIGN-OFF</h2>`;
    b += tbl(data.signoff.map(s => s.role),
      [data.signoff.map(s => [s.who, s.title].filter(Boolean).join(" · ") || "—")]);
  }

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
  xmlns:w='urn:schemas-microsoft-com:office:word'
  xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'>
<style>body{font-family:Calibri,sans-serif;font-size:10pt;margin:1in;color:#2d3748;}
@page{margin:1in;}</style></head>
<body>${b}</body></html>`;

  return new Blob(["﻿" + html], { type: "application/msword;charset=utf-8" });
}

// ── PDF export (print dialog) ─────────────────────────────────────────────────

function triggerPrint() {
  window.print();
}

// ── Print styles injected once ────────────────────────────────────────────────

const PRINT_CSS = `
/* Screen: hide inactive facility panels and their section labels */
.facility-panel-hidden { display: none; }
.facility-print-label  { display: none; }

/* Screen: hide the print-only template view */
#print-view { display: none; }

@media print {
  @page { margin: 1cm; size: A4 portrait; }

  /* Hide everything on screen — show only the template */
  body > * { display: none !important; }
  #root     { display: block !important; }
  .topbar, .no-print, .screen-layout { display: none !important; }

  /* Show the template */
  #print-view { display: block !important; }

  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
}
`;

// Print CSS is injected inside ReportScreen via useEffect (not at module scope).

// ── ReportScreen ──────────────────────────────────────────────────────────────

function ReportScreen({ data, onBack }) {
  const [wordBusy, setWordBusy] = useStateR(false);
  const [wordErr, setWordErr]   = useStateR("");

  // Editable sign-off — initialized from extracted data, user can override
  const [signoffState, setSignoffState] = useStateR(() =>
    (data.signoff?.length ? data.signoff : [
      { role: "Prepared by",  who: "", title: "" },
      { role: "Follow-up by", who: "", title: "" },
      { role: "Approved by",  who: "", title: "" },
    ])
  );
  const updateSignoff = (i, field, val) =>
    setSignoffState((prev) => prev.map((s, j) => j === i ? { ...s, [field]: val } : s));

  // Inject print styles once when the report mounts (safe for HMR)
  useEffectR(() => {
    if (document.getElementById("cbr-print-css")) return;
    const s = document.createElement("style");
    s.id = "cbr-print-css";
    s.textContent = PRINT_CSS;
    document.head.appendChild(s);
    return () => {
      document.getElementById("cbr-print-css")?.remove();
    };
  }, []);

  const totalAccounts =
    (data.facilities?.installments?.length    || 0) +
    (data.facilities?.nonInstallments?.length || 0) +
    (data.facilities?.creditCards?.length     || 0);
  const pastDue = [
    ...(data.cic || []).flatMap(g => g.items || []).map(i => i.conclusion),
    ...(data.facilities?.installments    || []).map(r => r.status),
    ...(data.facilities?.nonInstallments || []).map(r => r.status),
    ...(data.facilities?.creditCards     || []).map(r => r.status),
  ].filter(v => /past.?due|w.?off/i.test(v || "")).length;
  const adverseHits  = (data.adverseMedia || []).filter(a => a.assessmentType === "red").length;

  const handleDownloadWord = async () => {
    setWordErr("");
    setWordBusy(true);
    try {
      const blob = await generateWordDoc(data);
      const name = `CBR_${(data.meta.borrower || "report").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}.docx`;
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Word export failed:", e);
      setWordErr("Word export failed — check console for details.");
    } finally {
      setWordBusy(false);
    }
  };

  const riskBorderColor =
    (data.meta?.riskRating || 0) >= 4 ? "var(--red)"   :
    (data.meta?.riskRating || 0) >= 3 ? "var(--amber)" : "var(--green)";

  return (
    <div className="page">

      {/* Template-exact print view — hidden on screen, shown when printing */}
      <PrintView data={{ ...data, signoff: signoffState }} />

      {/* ── Screen layout (hidden when printing) ── */}
      <div id="screen-layout" className="screen-layout">

      {/* ── Toolbar (hidden on print) */}
      <div className="no-print hstack" style={{ marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <button className="btn ghost" onClick={onBack}>← Back to upload</button>
        <div className="spacer"></div>
        {wordErr && <span style={{ color: "var(--red)", fontSize: 12 }}>{wordErr}</span>}
        <button className="btn subtle" onClick={triggerPrint} title="Opens browser print dialog — choose 'Save as PDF'">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
            <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2H5zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4V3zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2H5zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/>
          </svg>
          Download PDF
        </button>
        <button className="btn" onClick={handleDownloadWord} disabled={wordBusy} style={{ minWidth: 148 }}>
          {wordBusy ? (
            <><span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: 6 }}>⟳</span>Generating…</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 4 }}>
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>Download Word</>
          )}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Borrower header */}
      <div className="card card-pad accent" style={{ marginBottom: 20 }}>
        <div className="hstack" style={{ alignItems: "flex-start", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Borrower</div>
            <h1 style={{ fontSize: 28, margin: "6px 0 4px" }}>{data.meta.borrower}</h1>
            <div className="hstack" style={{ gap: 16, flexWrap: "wrap" }}>
              <span className="muted small">Report date · {data.meta.reportDate}</span>
              {data.crif?.secReg && <span className="muted small">SEC · {data.crif.secReg}</span>}
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div className="eyebrow">Est. annual revenue</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 600, marginTop: 4, color: "var(--brand-blue)" }}>
              {data.meta.estAnnRev || "—"}
            </div>
          </div>
        </div>

        <hr className="soft" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <div>
            <div className="stat-label">Risk rating</div>
            <div className="stat-val" style={{ color: data.meta.riskRating > 0 ? riskBorderColor : "var(--muted)", fontSize: 20 }}>
              {data.meta.riskRating > 0 ? `${data.meta.riskRating}/5` : "—"}
              {" "}<span style={{ fontSize: 13, fontWeight: 400 }}>{data.meta.riskTier || ""}</span>
            </div>
          </div>
          <div>
            <div className="stat-label">Total accounts</div>
            <div className="stat-val brand">{totalAccounts}</div>
          </div>
          <div>
            <div className="stat-label">Past-due (all)</div>
            <div className="stat-val" style={{ color: "var(--red)" }}>{pastDue}</div>
          </div>
          <div>
            <div className="stat-label">Adverse media</div>
            <div className="stat-val" style={{ color: adverseHits > 0 ? "var(--red)" : "var(--green)" }}>
              {adverseHits} {adverseHits === 0 ? "· CLEAR" : "· VERIFY"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Risk hero */}
      <RiskHero meta={data.meta} rationale={data.rationale} />

      {/* ── Findings / action plan / sign-off */}
      <div className="section">
        <div className="section-head">
          <span className="section-num">Summary</span>
          <h2 className="section-title">Findings, action plan &amp; rationale</h2>
        </div>
        <div className="tri">
          <div>
            <h4>Summary findings</h4>
            {(data.summaryFindings || []).length === 0 ? (
              <p className="muted small" style={{ fontStyle: "italic" }}>
                Upload documents and run extraction to generate findings.
              </p>
            ) : (
              <ul>{data.summaryFindings.map((s, i) => <li key={i}>{s}</li>)}</ul>
            )}
          </div>
          <div>
            <h4>Action plan</h4>
            {(data.actionPlan || []).length === 0 ? (
              <p className="muted small" style={{ fontStyle: "italic" }}>
                Action items will be generated after extraction.
              </p>
            ) : (
              <ul>{data.actionPlan.map((s, i) => <li key={i}>{s}</li>)}</ul>
            )}
          </div>
          <div>
            <h4>Follow-up results</h4>
            <ul>
              <li className="muted" style={{ fontStyle: "italic" }}>Pending borrower response.</li>
            </ul>
          </div>
        </div>

        {/* ── Sign-off — full-width, inputs for Prepared by + Follow-up by ── */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <div className="card-title" style={{ fontSize: 12 }}>Sign-off</div>
            <div className="spacer" />
            <span className="muted small">Prepared by and Follow-up by are editable</span>
          </div>
          <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {signoffState.map((s, i) => {
              const editable   = i < 2;
              const isApprover = i === 2;

              const APPROVERS = [
                { who: "Adnan Agha",      title: "Chief Executive Officer" },
                { who: "Dwaipayan Mitra", title: "Chief Lending Officer"   },
              ];

              // Current dropdown value: match by name, default to first option
              const approverValue = APPROVERS.findIndex((a) => a.who === s.who) >= 0
                ? s.who : APPROVERS[0].who;

              return (
                <div key={i} style={{
                  padding: "0 28px",
                  borderRight: i < 2 ? "1px solid var(--line)" : "none",
                }}>
                  {/* Role label */}
                  <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 500, marginBottom: 12 }}>
                    {s.role}
                  </div>

                  {/* Name — text input / dropdown / static */}
                  {editable ? (
                    <input
                      type="text"
                      placeholder="Name…"
                      value={s.who || ""}
                      onChange={(e) => updateSignoff(i, "who", e.target.value)}
                      style={{
                        width: "100%", fontWeight: 600, fontSize: 14,
                        background: "transparent", border: "none",
                        borderBottom: "1.5px solid var(--ink)", borderRadius: 0,
                        padding: "4px 0", outline: "none",
                      }}
                    />
                  ) : isApprover ? (
                    <select
                      value={approverValue}
                      onChange={(e) => {
                        const chosen = APPROVERS.find((a) => a.who === e.target.value);
                        if (chosen) {
                          setSignoffState((prev) => prev.map((x, j) =>
                            j === i ? { ...x, who: chosen.who, title: chosen.title } : x
                          ));
                        }
                      }}
                      style={{
                        width: "100%", fontWeight: 600, fontSize: 14,
                        background: "transparent",
                        border: "none", borderBottom: "1.5px solid var(--ink)", borderRadius: 0,
                        padding: "4px 0", outline: "none", cursor: "pointer",
                        appearance: "none", WebkitAppearance: "none",
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7785'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 2px center",
                        paddingRight: 18,
                      }}
                    >
                      {APPROVERS.map((a) => (
                        <option key={a.who} value={a.who}>{a.who}</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontWeight: 600, fontSize: 14, paddingBottom: 4, borderBottom: "1.5px solid var(--ink)" }}>
                      {s.who || "—"}
                    </div>
                  )}

                  {/* Title */}
                  {editable ? (
                    <input
                      type="text"
                      placeholder="Title / role…"
                      value={s.title || ""}
                      onChange={(e) => updateSignoff(i, "title", e.target.value)}
                      style={{
                        width: "100%", fontSize: 11,
                        fontFamily: "IBM Plex Mono, monospace",
                        background: "transparent", border: "none",
                        borderBottom: "1px dashed var(--line-2)", borderRadius: 0,
                        padding: "3px 0", marginTop: 6, outline: "none",
                        textTransform: "uppercase", color: "var(--muted)",
                        letterSpacing: "0.05em",
                      }}
                    />
                  ) : (
                    <div style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 11, textTransform: "uppercase", color: "var(--muted)", marginTop: 6 }}>
                      {s.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Section 1 */}
      <div className="section">
        <div className="section-head">
          <span className="section-num">Section 01</span>
          <h2 className="section-title">Credit bureau review &amp; delinquency history</h2>
        </div>
        <div className="row-gap-22">

          {/* NFIS */}
          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="num">NFIS</span>Negative files</div>
              <div className="spacer"></div>
              <span className="muted small">
                {(data.nfis || []).length} subject{(data.nfis || []).length !== 1 ? "s" : ""}
                {" · "}
                {(data.nfis || []).reduce((a, g) => a + (g.items?.length || 0), 0)} entries
              </span>
            </div>
            {(data.nfis || []).length
              ? <SubjectTable rows={data.nfis} />
              : <div className="card-pad muted small">No NFIS data extracted.</div>
            }
          </div>

          {/* CIC */}
          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="num">CIC</span>Credit Information Corporation</div>
              <div className="spacer"></div>
              <span className="muted small">
                {(data.cic || []).length} subject{(data.cic || []).length !== 1 ? "s" : ""}
                {" · "}
                {(data.cic || []).reduce((a, g) => a + (g.items?.length || 0), 0)} entries
              </span>
            </div>
            {(data.cic || []).length
              ? <SubjectTable rows={data.cic} />
              : <div className="card-pad muted small">No CIC summary data extracted.</div>
            }
          </div>

          <GisSection gis={data.gis} />
          <CrifSection crif={data.crif || {}} />
          <ThreeWayTable rows={data.threeWay || []} />
          <NamescanSection namescan={data.namescan || []} adverseMedia={data.adverseMedia || []} />
        </div>
      </div>

      {/* ── Section 2 */}
      <div className="section">
        <div className="section-head">
          <span className="section-num">Section 02</span>
          <h2 className="section-title">All reported facilities</h2>
        </div>
        <FacilitiesSection facilities={data.facilities || { installments: [], nonInstallments: [], creditCards: [] }} />
      </div>

      </div> {/* end #screen-layout */}
    </div>
  );
}

export default ReportScreen;
