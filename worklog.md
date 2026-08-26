# CineTales — Worklog

A cinematic story-series generator: paste a story → AI breaks it into chapters, generates cinematic scene visuals + narration audio, and plays it back as a cinematic series.

---
Task ID: 0
Agent: main
Task: Project setup & architecture planning

Work Log:
- Explored project scaffold (Next.js 16, Tailwind 4, shadcn/ui new-york, Prisma SQLite, z-ai-web-dev-sdk installed)
- Read LLM, TTS, and Image Generation skill docs
- Designed architecture: single-page app with view-state routing, client-orchestrated media generation with granular progress

Stage Summary:
- Data model: Story -> Chapter -> Scene (with audioUrl / imageUrl / status fields)
- AI pipeline: LLM breaks story into chapters+scene prompts -> Image Gen (scenes + cover) -> TTS (chapter narration)
- Generation orchestrated client-side via granular API endpoints to avoid timeouts and give live progress
- TTS constraint: 1024 chars max -> chapter narrations kept under ~900 chars
- Visual theme: cinematic dark, amber/gold accents, letterbox player with Ken Burns + crossfade

---
Task ID: 1-8
Agent: main
Task: Build CineTales end-to-end (DB, AI pipeline, API, frontend, player)

Work Log:
- Prisma schema: Story -> Chapter -> Scene (with coverStatus/audioStatus/status + media URLs). Pushed to SQLite.
- AI lib (src/lib/ai.ts): breakdownStory() LLM call returns JSON {title, description, coverPrompt, chapters[{title, narration, scenes[{prompt, caption}]}]}; generateImageBuffer() + generateTtsBuffer() with 429-retry/backoff; CINEMATIC_STYLE suffix for visual consistency.
- API routes: POST/GET /api/stories (create via LLM + list), GET/DELETE /api/stories/[id], POST cover, POST chapter audio, POST scene image. Media saved to public/storage/{covers,audio,scenes}.
- Frontend: single-page app with Zustand view-state (library/create/series/player). TanStack Query for data. Cinematic dark theme (amber/gold accents, oklch palette), custom Ken Burns + crossfade + vignette + letterbox CSS.
- Library view: hero + story cards with readiness badges & progress bars.
- Create view: story textarea + sample story + client-orchestrated generation with live per-chapter progress (concurrency 2 + retry).
- Series view: cover hero, chapter list with thumbnails, "generate missing" banner, delete dialog.
- Cinematic Player: full-screen, scene images with Ken Burns + crossfade synced to audio time, captions, auto-hide controls, scrubber with scene-segment markers, chapter nav + auto-advance, "The End" screen.

Stage Summary:
- Full pipeline verified end-to-end with "Pip's Reawakening" (4 chapters, 8 scenes, 4 audios, 1 cover = 13 assets all ready).
- Agent Browser verification: library/series/player/create all render; player audio plays, scenes sync & advance, controls auto-hide, chapter switching works; footer sticks to bottom; no console errors.
- Lint: 0 errors. Concurrency tuned to 2 with 429 backoff retry to respect API rate limits.
