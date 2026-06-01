"""
CIC PDF Extraction Server  —  port 3009
POST /api/extract-cic  multipart: file=<PDF>
Returns JSON: { installments, nonInstallments, creditCards }
matching the shape expected by src/extractor.js.
"""

import importlib.util, subprocess, sys, re, io

def _ensure(import_name, pip_name=None):
    if importlib.util.find_spec(import_name) is None:
        print(f"Installing {pip_name or import_name}…", flush=True)
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", pip_name or import_name])

_ensure("flask")
_ensure("pdfplumber")

from flask import Flask, request, jsonify
import pdfplumber

app  = Flask(__name__)
PORT = 3009

MONTHS     = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"]
DETAIL_RE  = re.compile(r"Detail\s+of\s+(Installment|Non\s+Installment|Credit\s+Card)\s+\d+", re.IGNORECASE)

# ── Field extractors ──────────────────────────────────────────────────────────

def extract_subject(text):
    dear = re.search(r"Dear\s+([A-Z][A-Z\s]{3,40}?)[\r\n]", text)
    if dear:
        return dear.group(1).strip()
    m_last  = re.search(r"Last Name\s+([A-Z][A-Z\s]+)\n", text)
    m_first = re.search(r"First Name\s+([A-Z][A-Z]+)", text)
    if m_last:
        last  = m_last.group(1).strip()
        first = m_first.group(1).strip() if m_first else ""
        return f"{first} {last}".strip()
    return ""

def get_provider(lines):
    for i, line in enumerate(lines):
        if "Provider Description" not in line:
            continue
        m = re.search(r"Provider Description\s+(.+?)\s+Last Update Date", line)
        if m:
            name = m.group(1).strip()
            if i + 1 < len(lines):
                nxt = lines[i + 1].strip()
                if nxt.startswith("(") and nxt.endswith(")"):
                    name = f"{name} {nxt}"
            return name
        if i > 0:
            candidate = lines[i - 1].strip()
            if candidate and re.match(r"[A-Z]", candidate) and "/" not in candidate:
                suffix = ""
                if i + 1 < len(lines):
                    nxt = lines[i + 1].strip()
                    if nxt.startswith("(") and nxt.endswith(")"):
                        suffix = f" {nxt}"
                return candidate + suffix
    return ""

def get_contract_type(lines):
    for line in lines:
        if not line.startswith("Contract Type"):
            continue
        rest = line[len("Contract Type"):].strip()
        for stopper in ["Financed Amount", "Credit Limit", "Overall Credit Limit",
                        "Transaction Type", "Original Currency"]:
            rest = rest.split(stopper)[0]
        return rest.strip()
    return ""

def get_credit_limit(text):
    m = re.search(r"Credit Limit\s+([\d,]+)", text)
    if m:
        return m.group(1).replace(",", "")
    m = re.search(r"Financed Amount\s+([\d,]+)", text)
    if m:
        return m.group(1).replace(",", "")
    return ""

def get_dates(text):
    start = end = ""
    m = re.search(r"Contract Start Date\s+([\d/]+)", text)
    if m:
        start = m.group(1)
    m = re.search(r"Contract End Date\s+([\d/\-]+)", text)
    if m:
        raw = m.group(1).strip()
        end = "" if raw == "-" else raw
    return start, end

def get_contract_phase(text):
    m = re.search(r"Contract Phase\s+(Closed in advance|Closed|Active|Requested|Refused|Renounced)", text)
    if m:
        return m.group(1)
    m = re.search(r"Contract Phase\s+(\S+)", text)
    return m.group(1) if m else ""

def get_cic_code(text):
    m = re.search(r"CIC Contract Code:\s*(\S+)", text)
    return m.group(1) if m else ""

def get_status(text, phase):
    phase_lower = phase.lower()
    if "closed in advance" in phase_lower:
        return "CLOSED IN ADV."
    if "closed" in phase_lower:
        return "CLOSED"
    hist_m = re.search(
        r"Historical Data(.+?)(?:Granted Installment|Payments\n|Outstanding\n)", text, re.DOTALL
    )
    hist = hist_m.group(1) if hist_m else text
    if re.search(r"Write.off", hist, re.IGNORECASE):
        return "W-OFF"
    if re.search(r"61.90 days|3 Cycles late", hist, re.IGNORECASE):
        return "PAST DUE"
    if re.search(r"31.60 days|2 Cycles late", hist, re.IGNORECASE):
        return "PAST DUE"
    if re.search(r"1.30 days|1 Cycle late", hist, re.IGNORECASE):
        return "PAST DUE"
    if re.search(r"Past Due", hist):
        return "PAST DUE"
    return "CURRENT"

def fmt_date(d):
    if not d or d == "-":
        return "—"
    parts = d.split("/")
    if len(parts) < 2:
        return d
    try:
        if len(parts[0]) == 4:          # YYYY/MM/DD
            y, m_str = parts[0], parts[1]
        elif len(parts) >= 3:           # MM/DD/YYYY
            m_str, y = parts[0], parts[2]
        else:
            return d
        idx = int(m_str) - 1
        if 0 <= idx < 12:
            return f"{MONTHS[idx]} '{y[-2:]}"
    except (ValueError, IndexError):
        pass
    return d

def fmt_amount(a):
    if not a:
        return "—"
    n_str = re.sub(r"[^0-9]", "", str(a))
    if not n_str or int(n_str) == 0:
        return "—"
    return f"P{int(n_str):,}"

# ── Core extraction ───────────────────────────────────────────────────────────

def extract_facilities(pdf_bytes):
    subject        = ""
    installments   = []
    non_installs   = []
    credit_cards   = []

    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        for page in pdf.pages[:6]:
            text = page.extract_text() or ""
            if "Last Name" in text or "Dear " in text:
                s = extract_subject(text)
                if s:
                    subject = s
                    break

        for page in pdf.pages:
            text = page.extract_text() or ""
            m    = DETAIL_RE.search(text)
            if not m:
                continue

            sec_type = m.group(1).strip()   # "Installment" / "Non Installment" / "Credit Card"
            lines    = text.split("\n")

            cic_code = get_cic_code(text)
            lender   = get_provider(lines)
            ctype    = get_contract_type(lines)
            limit    = get_credit_limit(text)
            start, end = get_dates(text)
            phase    = get_contract_phase(text)
            status   = get_status(text, phase)

            contract = (
                f"{ctype} ({cic_code})" if ctype and cic_code
                else ctype or cic_code or "—"
            )
            settled = fmt_date(end) if status in ("CLOSED", "CLOSED IN ADV.") and end else "—"

            base = {
                "subject":  subject  or "SUBJECT",
                "lender":   lender   or "—",
                "contract": contract,
                "start":    fmt_date(start),
                "end":      fmt_date(end) if end else "—",
                "status":   status,
                "settled":  settled,
            }

            st = sec_type.upper()
            if st == "INSTALLMENT":
                installments.append({**base, "amount": fmt_amount(limit)})
            elif "NON" in st:
                non_installs.append({**base, "limit": fmt_amount(limit)})
            else:
                credit_cards.append({**base, "limit": fmt_amount(limit)})

    return {
        "installments":    installments,
        "nonInstallments": non_installs,
        "creditCards":     credit_cards,
    }

# ── Flask routes ──────────────────────────────────────────────────────────────

@app.after_request
def _cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

@app.route("/api/extract-cic", methods=["POST", "OPTIONS"])
def api_extract_cic():
    if request.method == "OPTIONS":
        return "", 204
    if "file" not in request.files:
        return jsonify({"error": "Missing 'file' field"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400
    try:
        data = extract_facilities(f.read())
        return jsonify(data)
    except Exception as exc:
        print(f"[PY extractor] Error: {exc}", flush=True)
        return jsonify({"error": str(exc)}), 500

@app.route("/api/extract-text", methods=["POST", "OPTIONS"])
def api_extract_text():
    """Extract raw text from a PDF using pdfplumber. Used by the LLM extractors
    (NFIS, CIC summary, CRIF, GIS) so they get clean text instead of pdfjs-dist output."""
    if request.method == "OPTIONS":
        return "", 204
    if "file" not in request.files:
        return jsonify({"error": "Missing 'file' field"}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(f.read())) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text += page_text + "\n"
        return jsonify({"text": text})
    except Exception as exc:
        print(f"[PY text] Error: {exc}", flush=True)
        return jsonify({"error": str(exc)}), 500

@app.route("/health")
def health():
    return jsonify({"ok": True})

if __name__ == "__main__":
    print(f"  [PY]  CIC extractor -> http://localhost:{PORT}", flush=True)
    app.run(host="0.0.0.0", port=PORT, debug=False)
