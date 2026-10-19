// Vercel serverless function for POST /api/prompt.
//
// LLM prompt engineering for the Enhance button: turns the user's short idea
// into an optimized image generation prompt using lib/prompt-engine.js
// (OpenAI GPT when OPENAI_API_KEY is set, otherwise the free Pollinations
// text API — key never leaves the server).

const { enhanceWithLLM } = require("../lib/prompt-engine.js");

const MAX_INPUT_CHARS = 1200;

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
      if (buf.length > 4000) {
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
      return sendJson(res, 413, { error: "Prompt payload too large" });
    }
    return sendJson(res, 400, { error: "Invalid JSON" });
  }

  const prompt = typeof payload.prompt === "string" ? payload.prompt.trim().slice(0, MAX_INPUT_CHARS) : "";
  if (!prompt) {
    return sendJson(res, 400, { error: "prompt is required" });
  }

  const style = typeof payload.style === "string" ? payload.style.slice(0, 40) : "";
  const mode = payload.mode === "video" ? "video" : "image";
  const hints = [
    style ? `Target style: ${style}.` : "",
    mode === "video" ? "Target output: a cinematic 16:9 keyframe of a shot." : "Target output: a single still image."
  ]
    .filter(Boolean)
    .join(" ");

  const enhanced = await enhanceWithLLM(prompt, hints);
  if (enhanced) {
    return sendJson(res, 200, { ok: true, provider: enhanced.provider, prompt: enhanced.prompt, base: prompt });
  }

  return sendJson(res, 503, {
    ok: false,
    provider: "none",
    error: "AI prompt enhancement is unavailable right now (no provider reachable). The studio falls back to its built-in enhancer."
  });
};
