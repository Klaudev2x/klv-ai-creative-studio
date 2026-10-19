// Vercel serverless function for POST /api/scenes.
//
// AI scene direction for the storyboard workflow: the narration script goes
// in, a shot list of vivid per-shot visual descriptions comes out, written by
// the LLM (OpenAI GPT when OPENAI_API_KEY is set, otherwise the free
// Pollinations text API — same chain as lib/prompt-engine).
// No usable provider -> the client falls back to its mechanical splitter.

const { breakdownScenes } = require("../lib/prompt-engine.js");

const MAX_SCRIPT_CHARS = 4000;
const MAX_SCENES = 8;

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => {
      buf += chunk;
      if (buf.length > 12000) {
        reject(new Error("payload_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(buf ? JSON.parse(buf) : {}));
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  let payload = {};
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    if (error && error.message === "payload_too_large") {
      return sendJson(res, 413, { error: "Script payload too large" });
    }
    return sendJson(res, 400, { error: "Invalid JSON" });
  }

  const script = typeof payload.script === "string" ? payload.script.trim() : "";
  if (!script) {
    return sendJson(res, 400, { error: "script is required" });
  }

  const requestedMax = Number(payload.maxScenes);
  const maxScenes =
    Number.isInteger(requestedMax) && requestedMax >= 1 && requestedMax <= MAX_SCENES
      ? requestedMax
      : MAX_SCENES;

  const directed = await breakdownScenes(script.slice(0, MAX_SCRIPT_CHARS), maxScenes);
  if (directed) {
    return sendJson(res, 200, { ok: true, provider: directed.provider, scenes: directed.scenes });
  }

  return sendJson(res, 503, {
    ok: false,
    provider: "none",
    error: "AI scene direction is unavailable right now (no LLM provider reachable). The studio falls back to its quick sentence splitter."
  });
};
