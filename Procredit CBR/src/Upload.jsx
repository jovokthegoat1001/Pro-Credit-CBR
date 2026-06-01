import React, { useState, useRef, useEffect } from "react";
import { quickExtractMeta } from "./extractor.js";

export const DOC_TYPES = [
  { id: "gis",      name: "GIS",      desc: "SEC General Information Sheet — registered company details, officers, shareholders, paid-up capital." },
  { id: "nfis",     name: "NFIS",     desc: "Negative Files Information System — write-offs, cancelled cards, individual delinquency history." },
  { id: "cic",      name: "CIC",      desc: "Credit Information Corporation report — provider lines, DPD, balances and remarks." },
  { id: "crif",     name: "CRIF",     desc: "Corporate dossier — SEC reg, shareholders, financials, litigation." },
  { id: "namescan", name: "Namescan", desc: "Sanctions, PEP and adverse media screening (Namescan.io Emerald)." },
];

function getPhilippineDate() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year:  "numeric",
    month: "long",
    day:   "numeric",
  }).format(new Date());
}

// ── Multi-file Dropzone ───────────────────────────────────────────────────────

function Dropzone({ type, files, onAddFiles, onRemove }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const hasFiles        = files.length > 0;

  const addFiles = (raw) => {
    const list = Array.from(raw || []).filter((f) =>
      f.type === "application/pdf" || /\.(pdf|txt|csv|xlsx|png|jpg|jpeg)$/i.test(f.name)
    );
    if (list.length) onAddFiles(list);
  };

  return (
    <div
      className={`drop${hasFiles ? " has-file" : ""}${drag ? " drag" : ""}`}
      onClick={() => !drag && inputRef.current?.click()}
      onDragOver={(e)  => { e.preventDefault(); setDrag(true); }}
      onDragLeave={()  => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <div className="drop-head">
        <span className="drop-tag">
          <span className="dot"></span>{type.id.toUpperCase()}
        </span>
        {hasFiles
          ? <span className="badge green">{files.length} file{files.length > 1 ? "s" : ""}</span>
          : <span className="badge">Drop or click</span>
        }
      </div>

      <div className="drop-name">{type.name}</div>
      <div className="drop-desc">{type.desc}</div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.csv,.xlsx,.png,.jpg,.jpeg"
        style={{ display: "none" }}
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
      />

      {hasFiles && (
        <div style={{ marginTop: "auto", paddingTop: 10, borderTop: "1px dashed var(--line)" }}>
          {files.map((f, i) => (
            <div
              key={i}
              className="drop-file"
              style={{ paddingTop: i > 0 ? 6 : 0, borderTop: i > 0 ? "1px dashed var(--line)" : "none" }}
            >
              <span className="drop-filename" title={f.name}>{f.name}</span>
              <button
                className="x-btn"
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
              >
                Remove
              </button>
            </div>
          ))}
          <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)", fontFamily: "IBM Plex Mono, monospace" }}>
            + click or drop to add more
          </div>
        </div>
      )}
    </div>
  );
}

// ── UploadScreen ──────────────────────────────────────────────────────────────

export default function UploadScreen({ onProcess, onDemo, extractionError }) {
  const [files, setFiles]   = useState({ gis: [], nfis: [], cic: [], crif: [], namescan: [] });
  const [borrower, setBorrower] = useState("");
  const [reviewer, setReviewer] = useState("");
  const [notes, setNotes]   = useState("");

  // Report date is always Philippine time — not user-editable
  const reportDate = getPhilippineDate();

  // Auto-fill borrower name from uploaded documents
  const [autoFilling, setAutoFilling]     = useState(false);
  const [autoFilledKey, setAutoFilledKey] = useState("");

  const totalFiles  = Object.values(files).reduce((sum, arr) => sum + arr.length, 0);
  const filledSlots = Object.values(files).filter((arr) => arr.length > 0).length;
  const ready       = totalFiles > 0;

  const addFiles = (typeId, newFiles) => {
    setFiles((prev) => ({ ...prev, [typeId]: [...prev[typeId], ...newFiles] }));
  };

  const removeFile = (typeId, index) => {
    setFiles((prev) => ({ ...prev, [typeId]: prev[typeId].filter((_, i) => i !== index) }));
  };

  // ── Auto-fill borrower name ──────────────────────────────────────────────────

  const fileKey = [
    ...files.gis.map((f)      => "g:"  + f.name),
    ...files.crif.map((f)     => "c:"  + f.name),
    ...files.nfis.map((f)     => "n:"  + f.name),
    ...files.cic.map((f)      => "ci:" + f.name),
    ...files.namescan.map((f) => "ns:" + f.name),
  ].join("|");

  const borrowerRef = useRef(borrower);
  useEffect(() => { borrowerRef.current = borrower; }, [borrower]);

  useEffect(() => {
    const candidates = [...files.crif, ...files.nfis, ...files.cic, ...files.namescan];
    if (!candidates.length) return;

    let cancelled = false;
    setAutoFilling(true);

    (async () => {
      for (const file of candidates) {
        try {
          const meta = await quickExtractMeta(file);
          if (cancelled) return;
          if (meta.borrower && !borrowerRef.current.trim()) {
            setBorrower(meta.borrower);
            break;
          }
        } catch (e) {
          console.warn("Auto-fill failed for", file.name, e);
        }
      }
      if (cancelled) return;
      setAutoFilling(false);
      setAutoFilledKey("borrower");
      setTimeout(() => setAutoFilledKey(""), 3000);
    })();

    return () => { cancelled = true; };
  }, [fileKey]);

  // ── Render ───────────────────────────────────────────────────────────────────

  const autoTag = () => {
    if (autoFilling)               return <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}>  scanning…</span>;
    if (autoFilledKey === "borrower") return <span style={{ color: "var(--brand-green-deep)", fontSize: 11, fontFamily: "IBM Plex Mono, monospace" }}>  ✓ auto-filled</span>;
    return null;
  };

  return (
    <div className="page">
      <div className="eyebrow">CBR Builder · v0.1</div>
      <h1>Credit Bureau Report — Builder</h1>
      <p className="lede">
        Drop the five source documents and the system extracts a single, signed-off Credit Bureau
        Report. Built for Credit Ops to skip the copy-paste.
      </p>

      {extractionError && (
        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 8,
          background: "var(--red-soft)", border: "1px solid var(--red)",
          color: "var(--red)", fontSize: 13, fontFamily: "IBM Plex Mono, monospace",
        }}>
          Extraction failed — {extractionError}
        </div>
      )}

      <div className="row-gap-22" style={{ marginTop: 32 }}>

        {/* Borrower meta */}
        <div className="card accent">
          <div className="card-head">
            <div className="card-title"><span className="num">01</span>Borrower</div>
            <div className="spacer"></div>
            <span className="muted small">
              {autoFilling ? "Scanning documents for borrower name…" : "Auto-filled from uploaded documents · or type to override"}
            </span>
          </div>
          <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 }}>
            <div>
              <label className="field">Borrower name{autoTag()}</label>
              <input
                type="text"
                placeholder="e.g. Pro Credit Financing Corp."
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                style={autoFilledKey === "borrower" ? { borderColor: "var(--brand-green)" } : {}}
              />
            </div>
            <div>
              <label className="field">Report date</label>
              <div style={{
                padding: "10px 12px",
                border: "1px solid var(--line)",
                borderRadius: 8,
                background: "var(--bg)",
                color: "var(--ink-2)",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 13,
              }}>
                {reportDate}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, fontFamily: "IBM Plex Mono, monospace" }}>
                Philippine Time · auto
              </div>
            </div>
            <div>
              <label className="field">Reviewer</label>
              <input
                type="text"
                placeholder="Your name"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Files */}
        <div className="card">
          <div className="card-head">
            <div className="card-title"><span className="num">02</span>Source documents</div>
            <div className="spacer"></div>
            <span className="pill mono">{filledSlots} / 5 slots · {totalFiles} file{totalFiles !== 1 ? "s" : ""}</span>
          </div>
          <div className="card-pad">
            {/* 6-unit base grid: first 3 items span 2 units (1/3 each), last 2 span 3 units (1/2 each) */}
            <div className="drop-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
              {DOC_TYPES.map((t, i) => (
                <div key={t.id} style={{ gridColumn: `span ${i < 3 ? 2 : 3}` }}>
                  <Dropzone
                    type={t}
                    files={files[t.id]}
                    onAddFiles={(newFiles) => addFiles(t.id, newFiles)}
                    onRemove={(j) => removeFile(t.id, j)}
                  />
                </div>
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
              {ready
                ? `${totalFiles} file${totalFiles !== 1 ? "s" : ""} ready across ${filledSlots} slot${filledSlots !== 1 ? "s" : ""}.`
                : "Drop at least one document to begin."}
            </span>
            <button
              className="btn"
              disabled={!ready}
              onClick={() => onProcess({ files, borrower, reportDate, notes, reviewer })}
            >
              Extract & build report →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
