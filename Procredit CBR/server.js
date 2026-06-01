// ─────────────────────────────────────────────────────────────────────────────
// LEGACY standalone server (pre-Vite).
// For the bundled Vite version use:  npm run dev
//   That starts api-server.js (port 3008) + vite dev server (port 3007).
//
// This file is kept for reference / fallback only.
// Running it while Vite is active will cause EADDRINUSE on port 3007.
// ─────────────────────────────────────────────────────────────────────────────

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT = 3007;

// Warn loudly if Vite is already on this port
const net = require("net");
const probe = net.createConnection({ port: PORT, host: "127.0.0.1" });
probe.on("connect", () => {
  probe.destroy();
  console.error(`\n  ✖  Port ${PORT} is already in use (Vite dev server is probably running).`);
  console.error(`     Use  npm run dev  to start the app, not  node server.js\n`);
  process.exit(1);
});
probe.on("error", () => { probe.destroy(); /* port is free — proceed */ });

// Read API key: env var takes priority, then api-key.txt in the same folder
function readApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const keyFile = path.join(__dirname, "api-key.txt");
    return fs.readFileSync(keyFile, "utf8").trim();
  } catch {
    return "";
  }
}
const API_KEY = readApiKey();

const MIME = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".jsx":  "application/javascript",
  ".css":  "text/css",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".svg":  "image/svg+xml",
  ".json": "application/json",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-cache" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function handleComplete(req, res) {
  if (!API_KEY) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ANTHROPIC_API_KEY not set. Start the server with: ANTHROPIC_API_KEY=sk-... node server.js" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  const { prompt } = JSON.parse(body);

  const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/complete") {
    try { await handleComplete(req, res); }
    catch (e) { res.writeHead(500); res.end(String(e)); }
    return;
  }

  // Static file serving
  let urlPath = req.url.split("?")[0];
  if (urlPath === "/" || urlPath === "") urlPath = "/index.html";
  const filePath = path.join(__dirname, urlPath);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`\n  CBR Builder running at http://localhost:${PORT}\n`);
  if (!API_KEY) {
    console.warn("  WARNING: ANTHROPIC_API_KEY is not set.");
    console.warn("  Option 1 — create a file called  api-key.txt  in this folder");
    console.warn("             and paste your key inside it, then restart.\n");
    console.warn("  Option 2 — restart with:  ANTHROPIC_API_KEY=sk-... node server.js\n");
  } else {
    console.log("  API key loaded ✓\n");
  }
});
