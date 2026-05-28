// Upload screen
const { useState, useRef } = React;

const DOC_TYPES = [
  { id: "nfis",     name: "NFIS",     desc: "Negative Files Information System — write-offs, cancelled cards, individual delinquency history." },
  { id: "cic",      name: "CIC",      desc: "Credit Information Corporation report — provider lines, DPD, balances and remarks." },
  { id: "crif",     name: "CRIF",     desc: "Corporate dossier — SEC reg, GIS, shareholders, financials, litigation." },
  { id: "namescan", name: "Namescan", desc: "Sanctions, PEP and adverse media screening (Namescan.io Emerald)." },
];

function Dropzone({ type, file, onFile, onClear }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handle = (f) => f && onFile(f);

  return (
    <div
      className={`drop${file ? " has-file" : ""}${drag ? " drag" : ""}`}
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files?.[0];
        handle(f);
      }}
    >
      <div className="drop-head">
        <span className="drop-tag"><span className="dot"></span>{type.id.toUpperCase()}</span>
        {file && <span className="badge green">Ready</span>}
      </div>
      <div className="drop-name">{type.name}</div>
      <div className="drop-desc">{type.desc}</div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {file && (
        <div className="drop-file">
          <span className="drop-filename" title={file.name}>{file.name}</span>
          <button className="x-btn" onClick={(e) => { e.stopPropagation(); onClear(); }}>Remove</button>
        </div>
      )}
    </div>
  );
}

function UploadScreen({ onProcess, onDemo }) {
  const [files, setFiles] = useState({});
  const [borrower, setBorrower] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [notes, setNotes] = useState("");

  const count = Object.values(files).filter(Boolean).length;
  const ready = count > 0;

  return (
    <div className="page">
      <div className="eyebrow">CBR Builder · v0.1</div>
      <h1>Credit Bureau Report — Builder</h1>
      <p className="lede">
        Drop the four source documents and the system extracts a single, signed-off Credit Bureau
        Report. Built for Credit Ops to skip the copy-paste.
      </p>

      <div className="row-gap-22" style={{ marginTop: 32 }}>
        {/* Borrower meta */}
        <div className="card accent">
          <div className="card-head">
            <div className="card-title"><span className="num">01</span>Borrower</div>
            <div className="spacer"></div>
            <span className="muted small">Optional — auto-extracted from CRIF if blank</span>
          </div>
          <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <div>
              <label className="field">Borrower name</label>
              <input
                type="text"
                placeholder="e.g. Pro Credit Financial Corp.."
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
              />
            </div>
            <div>
              <label className="field">Report date</label>
              <input
                type="text"
                placeholder="May 05-06, 2026"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
            <div>
              <label className="field">Reviewer</label>
              <input type="text" placeholder="Your name" />
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><span className="num">02</span>Source documents</div>
            <div className="spacer"></div>
            <span className="pill mono">{count} / 4 attached</span>
          </div>
          <div className="card-pad">
            <div className="drop-grid">
              {DOC_TYPES.map((t) => (
                <Dropzone
                  key={t.id}
                  type={t}
                  file={files[t.id]}
                  onFile={(f) => setFiles((s) => ({ ...s, [t.id]: f }))}
                  onClear={() => setFiles((s) => ({ ...s, [t.id]: null }))}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><span className="num">03</span>Notes for the analyst</div>
            <div className="spacer"></div>
            <span className="muted small">Optional · passed to the model as additional context</span>
          </div>
          <div className="card-pad">
            <textarea
              rows="3"
              placeholder="e.g. focus on adverse media for the corporate entity; flag any CC delinquencies in the last 24 months."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Action bar */}
        <div className="hstack" style={{ justifyContent: "space-between", marginTop: 8 }}>
          <button className="btn ghost brand" onClick={onDemo}>
            ▸ Load Project Duo (demo)
          </button>
          <div className="hstack">
            <span className="muted small">
              {ready ? "Ready to extract." : "Drop at least one document to begin."}
            </span>
            <button className="btn" disabled={!ready} onClick={() => onProcess({ files, borrower, reportDate, notes })}>
              Extract & build report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.UploadScreen = UploadScreen;
window.DOC_TYPES = DOC_TYPES;
