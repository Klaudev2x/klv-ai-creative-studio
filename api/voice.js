// Vercel serverless function for POST /api/voice.
//
// ElevenLabs AI voiceover integration. The API key never leaves the server:
// set ELEVENLABS_API_KEY in the hosting environment (Vercel project env vars,
// or an environment variable for `node server.js` locally).
//
// Free-tier discipline:
//  - The voice list is cached for 5 minutes (at most 1 upstream call per 5 min).
//  - Previews are capped at 200 characters; the frontend plays the provider's
//    hosted `previewUrl` sample first, which costs no API quota.
//  - Narration is capped at 5000 characters per request (well inside free-tier
//    credit costs) and the client is told exactly when quota is exhausted.
//
// The provider is deliberately wrapped behind an action + adapter structure so a
// different voice engine can be plugged in later without touching the frontend.

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const PREVIEW_MAX_CHARS = 200;
const GENERATE_MAX_CHARS = 5000;
const VOICES_CACHE_TTL = 5 * 60 * 1000;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

let voicesCache = null;
let voicesCacheAt = 0;

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

function apiKey() {
  return (process.env.ELEVENLABS_API_KEY || "").trim();
}

function modelId() {
  return (process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2").trim();
}

function isConfigured() {
  return apiKey().length > 0;
}

async function readJsonBody(req) {
  const raw = await new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", (chunk) => {
      buf += chunk;
      if (buf.length > 100000) {
        reject(new Error("payload_too_large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(buf));
    req.on("error", reject);
  });
  return raw ? JSON.parse(raw) : {};
}

function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return Math.min(max, Math.max(min, num));
}

async function elevenLabsFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    return await fetch(`${ELEVENLABS_BASE}${path}`, {
      ...options,
      headers: {
        "xi-api-key": apiKey(),
        ...(options.headers || {})
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

// Maps upstream statuses to honest, actionable client messages.
function upstreamError(status, detail) {
  if (status === 401) {
    return { status: 502, error: "ElevenLabs rejected the configured API key. Check ELEVENLABS_API_KEY on the server." };
  }
  if (status === 402 || status === 429) {
    return {
      status: 429,
      error: "ElevenLabs free quota is exhausted or rate limited. Try again later, or upload your own audio instead."
    };
  }
  if (status === 422) {
    return { status: 400, error: `Voice request rejected by ElevenLabs${detail ? `: ${detail}` : ""}` };
  }
  return { status: 502, error: `Voice provider request failed${detail ? ` (${detail})` : ""}` };
}

async function listVoices() {
  const res = await elevenLabsFetch("/voices", { method: "GET" });
  if (!res.ok) {
    const detail = res.status === 404 ? "voices endpoint missing" : "";
    const mapped = upstreamError(res.status, detail);
    return { ok: false, ...mapped };
  }
  const data = await res.json().catch(() => null);
  const voices = (data && Array.isArray(data.voices) ? data.voices : []).map((voice) => ({
    id: voice.voice_id,
    name: voice.name || "Unnamed voice",
    language: (voice.labels && (voice.labels.language || voice.labels.accent)) || voice.language || "",
    gender: (voice.labels && voice.labels.gender) || "",
    description: (voice.labels && (voice.labels.description || voice.labels.use_case)) || voice.description || "",
    previewUrl: voice.preview_url || ""
  }));
  return { ok: true, voices };
}

function buildVoiceSettings(settings) {
  const voiceSettings = {};
  if (settings && typeof settings === "object") {
    const stability = clamp(settings.stability, 0, 1);
    if (stability !== null) voiceSettings.stability = Number(stability.toFixed(2));
    const similarity = clamp(settings.similarity_boost ?? settings.similarity, 0, 1);
    if (similarity !== null) voiceSettings.similarity_boost = Number(similarity.toFixed(2));
    const style = clamp(settings.style, 0, 1);
    if (style !== null) voiceSettings.style = Number(style.toFixed(2));
    // Only include speed when the user actually changed it — some ElevenLabs
    // models reject voice_settings.speed, so the default keeps requests safe.
    const speed = clamp(settings.speed, 0.7, 1.2);
    if (speed !== null && Math.abs(speed - 1) > 0.001) voiceSettings.speed = Number(speed.toFixed(2));
    if (voiceSettings.style !== undefined && voiceSettings.style === 0) {
      // style: 0 is accepted, keep it explicit for expressiveness control.
    }
    voiceSettings.use_speaker_boost = true;
  }
  return voiceSettings;
}

async function synthesize(voiceId, text, settings) {
  const voiceSettings = buildVoiceSettings(settings);
  const res = await elevenLabsFetch(
    `/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: modelId(),
        voice_settings: voiceSettings
      })
    }
  );
  if (!res.ok) {
    let detail = "";
    try {
      const err = await res.json();
      detail = (err.detail && (err.detail.message || err.detail.status)) || "";
    } catch {
      detail = "";
    }
    const mapped = upstreamError(res.status, detail);
    return { ok: false, ...mapped };
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_AUDIO_BYTES) {
    return { ok: false, status: 413, error: "Generated audio is too large. Shorten the script." };
  }
  return { ok: true, dataUrl: `data:audio/mpeg;base64,${buffer.toString("base64")}`, bytes: buffer.length };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  let payload = {};
  try {
    payload = await readJsonBody(req);
  } catch (error) {
    if (error && error.message === "payload_too_large") {
      return sendJson(res, 413, { error: "Voice request payload too large" });
    }
    return sendJson(res, 400, { error: "Invalid JSON" });
  }

  const action = payload && payload.action;

  if (!isConfigured()) {
    return sendJson(res, 503, {
      ok: false,
      provider: "elevenlabs",
      handled: "not_configured",
      error: "Voice provider not configured",
      message:
        "ELEVENLABS_API_KEY is not set on the server, so AI voiceovers are unavailable. Upload your own audio, or configure a key to enable AI voices."
    });
  }

  if (action === "voices") {
    if (voicesCache && Date.now() - voicesCacheAt < VOICES_CACHE_TTL) {
      return sendJson(res, 200, { ok: true, provider: "elevenlabs", cached: true, voices: voicesCache });
    }
    let result;
    try {
      result = await listVoices();
    } catch (error) {
      return sendJson(res, 504, {
        ok: false,
        error: "Voice provider is unreachable right now. Check connectivity or try again shortly."
      });
    }
    if (!result.ok) {
      return sendJson(res, result.status, { ok: false, error: result.error });
    }
    voicesCache = result.voices;
    voicesCacheAt = Date.now();
    return sendJson(res, 200, { ok: true, provider: "elevenlabs", voices: voicesCache });
  }

  if (action === "preview" || action === "generate") {
    const voiceId = typeof payload.voiceId === "string" && payload.voiceId.length <= 100
      ? payload.voiceId.trim()
      : "";
    if (!voiceId) {
      return sendJson(res, 400, { ok: false, error: "voiceId is required" });
    }

    let text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (action === "preview") {
      text = text.slice(0, PREVIEW_MAX_CHARS) || "Hello, this is a preview of this voice for your animation.";
      if (!text) {
        return sendJson(res, 400, { ok: false, error: "text is required" });
      }
    } else {
      if (!text) {
        return sendJson(res, 400, { ok: false, error: "Write a narration script first." });
      }
      if (text.length > GENERATE_MAX_CHARS) {
        return sendJson(res, 413, {
          ok: false,
          error: `Script is too long for one request (${text.length} > ${GENERATE_MAX_CHARS} characters). Split it into parts.`
        });
      }
    }

    let result;
    try {
      result = await synthesize(voiceId, text, payload.settings || {});
    } catch (error) {
      return sendJson(res, 504, {
        ok: false,
        error: "Voice generation timed out or the provider is unreachable. Try again shortly."
      });
    }
    if (!result.ok) {
      return sendJson(res, result.status, { ok: false, error: result.error });
    }
    return sendJson(res, 200, {
      ok: true,
      provider: "elevenlabs",
      voiceId,
      audio: result.dataUrl,
      bytes: result.bytes,
      characters: text.length
    });
  }

  return sendJson(res, 400, { ok: false, error: "Unknown action. Use voices, preview, or generate." });
};
