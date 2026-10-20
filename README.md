# klv.ai - AI Creative Studio

Premium black and white AI creative studio frontend with:

- Home, Create, Explore, Pricing, and Dashboard routes
- Prompt enhancement and unsafe prompt refusal
- Image and video generation mock flow with saved history
- Free to Max pricing plans, queue labels, and watermark behavior
- Account sign-in mock with Firebase/Supabase-ready hooks
- Paystack subscription checkout for paid plans
- Cartoon, anime, cinematic, realistic, render, horror, stickman, illustrated, sketch, vector, comic, and whiteboard artwork assets

## Run locally

```bash
npm start
```

API keys are read from real environment variables, or from a `.env` file placed next to `server.js` (loaded automatically, no dependencies — real env vars always win):

```text
# .env (server-side only, never sent to the browser)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
GEMINI_API_KEY=...my-free-key...   # Nano Banana images: https://aistudio.google.com/apikey
```

Open:

```text
http://localhost:4173
```

## Paystack checkout

Paid pricing buttons open Paystack InlineJS checkout.

1. Open [app.js](app.js).
2. Replace `pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY` with your Paystack public key.
3. Set `PAYSTACK_CONFIG.currency` to the currency enabled on your Paystack account.
4. Update `planCheckout` amounts if you want different prices. Amounts are in the smallest currency unit, so `$19` is `1900`.
5. If you create recurring plans in the Paystack dashboard, paste each plan code into the matching `planCode` field.

Keep your Paystack secret key on a backend only. In production, verify the Paystack reference server-side and use Paystack webhooks before permanently activating a subscription.

## Production backend map

Recommended stack:

- Auth: Supabase Auth or Firebase Auth
- Database: `users`, `creations`, `subscriptions`, `usage_events`
- Storage: Supabase Storage or S3
- AI generation: Pollinations.ai (free, no API key required) — implemented in `api/generate.js`
- Payments: Paystack for subscriptions
- Safety: server-side moderation before generation

## Image generation (free)

Image and video-concept generation is wired to [Pollinations.ai](https://pollinations.ai), which is free and needs no API key or account:

- **Anime** uses the dedicated `flux-anime` model; other styles use `flux` (or `turbo` for lower quality).
- **Video** mode returns a 16:9 cinematic keyframe image (true free video generation isn't available yet).
- **Character types** (stickman, illustrated, sketch, vector, comic, whiteboard) are applied as prompt modifiers. Minimal styles (stickman, vector, sketch, whiteboard) prompts push hard toward flat doodle simplicity — plain backgrounds, uniform lines, no shading — instead of the "highly detailed" hint used for richer styles.
- **Character consistency** is improved via **seed locking**: every generation sends a persisted `characterSeed`, so regenerations and storyboard scenes reuse the same seed. This makes the character noticeably more consistent across scenes, but the free provider generates one image per request and prompt wording still varies by scene — consistency is best-effort, not guaranteed. Use **Reroll character** in the Workflow panel for a new look.
- **Color customization**: color modes (full color, black & white, grayscale, sketch) and per-element colors (skin, clothing, hair, background, props) are applied to the generation prompt; locally drawn placeholders are colorized with the user's palette while preserving character shapes.
- Generation is unlimited on the Free plan — no trial cap, no subscription required.

Optional environment variables (only needed if you add these features later):

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
ELEVENLABS_API_KEY=
OPENAI_API_KEY=
```

## AI prompt engineering (GPT)

Both the **Enhance** button and **every generation** now run the user's idea through an LLM prompt-engineering step implemented in `lib/prompt-engine.js` (shared by `api/prompt.js` and `api/generate.js`):

- The LLM identifies what the idea actually is, then rewrites it into one optimized image prompt (subject, action, environment, lighting, palette, camera) — tailored to the selected style and mode.
- **Provider chain**: OpenAI GPT (`OPENAI_API_KEY` + optional `OPENAI_MODEL`, server-side only) → free Pollinations text API (no key needed) → built-in offline enhancer. Failures fall back silently; the user's own words always win when no LLM answers.
- **Automatic**: `/api/generate` engineers the prompt before composing the image URL, with a 200-entry cache so retries and repeated scene renders skip the round-trip. The response reports `promptSource` (`openai`, `pollinations`, or `original`) — the client toast shows which engine wrote the prompt.
- **Cloudflare Workers AI images, your token** (`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`): the first-choice renderer once configured. Image mode uses **Flux Schnell** (`@cf/black-forest-labs/flux-1-schnell`), 16:9 video keyframes use **SDXL** (`@cf/stabilityai/stable-diffusion-xl-base-1.0`, 1024×576). Comes with a free daily allowance; results return as base64 data URLs. Overrides: `CLOUDFLARE_AI_MODEL`, `CLOUDFLARE_VIDEO_MODEL`.
- **Gemini image generation, your key** (`POST /api/generate` with `GEMINI_API_KEY` set): Google's Nano Banana model (`gemini-2.5-flash-image`, override with `GEMINI_IMAGE_MODEL`) renders first if Cloudflare isn't configured. Uploaded reference photos (max 3) are passed as inline images so **photo → style** restyles work (keep the subject, restyle per the prompt). Every failure — bad key, quota, timeout, blocked output — silently falls back to the free Pollinations renderer, so generation never gets blocked. Result returns as a base64 data URL. Free keys: https://aistudio.google.com/apikey
- No key is ever exposed to the frontend; no provider is ever on the critical path to failure.
- **AI scene director** (`POST /api/scenes`, backed by `breakdownScenes` in `lib/prompt-engine.js`): the same LLM chain turns the narration script into a shot list of vivid per-shot visual descriptions (up to 8, JSON output, tolerant parsing). The Workflow panel's **AI scene director** button uses it; when no LLM provider answers it falls back to the mechanical sentence splitter and says so.

## AI voiceovers (ElevenLabs)

The Create page includes an **AI narration & dialogue** panel backed by [ElevenLabs](https://elevenlabs.io), implemented server-side in `api/voice.js` and served locally by `server.js` at `POST /api/voice`:

- **Key stays on the server.** Set `ELEVENLABS_API_KEY` in your hosting environment (Vercel project env vars, or an environment variable when running `node server.js`). The frontend never sees the key.
- **Without a key**, the panel states clearly that AI voices are unavailable and the user can still upload their own audio — no paywall blocks either path.
- **Actions**
  - `voices` — list available voices (name, language, hosted preview sample URL). Cached for 5 minutes to stay within free-tier limits.
  - `preview` — a short sample capped at **200 characters**. The frontend first plays the voice's provider-hosted sample, which costs **no API credits**.
  - `generate` — full narration capped at **5000 characters** per request, returned as an MP3 data URL.
- **Voice settings**: stability, similarity, style (expressiveness), and speed where the model supports it. Speed is only sent when the user changes it from the default, since some models reject that field.
- **Voice choice**: the dropdown is populated from the account's `/v1/voices` response. No voice is ranked or privileged; all returned voices are shown as-is.
- **Quota honesty**: HTTP 401/402/429 from the provider are mapped to explicit messages ("free quota exhausted / rate limited — try later or upload audio"), never silently swallowed.
- **Uploaded audio** is stored client-side as a data URL as the always-available fallback; an 8 MB upload cap protects localStorage.

To swap in a different voice provider later, replace the internals of `api/voice.js` while keeping the `{ action: "voices" | "preview" | "generate" }` contract — no frontend changes required.

## Descript-style captions

Implemented in `api/transcribe.js` (transcription), `lib/captions.js` (pure caption engine), and the **Captions** panel on the Create page:

- **Word-level timing**: the shared caption engine groups timed words into lines (6 words max, sentence/pause aware), powers sticky karaoke highlighting synced to the voiceover player, and renders an editable line-by-line editor (click a line's text to seek; edit text or times directly — editing text re-spreads that line's words).
- **Three sources, in order of convenience**
  1. `Transcribe audio` — server-side transcription via the single `ELEVENLABS_API_KEY` (ElevenLabs Scribe model, word-level timestamps, auto language detection). Audio is sent raw (≤ 8 MB), wrapped to multipart on the server, so the key never reaches the browser. Scribe is billable per audio minute; free monthly credits apply.
  2. `Auto-time script` — **no provider needed**: distributes the narration script across the voiceover's duration, weighted by word length. Timings are honest estimates (flagged in the UI when no audio is loaded).
  3. `Import SRT/VTT` — parses existing caption files; word times are spread within each imported cue.
- **Styles**: karaoke highlight / clean / bold-outline presets, font size, position (bottom / middle / top), and a ±10 s timing offset for manual sync.
- **Export**: `.srt` and `.vtt` downloads built from the current word timings.
- **Quota honesty**: 401 → "key rejected", 402/429 → "transcription quota exhausted — try later or caption manually". The manual paths never gate on a provider.

The transcription provider is replaceable: swap the internals of `api/transcribe.js` while keeping the contract (raw audio body + `X-Audio-Mime` header in; `{ words: [{ text, start, end }], text, language }` out).

## Full animation workflow (script → storyboard → library)

The **Workflow** panel ties every feature into one pipeline, working strictly within free-provider limits:

1. **Build scenes from script** — splits the narration script (falls back to the main prompt) into sentence-sized shots, capped at 8 scenes per free run. No provider needed.
2. **Render scene images** — each scene is generated through the existing free Pollinations pipeline (`POST /api/generate`), one image at a time, carrying the chosen character style, color mode, and palette. Failed shots can be retried individually by clicking them in the scene strip.
3. **Play synced preview** — the storyboard stage advances scene keyframes (with fades), scaled so the total scene timing matches the voiceover duration when one exists (proportional to each scene's word count otherwise), while karaoke captions overlay in sync with the ± offset you set in the Captions panel. Audio plays with scenes; without audio the preview still animates. This is an animated storyboard of keyframes — real rendered video is not something free providers can produce, and the UI says so plainly.
4. **Save to library** — stores the storyboard in the normal creation library (`usage.videos` +1), flagged with `scenes`, `hasVoiceover`, and `hasCaptions` so downstream export/publish can act on it.

No payment, subscription, or API key is required for any workflow step; the provider-backed steps (scene rendering via Pollinations, transcription) degrade with clear messages exactly like the panels they reuse.

## Free access & honest limits

Compliance rules enforced across the studio:

- **No trial, no gate, no payment screen on generation or the animation suite.** Image generation, character types, color customization, the workflow/storyboard, voiceovers, and captions all work on the Free plan with zero subscription prompts. `ensureTrialOrPlanAllows` is a free-unlimited pass and the legacy trial counter is retired.
- **Payment modals only ever open from the Pricing page** (Paystack checkout for the paid plans). Generation failures surface as plain error messages, never upgrade pitches.
- **Honest plan copy**: the Free plan card lists what actually exists (unlimited images, video concepts + storyboard, voiceover/captions within provider free tiers, watermark, shared queue). No fake "ads supported" or invented caps; the dashboard shows usage as "N · unlimited" for Free instead of meter bars pretending at a cap.
- **Provider free-tier discipline, surfaced to the user**
  - Image/scene generation: Pollinations.ai, no key, effectively unlimited — failures show the real error.
  - Voice (ElevenLabs TTS): voice list cached 5 min; previews ≤ 200 chars (hosted samples cost nothing); narration ≤ 5000 chars; 402/429 → "free quota exhausted — try later or upload audio".
  - Transcription (ElevenLabs Scribe): ≤ 8 MB audio per request; billed per audio minute; quota errors name the manual fallbacks (auto-time script, SRT import).
  - Uploaded audio/captions: always free, no provider at all.
- **Undo behavior, not lockouts**: failed storyboard scenes stay individually retryable; nothing blocks retrying after a quota error clears.
- **Known paid-plan artifact kept, stated plainly**: Free-plan library downloads carry a "Made with klv.ai" watermark (existing product rule tied to the paid plans that remove it). It never blocks downloading.
- **Providers are replaceable**: Pollinations (images), ElevenLabs voice, and ElevenLabs Scribe are each wrapped behind a single server file with a stable contract (`api/generate.js`, `api/voice.js`, `api/transcribe.js`) — swap engines without frontend changes.
