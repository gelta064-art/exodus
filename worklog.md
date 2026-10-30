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

---
Task ID: naturalreader-goodreads
Agent: main
Task: Redesign Inkvine to NaturalReader-style bookshelf + Goodreads social features

Work Log:
- Prisma: added shelf (want_to_read|reading|read), rating (1-5), review, reviewAt to Document; added Activity model (community feed with reader/avatar/docTitle/detail/type/createdAt)
- types.ts: Shelf type, ActivityData, SHELVES constant (3 shelves with emoji/label)
- API: documents PATCH now accepts shelf/rating/review; new /api/activity GET (seeds 10 community entries on first call with staggered timestamps) + POST
- hooks: added useActivity()
- page.tsx: added Community nav (Library/Community/Voices), max-w-6xl layout
- library-view REWRITE (NaturalReader style): "My Library" header with search + stats (books/chars/reading/finished); shelf filter chips (All/Want to Read/Currently Reading/Read with counts); "Currently Reading" horizontal featured row (ReadingCard with cover+progress+Resume); bookshelf grid (BookCover with hover overlay, status badge, star rating, shelf badge, delete on hover); "Want to Read" mini-covers horizontal row; StarRating component (interactive, hover); ShelfBadge
- reader-view: added SocialBar component (shelf switcher chips, interactive star rating, review composer with textarea + Save, collapsed review display)
- community-view (Goodreads style): "Reader Activity" header; stats row (active readers / ratings&reviews / avg rating); "Trending this week" (top titles from activity counts); "Recent Activity" feed (avatar + reader name + verb + doc title + detail + timeAgo + colored type icon)
- Seeded 3 test books with covers: "The Lighthouse Keeper's Daughter" (reading, 4★), "The Cartographer's Apprentice" (want_to_read), "Salt and Signal" (read, 5★, review)

Stage Summary:
- Library now looks like NaturalReader: bookshelf grid of covers with hover-to-play, shelf filters, Currently Reading featured row, search
- Goodreads social features working: shelves (3), star ratings (interactive 1-5), reviews (composer), community activity feed (10 seeded entries with avatars/timestamps), trending, stats
- Browser-verified: library grid + filters + featured row render; community feed shows activity with timeAgo; reader social bar shows shelf/rating/review controls with 5 stars filled; 0 console errors; 0 lint errors; mobile responsive

---
Task ID: audible-layout
Agent: main
Task: Redesign Inkvine to Audible-style layout (per Luna's reference screenshot)

Work Log:
- Used VLM to analyze the reference screenshot: identified Audible layout (left sidebar nav, horizontal carousels with UPPERCASE headers, book cards with cover+title+By author+kebab, fixed Now Playing mini-player bar at bottom)
- globals.css: dark theme shifted from warm 280-hue to deep navy 260-hue (Audible-style), darker sidebar (oklch 0.11)
- store.ts: added NowPlaying state (docId/title/author/coverUrl/chunkIndex/totalChunks/timeLeftLabel/speed/isPlaying) + setNowPlaying/clearNowPlaying
- types.ts: added "discover" to AppView
- page.tsx REWRITE: left sidebar (w-56/60, dark bg, Home/Discover/Community/Voices nav + Upload button at bottom); main content area to the right; mobile top bar (md:hidden) with icon nav; NowPlayingBar shown when not immersive + nowPlaying set
- now-playing-bar.tsx: fixed bottom mini-player (thumbnail, title, Chapter X of Y, timeLeft left, speed, sleep timer icon, play/pause circle button, close X) — Audible-style
- discover-view.tsx: "Find your next listen" with carousels (Trending in your community, Recommended for you) + Browse by genre grid (8 genres with emoji + counts)
- library-view.tsx REWRITE (Audible-style): "My Library" header + search; horizontal carousels with UPPERCASE headers (CONTINUE LISTENING with featured ContinueCard showing progress bar + voice + Resume, WANT TO READ, FINISHED, ALL BOOKS); BookCard with cover + title + "By author" + kebab menu (delete); hover play overlay
- reader-view.tsx: added NowPlaying sync useEffect (updates store on doc/index/play/speed change so mini-bar reflects state)

Stage Summary:
- Inkvine now looks like Audible: left sidebar nav, deep navy theme, horizontal carousel rows with uppercase headers, book cards with covers + kebab menus, fixed Now Playing mini-player bar at bottom
- Browser-verified: sidebar (Home/Discover/Community/Voices + Upload), carousels (CONTINUE LISTENING/WANT TO READ/FINISHED/ALL BOOKS), now-playing bar shows "The Lighthouse Keeper's Daughter Chapter 1 of 4 · 0m left · 1x" with cover img + play btn, Discover view with trending/recommended/genres; mobile responsive (top bar on mobile); 0 console errors; 0 lint errors

---
Task ID: butterfly-engine
Agent: main
Task: Build the Butterfly Engine — living pages that come alive with motion + sound

Work Log:
- Prisma: added LivingBook + LivingPage models (artUrl/artStatus, videoUrl/videoStatus, ambientAudioUrl/audioStatus)
- API: /api/living-books (list) + /api/living-books/[id] (get with pages)
- Hooks: useLivingBooks + useLivingBook
- Store: added openButterfly(bookId) + selectedBookId
- Generated static page art: "girl beneath weeping willow, moonlit pond, fireflies" (768x1344 PNG)
- Video generation attempted with z-ai video SDK (image-to-video, quality mode, with_audio) — hit 429 rate limit twice
- FALLBACK: Built CSS-based "living" mode — Ken Burns zoom/pan + 24 animated firefly particles (framer-motion, random drift/opacity/scale) + ambient TTS narration (luodo voice, 0.85x speed)
- Generated ambient audio via TTS: page1-ambient.wav (1.4MB, narrates the page text)
- Seeded "The Willow Pond" living book (2 pages: page 1 fully loaded with art+audio, page 2 teaser)
- Butterfly Reader view: full-screen page canvas, clean chrome (top bar: back/title/chapter-list; bottom: page-turn + progress bar), text overlay at bottom
- THE BUTTERFLY BUTTON: custom SVG butterfly icon, top-right, electric cyan glow (animate-butterfly-glow), wing flutter animation (animate-wing-flutter); when alive: stronger alive-pulse animation
- Click butterfly → 300ms crossfade (framer-motion AnimatePresence) from static → living mode; ambient audio unmutes
- Click again → revert to quiet static (audio pauses, CSS layer unmounts)
- Library: "🦋 LIVING BOOKS" shelf at top with butterfly badges on covers, cyan accent
- Supports BOTH living modes: real video (when available) + CSS fallback (Ken Burns + particles + audio)

Stage Summary:
- Butterfly Engine prototype WORKING: click butterfly → page comes alive with Ken Burns motion + 24 drifting firefly particles + ambient narration audio; click again → quiet static
- Browser-verified: butterfly click toggles "Let the page breathe" ↔ "Return to quiet page"; 28 rounded-full elements (particles) appear in living mode; audio plays (page1-ambient.wav, paused=false, time=2); toggling back removes audio + particles; 0 console errors; 0 lint errors
- Video gen rate-limited (429) — CSS fallback ensures the prototype works tonight; real video can swap in seamlessly later (code auto-detects: videoUrl → video mode, else ambientAudioUrl → CSS mode)

---
Task ID: death-note-interactive
Agent: main
Task: Build Death Note-inspired interactive branching story (choose-your-own-adventure)

Work Log:
- API route /api/story: POST endpoint that uses LLM to generate branching scenes on-the-fly. System prompt establishes Death Note-inspired world (character names: Light, Ryuk, L, Soichiro, Misa, Near, Mello; premise: supernatural notebook, shinigami, detective pursuit) with instruction to write ORIGINAL scenes/dialogue (not reproduce manga). Each scene = 80-140 words second-person narration + 3 divergent choices with tone labels (bold/cautious/cruel/clever/reckless/ruthless/merciful/defiant/manipulative/desperate). Supports isEnding for natural conclusions.
- Request format: { history: [{sceneText, choiceText}], choice?: string }. First call (empty history) → opening scene. Subsequent calls pass full history + selected choice → LLM generates next scene with consequences + new choices.
- Story Reader view (story-view.tsx): full-screen dark immersive UI. Top bar (back, "Death Note" title with skull icon, history + restart buttons). Scene card with title + text. 3 choice buttons with tone-colored badges (A/B/C) and tone labels. Loading state ("The story bends to your will…"). Ending screen with restart. History drawer (slide-from-right) showing timeline of past scenes + choices with chapter markers.
- Library entry: prominent red/dark banner card "📓 Death Note — Choose Your Path" with "Play" button, shown at top of library.
- Tone colors: each tone has a unique color (bold=#f59e0b, cautious=#22d3ee, cruel=#ef4444, clever=#a78bfa, etc.) used for choice badges + labels.
- Tested: opening scene ("The Accused Discovery" / "The Death Note") with 3 choices; branching verified (chose "bold" → "The First Test" with consequences + new choices); chapter counter advances (Chapter 1 → Chapter 2).

Stage Summary:
- Interactive Death Note story WORKING: library banner → opens story reader → LLM generates opening scene → player makes choice → LLM generates next branch → continues until ending
- Original content only (character names + premise used as inspiration; all scenes/dialogue freshly generated by LLM)
- Browser-verified: banner renders, story loads, choices work, chapter advances, history drawer works; 0 console errors; 0 lint errors
