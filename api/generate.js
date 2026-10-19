// Vercel serverless function for POST /api/generate.
//
// Generates real images for free via Pollinations.ai (no API key or account
// required). The function keeps the user's prompt as the primary content and
// appends only a short style + quality hint, then returns a direct image URL.
// The browser loads the image itself, so the slow (~30-60s) render happens
// client-side and never hits Vercel's function timeout.

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

const STYLE_MODIFIERS = {
  Anime: "anime style",
  Cartoon: "cartoon illustration",
  Cinematic: "cinematic film still",
  Realistic: "photorealistic",
  "3D Render": "3D render",
  Horror: "dark horror, moody, no gore",
  Stickman:
    "minimalist classic stick figure doodle, smooth rounded joints, thick uniform black ink lines, simple plain round head with two dot eyes and a thin curved smile, flat solid white background, no shading, no gradients, no textures, no photorealism, no weapons, centered full body, children's doodle simplicity",
  Illustrated: "2D illustrated storybook style, clean lines, gentle shapes",
  Sketch: "hand-drawn sketch style, pencil linework, gestural strokes",
  Vector: "flat vector illustration, bold solid color shapes, minimal detail, clean edges",
  Comic: "comic book style, halftone shading, bold inks, dynamic pose",
  Whiteboard: "whiteboard explainer drawing, simple black marker strokes, minimal doodle figures, plain whiteboard background, no shading"
};

// Styles where "highly detailed" actively ruins the look — these get a
// minimal-composition hint instead of the detail push.
const MINIMAL_STYLES = new Set(["Stickman", "Vector", "Whiteboard", "Sketch"]);

const MODEL_BY_STYLE = {
  Anime: "flux-anime"
};

// --- LLM prompt engineering -------------------------------------------------
// Every generation first runs the user's idea through an LLM ("identify what
// it is, then write the best possible image prompt") using lib/prompt-engine.
// Results are cached so retries and repeated scene renders skip the round-trip.
const { enhanceWithLLM } = require("../lib/prompt-engine.js");
const promptCache = new Map(); // key -> { provider, prompt }
const PROMPT_CACHE_MAX = 200;

function cacheKey(style, mode, prompt) {
  return `${style}|${mode}|${prompt.trim().toLowerCase()}`;
}

async function engineeredPrompt(style, mode, userPrompt) {
  const key = cacheKey(style, mode, userPrompt);
  if (promptCache.has(key)) return { ...promptCache.get(key), cached: true };
  const enhanced = await enhanceWithLLM(userPrompt, [
    style ? `Target style: ${style}.` : "",
    mode === "video" ? "Target output: a cinematic 16:9 keyframe of a shot." : "Target output: a single still image."
  ].filter(Boolean).join(" "));
  if (!enhanced) return null;
  if (promptCache.size >= PROMPT_CACHE_MAX) {
    promptCache.delete(promptCache.keys().next().value);
  }
  promptCache.set(key, enhanced);
  return { ...enhanced, cached: false };
}

// Color modes are enforced directly in the prompt so the free provider renders
// the requested look; no client-side post-processing is needed.
const COLOR_MODE_MODIFIERS = {
  bw: "black and white line art, clean ink outlines, no color",
  grayscale: "grayscale monochrome palette, tonal shading only, no color",
  sketch: "rough pencil sketch rendering, graphite strokes, paper texture"
};

function safeHex(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

function colorDesignModifier(colors) {
  if (!colors || typeof colors !== "object") return "";
  const bits = [];
  const skin = safeHex(colors.skin);
  const outfit = safeHex(colors.outfit);
  const hair = safeHex(colors.hair);
  const background = safeHex(colors.background);
  const props = safeHex(colors.props);
  if (skin) bits.push(`skin and body color ${skin}`);
  if (outfit) bits.push(`clothing in ${outfit}`);
  if (hair) bits.push(`hair color ${hair}`);
  if (background) bits.push(`background scenery in ${background} tones`);
  if (props) bits.push(`props and objects in ${props}`);
  return bits.length ? `color design: ${bits.join(", ")}` : "";
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
    const raw = await new Promise((resolve, reject) => {
      let buf = "";
      req.on("data", (chunk) => {
        buf += chunk;
      });
      req.on("end", () => resolve(buf));
      req.on("error", reject);
    });
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON" });
  }

  const { prompt, mode, style, quality, colorMode, colors, references } = payload || {};

  if (!prompt || typeof prompt !== "string") {
    return sendJson(res, 400, { error: "prompt is required" });
  }

  // Safety block list (keep in sync with the frontend)
  const unsafeTerms = [
    "child sexual",
    "minor nude",
    "non-consensual",
    "deepfake nude",
    "bomb instructions",
    "weapon instructions",
    "terrorist attack",
    "suicide method",
    "self harm",
    "graphic gore"
  ];
  const lower = prompt.toLowerCase();
  if (unsafeTerms.some((term) => lower.includes(term))) {
    return sendJson(res, 400, { error: "Prompt rejected" });
  }

  // --- Build the final prompt ---
  // Step 1: LLM prompt engineering — understand the idea, write the best
  // version. Silent fallback: no LLM available means the user's own words win.
  let promptEngine = "original";
  let subject = prompt.trim();
  try {
    const engineered = await engineeredPrompt(style, mode, prompt);
    if (engineered && engineered.prompt) {
      subject = engineered.prompt;
      promptEngine = engineered.provider + (engineered.cached ? " (cached)" : "");
    }
  } catch {
    // keep the user's original prompt
  }

  // Step 2: style + color + mode hints on top of the engineered subject.
  const styleMod = STYLE_MODIFIERS[style] || "";
  const colorMod = colorMode === "full" ? colorDesignModifier(colors) : COLOR_MODE_MODIFIERS[colorMode] || "";
  const modeMod =
    mode === "video"
      ? "cinematic 16:9 film keyframe"
      : MINIMAL_STYLES.has(style)
        ? "clean minimal flat composition, uncluttered plain background"
        : "highly detailed, sharp focus";

  const parts = [subject, styleMod, colorMod, modeMod].filter(Boolean);
  const finalPrompt = parts.join(", ").slice(0, 1500);

  // --- Dimensions: video = 16:9 keyframe, image = square (native max) ---
  const width = mode === "video" ? 1280 : 1024;
  const height = mode === "video" ? 720 : 1024;

  // --- Quality (1-5): only the lowest uses the fast "turbo" model ---
  const q = Number(quality) || 4;
  const model = q <= 1 ? "turbo" : MODEL_BY_STYLE[style] || "flux";

  // Seed locking: a client-provided seed keeps the character looking the same
  // across regenerations and storyboard scenes. Random only when not given.
  const requestedSeed = Number(payload.seed);
  const seed =
    Number.isInteger(requestedSeed) && requestedSeed >= 0 && requestedSeed < 2147483648
      ? requestedSeed
      : Math.floor(Math.random() * 2147483647);

  const imageUrl =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(finalPrompt) +
    `?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

  // `references` (uploaded images) are accepted for forward-compatibility but
  // not yet used for image-to-image (free image-to-image needs hosted URLs).

  return sendJson(res, 200, {
    ok: true,
    imageUrl,
    provider: "pollinations",
    model,
    seed,
    promptSource: promptEngine,
    mode: mode || "image",
    colorMode: colorMode || "full"
  });
};
