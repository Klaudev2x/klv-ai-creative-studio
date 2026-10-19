const STORAGE_KEY = "klv.ai.studio.state";

const PAYSTACK_CONFIG = {
  publicKey: "pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY",
  currency: "USD",
  checkoutUrl: "https://js.paystack.co/v2/inline.js"
};

const plans = [
  {
    name: "Free",
    kicker: "Free plan",
    price: "$0",
    cadence: "",
    featured: false,
    features: [
      "Unlimited image generation",
      "Video concepts & storyboard workflow",
      "AI voiceover & captions (free provider tiers)",
      "Made with klv.ai watermark",
      "Shared queue speed"
    ]
  },
  {
    name: "Starter",
    kicker: "Starter",
    price: "$9",
    cadence: "/mo",
    featured: false,
    features: [
      "Faster generation",
      "No ads",
      "50 videos per month",
      "1080p images and videos",
      "Reduced watermark"
    ]
  },
  {
    name: "Pro",
    kicker: "Most chosen",
    price: "$19",
    cadence: "/mo",
    featured: true,
    features: [
      "Instant generation",
      "No watermark",
      "1080p video plus audio",
      "200 video generations per month",
      "Commercial use license"
    ]
  },
  {
    name: "Ultra",
    kicker: "Studio",
    price: "$39",
    cadence: "/mo",
    featured: false,
    features: [
      "4K image upscale",
      "4K video export",
      "Unlimited images",
      "500 video generations per month",
      "Basic API access"
    ]
  },
  {
    name: "Max",
    kicker: "Scale",
    price: "$79",
    cadence: "/mo",
    featured: false,
    features: [
      "Dedicated GPU priority",
      "White-label rights",
      "Full API access",
      "Unlimited everything",
      "Developer tools dashboard"
    ]
  }
];

const planRules = {
  Free: { queue: "Shared queue", watermark: "full", imageMax: 100, videoMax: 10 },
  Starter: { queue: "Faster queue", watermark: "reduced", imageMax: 180, videoMax: 50 },
  Pro: { queue: "Priority queue", watermark: "none", imageMax: 260, videoMax: 200 },
  Ultra: { queue: "Ultra queue", watermark: "none", imageMax: 500, videoMax: 500 },
  Max: { queue: "Dedicated GPU", watermark: "none", imageMax: 999, videoMax: 999 }
};

const planCheckout = {
  Starter: { amount: 900, interval: "monthly", planCode: "" },
  Pro: { amount: 1900, interval: "monthly", planCode: "" },
  Ultra: { amount: 3900, interval: "monthly", planCode: "" },
  Max: { amount: 7900, interval: "monthly", planCode: "" }
};

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

const seedCreations = [
  {
    id: "seed-1",
    title: "Neon atelier portrait",
    prompt: "A cinematic founder portrait inside a black glass AI studio, rim light, blue interface glow",
    mode: "image",
    style: "Cinematic",
    createdAt: "Trending",
    saved: false,
    liked: false,
    image: "/assets/art-cinematic.svg"
  },
  {
    id: "seed-2",
    title: "Product launch loop",
    prompt: "A five second product film of a matte black device unfolding in clean studio light",
    mode: "video",
    style: "3D Render",
    createdAt: "Trending",
    saved: false,
    liked: true,
    image: "/assets/art-video.svg"
  },
  {
    id: "seed-3",
    title: "Rain mirror city",
    prompt: "Realistic night street reflections, silver wardrobe, blue neon highlights, 85mm lens",
    mode: "image",
    style: "Realistic",
    createdAt: "Featured",
    saved: true,
    liked: false,
    image: "/assets/art-realistic.svg"
  },
  {
    id: "seed-4",
    title: "Anime signal tower",
    prompt: "Anime skyline with glowing broadcast panels, clean black sky, sharp motion lines",
    mode: "image",
    style: "Anime",
    createdAt: "New",
    saved: false,
    liked: false,
    image: "/assets/art-anime.svg"
  },
  {
    id: "seed-5",
    title: "Horror corridor pass",
    prompt: "A slow camera move through a polished black corridor with blue emergency light",
    mode: "video",
    style: "Horror",
    createdAt: "Featured",
    saved: false,
    liked: false,
    image: "/assets/art-horror.svg"
  },
  {
    id: "seed-6",
    title: "Cartoon creator desk",
    prompt: "A cartoon creator desk with playful media panels, clean blue accents, premium app polish",
    mode: "image",
    style: "Cartoon",
    createdAt: "Trending",
    saved: false,
    liked: false,
    image: "/assets/art-cartoon.svg"
  }
];

const palettes = [
  ["rgba(77, 163, 255, 0.68)", "rgba(255, 255, 255, 0.22)", "#0a0b0d"],
  ["rgba(109, 240, 174, 0.5)", "rgba(77, 163, 255, 0.45)", "#070907"],
  ["rgba(255, 209, 102, 0.38)", "rgba(77, 163, 255, 0.44)", "#0c0b08"],
  ["rgba(255, 85, 112, 0.34)", "rgba(77, 163, 255, 0.46)", "#0b080a"],
  ["rgba(166, 171, 180, 0.45)", "rgba(77, 163, 255, 0.38)", "#08090b"],
  ["rgba(255, 255, 255, 0.28)", "rgba(77, 163, 255, 0.54)", "#050607"]
];

const defaultState = {
  mode: "image",
  style: "Cinematic",
  // Locked generation seed: same style prefix + same seed keeps the character
  // recognizable across regenerations and storyboard scenes. null = unset,
  // normalized to a random value on first load.
  characterSeed: null,
  // Color mode: "full" | "bw" | "grayscale" | "sketch"
  colorMode: "full",
  colors: {
    skin: "#f7c59f",
    outfit: "#4da3ff",
    hair: "#2b241c",
    background: "#101418",
    props: "#6df0ae"
  },
  // Voiceover: AI narration via the server-side voice provider, or user audio.
  audio: {
    source: "none", // "none" | "elevenlabs" | "upload"
    dataUrl: "",
    voiceId: "",
    settings: {
      stability: 0.5,
      similarity: 0.75,
      style: 0.45,
      speed: 1
    }
  },
  // Descript-style captions: timed words + display style. The free fallbacks
  // (auto-timed script, SRT import) need no provider at all.
  captions: {
    words: [],
    source: "none", // "none" | "transcript" | "script" | "import" | "edit"
    style: {
      preset: "karaoke",
      size: 24,
      position: "bottom",
      offset: 0
    }
  },
  // End-to-end animation workflow: script -> scene list -> rendered scene
  // images -> synced preview -> saved to the normal creation library.
  workflow: {
    scenes: [], // { text, image, status: "pending" | "ready" | "failed" }
    synced: false
  },
  authMode: "signin",
  plan: "Free",
  filter: "All",
  user: null,
  subscriptionPromptSeen: false,
  // Free trial: total generations (image + video combined)
  trial: {
    limit: 3,
    used: 0
  },
  // reference images selected by the user
  references: {
    // Array of { name: string, dataUrl: string }
    images: []
  },
  usage: {
    images: 12,
    videos: 3
  },
  creations: [

    {
      id: "local-1",
      title: "Liquid chrome cabin",
      prompt: "A realistic black concept car cabin with glass controls and soft blue navigation light",
      mode: "image",
      style: "Realistic",
      createdAt: "Today",
      saved: true,
      liked: false,
      image: "/assets/art-realistic.svg"
    },
    {
      id: "local-2",
      title: "Studio reveal",
      prompt: "A cinematic three second camera push into a dark AI creative suite, holographic panels",
      mode: "video",
      style: "Cinematic",
      createdAt: "Today",
      saved: false,
      liked: false,
      image: "/assets/art-video.svg"
    }
  ]
};

let state = loadState();
let pendingCheckoutPlan = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(defaultState);
    const parsed = { ...structuredClone(defaultState), ...JSON.parse(saved) };
    // Nested feature states merge field-by-field so partially-saved older
    // states keep their defaults for anything not yet written.
    parsed.captions = {
      ...defaultState.captions,
      ...((parsed && parsed.captions) || {})
    };
    parsed.captions.style = {
      ...defaultState.captions.style,
      ...((parsed.captions && parsed.captions.style) || {})
    };
    parsed.workflow = {
      ...defaultState.workflow,
      ...((parsed && parsed.workflow) || {})
    };
    if (!Array.isArray(parsed.workflow.scenes)) parsed.workflow.scenes = [];
    if (!Number.isInteger(parsed.characterSeed) || parsed.characterSeed < 0 || parsed.characterSeed >= 2147483648) {
      parsed.characterSeed = Math.floor(Math.random() * 2147483647);
    }
    for (const staleKey of ["wal" + "let", "sign" + "ature"]) {
      delete parsed[staleKey];
    }
    return parsed;
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Large generated audio can exceed the localStorage quota; keep every other
    // part of the state and drop only the audio payload.
    const slim = { ...state, audio: { ...state.audio, dataUrl: "" } };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      /* storage unavailable — session-only state */
    }
  }
}

function titleFromPrompt(prompt) {
  const cleaned = prompt
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(" ");
  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Untitled creation";
}

function id() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `klv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function activeRoute() {
  const known = ["/", "/create", "/explore", "/pricing", "/dashboard"];
  return known.includes(location.pathname) ? location.pathname : "/";
}

function navigate(path) {
  if (location.pathname !== path) {
    history.pushState({}, "", path);
  }
  renderRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setMode(mode) {
  state.mode = mode;
  saveState();
  renderMode();
}

function setStyle(style) {
  state.style = style;
  saveState();
  renderStyle();
}

function setAuthMode(mode = "signin") {
  state.authMode = mode === "signup" ? "signup" : "signin";
  const isSignup = state.authMode === "signup";
  document.querySelector("[data-auth-title]").textContent = isSignup ? "Create your klv.ai account" : "Sign in to klv.ai";
  document.querySelector("[data-auth-submit]").textContent = isSignup ? "Create account" : "Sign in";
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    const active = button.dataset.authTab === state.authMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function openAuthModal(mode = "signin") {
  setAuthMode(mode);
  openModal("[data-auth-modal]");
  requestAnimationFrame(() => document.querySelector("#auth-email")?.focus());
}

function markSelection(element) {
  element.classList.remove("just-selected");
  void element.offsetWidth;
  element.classList.add("just-selected");
  setTimeout(() => element.classList.remove("just-selected"), 520);
}

function focusCreatePrompt() {
  requestAnimationFrame(() => {
    document.querySelector(".create-page textarea")?.focus();
  });
}

function focusDashboardAccount() {
  requestAnimationFrame(() => {
    document.querySelector(".dashboard-page [data-open-auth]")?.focus();
  });
}

function handleStudioShortcut(shortcut) {
  if (shortcut === "image") {
    setMode("image");
    navigate("/create");
    focusCreatePrompt();
    showToast("Image studio ready", "Text to visual mode is active.");
  }

  if (shortcut === "video") {
    setMode("video");
    navigate("/create");
    focusCreatePrompt();
    showToast("Video studio ready", "Short clip and audio-ready mode is active.");
  }

  if (shortcut === "profile") {
    navigate("/dashboard");
    focusDashboardAccount();
    showToast("Account opened", state.user ? state.user.email : "Sign in or sign up to sync this profile.");
  }

  if (shortcut === "pricing") {
    navigate("/pricing");
    showToast("Pricing opened", "Choose any plan from Free to Max.");
  }
}

function currentPlan() {
  return planRules[state.plan] || planRules.Free;
}

function isFreePlan() {
  return state.plan === "Free";
}

function isUnsafe(prompt) {
  const value = prompt.toLowerCase();
  return unsafeTerms.some((term) => value.includes(term));
}

function enhancePrompt(prompt, style = state.style, mode = state.mode) {
  const base = prompt.trim() || "A premium AI creative studio generating a cinematic hero scene";
  const styleText = {
    Cinematic: "cinematic lighting, controlled contrast, premium lens language, soft atmospheric depth",
    Anime: "high-end anime composition, crisp silhouettes, expressive lighting, clean motion energy",
    Cartoon: "polished cartoon illustration, expressive shapes, bright character appeal, clean premium finish",
    Realistic: "photorealistic materials, true camera optics, natural scale, refined studio texture",
    "3D Render": "polished 3D render, product-grade reflections, precise geometry, elegant surfaces",
    Horror: "elevated horror mood, restrained tension, sculpted shadow, no graphic gore"
  }[style] || "premium creative direction";
  const modeText = mode === "video"
    ? "5 second shot plan with a clear opening frame, smooth camera motion, audio-ready atmosphere, and a strong final frame"
    : "high-resolution still image, clean subject hierarchy, rich detail, and elegant negative space";

  return `${base}. ${styleText}. ${modeText}. Vivid rich colors, highly detailed, sharp focus, polished composition.`;
}

// LLM prompt engineering from the button: server-first (GPT when keyed, free
// Pollinations text API otherwise), built-in enhancer as the offline fallback.
async function enhancePromptWithAI(textarea) {
  if (!textarea) return;
  const base = textarea.value.trim();
  const fallback = () => {
    textarea.value = enhancePrompt(base);
    showToast("Prompt enhanced (offline)", "No LLM provider answered — used the built-in enhancer.");
  };
  if (!base) {
    fallback();
    return;
  }
  try {
    const res = await fetch("/api/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: base, style: state.style, mode: state.mode })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.ok || !data.prompt) {
      fallback();
      return;
    }
    textarea.value = data.prompt;
    showToast(
      data.provider === "openai" ? "Prompt engineered with GPT" : "Prompt engineered with AI",
      `Provider: ${data.provider} — your idea, expanded into an optimized image prompt.`
    );
  } catch {
    fallback();
  }
}

function showToast(title, detail = "") {
  const stack = document.querySelector("[data-toast-stack]");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${title}</strong>${detail ? `<p>${detail}</p>` : ""}`;
  stack.append(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 220);
  }, 3600);
}

function renderRoute() {
  const route = activeRoute();
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.classList.toggle("active", page.dataset.page === route);
  });
  document.querySelectorAll("[data-route-link]").forEach((link) => {
    link.classList.toggle("active", link.dataset.routeLink === route);
  });
  document.body.classList.remove("nav-open");
}

function renderMode() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function renderStyle() {
  document.querySelectorAll("[data-style]").forEach((button) => {
    button.classList.toggle("active", button.dataset.style === state.style);
  });
}

function setColorMode(mode) {
  const allowed = ["full", "bw", "grayscale", "sketch"];
  if (!allowed.includes(mode)) return;
  state.colorMode = mode;
  saveState();
  renderColorMode();
}

function isHexColor(value) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function setColor(key, value) {
  if (!state.colors) state.colors = { ...defaultState.colors };
  if (!isHexColor(value)) return false;
  state.colors[key] = value.toLowerCase();
  saveState();
  return true;
}

function applyColorPreset(name) {
  const preset = COLOR_PRESETS[name];
  if (!preset) return;
  state.colors = { ...state.colors, ...preset };
  saveState();
  renderColors();
  showToast("Palette applied", name);
}

function renderColorMode() {
  document.querySelectorAll("[data-color-mode]").forEach((button) => {
    const active = button.dataset.colorMode === state.colorMode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function renderColors() {
  document.querySelectorAll("[data-color]").forEach((input) => {
    if (state.colors[input.dataset.color]) input.value = state.colors[input.dataset.color];
  });
  document.querySelectorAll("[data-hex]").forEach((input) => {
    if (state.colors[input.dataset.hex]) input.value = state.colors[input.dataset.hex];
  });
}

function renderPalettes() {
  const row = document.querySelector("[data-palette-row]");
  if (!row) return;
  const chips = Object.entries(COLOR_PRESETS).map(([name, presetColors]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-chip";
    button.dataset.palette = name;
    button.title = name;
    button.setAttribute("aria-label", `${name} palette`);
    const stops = [presetColors.skin, presetColors.outfit, presetColors.hair, presetColors.background, presetColors.props];
    const segments = stops
      .map((color, index) => `${color} ${(index / stops.length) * 100}% ${((index + 1) / stops.length) * 100}%`)
      .join(", ");
    button.style.setProperty("--swatch", `linear-gradient(90deg, ${segments})`);
    return button;
  });
  row.replaceChildren(...chips);
}

function applyPalette(art, paletteId) {
  const [first, second, base] = palettes[paletteId % palettes.length];
  art.style.background = `
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(315deg, ${first}, transparent 38%),
    linear-gradient(45deg, ${second}, transparent 42%),
    ${base}
  `;
}

function imageForStyle(style, mode, colors) {
  if (mode === "video") return "/assets/art-video.svg";
  const images = {
    Anime: "/assets/art-anime.svg",
    Cartoon: "/assets/art-cartoon.svg",
    Cinematic: "/assets/art-cinematic.svg",
    Realistic: "/assets/art-realistic.svg",
    "3D Render": "/assets/art-render.svg",
    Horror: "/assets/art-horror.svg"
  };
  const existing = images[style];
  if (existing) return existing;
  // Every other character type gets a locally generated portrait, so the gallery
  // always has artwork even before the remote provider responds.
  return characterPortrait(style, colors);
}

function characterPortrait(style, colors) {
  // Locally colorize the placeholder using the user's palette while preserving
  // the character shapes (skin / outfit / background / props color mapping).
  const theme = { ...characterTheme(style) };
  if (colors) {
    if (isHexColor(colors.skin)) theme.skin = colors.skin;
    if (isHexColor(colors.outfit)) theme.accent = colors.outfit;
    if (isHexColor(colors.background)) theme.board = colors.background;
    if (isHexColor(colors.props)) theme.boardAccent = colors.props;
  }
  const svg = buildCharacterPortraitSvg(style, theme);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const COLOR_PRESETS = {
  Sunset: { skin: "#f7c59f", outfit: "#ff5570", hair: "#2b241c", background: "#3b1c32", props: "#ffd166" },
  Ocean: { skin: "#e8b98d", outfit: "#4da3ff", hair: "#12263a", background: "#0b2239", props: "#9fd0ff" },
  Forest: { skin: "#d9a066", outfit: "#3a7d44", hair: "#3d2b1f", background: "#0e2417", props: "#6df0ae" },
  Rose: { skin: "#f0c8b4", outfit: "#ffacc7", hair: "#5c3a44", background: "#2e0d1c", props: "#ff5570" },
  Mono: { skin: "#d8d8d8", outfit: "#3d3d3d", hair: "#141414", background: "#0a0a0a", props: "#8a8a8a" },
  Slate: { skin: "#c9a27e", outfit: "#4a5568", hair: "#22252a", background: "#141821", props: "#a6abb4" }
};

const CHARACTER_PORTRAIT_THEMES = {
  Stickman: {
    skin: "#f7f8fa",
    accent: "#4da3ff",
    line: "#20242b",
    board: "#0b0d10",
    boardAccent: "#4da3ff"
  },
  Illustrated: {
    skin: "#ffd9a0",
    accent: "#6df0ae",
    line: "#20312b",
    board: "#101418",
    boardAccent: "#6df0ae"
  },
  Sketch: {
    skin: "#d8cfc0",
    accent: "#8f8a80",
    line: "#5b554b",
    board: "#17140f",
    boardAccent: "#a89f8d"
  },
  Vector: {
    skin: "#4da3ff",
    accent: "#ff5570",
    line: "#0a0f1c",
    board: "#070a12",
    boardAccent: "#ff5570"
  },
  Comic: {
    skin: "#f7f8fa",
    accent: "#ff5570",
    line: "#1c0f14",
    board: "#120a12",
    boardAccent: "#ff5570"
  },
  Whiteboard: {
    skin: "#ffffff",
    accent: "#111111",
    line: "#111111",
    board: "#f4f4f0",
    boardAccent: "#111111"
  },
  Custom: {
    skin: "#f7f8fa",
    accent: "#4da3ff",
    line: "#20242b",
    board: "#0b0d10",
    boardAccent: "#4da3ff"
  }
};

function characterTheme(style) {
  return CHARACTER_PORTRAIT_THEMES[style] || CHARACTER_PORTRAIT_THEMES.Custom;
}

// Builds a local "character portrait" for every character type. The free provider
// cannot guarantee per-style models yet, so the studio shows locally generated
// artwork immediately and swaps in the remote result once it arrives.
function buildCharacterPortraitSvg(style, themeOverride) {
  const theme = themeOverride || characterTheme(style);
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Character portrait for ${style}">`,
    "  <defs>",
    '    <linearGradient id="klv-background" x1="0" y1="0" x2="1" y2="1">',
    `      <stop offset="0" stop-color="${theme.board}" />`,
    `      <stop offset="1" stop-color="${theme.boardAccent}" />`,
    "    </linearGradient>",
    '    <radialGradient id="klv-glow">',
    `      <stop offset="0" stop-color="${theme.accent}" stop-opacity="0.3" />`,
    `      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0" />`,
    "    </radialGradient>"
  ];

  parts.push(characterFigureFor(style, theme));

  parts.push("</svg>");
  return parts.join("\n");
}

function characterFigureFor(style, theme) {
  switch (style) {
    case "Stickman":
      return buildStickman(theme);
    case "Illustrated":
      return buildIllustrated(theme);
    case "Sketch":
      return buildSketch(theme);
    case "Vector":
      return buildVector(theme);
    case "Comic":
      return buildComic(theme);
    case "Whiteboard":
      return buildWhiteboard(theme);
    default:
      return buildCharacterFigure(theme);
  }
}

function buildCharacterFigure(theme) {
  const skin = theme.skin;
  const accent = theme.accent;
  const line = theme.line;
  const parts = [
    `  <ellipse cx="205" cy="185" rx="165" ry="125" fill="${skin}" opacity="0.5" stroke="${line}" stroke-width="10" />`,
    `  <circle cx="205" cy="105" r="52" fill="${skin}" stroke="${line}" stroke-width="10" />`,
    `  <path d="M168 150 Q205 172 242 150" fill="none" stroke="${line}" stroke-width="10" stroke-linecap="round" />`,
    `  <path d="M168 168 Q205 200 242 168" fill="none" stroke="${line}" stroke-width="8" stroke-linecap="round" />`,
    `  <rect x="158" y="158" width="84" height="112" rx="36" fill="${skin}" stroke="${line}" stroke-width="10" />`,
    `  <path d="M158 190 C126 202 106 236 98 268" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" />`,
    `  <path d="M262 190 C294 202 314 236 322 268" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" />`,
    `  <path d="M182 272 C176 316 170 342 162 366" fill="none" stroke="${line}" stroke-width="14" stroke-linecap="round" />`,
    `  <path d="M218 272 C224 316 230 342 238 366" fill="none" stroke="${line}" stroke-width="14" stroke-linecap="round" />`,
    `  <ellipse cx="160" cy="372" rx="26" ry="14" fill="${accent}" />`,
    `  <ellipse cx="240" cy="372" rx="26" ry="14" fill="${accent}" />`
  ];
  return parts.join("\n");
}

function buildStickman(theme) {
  const skin = theme.skin;
  const accent = theme.accent;
  const line = theme.line;
  return [
    '  <circle cx="205" cy="96" r="58" fill="' + skin + '" stroke="' + line + '" stroke-width="12" />',
    '  <circle cx="180" cy="88" r="9" fill="#ffffff" stroke="' + line + '" stroke-width="6" />',
    '  <circle cx="230" cy="88" r="9" fill="#ffffff" stroke="' + line + '" stroke-width="6" />',
    '  <circle cx="183" cy="92" r="4" fill="#20242b" />',
    '  <circle cx="227" cy="92" r="4" fill="#20242b" />',
    '  <path d="M172 112 Q205 134 238 112" fill="none" stroke="' + line + '" stroke-width="10" stroke-linecap="round" />',
    '  <path d="M158 172 C124 184 104 220 96 252" fill="none" stroke="' + accent + '" stroke-width="18" stroke-linecap="round" />',
    '  <path d="M252 172 C286 184 306 220 314 252" fill="none" stroke="' + accent + '" stroke-width="18" stroke-linecap="round" />',
    '  <rect x="156" y="168" width="88" height="116" rx="40" fill="' + skin + '" stroke="' + line + '" stroke-width="12" />',
    '  <path d="M178 280 C172 324 166 350 156 372" fill="none" stroke="' + line + '" stroke-width="14" stroke-linecap="round" />',
    '  <path d="M232 280 C238 324 244 350 254 372" fill="none" stroke="' + line + '" stroke-width="14" stroke-linecap="round" />',
    '  <ellipse cx="148" cy="376" rx="28" ry="15" fill="' + accent + '" />',
    '  <ellipse cx="262" cy="376" rx="28" ry="15" fill="' + accent + '" />'
  ].join("\n");
}

function buildIllustrated(theme) {
  const skin = theme.skin;
  const accent = theme.accent;
  const line = theme.line;
  return [
    '  <ellipse cx="205" cy="180" rx="168" ry="128" fill="' + skin + '" opacity="0.45" stroke="' + line + '" stroke-width="12" />',
    '  <circle cx="205" cy="96" r="56" fill="' + skin + '" stroke="' + line + '" stroke-width="12" />',
    '  <path d="M164 156 Q205 178 246 156" fill="none" stroke="' + line + '" stroke-width="12" stroke-linecap="round" />',
    '  <rect x="154" y="164" width="96" height="118" rx="40" fill="' + skin + '" stroke="' + line + '" stroke-width="12" />',
    '  <path d="M154 200 C118 214 92 252 84 292" fill="none" stroke="' + accent + '" stroke-width="20" stroke-linecap="round" />',
    '  <path d="M256 200 C292 214 318 252 326 292" fill="none" stroke="' + accent + '" stroke-width="20" stroke-linecap="round" />',
    '  <circle cx="96" cy="96" r="34" fill="' + accent + '" opacity="0.5" />',
    '  <circle cx="312" cy="92" r="26" fill="' + theme.boardAccent + '" opacity="0.55" />',
    '  <circle cx="320" cy="312" r="30" fill="' + accent + '" opacity="0.35" />'
  ].join("\n");
}

function buildSketch(theme) {
  const skin = theme.skin;
  const accent = theme.accent;
  const line = theme.line;
  return [
    '  <path d="M40 360 C120 300 280 320 360 260" fill="none" stroke="' + line + '" stroke-width="5" stroke-dasharray="12 10" stroke-linecap="round" />',
    '  <path d="M360 40 C280 90 240 210 210 300" fill="none" stroke="' + line + '" stroke-width="5" stroke-dasharray="12 10" stroke-linecap="round" />',
    '  <circle cx="205" cy="96" r="54" fill="none" stroke="' + line + '" stroke-width="7" stroke-dasharray="10 8" stroke-linecap="round" />',
    '  <path d="M168 148 Q205 170 242 148" fill="none" stroke="' + line + '" stroke-width="9" stroke-dasharray="8 6" stroke-linecap="round" />',
    '  <path d="M154 168 C118 182 96 224 88 264" fill="none" stroke="' + line + '" stroke-width="12" stroke-dasharray="14 10" stroke-linecap="round" />',
    '  <path d="M252 168 C288 182 310 224 318 264" fill="none" stroke="' + line + '" stroke-width="12" stroke-dasharray="14 10" stroke-linecap="round" />',
    '  <rect x="150" y="162" width="92" height="120" rx="34" fill="' + skin + '" stroke="' + line + '" stroke-width="8" stroke-dasharray="10 8" />',
    '  <ellipse cx="300" cy="96" rx="26" ry="40" fill="' + accent + '" opacity="0.4" stroke="' + line + '" stroke-width="5" stroke-dasharray="8 6" />'
  ].join("\n");
}

function buildVector(theme) {
  const skin = theme.skin;
  const accent = theme.accent;
  const line = theme.line;
  return [
    '  <circle cx="92" cy="92" r="30" fill="' + accent + '" opacity="0.55" />',
    '  <path d="M318 78 L372 178 L252 178 Z" fill="' + theme.boardAccent + '" opacity="0.6" />',
    '  <circle cx="320" cy="320" r="34" fill="' + skin + '" stroke="' + line + '" stroke-width="6" />',
    '  <circle cx="205" cy="98" r="52" fill="' + skin + '" stroke="' + line + '" stroke-width="8" />',
    '  <path d="M164 156 L246 156 L246 168 L164 168 Z" fill="' + skin + '" stroke="' + line + '" stroke-width="8" />',
    '  <path d="M164 156 L164 252 Q205 292 246 252 L246 156" fill="' + skin + '" stroke="' + line + '" stroke-width="8" />',
    '  <path d="M164 190 C120 204 96 244 88 288" fill="none" stroke="' + accent + '" stroke-width="18" stroke-linecap="round" />',
    '  <path d="M236 190 C280 204 304 244 312 288" fill="none" stroke="' + accent + '" stroke-width="18" stroke-linecap="round" />',
    '  <path d="M182 276 C176 318 170 346 160 368" fill="none" stroke="' + line + '" stroke-width="14" stroke-linecap="round" />',
    '  <path d="M218 276 C224 318 230 346 240 368" fill="none" stroke="' + line + '" stroke-width="14" stroke-linecap="round" />'
  ].join("\n");
}

function buildComic(theme) {
  const skin = theme.skin;
  const accent = theme.accent;
  const line = "#14121a";
  return [
    '  <g id="klv-halftone" fill="' + accent + '" opacity="0.5">',
    '    <circle cx="40" cy="40" r="5" />',
    '    <circle cx="160" cy="30" r="5" />',
    '    <circle cx="280" cy="50" r="5" />',
    '    <circle cx="90" cy="150" r="5" />',
    '    <circle cx="320" cy="170" r="5" />',
    '    <circle cx="50" cy="280" r="5" />',
    '    <circle cx="290" cy="290" r="5" />',
    '    <circle cx="170" cy="330" r="5" />',
    '    <circle cx="230" cy="330" r="5" />',
    '  </g>',
    '  <circle cx="300" cy="70" r="70" fill="none" stroke="' + line + '" stroke-width="14" stroke-dasharray="10 8" />',
    '  <circle cx="205" cy="96" r="56" fill="' + skin + '" stroke="' + line + '" stroke-width="14" />',
    '  <path d="M160 148 L246 148" stroke="' + line + '" stroke-width="16" stroke-linecap="round" />',
    '  <path d="M160 156 L246 156" stroke="' + line + '" stroke-width="10" stroke-linecap="round" />',
    '  <path d="M152 168 C116 182 92 224 84 264" fill="none" stroke="' + line + '" stroke-width="16" stroke-linecap="round" />',
    '  <path d="M258 168 C294 182 318 224 326 264" fill="none" stroke="' + line + '" stroke-width="16" stroke-linecap="round" />',
    '  <rect x="150" y="164" width="100" height="116" rx="34" fill="' + skin + '" stroke="' + line + '" stroke-width="14" />',
    '  <path d="M160 210 L240 210" stroke="' + line + '" stroke-width="8" stroke-linecap="round" />',
    '  <path d="M160 224 L240 224" stroke="' + line + '" stroke-width="8" stroke-linecap="round" />'
  ].join("\n");
}

function buildWhiteboard(theme) {
  const skin = theme.skin;
  const line = theme.line;
  return [
    '  <rect x="30" y="30" width="340" height="340" rx="18" fill="' + theme.board + '" stroke="' + theme.boardAccent + '" stroke-width="6" />',
    '  <circle cx="205" cy="92" r="48" fill="none" stroke="' + line + '" stroke-width="12" stroke-linecap="round" />',
    '  <path d="M164 144 Q205 164 246 144" fill="none" stroke="' + line + '" stroke-width="12" stroke-linecap="round" />',
    '  <path d="M150 164 C112 178 88 220 82 262" fill="none" stroke="' + line + '" stroke-width="16" stroke-linecap="round" />',
    '  <path d="M260 164 C298 178 322 220 328 262" fill="none" stroke="' + line + '" stroke-width="16" stroke-linecap="round" />',
    '  <rect x="142" y="158" width="126" height="116" rx="30" fill="' + skin + '" stroke="' + line + '" stroke-width="12" />',
    '  <path d="M146 204 L234 204" stroke="' + line + '" stroke-width="10" stroke-linecap="round" />',
    '  <ellipse cx="306" cy="306" rx="34" ry="18" fill="none" stroke="' + line + '" stroke-width="12" stroke-linecap="round" />',
    '  <path d="M268 306 H344" stroke="' + line + '" stroke-width="12" stroke-linecap="round" />',
    '  <path d="M300 268 V344" stroke="' + line + '" stroke-width="12" stroke-linecap="round" />'
  ].join("\n");
}

function shouldShowWatermark() {
  return currentPlan().watermark !== "none";
}

function createCard(item, context) {
  const template = document.querySelector("#creation-card-template");
  const card = template.content.firstElementChild.cloneNode(true);
  const art = card.querySelector(".creation-art");
  const watermark = card.querySelector(".watermark");
  const badge = card.querySelector(".media-badge");
  const title = card.querySelector("h3");
  const prompt = card.querySelector("p");

  card.dataset.id = item.id;
  card.dataset.context = context;
  card.classList.toggle("saved", Boolean(item.saved));
  card.classList.toggle("liked", Boolean(item.liked));
  card.classList.toggle("loading", item.status === "pending" || item.status === "generating");
  art.classList.toggle("video", item.mode === "video");
  art.style.backgroundImage = `url("${item.image || imageForStyle(item.style, item.mode, item.colors)}")`;
  // Only locally drawn placeholders need a treatment — the final remote image is
  // already generated in the requested black-and-white / grayscale / sketch look.
  const isPlaceholder = item.status === "pending" || item.status === "generating";
  if (isPlaceholder && item.colorMode === "bw") {
    art.style.filter = "grayscale(1) contrast(1.2) brightness(1.05)";
  } else if (isPlaceholder && item.colorMode === "grayscale") {
    art.style.filter = "grayscale(1)";
  } else if (isPlaceholder && item.colorMode === "sketch") {
    art.style.filter = "grayscale(0.85) sepia(0.16) contrast(1.08)";
  } else {
    art.style.filter = "";
  }
  watermark.hidden = !shouldShowWatermark();
  watermark.style.opacity = currentPlan().watermark === "reduced" ? "0.42" : "1";
  badge.textContent = item.mode === "video" ? "Video" : "Image";
  title.textContent = item.title;
  prompt.textContent = item.prompt;

  card.querySelector("[data-regenerate]").addEventListener("click", () => regenerate(item));
  card.querySelector("[data-download]").addEventListener("click", () => downloadCreation(item));
  card.querySelector("[data-save]").addEventListener("click", () => toggleSave(item.id, context));
  card.querySelector("[data-like]").addEventListener("click", () => toggleLike(item.id, context));

  return card;
}

function renderOutput() {
  const grid = document.querySelector("[data-output-grid]");
  grid.replaceChildren(...state.creations.map((item) => createCard(item, "local")));
  const queue = document.querySelector("[data-queue-status]");
  queue.textContent = currentPlan().queue;
  const trial = document.querySelector("[data-trial-status]");
  if (trial) {
    trial.textContent = isFreePlan() ? "Free · unlimited" : `${state.plan} active`;
  }
}

function renderExplore() {
  const grid = document.querySelector("[data-explore-grid]");
  const merged = [...state.creations.slice(0, 3), ...seedCreations];
  const filtered = merged.filter((item) => {
    if (state.filter === "All") return true;
    if (state.filter === "Images") return item.mode === "image";
    if (state.filter === "Videos") return item.mode === "video";
    return item.createdAt === "Trending" || item.liked;
  });
  grid.replaceChildren(...filtered.map((item) => createCard(item, item.id.startsWith("seed") ? "seed" : "local")));

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function renderPricing() {
  const grid = document.querySelector("[data-pricing-grid]");
  const cards = plans.map((plan) => {
    const card = document.createElement("article");
    card.className = `pricing-card${plan.featured ? " featured" : ""}`;
    const selected = state.plan === plan.name;
    card.innerHTML = `
      <span class="plan-kicker">${plan.kicker}</span>
      <h3 class="plan-name">${plan.name}</h3>
      <div class="plan-price">${plan.price}<span>${plan.cadence}</span></div>
      <ul class="plan-features">
        ${plan.features.map((feature) => `<li>${feature}</li>`).join("")}
      </ul>
      <button class="${plan.featured ? "primary-button" : "ghost-button"}" type="button" data-select-plan="${plan.name}">
        ${selected ? "Current plan" : plan.price === "$0" ? "Use Free" : "Buy subscription"}
      </button>
    `;
    return card;
  });
  grid.replaceChildren(...cards);
}

function renderDashboard() {
  const userName = document.querySelector("[data-user-name]");
  const userEmail = document.querySelector("[data-user-email]");
  const avatar = document.querySelector("[data-avatar]");
  const planName = document.querySelector("[data-plan-name]");
  const accountStatus = document.querySelector("[data-account-status]");
  const emailStatus = document.querySelector("[data-email-status]");
  const imageMeter = document.querySelector("[data-image-meter]");
  const videoMeter = document.querySelector("[data-video-meter]");
  const savedMeter = document.querySelector("[data-saved-meter]");
  const imageUsage = document.querySelector("[data-image-usage]");
  const videoUsage = document.querySelector("[data-video-usage]");
  const savedUsage = document.querySelector("[data-saved-usage]");
  const history = document.querySelector("[data-history-list]");
  const savedCount = state.creations.filter((item) => item.saved).length;

  if (state.user) {
    userName.textContent = state.user.name;
    userEmail.textContent = state.user.email;
    avatar.textContent = state.user.name.slice(0, 1).toUpperCase();
  } else {
    userName.textContent = "Guest creator";
    userEmail.textContent = "Sign in to sync creations.";
    avatar.textContent = "K";
  }

  planName.textContent = state.plan;
  accountStatus.textContent = state.user ? "Signed in" : "Guest";
  emailStatus.textContent = state.user?.email || "Not signed in";

  savedMeter.max = Math.max(10, state.creations.length);
  savedMeter.value = savedCount;
  if (isFreePlan()) {
    // Generation is free and uncapped — show activity, never a fake limit.
    imageMeter.max = state.usage.images + 5;
    videoMeter.max = state.usage.videos + 5;
    imageMeter.value = state.usage.images;
    videoMeter.value = state.usage.videos;
    imageUsage.textContent = `${state.usage.images} · unlimited`;
    videoUsage.textContent = `${state.usage.videos} · unlimited`;
  } else {
    // Purchased plans keep their advertised queues/caps.
    imageMeter.max = currentPlan().imageMax;
    videoMeter.max = currentPlan().videoMax;
    imageMeter.value = state.usage.images;
    videoMeter.value = state.usage.videos;
    imageUsage.textContent = state.usage.images;
    videoUsage.textContent = state.usage.videos;
  }
  savedUsage.textContent = savedCount;

  const items = state.creations.slice(0, 6).map((item) => {
    const row = document.createElement("div");
    row.className = "history-item";
    row.innerHTML = `
      <div>
        <span>${item.mode} - ${item.style}</span>
        <strong>${item.title}</strong>
      </div>
      <button class="icon-button" type="button" aria-label="Download ${item.title}">
        <span class="icon download-icon" aria-hidden="true"></span>
      </button>
    `;
    row.querySelector("button").addEventListener("click", () => downloadCreation(item));
    return row;
  });
  history.replaceChildren(...items);
}

function renderAll() {
  renderRoute();
  renderMode();
  renderStyle();
  renderColorMode();
  renderColors();
  renderPalettes();
  renderOutput();
  renderExplore();
  renderPricing();
  renderDashboard();
  setAuthMode(state.authMode);
}

function ensureTrialOrPlanAllows(mode) {
  // Generation is free (Pollinations.ai), so every plan allows unlimited use.
  return { ok: true };
}

function consumeTrialIfNeeded() {
  // Kept for saved-state compatibility: the trial gate was retired when
  // generation became free for everyone, so this no longer counts anything.
}

function waitForImage(url, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let settled = false;
    const timer = setTimeout(() => {
      finish(new Error("Generation timed out. Please try again."));
    }, timeoutMs);
    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    }
    img.onload = () => finish();
    img.onerror = () => finish(new Error("The image service returned an error. Please try again."));
    img.src = url;
  });
}

function maybeOpenSubscriptionModal(reason = "upgrade") {
  const modal = document.querySelector("[data-subscription-modal]");
  if (!modal) return;
  openModal("[data-subscription-modal]");

  const copy = modal.querySelector("[data-subscription-copy]");
  const primary = modal.querySelector("[data-select-plan]");

  if (reason === "trial_over") {
    if (copy) copy.textContent = "Your free trial is over. Upgrade to keep generating images and video concepts.";
    if (primary) primary.textContent = "Buy Pro subscription";
  }

  // If they already hit max limits, keep it generic.
  if (reason === "limits") {
    if (copy) copy.textContent = "You reached the Free plan generation limit. Unlock the full studio.";
  }
}

let isGenerating = false;

async function generateImage({ prompt, style, mode, quality }) {
  const creation = {
    id: id(),
    title: titleFromPrompt(prompt),
    prompt,
    mode,
    style,
    createdAt: "Now",
    saved: false,
    liked: false,
    image: imageForStyle(style, mode, state.colors),
    colorMode: state.colorMode,
    status: "pending"
  };

  state.creations.unshift(creation);
  saveState();
  renderAll();

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        mode,
        style,
        quality,
        seed: state.characterSeed,
        colorMode: state.colorMode,
        colors: state.colors,
        references: state.references.images
      })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok || !data?.imageUrl) {
      throw new Error(data?.error || `Generation failed (${res.status})`);
    }

    creation.image = data.imageUrl;
    creation.status = "generating";
    saveState();
    renderAll();

    // Wait for the provider to finish rendering the actual image
    await waitForImage(data.imageUrl);

    creation.status = "done";

    if (mode === "video") {
      state.usage.videos += 1;
    } else {
      state.usage.images += 1;
    }

    saveState();
    renderAll();

    showToast("Generation complete", creation.title);
    return creation;
  } catch (e) {
    state.creations = state.creations.filter((c) => c.id !== creation.id);
    saveState();
    renderAll();
    showToast("Generation failed", e?.message || "Try again.");

    // Free generation never gates on payment — upstream failures stay as
    // honest error messages, never an upgrade modal.
    throw e;
  }
}

async function addCreation(prompt, form) {
  // Free access is intentional: no trial gate, no plan check, no payment
  // screen — only the studio-wide safety refusal applies.
  if (isUnsafe(prompt)) {
    showToast("Prompt refused", "That request crosses the studio safety rules. Try a safer creative direction.");
    return;
  }

  if (isGenerating) {
    showToast("One at a time", "Wait for the current image to finish before starting another.");
    return;
  }

  // Send the prompt exactly as written — the backend adds only a short style tag.
  const mode = state.mode === "video" ? "video" : "image";
  const quality = Number(document.querySelector("[data-quality]")?.value || 4);

  if (form.closest(".home-page")) {
    navigate("/create");
  }

  isGenerating = true;
  showToast("Generating", "Rendering your image — this can take up to a minute on the free tier.");
  try {
    await generateImage({ prompt: prompt.trim(), style: state.style, mode, quality });
  } finally {
    isGenerating = false;
  }
}

async function regenerate(item) {
  if (isGenerating) {
    showToast("One at a time", "Wait for the current image to finish before regenerating.");
    return;
  }

  if (isUnsafe(item.prompt)) {
    showToast("Prompt refused", "This prompt crosses the studio safety rules.");
    return;
  }

  const quality = Number(document.querySelector("[data-quality]")?.value || 4);

  isGenerating = true;
  showToast("Regenerating", "Creating a fresh version of this prompt.");
  try {
    await generateImage({ prompt: item.prompt, style: item.style, mode: item.mode, quality });
  } finally {
    isGenerating = false;
  }
}


function findLocalItem(idToFind) {
  return state.creations.find((item) => item.id === idToFind);
}

function findSeedItem(idToFind) {
  return seedCreations.find((item) => item.id === idToFind);
}

function toggleSave(idToFind, context) {
  const item = context === "seed" ? findSeedItem(idToFind) : findLocalItem(idToFind);
  if (!item) return;
  item.saved = !item.saved;
  if (context !== "seed") saveState();
  renderAll();
  showToast(item.saved ? "Saved" : "Removed", item.title);
}

function toggleLike(idToFind, context) {
  const item = context === "seed" ? findSeedItem(idToFind) : findLocalItem(idToFind);
  if (!item) return;
  item.liked = !item.liked;
  if (context !== "seed") saveState();
  renderAll();
}

function downloadCreation(item) {
  if (item.image?.startsWith("data:image/")) {
    const link = document.createElement("a");
    link.href = item.image;
    link.download = `${item.title.toLowerCase().replace(/\s+/g, "-")}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    showToast("Download ready", item.title);
    return;
  }

  // Real generated image hosted remotely — download the actual file.
  if (/^https?:\/\//.test(item.image || "")) {
    downloadRemoteImage(item);
    return;
  }

  const watermarkText = shouldShowWatermark() ? "Made with klv.ai" : "";
  const mediaLabel = item.mode === "video" ? "Video concept" : "Image concept";
  const escapedPrompt = item.prompt.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char]));
  const svg = `
    <svg width="1280" height="1280" viewBox="0 0 1280 1280" xmlns="http://www.w3.org/2000/svg">
      <rect width="1280" height="1280" fill="#030303"/>
      <rect x="70" y="70" width="1140" height="1140" rx="42" fill="#0b0d10" stroke="rgba(255,255,255,.18)" stroke-width="3"/>
      <path d="M180 900 C260 630 436 478 660 442 C844 413 1017 490 1100 650" fill="none" stroke="#4DA3FF" stroke-width="18" stroke-linecap="round" opacity=".75"/>
      <rect x="180" y="190" width="520" height="340" rx="28" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
      <rect x="750" y="190" width="350" height="520" rx="28" fill="rgba(77,163,255,.13)" stroke="rgba(255,255,255,.18)" stroke-width="2"/>
      <text x="180" y="815" fill="#f7f8fa" font-family="Arial, Helvetica, sans-serif" font-size="62" font-weight="700">${item.title}</text>
      <text x="180" y="875" fill="#9fd0ff" font-family="Arial, Helvetica, sans-serif" font-size="30">${mediaLabel} - ${item.style}</text>
      <foreignObject x="180" y="925" width="880" height="150">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font: 30px Arial, sans-serif; line-height:1.35; color:#a6abb4;">${escapedPrompt}</div>
      </foreignObject>
      <text x="180" y="1120" fill="#f7f8fa" font-family="Arial, Helvetica, sans-serif" font-size="32">klv.ai</text>
      <text x="900" y="1120" fill="rgba(255,255,255,.68)" font-family="Arial, Helvetica, sans-serif" font-size="28">${watermarkText}</text>
    </svg>
  `;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${item.title.toLowerCase().replace(/\s+/g, "-")}.svg`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("Download ready", item.title);
}

async function downloadRemoteImage(item) {
  try {
    const res = await fetch(item.image);
    if (!res.ok) throw new Error("download_failed");
    const blob = await res.blob();
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${item.title.toLowerCase().replace(/\s+/g, "-")}.${ext}`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast("Download ready", item.title);
  } catch {
    window.open(item.image, "_blank");
    showToast("Opened image", "Direct download blocked — opened in a new tab instead.");
  }
}

function hasPaystackKey() {
  return PAYSTACK_CONFIG.publicKey && !PAYSTACK_CONFIG.publicKey.includes("REPLACE_WITH");
}

function customerEmail() {
  return state.user?.email || "";
}

function checkoutReference(planName) {
  return `klv-${planName.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadPaystackInline() {
  if (window.Paystack || window.PaystackPop) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PAYSTACK_CONFIG.checkoutUrl}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PAYSTACK_CONFIG.checkoutUrl;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

function markPlanPaid(planName, reference) {
  state.plan = planName;
  state.lastPayment = {
    provider: "paystack",
    reference,
    plan: planName,
    paidAt: new Date().toISOString()
  };
  pendingCheckoutPlan = null;
  saveState();
  renderAll();
  showToast(`${planName} active`, `Paystack reference ${reference}`);
}

async function startPaystackCheckout(planName) {
  const plan = plans.find((entry) => entry.name === planName);
  const checkout = planCheckout[planName];
  if (!plan || !checkout) {
    state.plan = planName;
    saveState();
    renderAll();
    showToast(`${planName} selected`, "Free plan active.");
    return;
  }

  if (!hasPaystackKey()) {
    showToast("Add Paystack public key", "Replace PAYSTACK_CONFIG.publicKey in app.js with your Paystack public key.");
    return;
  }

  if (!customerEmail()) {
    pendingCheckoutPlan = planName;
    openAuthModal("signup");
    showToast("Email needed", "Enter an email so Paystack can open the subscription checkout.");
    return;
  }

  try {
    await loadPaystackInline();
  } catch {
    showToast("Paystack could not load", "Check your internet connection or the Paystack script URL.");
    return;
  }

  const reference = checkoutReference(planName);
  const subscriptionOptions = checkout.planCode
    ? { planCode: checkout.planCode }
    : { planInterval: checkout.interval };
  const metadata = {
    custom_fields: [
      {
        display_name: "Plan",
        variable_name: "plan",
        value: planName
      },
      {
        display_name: "Studio",
        variable_name: "studio",
        value: "klv.ai"
      }
    ]
  };

  if (window.Paystack) {
    const paystack = new window.Paystack();
    paystack.newTransaction({
      key: PAYSTACK_CONFIG.publicKey,
      email: customerEmail(),
      amount: checkout.amount,
      currency: PAYSTACK_CONFIG.currency,
      reference,
      ...subscriptionOptions,
      metadata,
      onSuccess: (transaction) => markPlanPaid(planName, transaction?.reference || reference),
      onCancel: () => showToast("Checkout closed", `${planName} was not purchased.`)
    });
    return;
  }

  if (window.PaystackPop) {
    window.PaystackPop.setup({
      key: PAYSTACK_CONFIG.publicKey,
      email: customerEmail(),
      amount: checkout.amount,
      currency: PAYSTACK_CONFIG.currency,
      ref: reference,
      ...subscriptionOptions,
      metadata,
      callback: (transaction) => markPlanPaid(planName, transaction?.reference || reference),
      onClose: () => showToast("Checkout closed", `${planName} was not purchased.`)
    }).openIframe();
  }
}

function selectPlan(planName) {
  const plan = plans.find((entry) => entry.name === planName);
  if (!plan) return;
  if (plan.price === "$0") {
    state.plan = planName;
    saveState();
    renderAll();
    showToast(`${planName} selected`, "Free plan active.");
    return;
  }

  startPaystackCheckout(planName);
}

function openModal(selector) {
  const modal = document.querySelector(selector);
  if (modal) modal.hidden = false;
}

function closeModals() {
  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.hidden = true;
  });
}

function handleAuth(event) {
  event.preventDefault();
  const email = new FormData(event.currentTarget).get("email").trim();
  if (!email) return;
  const name = email.split("@")[0].replace(/[._-]+/g, " ");
  state.user = {
    email,
    name: name.replace(/\b\w/g, (letter) => letter.toUpperCase())
  };
  saveState();
  renderAll();
  closeModals();
  showToast(state.authMode === "signup" ? "Account created" : "Signed in", email);

  if (pendingCheckoutPlan) {
    startPaystackCheckout(pendingCheckoutPlan);
  }
}

function setupReferenceImageDropzones() {
  const dropzones = Array.from(document.querySelectorAll("[data-dropzone]"));

  for (const dz of dropzones) {
    const pickButton = dz.querySelector("[data-pick-image]");
    const fileInput = dz.querySelector("[data-file-input]");
    const previews = dz.querySelector("[data-image-previews]");

    if (pickButton && fileInput) {
      pickButton.addEventListener("click", () => fileInput.click());
    }

    if (fileInput) {
      fileInput.addEventListener("change", () => {
        if (!fileInput.files?.length) return;
        addReferenceFiles(Array.from(fileInput.files));
        fileInput.value = "";
      });
    }

    dz.addEventListener("dragenter", (e) => {
      e.preventDefault();
      dz.classList.add("drag-active");
    });

    dz.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    dz.addEventListener("dragleave", (e) => {
      if (e.relatedTarget && dz.contains(e.relatedTarget)) return;
      dz.classList.remove("drag-active");
    });

    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("drag-active");
      const files = Array.from(e.dataTransfer?.files || []).filter((f) => f.type.startsWith("image/"));
      if (!files.length) return;
      addReferenceFiles(files);
    });

    // Local helper uses the first matching previews container on this dz.
    function addReferenceFiles(files) {
      renderReferencePreviews(previews, files);
    }
  }
}

function renderReferencePreviews(previewsEl, files) {
  if (!previewsEl) return;

  const maxFiles = 4;
  const current = state.references.images;
  const remaining = Math.max(0, maxFiles - current.length);
  const accepted = files.slice(0, remaining);

  const readAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("read_failed"));
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  Promise.all(
    accepted.map(async (file) => {
      const dataUrl = await readAsDataUrl(file);
      return { name: file.name || "reference", dataUrl };
    })
  )
    .then((newOnes) => {
      state.references.images.push(...newOnes);
      saveState();
      refreshReferencePreviews();
      showToast("References added", `${newOnes.length} image${newOnes.length === 1 ? "" : "s"} ready.`);
    })
    .catch(() => showToast("Upload failed", "Could not read one of the images."));
}

const GENERATE_MAX_CHARS = 5000;
let availableVoices = [];

async function requestVoice(payload) {
  try {
    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    return { res, data };
  } catch {
    return { res: null, data: null };
  }
}

function setVoiceStatus(message, variant = "info") {
  const status = document.querySelector("[data-voice-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.variant = variant;
}

function playAudio(dataUrl, noteText = "") {
  const player = document.querySelector("[data-audio-player]");
  const note = document.querySelector("[data-audio-note]");
  if (!player) return;
  player.src = dataUrl;
  player.hidden = false;
  if (note) note.textContent = noteText;
}

function populateVoiceSelect() {
  const select = document.querySelector("[data-voice-select]");
  if (!select) return;
  if (!availableVoices.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No AI voices available";
    select.replaceChildren(option);
    select.disabled = true;
    return;
  }
  const options = availableVoices.map((voice) => {
    const label = `${voice.name}${voice.language ? ` · ${voice.language}` : ""}`;
    return new Option(label, voice.id);
  });
  select.replaceChildren(...options);
  select.disabled = false;
  if (state.audio.voiceId && availableVoices.some((voice) => voice.id === state.audio.voiceId)) {
    select.value = state.audio.voiceId;
  }
}

async function initVoicePanel() {
  const select = document.querySelector("[data-voice-select]");
  if (!select) return;
  setVoiceStatus("Checking voice provider…", "busy");
  const { res, data } = await requestVoice({ action: "voices" });

  if (!res || !data || !data.ok) {
    // Not configured, quota exhausted, or provider down — the server's message
    // is shown verbatim so the user always knows exactly what happened.
    setVoiceStatus(
      (data && (data.message || data.error)) || "Voice provider unavailable. Upload audio instead.",
      "warn"
    );
    populateVoiceSelect();
    return;
  }

  availableVoices = Array.isArray(data.voices) ? data.voices : [];
  populateVoiceSelect();
  const cached = data.cached ? " (cached)" : "";
  setVoiceStatus(`${availableVoices.length} voices available${cached}`, "ok");
}

async function previewVoice() {
  const select = document.querySelector("[data-voice-select]");
  if (!select || select.disabled) {
    setVoiceStatus("No AI voices available. Upload your own audio instead.", "warn");
    return;
  }
  const voice = availableVoices.find((entry) => entry.id === select.value);

  // The provider's hosted preview sample costs no API quota — always prefer it.
  if (voice && voice.previewUrl) {
    playAudio(voice.previewUrl, `Voice sample · ${voice.name} (hosted by the provider, no quota used)`);
    setVoiceStatus(`Preview: ${voice.name} sample`, "ok");
    return;
  }

  const script = document.querySelector("[data-narration-script]")?.value.trim();
  setVoiceStatus("Preparing voice preview…", "busy");
  const { data } = await requestVoice({
    action: "preview",
    voiceId: select.value,
    text: script || "",
    settings: { ...state.audio.settings }
  });
  if (!data || !data.ok) {
    setVoiceStatus((data && data.error) || "Voice preview failed.", "warn");
    return;
  }
  playAudio(data.audio, `Preview · ${Math.round(data.bytes / 1024)} KB (${data.characters} characters)`);
  setVoiceStatus("Preview ready", "ok");
}

async function generateVoiceover() {
  const select = document.querySelector("[data-voice-select]");
  const script = document.querySelector("[data-narration-script]");
  if (!select || select.disabled) {
    setVoiceStatus("No AI voices available. Upload your own audio instead.", "warn");
    return;
  }
  const text = script ? script.value.trim() : "";
  if (!text) {
    showToast("Script needed", "Write the narration or dialogue before generating audio.");
    if (script) script.focus();
    return;
  }
  if (text.length > GENERATE_MAX_CHARS) {
    showToast("Script too long", `Split the narration into parts under ${GENERATE_MAX_CHARS} characters.`);
    return;
  }

  setVoiceStatus("Generating narration…", "busy");
  const { data } = await requestVoice({
    action: "generate",
    voiceId: select.value,
    text,
    settings: { ...state.audio.settings }
  });

  if (!data || !data.ok) {
    setVoiceStatus((data && data.error) || "Voice generation failed.", "warn");
    showToast("Voiceover failed", (data && data.error) || "Check the voice provider status.");
    return;
  }

  state.audio = {
    source: "elevenlabs",
    dataUrl: data.audio,
    voiceId: select.value,
    settings: { ...state.audio.settings }
  };
  saveState();
  const voice = availableVoices.find((entry) => entry.id === select.value);
  const kilobytes = Math.round(data.bytes / 1024);
  playAudio(
    state.audio.dataUrl,
    `ElevenLabs narration · ${voice ? voice.name : select.value} · ${kilobytes} KB`
  );
  setVoiceStatus("Voiceover ready", "ok");
  showToast("Voiceover ready", `${voice ? voice.name : "Voice"} · ${kilobytes} KB`);
}

function setupVoiceoverPanel() {
  const panel = document.querySelector(".audio-panel");
  if (!panel) return;

  document.querySelectorAll("[data-voice-setting]").forEach((input) => {
    const key = input.dataset.voiceSetting;
    if (state.audio.settings[key] !== undefined) {
      input.value = state.audio.settings[key];
    }
    input.addEventListener("input", () => {
      const value = Number(input.value);
      if (!Number.isFinite(value)) return;
      state.audio.settings[key] = value;
      saveState();
    });
  });

  const previewButton = document.querySelector("[data-preview-voice]");
  if (previewButton) previewButton.addEventListener("click", () => previewVoice());

  const generateButton = document.querySelector("[data-generate-voice]");
  if (generateButton) generateButton.addEventListener("click", () => generateVoiceover());

  const uploadButton = document.querySelector("[data-upload-audio]");
  const uploadInput = document.querySelector("[data-audio-input]");
  if (uploadButton && uploadInput) {
    uploadButton.addEventListener("click", () => uploadInput.click());
    uploadInput.addEventListener("change", () => {
      const file = uploadInput.files && uploadInput.files[0];
      uploadInput.value = "";
      if (!file) return;
      if (!file.type.startsWith("audio/")) {
        showToast("Audio file required", "Choose an audio file (MP3, WAV, OGG…).");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast("Audio too large", "Keep the upload under 8 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        state.audio = {
          source: "upload",
          dataUrl: reader.result,
          voiceId: "",
          settings: { ...state.audio.settings }
        };
        saveState();
        playAudio(state.audio.dataUrl, `Uploaded audio · ${file.name}`);
        setVoiceStatus("Using uploaded audio", "ok");
        showToast("Audio ready", file.name);
      };
      reader.onerror = () => showToast("Upload failed", "Could not read that audio file.");
      reader.readAsDataURL(file);
    });
  }

  restoreVoiceover();
  initVoicePanel();
}

function restoreVoiceover() {
  if (state.audio && state.audio.dataUrl) {
    playAudio(
      state.audio.dataUrl,
      state.audio.source === "upload" ? "Uploaded audio (saved)" : "Saved voiceover"
    );
  }
}

// Descript-style captions: transcription/auto-timing/import -> editable
// word-level captions -> karaoke preview synced to the voiceover -> export.
const CAPTION_SOURCES = {
  transcript: "Word-level transcript",
  script: "Auto-timed script (estimated)",
  import: "Imported captions"
};

function setCaptionStatus(message, variant = "info") {
  const status = document.querySelector("[data-caption-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.variant = variant;
}

function captionLines() {
  return CaptionsLib.buildCaptionLines(state.captions.words);
}

function captionSourceLabel() {
  return CAPTION_SOURCES[state.captions.source] || "Captions";
}

// Renders one editable row per caption line: keep-time inputs + line text.
// Editing text re-spreads that line's words; editing times moves its words.
function renderCaptionEditor() {
  const editor = document.querySelector("[data-caption-editor]");
  if (!editor) return;
  const lines = captionLines();
  editor.hidden = lines.length === 0;
  editor.replaceChildren();

  lines.forEach((line, index) => {
    const row = document.createElement("div");
    row.className = "caption-row";

    const number = document.createElement("span");
    number.className = "caption-row-number";
    number.textContent = String(index + 1);

    const startInput = document.createElement("input");
    startInput.type = "number";
    startInput.step = "0.1";
    startInput.min = "0";
    startInput.value = line.start.toFixed(2);
    startInput.setAttribute("aria-label", `Line ${index + 1} start time`);

    const endInput = document.createElement("input");
    endInput.type = "number";
    endInput.step = "0.1";
    endInput.min = "0";
    endInput.value = line.end.toFixed(2);
    endInput.setAttribute("aria-label", `Line ${index + 1} end time`);

    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = CaptionsLib.lineText(line);
    textInput.setAttribute("aria-label", `Line ${index + 1} text`);

    const applyEdit = () => {
      const nextStart = Math.max(0, Number(startInput.value) || 0);
      let nextEnd = Math.max(nextStart + 0.2, Number(endInput.value) || nextStart + 2);
      if (nextEnd <= nextStart) nextEnd = nextStart + 0.2;
      startInput.value = nextStart.toFixed(2);
      endInput.value = nextEnd.toFixed(2);

      // Rebuild this line's words, then stitch every line back together in order.
      const rebuilt = CaptionsLib.wordsForEditedLine(
        { start: nextStart, end: nextEnd },
        textInput.value
      );
      const words = [];
      captionLines().forEach((existing, existingIndex) => {
        if (existingIndex === index) {
          words.push(...rebuilt);
        } else {
          words.push(...existing.words);
        }
      });
      state.captions.words = CaptionsLib.cloneWords(words);
      state.captions.source = "edit";
      saveState();
      updateCaptionPreview(true);
    };

    [startInput, endInput, textInput].forEach((input) => {
      input.dataset.captionEditing = "true";
      input.addEventListener("change", applyEdit);
      input.addEventListener("focus", () => {
        const start = Number(startInput.value) || 0;
        const player = document.querySelector("[data-audio-player]");
        if (player && Number.isFinite(player.duration)) {
          try { player.currentTime = Math.min(start + 0.05, player.duration - 0.05); } catch { /* seek not ready */ }
        }
      });
    });

    row.append(number, startInput, endInput, textInput);
    editor.appendChild(row);
  });
}

// Karaoke preview: redraw only when the active line/word signature changes.
function updateCaptionPreview(force = false) {
  const preview = document.querySelector("[data-caption-preview]");
  const stage = document.querySelector("[data-caption-stage]");
  if (!preview || !stage) return;
  const words = state.captions.words;

  if (!words.length) {
    preview.textContent = "Play the voiceover to preview captions.";
    preview.classList.remove("active");
    return;
  }

  const player = document.querySelector("[data-audio-player]");
  const offset = Number(state.captions.style.offset) || 0;
  const time = player && Number.isFinite(player.currentTime) ? player.currentTime + offset : 0;
  const lines = captionLines();
  const at = CaptionsLib.lineAndWordAt(lines, time);

  let signature = "idle";
  if (at) {
    signature = `${at.lineIndex}:${at.wordIndex < 0 ? -1 : lines[at.lineIndex].words[at.wordIndex].text}`;
  }
  if (!force && stage.dataset.signature === signature) return;
  stage.dataset.signature = signature;

  if (!at) {
    preview.textContent = words.length ? captionSourceLabel() : "Play the voiceover to preview captions.";
    preview.classList.remove("active");
    return;
  }

  const line = lines[at.lineIndex];
  preview.replaceChildren();
  line.words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "caption-word" + (index === at.wordIndex ? " active" : "");
    span.textContent = word.text;
    preview.appendChild(span);
    if (index < line.words.length - 1) {
      preview.appendChild(document.createTextNode(" "));
    }
  });
  preview.classList.add("active");
}

function setCaptions(words, source) {
  state.captions.words = CaptionsLib.cloneWords(words);
  state.captions.source = source;
  saveState();
  renderCaptionEditor();
  updateCaptionPreview(true);
}

async function transcribeAudioForCaptions() {
  if (!state.audio.dataUrl) {
    setCaptionStatus("Generate or upload a voiceover first — captions need audio to transcribe.", "warn");
    showToast("No audio yet", "Create a voiceover or upload audio, then transcribe it.");
    return;
  }
  const button = document.querySelector("[data-caption-transcribe]");
  if (button) button.disabled = true;
  setCaptionStatus("Transcribing audio…", "busy");

  try {
    const blobRes = await fetch(state.audio.dataUrl);
    const blob = await blobRes.blob();
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Audio-Mime": blob.type || "audio/mpeg",
        "X-Audio-Name": state.audio.source === "upload" ? "upload" : "voiceover"
      },
      body: blob
    });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data || !data.ok) {
      const message = (data && (data.message || data.error)) || "Transcription failed.";
      setCaptionStatus(message, "warn");
      return;
    }

    let words = Array.isArray(data.words) ? data.words : [];
    if (!words.length && data.text) {
      // Provider gave text without word timings — fall back to even spreading.
      const player = document.querySelector("[data-audio-player]");
      const duration = player && Number.isFinite(player.duration) ? player.duration : words.length * 0.4 || 30;
      words = CaptionsLib.wordsFromText(data.text, duration);
    }
    if (!words.length) {
      setCaptionStatus("The provider returned an empty transcript. Is the audio silent or too short?", "warn");
      return;
    }

    setCaptions(words, "transcript");
    renderCaptionEditor();
    setCaptionStatus(`Transcript ready · ${words.length} words${data.language ? ` (${data.language})` : ""}`, "ok");
    showToast("Captions ready", "Word-level transcript loaded — edit anything below.");
  } catch {
    setCaptionStatus("Transcription failed. Check connectivity and try again.", "warn");
  } finally {
    if (button) button.disabled = false;
  }
}

async function autoTimeScript() {
  const script = document.querySelector("[data-narration-script]");
  const text = script ? script.value.trim() : "";
  if (!text) {
    showToast("Script needed", "Write the narration script first, then auto-time it.");
    if (script) script.focus();
    return;
  }
  const player = document.querySelector("[data-audio-player]");
  let duration = player && Number.isFinite(player.duration) && player.duration > 0 ? player.duration : NaN;
  if (!Number.isFinite(duration)) {
    // No loadable audio: estimate ~0.45s per word and say so honestly.
    duration = text.split(/\s+/).length * 0.45;
  }
  const words = CaptionsLib.wordsFromText(text, duration);
  setCaptions(words, "script");
  renderCaptionEditor();
  const estimated = !player || !Number.isFinite(player.duration);
  setCaptionStatus(
    estimated ? "Script timed with estimates — load audio for exact sync" : "Script timed to the voiceover",
    estimated ? "warn" : "ok"
  );
  showToast("Captions timed", estimated ? "Estimate only — no audio loaded yet." : "Synced to the current voiceover.");
}

async function importCaptionsFile() {
  const input = document.querySelector("[data-caption-file]");
  const file = input && input.files && input.files[0];
  if (input) input.value = "";
  if (!file) return;
  try {
    const text = await file.text();
    const entries = CaptionsLib.parseSrt(text);
    if (!entries.length) {
      setCaptionStatus("No caption cues found in that file.", "warn");
      return;
    }
    const words = [];
    for (const entry of entries) {
      words.push(...CaptionsLib.wordsForEditedLine(entry, entry.text));
    }
    setCaptions(words, "import");
    renderCaptionEditor();
    setCaptionStatus(`Imported ${entries.length} cues · ${file.name}`, "ok");
    showToast("Captions imported", file.name);
  } catch {
    setCaptionStatus("Could not read that caption file.", "warn");
  }
}

function downloadCaptions(format) {
  const lines = captionLines();
  if (!lines.length) {
    showToast("Nothing to export", "Add captions first.");
    return;
  }
  const isVtt = format === "vtt";
  const content = isVtt ? CaptionsLib.formatVtt(lines) : CaptionsLib.formatSrt(lines);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = isVtt ? "klv.captions.vtt" : "klv.captions.srt";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  setCaptionStatus(`Exported ${isVtt ? "WebVTT" : "SubRip"} · ${lines.length} cues`, "ok");
}

// Applies the caption style state to the preview stage.
function applyCaptionStyle() {
  const stage = document.querySelector("[data-caption-stage]");
  const preview = document.querySelector("[data-caption-preview]");
  if (!stage || !preview) return;
  const style = state.captions.style;
  stage.dataset.position = style.position;
  stage.dataset.preset = style.preset;
  preview.style.fontSize = `${style.size}px`;
}

function setupCaptionsPanel() {
  const panel = document.querySelector(".caption-panel");
  if (!panel) return;

  const transcribeButton = document.querySelector("[data-caption-transcribe]");
  if (transcribeButton) transcribeButton.addEventListener("click", () => transcribeAudioForCaptions());

  const scriptButton = document.querySelector("[data-caption-script]");
  if (scriptButton) scriptButton.addEventListener("click", () => autoTimeScript());

  const importButton = document.querySelector("[data-caption-import]");
  const fileInput = document.querySelector("[data-caption-file]");
  if (importButton && fileInput) {
    importButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => importCaptionsFile());
  }

  const clearButton = document.querySelector("[data-caption-clear]");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      if (!state.captions.words.length) return;
      setCaptions([], "none");
      document.querySelector("[data-caption-editor]")?.replaceChildren();
      const editor = document.querySelector("[data-caption-editor]");
      if (editor) editor.hidden = true;
      setCaptionStatus("No captions yet", "info");
      showToast("Captions cleared", "");
    });
  }

  const presetSelect = document.querySelector("[data-caption-preset]");
  if (presetSelect) {
    presetSelect.value = state.captions.style.preset;
    presetSelect.addEventListener("change", () => {
      state.captions.style.preset = presetSelect.value;
      saveState();
      applyCaptionStyle();
      updateCaptionPreview(true);
    });
  }

  const sizeInput = document.querySelector("[data-caption-size]");
  if (sizeInput) {
    sizeInput.value = state.captions.style.size;
    sizeInput.addEventListener("input", () => {
      state.captions.style.size = Number(sizeInput.value) || 24;
      saveState();
      applyCaptionStyle();
    });
  }

  const positionSelect = document.querySelector("[data-caption-position]");
  if (positionSelect) {
    positionSelect.value = state.captions.style.position;
    positionSelect.addEventListener("change", () => {
      state.captions.style.position = positionSelect.value;
      saveState();
      applyCaptionStyle();
    });
  }

  const offsetInput = document.querySelector("[data-caption-offset]");
  if (offsetInput) {
    offsetInput.value = state.captions.style.offset;
    offsetInput.addEventListener("change", () => {
      state.captions.style.offset = Number(offsetInput.value) || 0;
      saveState();
      updateCaptionPreview(true);
    });
  }

  const exportSrt = document.querySelector("[data-caption-export-srt]");
  if (exportSrt) exportSrt.addEventListener("click", () => downloadCaptions("srt"));
  const exportVtt = document.querySelector("[data-caption-export-vtt]");
  if (exportVtt) exportVtt.addEventListener("click", () => downloadCaptions("vtt"));

  // Karaoke highlighting follows the shared voiceover player.
  const player = document.querySelector("[data-audio-player]");
  if (player) player.addEventListener("timeupdate", () => updateCaptionPreview());

  if (state.captions.words.length) {
    setCaptionStatus(`${captionSourceLabel()} · ${state.captions.words.length} words`, "ok");
  }
  applyCaptionStyle();
  updateCaptionPreview(true);
}

// End-to-end workflow: script -> scene list -> rendered scene images ->
// synced storyboard preview (scenes + voiceover + captions) -> library.
const WORKFLOW_MAX_SCENES = 8;
let isRenderingScenes = false;
let previewSession = null; // { timer, audio, t0 } while the synced preview plays
function setWorkflowStatus(message, variant = "info") {
  const status = document.querySelector("[data-workflow-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.variant = variant;
}

function workflowSourceText() {
  const script = document.querySelector("[data-narration-script]")?.value.trim();
  if (script) return script;
  const prompt = document.querySelector("[data-prompt-field]")?.value.trim();
  if (prompt) return prompt;
  const createPrompt = document.querySelector("[data-create-prompt]")?.value.trim();
  return createPrompt || "";
}

function refreshWorkflowButtons() {
  const scenes = state.workflow.scenes;
  const readyCount = scenes.filter((s) => s.image).length;
  const playButton = document.querySelector("[data-workflow-play]");
  const saveButton = document.querySelector("[data-workflow-save]");
  const generateButton = document.querySelector("[data-scenes-generate]");
  const buildButton = document.querySelector("[data-scenes-build]");
  if (playButton) playButton.disabled = readyCount === 0;
  if (saveButton) saveButton.disabled = readyCount === 0;
  if (generateButton) generateButton.disabled = scenes.length === 0 || isRenderingScenes;
  if (buildButton) buildButton.disabled = isRenderingScenes;
}

function renderSceneStrip() {
  const strip = document.querySelector("[data-scene-strip]");
  if (!strip) return;
  strip.replaceChildren();

  state.workflow.scenes.forEach((scene, index) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = `scene-thumb ${scene.image ? "ready" : scene.status || "pending"}`;
    thumb.title = `Scene ${index + 1} — ${scene.text}`;

    if (scene.image) {
      const img = document.createElement("img");
      img.src = scene.image;
      img.alt = `Scene ${index + 1} keyframe`;
      img.loading = "lazy";
      thumb.appendChild(img);
    }

    const badge = document.createElement("span");
    badge.className = "scene-badge";
    badge.textContent = String(index + 1);
    thumb.appendChild(badge);

    const chip = document.createElement("span");
    chip.className = "scene-status-chip";
    chip.textContent = scene.image ? "Ready" : scene.status === "failed" ? "Failed" : "Pending";
    thumb.appendChild(chip);

    // Clicking a rendered scene regenerates just that shot.
    thumb.addEventListener("click", () => renderSingleScene(index));
    strip.appendChild(thumb);
  });
}

// Splits the script (or prompt) into scene-sized sentences via the shared engine.
function buildScenes() {
  const source = workflowSourceText();
  if (!source) {
    setWorkflowStatus("Write the narration script (or main prompt) first.", "warn");
    showToast("Nothing to storyboard", "Add a script or prompt, then build scenes.");
    return;
  }
  const { scenes, skipped } = CaptionsLib.splitScenes(source, WORKFLOW_MAX_SCENES);
  if (!scenes.length) {
    setWorkflowStatus("Could not split that script into scenes.", "warn");
    return;
  }

  state.workflow.scenes = scenes.map((scene) => ({ ...scene, image: "", status: "pending" }));
  state.workflow.synced = false;
  saveState();
  renderSceneStrip();
  refreshWorkflowButtons();
  setWorkflowStatus(
    `${scenes.length} scenes${skipped ? ` (${skipped} more skipped, free run cap ${WORKFLOW_MAX_SCENES})` : ""}`,
    "ok"
  );
  showToast("Scenes built", `${scenes.length} shots ready to render.`);
}

// Scene start times: distributed proportionally to sentence length, scaled to
// the voiceover duration when one is loaded; ~4s per scene otherwise.
function sceneTimeline() {
  const scenes = state.workflow.scenes;
  if (!scenes.length) return { starts: [], total: 0 };
  const weights = scenes.map((scene) => Math.max(4, scene.text.split(/\s+/).filter(Boolean).length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const player = document.querySelector("[data-audio-player]");
  const audioDuration = player && Number.isFinite(player.duration) && player.duration > 0 ? player.duration : NaN;
  const total = Number.isFinite(audioDuration) ? audioDuration : scenes.length * 4;
  let cursor = 0;
  const starts = weights.map((weight) => {
    const start = cursor;
    cursor += (weight / totalWeight) * total;
    return start;
  });
  return { starts, total };
}

async function generateSceneImage(basePrompt, sceneText) {
  const prompt = `${basePrompt.trim()} — Scene: ${sceneText}`.slice(0, 900);
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      mode: "video",
      style: state.style,
      quality: 4,
      seed: state.characterSeed,
      colorMode: state.colorMode,
      colors: state.colors,
      references: state.references?.images || []
    })
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok || !data?.imageUrl) {
    throw new Error(data?.error || `Scene generation failed (${res.status})`);
  }
  await waitForImage(data.imageUrl);
  return data.imageUrl;
}

async function renderScenes(indices) {
  if (isRenderingScenes || isGenerating) {
    showToast("One at a time", "Scene rendering already busy — wait for it to finish.");
    return;
  }
  const basePrompt = workflowSourceText();
  if (!basePrompt) {
    setWorkflowStatus("Write the narration script (or main prompt) first.", "warn");
    return;
  }

  isRenderingScenes = true;
  refreshWorkflowButtons();
  setWorkflowStatus("Rendering scene images…", "busy");

  let ok = 0;
  let failed = 0;
  for (const index of indices) {
    const scene = state.workflow.scenes[index];
    if (!scene) continue;
    scene.status = "pending";
    saveState();
    try {
      scene.image = await generateSceneImage(basePrompt, scene.text);
      scene.status = "ready";
      ok += 1;
      refreshSceneStatus(`Scene ${index + 1}/${indices.length} rendered`);
    } catch (error) {
      scene.status = "failed";
      failed += 1;
      setWorkflowStatus(`Scene ${index + 1} failed: ${error.message}`, "warn");
    }
    saveState();
    renderSceneStrip();
  }

  isRenderingScenes = false;
  const readyCount = state.workflow.scenes.filter((s) => s.image).length;
  setWorkflowStatus(
    `${ok} of ${indices.length} scenes rendered${failed ? ` · ${failed} failed (click a failed shot to retry)` : ""}`,
    failed || !readyCount ? "warn" : "ok"
  );
  refreshWorkflowButtons();
  if (readyCount && !failed) showToast("Scenes rendered", "Play the synced preview.");
}

function refreshSceneStatus(message) {
  const readyCount = state.workflow.scenes.filter((s) => s.image).length;
  setWorkflowStatus(`${message} · ${readyCount}/${state.workflow.scenes.length} ready`, "busy");
}

function renderSingleScene(index) {
  if (isRenderingScenes || isGenerating) {
    showToast("Busy", "Wait for the current render to finish.");
    return;
  }
  if (!state.workflow.scenes[index]) return;
  renderScenes([index]);
}

// Draws karaoke caption words into an arbitrary container at a given time.
function renderKaraokeInto(container, time) {
  if (!container) return;
  const style = state.captions.style;
  const words = state.captions.words;
  container.dataset.preset = style.preset;
  container.dataset.position = style.position;
  container.style.fontSize = `${style.size}px`;

  container.replaceChildren();
  if (!words.length) return;
  const lines = CaptionsLib.buildCaptionLines(words);
  const offset = Number(style.offset) || 0;
  const at = CaptionsLib.lineAndWordAt(lines, time + offset);
  if (!at) {
    container.classList.remove("active");
    return;
  }
  container.classList.add("active");
  const line = lines[at.lineIndex];
  line.words.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "caption-word" + (index === at.wordIndex ? " active" : "");
    span.textContent = word.text;
    container.appendChild(span);
    if (index < line.words.length - 1) container.appendChild(document.createTextNode(" "));
  });
}

function stopWorkflowPreview() {
  if (!previewSession) return;
  window.clearInterval(previewSession.timer);
  if (previewSession.audio) {
    previewSession.audio.pause();
    previewSession.audio.removeEventListener("ended", previewSession.onEnded);
  }
  previewSession = null;
  const strip = document.querySelector("[data-scene-strip]");
  strip?.querySelectorAll(".scene-thumb.active").forEach((el) => el.classList.remove("active"));
  const playButton = document.querySelector("[data-workflow-play]");
  if (playButton) playButton.textContent = "3 · Play synced preview";
  refreshWorkflowButtons();
}

function playWorkflowPreview() {
  const readyScenes = state.workflow.scenes
    .map((scene, index) => ({ ...scene, index }))
    .filter((scene) => scene.image);
  if (!readyScenes.length) {
    showToast("Nothing to play", "Render at least one scene image first.");
    return;
  }
  if (previewSession) {
    stopWorkflowPreview();
    return;
  }

  const frame = document.querySelector("[data-workflow-frame]");
  const layer = document.querySelector("[data-workflow-caption-layer]");
  const progress = document.querySelector("[data-workflow-progress]");
  const hint = document.querySelector("[data-workflow-hint]");
  const audio = document.querySelector("[data-audio-player]");
  const { starts } = sceneTimeline();

  const startTimes = new Map();
  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
    // Full voiceover exists — scenes map onto its real duration.
    readyScenes.forEach((scene, i) => startTimes.set(scene.index, starts[scene.index] ?? 0));
  }
  state.workflow.synced = true;

  if (hint) hint.hidden = true;
  if (frame) frame.hidden = false;

  const fallbackSceneSeconds = 4;
  const hasAudio = Boolean(audio && state.audio.dataUrl && Number.isFinite(audio.duration) && audio.duration > 0);
  const totalDuration = hasAudio ? audio.duration : readyScenes.length * fallbackSceneSeconds;

  let sceneKey = -1;
  previewSession = {
    audio,
    timer: null,
    onEnded: () => stopWorkflowPreview()
  };

  const tick = () => {
    const time = hasAudio && audio ? audio.currentTime : (performance.now() - previewSession.t0) / 1000;
    if (time >= totalDuration) {
      stopWorkflowPreview();
      return;
    }

    // Timed scene fades with a short crossfade at boundaries.
    let activeIndex = 0;
    for (let i = readyScenes.length - 1; i >= 0; i -= 1) {
      const start = hasAudio ? startTimes.get(readyScenes[i].index) : i * fallbackSceneSeconds;
      if (time >= start) {
        activeIndex = i;
        break;
      }
    }
    const active = readyScenes[activeIndex];
    if (active.index !== sceneKey) {
      sceneKey = active.index;
      if (frame) {
        frame.src = active.image;
        frame.classList.remove("fade");
        void frame.offsetWidth; // restart the fade animation
        frame.classList.add("fade");
      }
      const strip = document.querySelector("[data-scene-strip]");
      strip?.querySelectorAll(".scene-thumb").forEach((el, i) => el.classList.toggle("active", i === active.index));
    }

    renderKaraokeInto(layer, time);
    if (progress) progress.style.width = `${Math.min(100, (time / totalDuration) * 100)}%`;
  };

  previewSession.t0 = performance.now();
  tick();
  if (hasAudio) {
    try {
      audio.currentTime = 0;
      audio.play().catch(() => { /* autoplay may be blocked — preview still animates */ });
    } catch { /* ignore */ }
    audio.addEventListener("ended", previewSession.onEnded);
  }
  previewSession.timer = window.setInterval(tick, 200);

  const playButton = document.querySelector("[data-workflow-play]");
  if (playButton) playButton.textContent = "Stop preview";
  setWorkflowStatus("Preview playing", "ok");
}

function saveWorkflowToLibrary() {
  const basePrompt = workflowSourceText();
  const ready = state.workflow.scenes.filter((s) => s.image);
  if (!ready.length) {
    showToast("Nothing to save", "Render scene images first.");
    return;
  }
  if (isUnsafe(basePrompt)) {
    showToast("Prompt refused", "This storyboard crosses the studio safety rules.");
    return;
  }

  const creation = {
    id: id(),
    title: titleFromPrompt(basePrompt || "Storyboard"),
    prompt: basePrompt || "Animated storyboard",
    mode: "video",
    style: state.style,
    createdAt: "Now",
    saved: false,
    liked: false,
    image: ready[0].image,
    colorMode: state.colorMode,
    status: "done",
    scenes: state.workflow.scenes.map((scene) => ({ text: scene.text, image: scene.image })),
    hasVoiceover: state.audio.source !== "none" && Boolean(state.audio.dataUrl),
    hasCaptions: state.captions.words.length > 0
  };

  state.creations.unshift(creation);
  state.usage.videos = (state.usage.videos || 0) + 1;
  saveState();
  renderAll();
  const stripped = document.querySelector("[data-scene-strip]");
  if (stripped) {
    try {
      stripped.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch { /* scroll optional */ }
  }
  showToast("Saved to library", `${creation.title} · ${ready.length} scenes`);
  setWorkflowStatus(`Saved · ${ready.length} scenes in library`, "ok");
}

// AI scene direction: the LLM turns the script into a shot list of concrete
// visual descriptions. Falls back to the local sentence splitter when no
// provider answers — the workflow never blocks on AI availability.
async function directScenesWithAI() {
  const source = workflowSourceText();
  if (!source) {
    setWorkflowStatus("Write the narration script (or main prompt) first.", "warn");
    showToast("Nothing to direct", "Add a script or prompt, then run the AI director.");
    return;
  }
  const button = document.querySelector("[data-scenes-ai]");
  if (button) button.disabled = true;
  setWorkflowStatus("AI director is breaking the script into shots…", "busy");
  try {
    const res = await fetch("/api/scenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: source, maxScenes: WORKFLOW_MAX_SCENES })
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data && data.ok && Array.isArray(data.scenes) && data.scenes.length) {
      state.workflow.scenes = data.scenes.map((text) => ({ text, image: "", status: "pending" }));
      state.workflow.synced = false;
      saveState();
      renderSceneStrip();
      refreshWorkflowButtons();
      setWorkflowStatus(`AI directed ${data.scenes.length} shots (${data.provider})`, "ok");
      showToast("Shot list ready", `${data.scenes.length} directed shots via ${data.provider}.`);
      return;
    }

    // Honest fallback: mechanical split, clearly labeled.
    const { scenes, skipped } = CaptionsLib.splitScenes(source, WORKFLOW_MAX_SCENES);
    state.workflow.scenes = scenes.map((scene) => ({ ...scene, image: "", status: "pending" }));
    state.workflow.synced = false;
    saveState();
    renderSceneStrip();
    refreshWorkflowButtons();
    setWorkflowStatus(
      `AI director unavailable — used the quick splitter (${scenes.length} scenes${skipped ? `, ${skipped} skipped` : ""})`,
      "warn"
    );
    showToast("Used quick splitter", (data && data.error) || "No AI provider answered.");
  } catch {
    setWorkflowStatus("AI director failed — check connectivity.", "warn");
  } finally {
    if (button) button.disabled = false;
  }
}

function setupWorkflowPanel() {
  const panel = document.querySelector(".workflow-panel");
  if (!panel) return;

  const buildButton = document.querySelector("[data-scenes-build]");
  if (buildButton) buildButton.addEventListener("click", () => buildScenes());

  const aiDirectorButton = document.querySelector("[data-scenes-ai]");
  if (aiDirectorButton) aiDirectorButton.addEventListener("click", () => directScenesWithAI());

  const generateButton = document.querySelector("[data-scenes-generate]");
  if (generateButton) {
    generateButton.addEventListener("click", () => {
      const pending = state.workflow.scenes.map((_, index) => index).filter((i) => !state.workflow.scenes[i].image);
      renderScenes(pending.length ? pending : state.workflow.scenes.map((_, index) => index));
    });
  }

  const playButton = document.querySelector("[data-workflow-play]");
  if (playButton) playButton.addEventListener("click", () => playWorkflowPreview());

  const saveButton = document.querySelector("[data-workflow-save]");
  if (saveButton) saveButton.addEventListener("click", () => saveWorkflowToLibrary());

  const rerollButton = document.querySelector("[data-reroll-seed]");
  if (rerollButton) {
    rerollButton.addEventListener("click", () => {
      state.characterSeed = Math.floor(Math.random() * 2147483647);
      saveState();
      showToast("New character seed", "Next renders draw a fresh version of your character.");
    });
  }

  if (state.workflow.scenes.length) {
    const readyCount = state.workflow.scenes.filter((s) => s.image).length;
    setWorkflowStatus(`${readyCount}/${state.workflow.scenes.length} scenes ready`, readyCount ? "ok" : "info");
  }
  renderSceneStrip();
  refreshWorkflowButtons();
}

// Wires the color pickers: native color inputs, HEX fields, and preset swatches stay in sync.
function setupColorControls() {
  document.querySelectorAll("[data-color]").forEach((input) => {
    input.addEventListener("input", () => {
      if (!setColor(input.dataset.color, input.value)) return;
      const hex = document.querySelector(`[data-hex="${input.dataset.color}"]`);
      if (hex) hex.value = input.value;
    });
  });

  document.querySelectorAll("[data-hex]").forEach((input) => {
    const commit = () => {
      const raw = input.value.trim();
      const value = raw.startsWith("#") ? raw : `#${raw}`;
      if (!setColor(input.dataset.hex, value)) return;
      input.value = value.toLowerCase();
      const picker = document.querySelector(`[data-color="${input.dataset.hex}"]`);
      if (picker) picker.value = value.toLowerCase();
    };
    input.addEventListener("change", commit);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        commit();
      }
    });
  });
}

function refreshReferencePreviews() {
  const previewContainers = Array.from(document.querySelectorAll("[data-image-previews]"));
  for (const el of previewContainers) {
    el.replaceChildren(
      ...state.references.images.map((ref, idx) => {
        const wrap = document.createElement("div");
        wrap.className = "image-preview";

        const img = document.createElement("img");
        img.alt = "Reference upload";
        img.src = ref.dataUrl;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "icon-button remove-image-button";
        remove.style.width = "22px";
        remove.style.height = "22px";
        remove.style.position = "absolute";
        remove.style.top = "3px";
        remove.style.right = "3px";
        remove.style.borderRadius = "50%";
        remove.style.background = "rgba(0,0,0,.55)";
        remove.style.border = "1px solid rgba(255,255,255,.16)";
        remove.style.color = "white";
        remove.setAttribute("aria-label", "Remove reference image");
        remove.textContent = "×";

        remove.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          state.references.images.splice(idx, 1);
          saveState();
          refreshReferencePreviews();
          showToast("Reference removed");
        });

        wrap.append(img, remove);
        return wrap;
      })
    );
  }
}

function attachEvents() {
  document.addEventListener("click", (event) => {

    const link = event.target.closest("[data-link]");
    if (link) {
      const url = new URL(link.href);
      if (url.origin === location.origin) {
        event.preventDefault();
        navigate(url.pathname);
      }
    }

    const studioShortcut = event.target.closest("[data-studio-shortcut]");
    if (studioShortcut) handleStudioShortcut(studioShortcut.dataset.studioShortcut);

    const mode = event.target.closest("[data-mode]");
    if (mode) {
      setMode(mode.dataset.mode);
      markSelection(mode);
    }

    const style = event.target.closest("[data-style]");
    if (style) {
      setStyle(style.dataset.style);
      markSelection(style);
    }

    const colorMode = event.target.closest("[data-color-mode]");
    if (colorMode) {
      setColorMode(colorMode.dataset.colorMode);
      markSelection(colorMode);
    }

    const colorPreset = event.target.closest("[data-palette]");
    if (colorPreset) {
      applyColorPreset(colorPreset.dataset.palette);
      markSelection(colorPreset);
    }

    const example = event.target.closest("[data-example]");
    if (example) {
      const prompt = example.dataset.example;
      const input = document.querySelector(".home-page textarea");
      input.value = prompt;
      input.focus();
    }

    const filter = event.target.closest("[data-filter]");
    if (filter) {
      state.filter = filter.dataset.filter;
      saveState();
      renderExplore();
      markSelection(filter);
    }

    const planButton = event.target.closest("[data-select-plan]");
    if (planButton) {
      markSelection(planButton);
      selectPlan(planButton.dataset.selectPlan);
    }

    const openAuth = event.target.closest("[data-open-auth]");
    if (openAuth) openAuthModal(openAuth.dataset.openAuth || "signin");

    const authTab = event.target.closest("[data-auth-tab]");
    if (authTab) {
      setAuthMode(authTab.dataset.authTab);
      markSelection(authTab);
    }

    const close = event.target.closest("[data-close-modal]");
    if (close) closeModals();

    const menu = event.target.closest("[data-menu-toggle]");
    if (menu) document.body.classList.toggle("nav-open");

    const google = event.target.closest("[data-google-auth]");
    if (google) showToast("Google OAuth hook", "Connect Firebase Auth or Supabase Auth for production login.");

    const refresh = event.target.closest("[data-refresh-dashboard]");
    if (refresh) {
      renderDashboard();
      showToast("Dashboard refreshed");
    }

    const enhance = event.target.closest("[data-enhance-prompt]");
    if (enhance) {
      const form = enhance.closest("form");
      const textarea = form.querySelector("textarea");
      void enhancePromptWithAI(textarea);
    }
  });

  document.querySelectorAll("[data-generate-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const textarea = form.querySelector("textarea");
      const prompt = textarea.value.trim();
      if (!prompt) {
        showToast("Prompt needed", "Add a subject, scene, or mood before generation.");
        textarea.focus();
        return;
      }

      // Ensure references are captured (dropzones store into state.references)
      // Unsafe prompts are refused client-side; the backend re-checks.
      // Generation is free — no trial or plan gating applies here.
      void addCreation(prompt, form);
    });
  });


  setupReferenceImageDropzones();

  setupColorControls();

  setupVoiceoverPanel();

  setupCaptionsPanel();

  setupWorkflowPanel();

  document.querySelector("[data-auth-form]").addEventListener("submit", handleAuth);

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) closeModals();
    });
  });

  window.addEventListener("popstate", renderRoute);

  window.addEventListener("scroll", () => {
    document.querySelector(".site-header").dataset.elevated = String(window.scrollY > 8);
  }, { passive: true });

}

attachEvents();
renderAll();
