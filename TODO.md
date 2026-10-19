- [x] Add drag-and-drop + plus-button file upload handling for the prompt dropzones
- [x] Render uploaded reference image thumbnails in the UI and store references in app state

- [x] Add generation gating: enforce plan limits + 3-generation free trial (per total)

- [ ] When blocked, auto-open subscription modal; when trial is over, show it automatically
- [x] Wire generation to backend AI provider through an API route (/api/generate)

- [ ] Add Vercel-compatible API implementation (serverless) for /api/generate
- [ ] Keep local dev server working (optionally proxy /api/\*)
- [ ] Add safety enforcement on server side (deny unsafe prompts)
- [ ] Add deployment notes for Vercel + GetHuna
