// Shared LLM prompt-engineering engine ("figure out the idea, write the best
// image prompt"). Used by api/prompt.js (Enhance button) and api/generate.js
// (automatic rewriting before every render).
//
// Provider chain, first available wins:
//   1. OpenAI GPT (only when OPENAI_API_KEY is configured — server-side only)
//   2. Pollinations text API (free, no key, "openai" model)
// A null result means "no provider answered" — callers fall back gracefully.

const POLLINATIONS_OPENAI = "https://text.pollinations.ai/openai";
const OPENAI_BASE = "https://api.openai.com/v1";
const MAX_PROMPT_CHARS = 900;

const SYSTEM_INSTRUCTION = [
  "You are an expert prompt engineer for AI image generation models (FLUX-class).",
  "Rewrite the user's creative idea into ONE optimized image prompt.",
  "Rules:",
  "- Identify what the idea actually is (subject, action, mood, genre) and make it concrete.",
  "- Add specifics the model needs: environment, action/pose, lighting, palette hints, camera or composition.",
  "- Respect the requested character style; for minimal styles (stickman/vector/sketch/whiteboard) request simple flat doodle rendering with plain white background.",
  "- Never add meta text, quotes, preambles, or explanations. Output ONLY the final prompt text.",
  "- Maximum 90 words. English."
].join(" ");

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function viaOpenAI(userPrompt, hints) {
  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) return null;
  try {
    const res = await fetchWithTimeout(
      `${OPENAI_BASE}/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: (process.env.OPENAI_MODEL || "gpt-4o-mini").trim(),
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: `${hints}\n\nCreative idea: ${userPrompt}` }
          ],
          max_tokens: 220,
          temperature: 0.7
        })
      },
      30000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return text && text.trim() ? { provider: "openai", prompt: text.trim() } : null;
  } catch {
    return null;
  }
}

async function viaPollinations(userPrompt, hints) {
  try {
    const res = await fetchWithTimeout(
      POLLINATIONS_OPENAI,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: `${hints}\n\nCreative idea: ${userPrompt}` }
          ]
        })
      },
      30000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    return text && text.trim() ? { provider: "pollinations", prompt: text.trim() } : null;
  } catch {
    return null;
  }
}

function clampPrompt(text) {
  return String(text).replace(/^["'`]+|["'`]+$/g, "").trim().slice(0, MAX_PROMPT_CHARS);
}

// Returns { provider, prompt } or null. Every failure is silent by design —
// callers keep the user's original prompt when no LLM answers.
async function enhanceWithLLM(userPrompt, hints) {
  const gpt = await viaOpenAI(userPrompt, hints);
  if (gpt) return { provider: gpt.provider, prompt: clampPrompt(gpt.prompt) };
  const free = await viaPollinations(userPrompt, hints);
  if (free) return { provider: free.provider, prompt: clampPrompt(free.prompt) };
  return null;
}

// LLM scene direction: breaks a narration script into a shot list of vivid
// visual descriptions for the storyboard workflow. Same provider chain as
// enhanceWithLLM (OpenAI GPT when keyed, free Pollinations text API).
// Returns an array of shot description strings, or null when no provider
// answers — callers fall back to the mechanical sentence splitter.
async function breakdownScenes(script, maxScenes = 8) {
  const system = [
    "You are a storyboard director for AI-generated animation.",
    "Break the user's script into up to " + maxScenes + " shots.",
    "Each shot: ONE vivid sentence of pure visual description (what is on screen: subject, action, framing, lighting).",
    "Cover the whole script in order; adapt shot count to script length.",
    'Output ONLY a JSON array of strings, like ["description", "description"]. No other text.'
  ].join(" ");
  const user = `Script: ${String(script || "").slice(0, 4000)}`;

  const attempts = [
    { provider: "openai", url: `${OPENAI_BASE}/chat/completions`, needsKey: true, json: true },
    { provider: "pollinations", url: POLLINATIONS_OPENAI, needsKey: false, json: false }
  ];

  for (const attempt of attempts) {
    if (attempt.needsKey && !(process.env.OPENAI_API_KEY || "").trim()) continue;
    try {
      const body = {
        model: attempt.provider === "openai" ? (process.env.OPENAI_MODEL || "gpt-4o-mini").trim() : "openai",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      };
      if (attempt.json) {
        body.response_format = { type: "json_object" };
      }
      const res = await fetchWithTimeout(attempt.url, {
        method: "POST",
        headers: attempt.needsKey
          ? { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY.trim()}` }
          : { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }, 45000);
      if (!res.ok) continue;
      const data = await res.json();
      const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!text) continue;
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) continue;
      const parsed = JSON.parse(match[0]);
      const shots = (Array.isArray(parsed) ? parsed : [])
        .map((entry) => String(entry && typeof entry === "object" && entry.description ? entry.description : entry).trim())
        .filter(Boolean)
        .slice(0, maxScenes);
      if (shots.length) return { provider: attempt.provider, scenes: shots };
    } catch {
      // try next provider
    }
  }
  return null;
}

module.exports = {
  enhanceWithLLM,
  breakdownScenes,
  clampPrompt,
  SYSTEM_INSTRUCTION,
  MAX_PROMPT_CHARS
};
