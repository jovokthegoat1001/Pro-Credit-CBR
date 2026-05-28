// Report screen
const { useState: useStateR } = React;

function Badge({ kind, children }) {
  return <span className={`badge ${kind || ""}`}>{children}</span>;
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
          <div className="meta-cell">
            <div className="meta-label">Legal name</div>
            <div className="meta-val">{crif.company}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">SEC Reg</div>
            <div className="meta-val mono">{crif.secReg}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">TIN</div>
            <div className="meta-val mono">{crif.tin}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Status</div>
            <div className="meta-val">{crif.status}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Line of business</div>
            <div className="meta-val" style={{ fontSize: 13 }}>{crif.lineOfBusiness}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Principal</div>
            <div className="meta-val" style={{ fontSize: 13 }}>{crif.principal}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Activity start</div>
            <div className="meta-val mono">{crif.activityStart}</div>
          </div>
          <div className="meta-cell">
            <div className="meta-label">Employees</div>
            <div className="meta-val mono">{crif.employees}</div>
          </div>
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>2024 Financial highlights</div>
        <div className="meta-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 18 }}>
          {crif.fin2024.map((f, i) => (
            <div key={i} className={`meta-cell ${i === 0 ? "cool" : i === 1 ? "pos" : ""}`}>
              <div className="meta-label">{f.label}</div>
              <div className="meta-val mono" style={{ fontSize: 18, color: i === 0 ? "var(--brand-blue-deep)" : i === 1 ? "var(--brand-green-deep)" : "var(--ink)" }}>{f.val}</div>
            </div>
          ))}
        </div>

        <div className="eyebrow" style={{ marginBottom: 10 }}>Shareholders &amp; officers · GIS vs CRIF</div>
        <div className="card" style={{ boxShadow: "none" }}>
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>GIS title / board role</th>
                <th>CRIF title</th>
                <th className="num-cell">Shares (PHP)</th>
                <th className="num-cell">%</th>
                <th>TIN</th>
              </tr>
            </thead>
            <tbody>
              {crif.shareholders.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{s.name}</td>
                  <td>{s.gisRole}</td>
                  <td>{s.crifRole}</td>
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
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Data point</th>
            <th>GIS / SEC filing</th>
            <th>CRIF report</th>
            <th>CBR template</th>
            <th style={{ width: "14%" }}>Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{r.dp}</td>
              <td>{r.gis}</td>
              <td>{r.crif}</td>
              <td>{r.cbr}</td>
              <td><Badge kind={r.verdictType}>{r.verdict}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
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

      <table className="data">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Scan ID</th>
            <th>Date</th>
            <th>Sanctions / PEP</th>
            <th>Adverse media</th>
            <th style={{ width: "18%" }}>Conclusion</th>
          </tr>
        </thead>
        <tbody>
          {namescan.map((r, i) => (
            <tr key={i}>
              <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{r.subject}</td>
              <td>{r.scanId}</td>
              <td>{r.date}</td>
              <td>{r.sanctionsPep}</td>
              <td>{r.adverse}</td>
              <td><Badge kind={r.verdictType}>{r.verdict}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="card-pad" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Adverse media detail · requires borrower clarification</div>
        <table className="data" style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
          <thead>
            <tr>
              <th>Source</th>
              <th style={{ width: "44%" }}>Finding</th>
              <th>Date</th>
              <th style={{ width: "22%" }}>Assessment</th>
            </tr>
          </thead>
          <tbody>
            {adverseMedia.map((a, i) => (
              <tr key={i}>
                <td>{a.source}</td>
                <td>{a.finding}</td>
                <td>{a.date}</td>
                <td><Badge kind={a.assessmentType}>{a.assessment}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacilitiesSection({ facilities }) {
  const [tab, setTab] = useStateR("installments");
  const isInst = tab === "installments";
  const isCC = tab === "creditCards";
  const isNon = tab === "nonInstallments";

  const rows = facilities[tab];
  const headLimitLabel = isInst ? "Financed amt" : "Credit limit";

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title"><span className="num">02</span>All reported facilities</div>
        <div className="spacer"></div>
        <span className="muted small">{rows.length} accounts</span>
      </div>

      <div style={{ padding: "12px 22px 0" }}>
        <div className="tabs">
          <button className={`tab${isInst ? " active" : ""}`} onClick={() => setTab("installments")}>
            Installments · {facilities.installments.length}
          </button>
          <button className={`tab${isNon ? " active" : ""}`} onClick={() => setTab("nonInstallments")}>
            Non-installments · {facilities.nonInstallments.length}
          </button>
          <button className={`tab${isCC ? " active" : ""}`} onClick={() => setTab("creditCards")}>
            Credit cards · {facilities.creditCards.length}
          </button>
        </div>
      </div>

      <table className="data">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Lender</th>
            <th>Contract</th>
            <th className="num-cell">{headLimitLabel}</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            <th>Settled</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const tone =
              r.status === "CURRENT" ? "green" :
              r.status?.startsWith("CLOSED") ? "slate" :
              r.status === "PAST DUE" ? "red" : "slate";
            return (
              <tr key={i}>
                <td style={{ fontFamily: "Source Sans 3, sans-serif", fontWeight: 600 }}>{r.subject}</td>
                <td>{r.lender}</td>
                <td>{r.contract}</td>
                <td className="num-cell">{r.amount || r.limit}</td>
                <td>{r.start}</td>
                <td>{r.end}</td>
                <td><Badge kind={tone}>{r.status}</Badge></td>
                <td>{r.settled}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RiskHero({ meta, rationale }) {
  return (
    <div className="card risk-hero">
      <div className="risk-block">
        <div>
          <div className="risk-label">Risk rating</div>
          <div className="risk-score">{meta.riskRating}<span className="denom">/ 5</span></div>
        </div>
        <div className="risk-tier">{meta.riskTier}</div>
      </div>
      <div className="risk-text">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Rationale</div>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
          {rationale.map((r, i) => (
            <li key={i} style={{ padding: "6px 0", borderBottom: i < rationale.length - 1 ? "1px dashed var(--line)" : "0", fontSize: 13.5, color: "var(--ink-2)" }}>
              <span style={{ color: "var(--red)", marginRight: 8 }}>▸</span>{r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReportScreen({ data, onBack }) {
  // Build summary stats
  const totalAccounts =
    data.facilities.installments.length +
    data.facilities.nonInstallments.length +
    data.facilities.creditCards.length;
  const pastDue = [...data.cic].flatMap(g => g.items).filter(i => i.conclusion === "PAST DUE").length;
  const adverseHits = data.adverseMedia.filter(a => a.assessmentType === "red").length;

  return (
    <div className="page">
      <div className="hstack" style={{ marginBottom: 18 }}>
        <button className="btn ghost" onClick={onBack}>← Back to upload</button>
        <div className="spacer"></div>
        <button className="btn subtle" onClick={() => window.print()}>Export PDF</button>
        <button className="btn subtle" onClick={() => {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "cbr-report.json"; a.click();
          URL.revokeObjectURL(url);
        }}>Download JSON</button>
        <button className="btn green">Send to Credit Ops →</button>
      </div>

      {/* Borrower header */}
      <div className="card card-pad accent" style={{ marginBottom: 24 }}>
        <div className="hstack" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">Borrower</div>
            <h1 style={{ fontSize: 32, margin: "6px 0 4px" }}>{data.meta.borrower}</h1>
            <div className="muted small">Report date · {data.meta.reportDate}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="eyebrow">Est. annual revenue</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: "var(--brand-blue)" }}>{data.meta.estAnnRev}</div>
          </div>
        </div>

        <hr className="soft" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <div>
            <div className="stat-label">Total accounts</div>
            <div className="stat-val brand">{totalAccounts}</div>
          </div>
          <div>
            <div className="stat-label">Past-due (CIC)</div>
            <div className="stat-val" style={{ color: "var(--red)" }}>{pastDue}</div>
          </div>
          <div>
            <div className="stat-label">Adverse media hits</div>
            <div className="stat-val" style={{ color: "var(--red)" }}>{adverseHits}</div>
          </div>
          <div>
            <div className="stat-label">Litigation (CRIF)</div>
            <div className="stat-val pos">{data.crif.litigation}</div>
          </div>
        </div>
      </div>

      {/* Risk hero */}
      <RiskHero meta={data.meta} rationale={data.rationale} />

      {/* Summary findings + action plan */}
      <div className="section">
        <div className="section-head">
          <span className="section-num">Summary</span>
          <h2 className="section-title">Findings, action plan &amp; rationale</h2>
        </div>
        <div className="tri">
          <div>
            <h4>Summary findings</h4>
            <ul>
              {data.summaryFindings.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4>Action plan</h4>
            <ul>
              {data.actionPlan.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <h4>Follow-up</h4>
            <ul>
              <li className="muted" style={{ fontStyle: "italic" }}>Pending borrower response.</li>
            </ul>
            <hr className="soft" />
            <h4>Sign-off</h4>
            <div style={{ display: "grid", gap: 12 }}>
              {data.signoff.map((s, i) => (
                <div key={i}>
                  <div className="stat-label">{s.role}</div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{s.who}</div>
                  <div className="muted small">{s.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <div className="section">
        <div className="section-head">
          <span className="section-num">Section 01</span>
          <h2 className="section-title">Credit bureau review &amp; delinquency history</h2>
        </div>

        <div className="row-gap-22">
          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="num">NFIS</span>Negative files</div>
              <div className="spacer"></div>
              <span className="muted small">2 subjects · 4 entries</span>
            </div>
            <SubjectTable rows={data.nfis} />
          </div>

          <div className="card">
            <div className="card-head">
              <div className="card-title"><span className="num">CIC</span>Credit Information Corporation</div>
              <div className="spacer"></div>
              <span className="muted small">3 subjects · {data.cic.reduce((a, g) => a + g.items.length, 0)} entries</span>
            </div>
            <SubjectTable rows={data.cic} />
          </div>

          <CrifSection crif={data.crif} />

          <ThreeWayTable rows={data.threeWay} />

          <NamescanSection namescan={data.namescan} adverseMedia={data.adverseMedia} />
        </div>
      </div>

      {/* Section 2 */}
      <div className="section">
        <div className="section-head">
          <span className="section-num">Section 02</span>
          <h2 className="section-title">All reported facilities</h2>
        </div>
        <FacilitiesSection facilities={data.facilities} />
      </div>
    </div>
  );
}

window.ReportScreen = ReportScreen;
