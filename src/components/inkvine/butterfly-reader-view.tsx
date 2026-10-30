"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, List, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useLivingBook } from "./hooks";
import { cn } from "@/lib/utils";

/** Custom butterfly SVG icon with cyan/indigo glow */
function ButterflyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left wings */}
      <path
        d="M24 24C20 14 14 10 8 12C4 13 3 18 6 22C9 26 16 26 24 24Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M24 24C22 30 17 34 12 33C9 32.5 8 29 10 27C13 24.5 19 24 24 24Z"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Right wings (mirror) */}
      <path
        d="M24 24C28 14 34 10 40 12C44 13 45 18 42 22C39 26 32 26 24 24Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M24 24C26 30 31 34 36 33C39 32.5 40 29 38 27C35 24.5 29 24 24 24Z"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Body */}
      <ellipse cx="24" cy="24" rx="1.8" ry="9" fill="currentColor" />
      {/* Antennae */}
      <path d="M24 15C23 11 21 9 19 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M24 15C25 11 27 9 29 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ButterflyReaderView() {
  const bookId = useAppStore((s) => s.selectedBookId);
  const back = useAppStore((s) => s.backToLibrary);
  const { data: book } = useLivingBook(bookId);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [alive, setAlive] = React.useState(false);
  const [showChrome, setShowChrome] = React.useState(true);
  const [showChapterList, setShowChapterList] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const pages = book?.pages ?? [];
  const page = pages[pageIndex];
  // Determine which "living" mode is available: real video, or CSS fallback (Ken Burns + particles + ambient audio)
  const livingMode: "video" | "css" | "none" = page?.videoUrl
    ? "video"
    : page?.ambientAudioUrl
    ? "css"
    : "none";
  const canLive = livingMode !== "none";

  React.useEffect(() => {
    setPageIndex(0);
    setAlive(false);
  }, [bookId]);

  // Handle media play/pause when toggling alive
  React.useEffect(() => {
    const v = videoRef.current;
    const a = audioRef.current;
    if (alive) {
      if (v && livingMode === "video") {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
      if (a && livingMode === "css") {
        a.currentTime = 0;
        a.play().catch(() => {});
      }
    } else {
      v?.pause();
      a?.pause();
    }
  }, [alive, pageIndex, livingMode]);

  const pokeChrome = React.useCallback(() => {
    setShowChrome(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (alive) setShowChrome(false);
    }, 3000);
  }, [alive]);

  React.useEffect(() => { pokeChrome(); }, [alive, pokeChrome]);

  const toggleButterfly = () => {
    if (!canLive) return;
    setAlive((a) => !a);
    pokeChrome();
  };

  const goPage = (delta: number) => {
    const next = pageIndex + delta;
    if (next < 0 || next >= pages.length) return;
    setAlive(false);
    setPageIndex(next);
    pokeChrome();
  };

  if (!book) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black">
        <div className="text-cyan-300/60 animate-pulse">Loading the Butterfly Engine…</div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black text-center px-6">
        <div>
          <p className="text-muted-foreground text-sm">No pages in this book yet.</p>
          <button onClick={back} className="mt-4 text-cyan-300 text-sm hover:underline">Back to library</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onMouseMove={pokeChrome}
      onClick={() => setShowChrome((v) => !v && true)}
    >
      {/* Page canvas — static art + video crossfade */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-full w-full max-w-[30rem] mx-auto">
          {/* Static art layer */}
          <AnimatePresence>
            {!alive && (
              <motion.div
                key="static"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {page.artUrl ? (
                  <img src={page.artUrl} alt={page.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full ct-shimmer grid place-items-center">
                    <span className="text-cyan-300/40 text-sm">painting the page…</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Living video layer (real video mode) */}
          <AnimatePresence>
            {alive && livingMode === "video" && (
              <motion.div
                key="living-video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <video
                  ref={videoRef}
                  src={page.videoUrl!}
                  className="h-full w-full object-cover"
                  loop
                  muted={!alive}
                  playsInline
                  autoPlay
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Living CSS layer (fallback: Ken Burns + firefly particles + ambient audio) */}
          <AnimatePresence>
            {alive && livingMode === "css" && page.artUrl && (
              <motion.div
                key="living-css"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 overflow-hidden"
              >
                {/* Ken Burns zoom/pan on the static art */}
                <img
                  src={page.artUrl}
                  alt={page.title}
                  className="h-full w-full object-cover animate-kenburns"
                />
                {/* Firefly particles overlay */}
                <FireflyParticles />
                {/* Ambient audio */}
                <audio ref={audioRef} src={page.ambientAudioUrl!} loop preload="auto" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cinematic vignette + gradient for text readability */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Text overlay (page content) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
        <div className="mx-auto max-w-[30rem] px-6 pb-20 pt-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300/70 mb-2">
            Page {pageIndex + 1} · {page.title}
          </p>
          <p className="text-base sm:text-lg leading-relaxed text-white/90 font-medium drop-shadow-lg">
            {page.text}
          </p>
        </div>
      </div>

      {/* === CLEAN CHROME === */}
      <AnimatePresence>
        {showChrome && (
          <>
            {/* Top bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-0 inset-x-0 z-30 px-5 py-4 flex items-center justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={back}
                className="grid place-items-center h-9 w-9 rounded-full bg-black/40 backdrop-blur text-white/80 hover:bg-black/60 transition"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="text-center min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{book.title}</p>
                <p className="text-xs font-medium text-white/70 truncate max-w-[60vw]">{page.title}</p>
              </div>
              <button
                onClick={() => setShowChapterList(true)}
                className="grid place-items-center h-9 w-9 rounded-full bg-black/40 backdrop-blur text-white/80 hover:bg-black/60 transition"
              >
                <List className="h-4 w-4" />
              </button>
            </motion.div>

            {/* Bottom: page turn + progress */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute bottom-0 inset-x-0 z-30 px-5 pb-5 pt-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* progress bar */}
              <div className="mx-auto max-w-[30rem] mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 tabular-nums">{pageIndex + 1}</span>
                  <div className="flex-1 h-0.5 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className="h-full bg-cyan-300 transition-all"
                      style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/50 tabular-nums">{pages.length}</span>
                </div>
              </div>
              {/* page turn */}
              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={() => goPage(-1)}
                  disabled={pageIndex === 0}
                  className="text-white/70 hover:text-white disabled:opacity-20 transition p-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => goPage(1)}
                  disabled={pageIndex >= pages.length - 1}
                  className="text-white/70 hover:text-white disabled:opacity-20 transition p-2"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* === THE BUTTERFLY BUTTON === */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleButterfly(); }}
        className={cn(
          "absolute top-16 right-5 z-40 grid place-items-center h-14 w-14 rounded-full transition-all",
          alive
            ? "bg-cyan-400/20 ring-2 ring-cyan-300 animate-alive-pulse"
            : canLive
            ? "bg-cyan-400/10 ring-1 ring-cyan-300/40 animate-butterfly-glow hover:scale-110"
            : "bg-muted/40 ring-1 ring-border opacity-40 cursor-not-allowed"
        )}
        title={alive ? "Return to quiet page" : canLive ? "Let the page breathe" : "Living asset not ready"}
      >
        <ButterflyIcon
          className={cn(
            "h-7 w-7",
            alive ? "text-cyan-200" : canLive ? "text-cyan-300 animate-wing-flutter" : "text-muted-foreground"
          )}
        />
      </button>

      {/* "Alive" indicator label */}
      <AnimatePresence>
        {alive && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute top-[5.5rem] right-20 z-40 pointer-events-none"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-300/80 font-medium">
              Living
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter list drawer */}
      <AnimatePresence>
        {showChapterList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowChapterList(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border/60 p-5 overflow-y-auto ct-scroll"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Pages</h3>
                <button onClick={() => setShowChapterList(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-1.5">
                {pages.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => { setPageIndex(i); setAlive(false); setShowChapterList(false); }}
                    className={cn(
                      "w-full text-left rounded-lg p-3 transition",
                      i === pageIndex ? "bg-cyan-400/10 ring-1 ring-cyan-300/30" : "hover:bg-muted/60"
                    )}
                  >
                    <p className="text-[10px] uppercase tracking-wide text-cyan-300/60">Page {i + 1}</p>
                    <p className="text-sm font-medium truncate">{p.title}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Animated firefly particles for the CSS "living" fallback mode */
function FireflyParticles() {
  const fireflies = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const size = 2 + Math.random() * 4;
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const duration = 6 + Math.random() * 8;
      const delay = Math.random() * 6;
      const driftX = (Math.random() - 0.5) * 60;
      const driftY = (Math.random() - 0.5) * 80;
      return { id: i, size, left, top, duration, delay, driftX, driftY };
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {fireflies.map((f) => (
        <motion.div
          key={f.id}
          className="absolute rounded-full"
          style={{
            width: f.size,
            height: f.size,
            left: `${f.left}%`,
            top: `${f.top}%`,
            backgroundColor: "#7dd3fc",
            boxShadow: `0 0 ${f.size * 3}px #7dd3fc, 0 0 ${f.size * 6}px rgba(125,211,252,0.4)`,
          }}
          animate={{
            x: [0, f.driftX, 0],
            y: [0, f.driftY, 0],
            opacity: [0.2, 1, 0.2],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: f.duration,
            delay: f.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
