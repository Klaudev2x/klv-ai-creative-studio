const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Tiny .env loader (no dependency): reads KEY=VALUE pairs from .env next to
// server.js. Real environment variables always win. This keeps API keys
// (ELEVENLABS_API_KEY, OPENAI_API_KEY) server-side only.
try {
  const envPath = path.join(__dirname, ".env");
  const envFile = fs.readFileSync(envPath, "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
} catch {
  // No .env file — fine, all providers degrade to their free paths.
}

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Server error");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Serve the serverless API locally so `npm run dev` matches production.
  if (url.pathname === "/api/generate") {
    require("./api/generate.js")(req, res);
    return;
  }

  if (url.pathname === "/api/voice") {
    require("./api/voice.js")(req, res);
    return;
  }

  if (url.pathname === "/api/transcribe") {
    require("./api/transcribe.js")(req, res);
    return;
  }

  if (url.pathname === "/api/prompt") {
    require("./api/prompt.js")(req, res);
    return;
  }

  if (url.pathname === "/api/scenes") {
    require("./api/scenes.js")(req, res);
    return;
  }

  const safePath = path
    .normalize(decodeURIComponent(url.pathname))
    .replace(/^[/\\]+/, "")
    .replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(root, safePath);

  if (url.pathname === "/" || !path.extname(filePath)) {
    filePath = path.join(root, "index.html");
  }

  if (!filePath.startsWith(root)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(res, filePath);
      return;
    }

    sendFile(res, path.join(root, "index.html"));
  });
});

server.listen(port, () => {
  console.log(`klv.ai studio running at http://localhost:${port}`);
});

module.exports = server;
