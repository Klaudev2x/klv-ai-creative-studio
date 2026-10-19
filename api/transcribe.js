// Vercel serverless function for POST /api/transcribe.
//
// Word-level transcription for the captions workflow. The provider is
// ElevenLabs Scribe (same single key as TTS: ELEVENLABS_API_KEY), kept
// replaceable behind the same adapter shape as api/voice.js.
//
// The client sends the raw audio bytes with an `X-Audio-Mime` header. We wrap
// them into a multipart request server-side — smaller payloads than base64
// JSON, and no multipart parsing needed here.
//
// Free-tier discipline: audio is capped at 8 MB per request, the default
// model is the current Scribe generation, and quota/auth errors are surfaced
// to the user verbatim instead of being swallowed.

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const MIN_AUDIO_BYTES = 64; // endpoint requires at least 100ms of audio
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

function apiKey() {
  return (process.env.ELEVENLABS_API_KEY || "").trim();
}

function modelId() {
  return (process.env.ELEVENLABS_TRANSCRIBE_MODEL_ID || "scribe_v2").trim();
}

function upstreamError(status, detail) {
  if (status === 401) {
    return { status: 502, error: "The transcription provider rejected the configured API key. Check ELEVENLABS_API_KEY on the server." };
  }
  if (status === 402 || status === 429) {
    return {
      status: 429,
      error: "Transcription free quota is exhausted or rate limited. Try again later, or caption manually (auto-time the script, or import an SRT file)."
    };
  }
  return { status: 502, error: `Transcription request failed${detail ? ` (${detail})` : ""}` };
}

function readRawBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// Builds a multipart body by hand so the audio can be forwarded verbatim.
function buildMultipart(audioBuffer, fileName, mime, fields) {
  const boundary = `----klvai${Math.random().toString(16).slice(2)}`;
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
      )
    );
  }
  parts.push(
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`
    )
  );
  parts.push(audioBuffer, Buffer.from(`\r\n--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(parts) };
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Audio-Mime, X-Audio-Name");

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!apiKey()) {
    return sendJson(res, 503, {
      ok: false,
      provider: "elevenlabs-scribe",
      handled: "not_configured",
      error: "Transcription provider not configured",
      message:
        "ELEVENLABS_API_KEY is not set on the server, so automatic transcription is unavailable. Use Auto-time script or Import SRT/VTT to caption without a provider."
    });
  }

  let audio;
  try {
    audio = await readRawBody(req, MAX_AUDIO_BYTES);
  } catch (error) {
    if (error && error.message === "payload_too_large") {
      return sendJson(res, 413, { ok: false, error: "Audio is too large (8 MB max per transcription)." });
    }
    return sendJson(res, 400, { ok: false, error: "Failed to read the audio upload." });
  }

  if (audio.length < MIN_AUDIO_BYTES) {
    return sendJson(res, 400, { ok: false, error: "Generate or upload audio first — there is nothing to transcribe." });
  }

  const mime = String(req.headers["x-audio-mime"] || "audio/mpeg").split(";")[0].slice(0, 60);
  const baseName = String(req.headers["x-audio-name"] || "voiceover")
    .replace(/[^\w.-]+/g, "-")
    .slice(0, 40);
  const extension = mime.includes("wav") ? "wav" : mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "mp3";

  const { boundary, body } = buildMultipart(audio, `${baseName}.${extension}`, mime, {
    model_id: modelId()
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  let upstream;
  try {
    upstream = await fetch(`${ELEVENLABS_BASE}/speech-to-text`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey(),
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body,
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timer);
    return sendJson(res, 504, {
      ok: false,
      error: "Transcription timed out or the provider is unreachable. Try again shortly."
    });
  }
  clearTimeout(timer);

  if (!upstream.ok) {
    let detail = "";
    try {
      const err = await upstream.json();
      detail = (err.detail && (err.detail.message || err.detail.status)) || "";
    } catch {
      detail = "";
    }
    const mapped = upstreamError(upstream.status, detail);
    return sendJson(res, mapped.status, { ok: false, error: mapped.error });
  }

  let data;
  try {
    data = await upstream.json();
  } catch {
    return sendJson(res, 502, { ok: false, error: "Transcription provider returned an unreadable response." });
  }

  const words = (Array.isArray(data.words) ? data.words : [])
    .filter((w) => {
      if (!w || typeof w.start !== "number" || typeof w.end !== "number") return false;
      if (w.type && w.type !== "word") return false; // skip audio-event / spacing markers
      return String(w.text || "").trim().length > 0;
    })
    .map((w) => ({ text: String(w.text).trim(), start: w.start, end: w.end }));

  return sendJson(res, 200, {
    ok: true,
    provider: "elevenlabs-scribe",
    model: modelId(),
    language: data.language_code || "",
    words,
    text: data.text || "",
    audioSeconds: audio.length
  });
};
