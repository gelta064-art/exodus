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

---
Task ID: drama-rebuild
Agent: main
Task: Rebuild Dramai (AI mini-drama app) after environment revert

Work Log:
- Previous session's drama pivot was lost (environment reverted to CineTales state)
- Redid entire drama pivot cleanly: prisma schema (Series/Character/Episode/Scene/Line), types, ai.ts (breakdownDrama + DRAMA_STYLE + generateImageBuffer + generateLineAudio), storage (covers/scenes/lines), store (feed view), hooks, generator, progress
- Cleaned up old CineTales files (api/stories, api/chapters, player-view.tsx)
- Fixed scenes API route (CINEMATIC_STYLE → DRAMA_STYLE, removed size param)
- Rewrote page.tsx (mobile app shell with floating bottom nav), layout.tsx (Dramai metadata), globals.css (drama CSS: ct-feed scroll-snap, animate-subtitle, animate-hint, animate-pulse-dot)
- Rewrote library-view, create-view, series-view for drama model
- Verified feed-view.tsx survived intact from previous session
- Pushed schema to DB (force-reset), generated Prisma client
- Created test series "The Contract Fiancée" (4 chars: Maya/tongtong, Daniel/jam, Vivian/xiaochen, Leo/luodo; 3 episodes with cliffhanger hooks)
- Generated all 28 media assets (1 cover + 9 scenes + 18 dialogue lines) via bun script with concurrency 2 + 429 retry
- Agent Browser verification: library renders series card with READY badge; series view shows cover/cast/episodes; feed player plays audio with dialogue subtitles + character emotion badges + progress dots advancing (✓✓✓▶··); mobile responsive at 390px; 0 console errors

Stage Summary:
- Dramai is a fully functional AI mini-drama app: paste story → LLM writes dialogue script with cliffhangers + assigns character voices → image gen paints 9:16 scenes → TTS generates per-line dialogue audio → Reels-style vertical swipe player with Ken Burns, crossfades, subtitle animations, auto-advance, and cliffhanger hooks
- Test series "The Contract Fiancée" fully generated and verified playing end-to-end
- Lint: 0 errors. Browser: 0 errors. Mobile responsive.

---
Task ID: genre-consistency-hooks
Agent: main
Task: Add genre presets, character visual consistency, and 5-episode cliffhanger loop

Work Log:
- Prisma: added visualDescription field to Character model
- types.ts: added visualDescription to CharacterData + DramaBreakdown; added GENRE_PRESETS (8 genres: CEO Romance, Contract Marriage, Revenge & Comeback, Rebirth, Hidden Identity, Lost Heir, Supernatural, Family Feud) with emoji/label/blurb/tropes
- ai.ts DIRECTOR_SYSTEM prompt: 3→5 episodes, added "coin-moment" cliffhanger rules (betrayal/slap/kiss-interrupted/identity-exposed), genre hint steering, character "visual" field (concise physical description for consistency)
- breakdownDrama() now accepts genreHint param {label, tropes}
- series API: accepts genreId, looks up preset, passes genreHint, persists visualDescription; serialize includes visualDescription
- scenes image API: prepends "Characters in frame: <visual1>; <visual2>" to each scene prompt based on which characters speak in that scene → face/look consistency across scenes
- create-view: added genre preset chip selector (8 buttons with emoji), blurb shows on selection, sample button now sets genre=contract-marriage
- Generated "Return of M" test series (revenge genre): 5 episodes, 4 chars with distinct visuals (Mei Lin: sleek black bob/cold eyes/locket; Mrs. Chen: silver hair/diamonds; David: tousled hair/worn book; Sophia: blonde/sneering), cliffhangers escalating ("take back what's mine" → "lose you again")
- All 44 media assets generated; browser-verified: library shows both series, create view shows 8 genre chips, series detail shows 5 episodes with hooks, feed plays with dialogue+badges; 0 console errors; 0 lint errors

Stage Summary:
- Three upgrades complete: (1) 8 genre preset buttons steering LLM tropes, (2) character visual descriptions prepended to scene prompts for face consistency, (3) 5 episodes with stronger "coin-moment" cliffhangers
- "Return of M" (Revenge & Comeback) fully generated and verified — 5 eps, 4 chars, 28 lines, 15 scenes, 1 cover = 44 assets ready

---
Task ID: inkvine-build
Agent: main
Task: Build Inkvine — Voice-Cloned Audiobook Reader (per Luna's spec)

Work Log:
- Replaced Dramai with Inkvine: voice-cloned audiobook reader
- Prisma schema: Document (title/fileName/fileType/rawText/charCount/cover/voiceId/progress/lastChunk) + VoiceProfile + AudioChunk
- parser.ts: parseDocument() supports TXT/MD (utf-8), EPUB (epub2, spine-order chapter extraction + htmlToText), PDF (pdf-parse); cleanText() + chunkText() (paragraph-aware, ≤950 chars, sentence-splitting for long paragraphs)
- ai.ts: generateTtsBuffer() (429 retry), generateCoverBuffer() (vertical book cover), generateDocMeta() (LLM writes title+coverPrompt from excerpt)
- API routes: documents (GET list / POST upload+parse+chunk / PATCH progress / DELETE), documents/[id]/cover (POST), chunks/[id]/audio (POST per-chunk TTS), voices (GET seeds 7 defaults / POST create custom)
- Frontend: library-view (NaturalReader-style: top stats, featured media card with cover/Listen/progress, document list with file-type icons + voice dots + delete), upload-view (drag-drop + voice selector + parse flow), reader-view (text chunks with reading-highlight, sticky player with play/skip/speed-cycle 0.5x-2.5x, chunk dots, generate-all-audio button), voice-studio-view (voice profile cards with waveforms + create-custom modal + cloning-pipeline concept note)
- globals.css: Inkvine scrollbar, fade-in, wave animation, shimmer, pulse-dot, reading-highlight
- Test doc "The Lighthouse Keeper's Daughter.txt" uploaded: 2356 chars → 4 chunks → cover + 4 audio generated; reader plays with audio time=4 paused=false, current chunk highlighted; speed control cycles; Voice Studio shows 7 profiles + create modal

Stage Summary:
- Inkvine fully functional: upload EPUB/PDF/TXT → parse → chunk → TTS narrate → reader with variable speed + text highlight + chunk navigation
- 7 voice profiles (TongTong, Jam, ChuiChui, XiaoChen, LuoDo, Kazi, DouJi) + custom profile creation
- Browser-verified: library, reader (audio plays, highlight works), voice studio all render; 0 console errors; 0 lint errors
