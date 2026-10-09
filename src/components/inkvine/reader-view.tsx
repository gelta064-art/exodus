"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader2,
  RefreshCw,
  Gauge,
  Book,
  AlertTriangle,
  Star,
  Check,
  PenLine,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useDocument } from "./hooks";
import { api } from "@/lib/api-client";
import { voiceConfig } from "@/lib/voices";
import { generateDocumentAudio, type GenerateProgress } from "./generator";
import { SHELVES, type Shelf } from "@/lib/types";
import { StarRating } from "./library-view";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5];

export function ReaderView() {
  const docId = useAppStore((s) => s.selectedDocId);
  const back = useAppStore((s) => s.backToLibrary);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const { data: doc, isLoading } = useDocument(docId);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const textRef = React.useRef<HTMLDivElement | null>(null);

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [loadingAudio, setLoadingAudio] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [generating, setGenerating] = React.useState(false);
  const [progress, setProgress] = React.useState<GenerateProgress | null>(null);

  const chunks = doc?.chunks ?? [];
  const current = chunks[currentIndex];
  const ready = chunks.filter((c) => c.status === "ready").length;
  const allReady = ready === chunks.length && chunks.length > 0;

  // Reset index when doc changes
  React.useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, [docId]);

  // Set audio src when chunk changes
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (audio.src !== current.audioUrl) {
      audio.src = current.audioUrl;
      audio.load();
      setLoadingAudio(true);
    }
  }, [currentIndex, current?.audioUrl]);

  // Apply speed
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed, currentIndex]);

  // Play/pause
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentIndex, current?.audioUrl]);

  // Scroll current chunk into view
  React.useEffect(() => {
    const el = textRef.current?.querySelector(`[data-chunk-idx="${currentIndex}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [currentIndex]);

  async function handleEnded() {
    if (currentIndex + 1 < chunks.length) {
      setCurrentIndex((i) => i + 1);
      // Persist progress
      try {
        await api(`/api/documents/${docId}`, {
          method: "PATCH",
          body: JSON.stringify({ lastChunk: currentIndex + 1, progress: (currentIndex + 1) / chunks.length }),
        });
      } catch {}
    } else {
      setIsPlaying(false);
      toast.success("Finished!", { description: "You reached the end of the document." });
    }
  }

  async function handleGenerateAll() {
    if (!doc) return;
    setGenerating(true);
    setProgress(null);
    try {
      await generateDocumentAudio(doc, (p) => setProgress(p));
      bumpRefresh();
      toast.success("All audio generated");
    } catch {
      toast.error("Generation incomplete");
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  }

  function togglePlay() {
    if (!current?.audioUrl) {
      toast.error("This chunk's audio isn't ready yet. Generate audio first.");
      return;
    }
    setIsPlaying((p) => !p);
  }

  function skip(delta: number) {
    const next = currentIndex + delta;
    if (next >= 0 && next < chunks.length) {
      setCurrentIndex(next);
    }
  }

  function cycleSpeed() {
    const i = SPEEDS.indexOf(speed);
    const next = SPEEDS[(i + 1) % SPEEDS.length];
    setSpeed(next);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-6 space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-16 text-center">
        <p className="text-muted-foreground">Document not found.</p>
        <button onClick={back} className="mt-4 text-primary hover:underline text-sm">
          Back to library
        </button>
      </div>
    );
  }

  const vcfg = voiceConfig(doc.voiceId);
  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-6">
      <button
        onClick={back}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded font-semibold">
              {doc.fileType}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vcfg.color }} />
              {vcfg.label}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{doc.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {doc.charCount.toLocaleString()} chars · {chunks.length} chunks · {ready}/{chunks.length} ready
          </p>
        </div>
        {!allReady && (
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 text-amber-950 px-3 py-2 text-xs font-semibold hover:bg-amber-300 transition disabled:opacity-60 shrink-0"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {generating ? `${progress?.done ?? 0}/${progress?.total ?? 0}` : "Generate audio"}
          </button>
        )}
      </div>

      {/* Social controls: shelf + rating + review */}
      <SocialBar doc={doc} />

      {/* Generation banner */}
      {generating && progress && (
        <div className="mb-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 p-3">
          <div className="flex items-center justify-between text-xs text-amber-100 mb-1.5">
            <span>Generating audio…</span>
            <span>{progress.done}/{progress.total}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-amber-500/20">
            <div
              className="h-full bg-amber-300 transition-all"
              style={{ width: `${Math.round((progress.done / Math.max(progress.total, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Not ready banner */}
      {!allReady && !generating && (
        <div className="mb-4 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 p-3 flex items-center gap-2 text-xs text-amber-100">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Some chunks aren't narrated yet. Click "Generate audio" to synthesize all pending chunks.</span>
        </div>
      )}

      {/* Reading text */}
      <div
        ref={textRef}
        className="rounded-2xl bg-card ring-1 ring-border/60 p-4 sm:p-6 max-h-[50vh] overflow-y-auto ct-scroll mb-5"
      >
        <div className="prose prose-invert max-w-none">
          {chunks.map((ch, i) => (
            <p
              key={ch.id}
              data-chunk-idx={i}
              onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
              className={cn(
                "text-sm leading-relaxed mb-3 cursor-pointer rounded transition-colors px-1 py-0.5",
                i === currentIndex
                  ? "reading-highlight text-foreground"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {ch.text}
            </p>
          ))}
        </div>
      </div>

      {/* Player */}
      <div className="sticky bottom-16 sm:bottom-4 z-30">
        <div className="rounded-2xl bg-card/95 backdrop-blur-xl ring-1 ring-border/60 shadow-2xl shadow-black/40 p-3 sm:p-4">
          <audio
            ref={audioRef}
            onEnded={handleEnded}
            onCanPlay={() => setLoadingAudio(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Chunk info */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              Chunk {currentIndex + 1} / {chunks.length}
              {current?.status === "pending" && " · generating…"}
              {current?.status === "error" && " · failed"}
            </p>
            <button
              onClick={cycleSpeed}
              className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium hover:bg-muted/70 transition"
            >
              <Gauge className="h-3.5 w-3.5" />
              {speed}×
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => skip(-1)}
              disabled={currentIndex === 0}
              className="grid place-items-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!current?.audioUrl}
              className={cn(
                "grid place-items-center h-12 w-12 rounded-full shadow-lg transition",
                current?.audioUrl
                  ? "bg-primary text-primary-foreground shadow-primary/20 hover:scale-105"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              {loadingAudio ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={() => skip(1)}
              disabled={currentIndex >= chunks.length - 1}
              className="grid place-items-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Chunk dots */}
          {chunks.length > 1 && (
            <div className="mt-3 flex items-center gap-1 overflow-x-auto ct-scroll">
              {chunks.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
                  className={cn(
                    "h-1.5 rounded-full shrink-0 transition-all",
                    i === currentIndex
                      ? "w-6 bg-primary"
                      : chunks[i]?.status === "ready"
                      ? "w-1.5 bg-foreground/30 hover:bg-foreground/50"
                      : "w-1.5 bg-amber-400/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Goodreads-style shelf switcher + star rating + review composer */
function SocialBar({ doc }: { doc: any }) {
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const [shelf, setShelf] = React.useState<Shelf | null>(doc.shelf);
  const [rating, setRating] = React.useState<number | null>(doc.rating);
  const [review, setReview] = React.useState(doc.review || "");
  const [showReview, setShowReview] = React.useState(false);

  // Sync when doc changes
  React.useEffect(() => {
    setShelf(doc.shelf);
    setRating(doc.rating);
    setReview(doc.review || "");
  }, [doc.id, doc.shelf, doc.rating, doc.review]);

  async function patchShelf(s: Shelf | null) {
    setShelf(s);
    try {
      await api(`/api/documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ shelf: s || "" }),
      });
      bumpRefresh();
      if (s) toast.success(`Moved to ${SHELVES.find((x) => x.id === s)?.label}`);
    } catch {
      toast.error("Failed to update shelf");
    }
  }

  async function patchRating(r: number | null) {
    setRating(r);
    try {
      await api(`/api/documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ rating: r || 0 }),
      });
      bumpRefresh();
    } catch {
      toast.error("Failed to save rating");
    }
  }

  async function saveReview() {
    try {
      await api(`/api/documents/${doc.id}`, {
        method: "PATCH",
        body: JSON.stringify({ review }),
      });
      bumpRefresh();
      toast.success("Review saved");
      setShowReview(false);
    } catch {
      toast.error("Failed to save review");
    }
  }

  return (
    <div className="mb-5 rounded-2xl bg-card ring-1 ring-border/60 p-3 sm:p-4 space-y-3">
      {/* Shelf switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mr-1">Shelf:</span>
        {SHELVES.map((s) => (
          <button
            key={s.id}
            onClick={() => patchShelf(shelf === s.id ? null : s.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition",
              shelf === s.id
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-background text-muted-foreground ring-border hover:text-foreground hover:ring-primary/30"
            )}
          >
            <span>{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Rating */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your rating:</span>
          <StarRating value={rating} size={18} onChange={(v) => patchRating(v === rating ? 0 : v)} />
          {rating ? <span className="text-xs text-muted-foreground ml-1">{rating}/5</span> : null}
        </div>
        <button
          onClick={() => setShowReview((v) => !v)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition"
        >
          <PenLine className="h-3.5 w-3.5" />
          {doc.review ? "Edit review" : "Write a review"}
        </button>
      </div>

      {/* Review composer / display */}
      <AnimatePresence>
        {showReview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share what you thought about this book…"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{review.length}/500</span>
              <div className="flex gap-2">
                <button onClick={() => setShowReview(false)} className="rounded-lg bg-muted text-muted-foreground px-3 py-1.5 text-xs font-medium hover:text-foreground transition">
                  Cancel
                </button>
                <button onClick={saveReview} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:brightness-110 transition">
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing review (collapsed) */}
      {doc.review && !showReview && (
        <div className="rounded-lg bg-background/60 p-2.5 text-xs text-muted-foreground italic line-clamp-2">
          &ldquo;{doc.review}&rdquo;
        </div>
      )}
    </div>
  );
}
