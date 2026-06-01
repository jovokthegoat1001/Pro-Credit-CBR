// API proxy server — forwards /api/complete requests to Anthropic.
// Runs on port 3008; Vite dev server proxies /api/* here.
//
// API key priority:
//   1. ANTHROPIC_API_KEY environment variable
//   2. .env file  (ANTHROPIC_API_KEY=sk-ant-...)
//   3. api-key.txt (legacy fallback)

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT = 3008;

// ── Read API key from env / .env / api-key.txt ───────────────────────────────

function readApiKey() {
  // 1. Environment variable (set externally or by shell)
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2. .env file — simple single-line parser, no dependency needed
  try {
    const env = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    for (const line of env.split(/\r?\n/)) {
      const m = line.match(/^\s*ANTHROPIC_API_KEY\s*=\s*(.+)$/);
      if (m) {
        const val = m[1].trim().replace(/^["']|["']$/g, ""); // strip optional quotes
        if (val && val !== "paste-your-key-here") return val;
      }
    }
  } catch { /* .env not present — that's fine */ }

  // 3. api-key.txt (legacy)
  try {
    const val = fs.readFileSync(path.join(__dirname, "api-key.txt"), "utf8").trim();
    if (val && val !== "PASTE_YOUR_KEY_HERE") return val;
  } catch { /* not present */ }

  return "";
}

const API_KEY = readApiKey();

// ── Request handler ──────────────────────────────────────────────────────────

async function handleComplete(req, res) {
  if (!API_KEY) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: "ANTHROPIC_API_KEY not set. Open .env and replace 'paste-your-key-here' with your real key, then restart with npm run dev.",
    }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  const { prompt } = JSON.parse(body);

  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key":         API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type":      "application/json",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-6",
      max_tokens: 8192,
      messages:   [{ role: "user", content: prompt }],
    }),
  });

  const data = await apiRes.json();
  if (!apiRes.ok) {
    res.writeHead(apiRes.status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
    return;
  }

  const text = data.content?.[0]?.text ?? "";
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ text }));
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/complete") {
    try { await handleComplete(req, res); }
    catch (e) { res.writeHead(500); res.end(String(e)); }
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// ── Graceful EADDRINUSE — don't crash concurrently ───────────────────────────
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.log(`  [API] Port ${PORT} already in use — reusing existing instance.\n`);
    process.exit(0); // clean exit so concurrently keeps Vite running
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`  [API] http://localhost:${PORT}`);
  if (!API_KEY) {
    console.warn("  [API] ⚠  No API key found.");
    console.warn("  [API]    Open .env and set ANTHROPIC_API_KEY=sk-ant-...\n");
  } else {
    console.log("  [API] API key loaded ✓\n");
  }
});
