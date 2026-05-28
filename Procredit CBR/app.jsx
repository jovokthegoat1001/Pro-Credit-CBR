// Main app — state machine + Claude API extraction
const { useState: useStateA, useEffect: useEffectA } = React;

function Buffer({ onStart, onDemo }) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
  const items = [
    { tag: "NFIS", title: "Negative files", desc: "Individual delinquency, write-offs, cancelled cards." },
    { tag: "CIC",  title: "Credit Information Corp.", desc: "Provider lines, DPD, balances, remarks." },
    { tag: "CRIF", title: "Corporate dossier", desc: "SEC reg, GIS, shareholders, financials, litigation." },
    { tag: "NS",   title: "Namescan", desc: "Sanctions, PEP and adverse-media screening." },
  ];
  return (
    <div className="buffer">
      <div className="buffer-inner">
        <img src="procredit-logo.png" alt="ProCredit Financing Corp" className="buffer-logo" />

        <div className="buffer-eyebrow"><span className="ping"></span>Credit Ops · CBR Builder v0.1</div>

        <h1 className="buffer-title">
          From four reports to one&nbsp;<em>Credit Bureau Report.</em>
        </h1>
        <p className="buffer-lede">
          Drop your NFIS, CIC, CRIF and Namescan files. ProCredit’s CBR Builder reads them,
          reconciles the data three ways, and assembles the signed-off report your team uses today.
        </p>

        <div className="buffer-cta">
          <button className="buffer-btn primary" onClick={onStart}>
            Start new report →
          </button>
          <button className="buffer-btn ghost" onClick={onDemo}>
            View sample (Project Duo)
          </button>
        </div>

        <div className="buffer-grid">
          {items.map((it) => (
            <div className="buffer-card" key={it.tag}>
              <div className="tag">{it.tag}</div>
              <h3>{it.title}</h3>
              <p>{it.desc}</p>
            </div>
          ))}
        </div>

        <div className="buffer-strip">
          <div className="hstack">
            <span className="mono">{today}</span>
            <span>·</span>
            <span>Internal use only — Credit Ops</span>
          </div>
          <div className="hstack">
            <span className="mono">Powered by Claude</span>
            <span>·</span>
            <span>v0.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TopBar({ onHome }) {
  return (
    <div className="topbar">
      <div className="topbar-inner">
        <div className="brand" style={{ cursor: onHome ? "pointer" : "default" }} onClick={onHome}>
          <img src="procredit-logo.png" alt="ProCredit Financing Corp" className="brand-logo" />
          <span className="brand-sub">Credit Bureau Report Builder</span>
        </div>
        <div className="spacer"></div>
        <span className="pill mono">Internal · Credit Ops</span>
      </div>
    </div>
  );
}

function Processing({ steps, current }) {
  return (
    <div className="page">
      <div className="process">
        <div className="eyebrow">Extracting</div>
        <div className="process-title">Reading your documents…</div>
        <p className="muted" style={{ marginBottom: 28 }}>
          Each source is parsed with Claude and merged into the CBR template.
        </p>
        {steps.map((s, i) => {
          const state =
            i < current ? "done" :
            i === current ? "active" : "";
          return (
            <div key={s.id} className={`step ${state}`}>
              <div className="step-mark">{i < current ? "✓" : i + 1}</div>
              <div className="step-text">{s.label}</div>
              <div className="step-meta">{i < current ? "DONE" : i === current ? "RUNNING" : "PENDING"}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// PDF reading and extraction are handled by extractor.js (window.CBRExtractor)

function App() {
  const [phase, setPhase] = useStateA("buffer"); // buffer | upload | processing | report
  const [report, setReport] = useStateA(null);
  const [steps, setSteps] = useStateA([]);
  const [stepIdx, setStepIdx] = useStateA(0);

  const handleDemo = () => {
    setReport(window.SAMPLE_REPORT);
    setPhase("report");
  };

  const handleProcess = async ({ files, borrower, reportDate, notes }) => {
    const STEP_LABELS = [
      "Reading documents",
      "Extracting NFIS — negative files",
      "Extracting CIC — credit history summary",
      "Extracting CIC — all reported facilities (transactions)",
      "Extracting CRIF — corporate dossier",
      "Extracting Namescan — screening results",
      "Generating summary, risk rating & three-way reconciliation",
      "Assembling CBR report",
    ];

    setSteps(STEP_LABELS.map((label, i) => ({ id: String(i), label })));
    setStepIdx(0);
    setPhase("processing");

    const report = await window.CBRExtractor.extractAll(
      files,
      { borrower, reportDate, notes },
      (idx) => setStepIdx(idx)
    );

    setReport(report);
    setPhase("report");
  };

  const handleBack = () => setPhase("upload");
  const handleHome = () => setPhase("buffer");

  return (
    <>
      {phase !== "buffer" && <TopBar onHome={handleHome} />}
      {phase === "buffer" && <Buffer onStart={() => setPhase("upload")} onDemo={handleDemo} />}
      {phase === "upload" && <UploadScreen onProcess={handleProcess} onDemo={handleDemo} />}
      {phase === "processing" && <Processing steps={steps} current={stepIdx} />}
      {phase === "report" && report && <ReportScreen data={report} onBack={handleBack} />}
    </>
  );
}


ReactDOM.createRoot(document.getElementById("root")).render(<App />);
