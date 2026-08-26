"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  Check,
  AlertCircle,
  Film,
  Volume2,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { StoryData } from "@/lib/types";
import { generateAllMedia, type GenerateProgress, type MediaTask } from "./generator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SAMPLE_STORY = `In a forgotten village at the edge of the world, there lived an old lighthouse keeper named Eira. Every night she lit the great lamp to guide ships safely past the jagged coast. But one stormy evening, the light flickered and died, and from the crashing waves rose a creature of starlight and salt — a being who called itself the Last Star.

It had fallen from the sky, the Star told Eira, and without its place in the heavens the constellations themselves were unraveling. Only the keeper of a light could help it return. So Eira packed her lantern, locked the lighthouse door, and set out across the darkening sea in a tiny wooden boat.

The journey was long and strange. They sailed through forests of kelp that glowed like emeralds, past islands where the rocks whispered old secrets, and beneath skies that cracked open to show other worlds. The Star grew dimmer with each passing night, and Eira began to fear they would be too late.

At last they reached the Ends of the Water — a place where the sea poured upward into the sky like a great silver fountain. There, Eira made her choice. She gave the Star her lantern's flame, the last light she had, and watched it rise, burning brighter and brighter until it took its place among the stars.

When Eira returned home, the lighthouse lamp would never light again. But on clear nights, a single brilliant star hangs just above her tower, and no ship is ever lost upon the coast. They say if you listen to the wind there, you can still hear the Star whispering its thanks.`;

type Phase = "idle" | "structuring" | "generating" | "done" | "error";

export function CreateView() {
  const [sourceText, setSourceText] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState<GenerateProgress | null>(null);
  const [createdStory, setCreatedStory] = React.useState<StoryData | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  const backToLibrary = useAppStore((s) => s.backToLibrary);
  const openStory = useAppStore((s) => s.openStory);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const charCount = sourceText.length;
  const canSubmit = sourceText.trim().length >= 40 && phase === "idle";

  async function handleCreate() {
    if (!canSubmit) return;
    setPhase("structuring");
    setErrorMsg("");
    setProgress(null);

    try {
      // Step 1 — LLM breaks the story into structure
      const { story } = await api<{ story: StoryData }>("/api/stories", {
        method: "POST",
        body: JSON.stringify({ sourceText, title: title.trim() || undefined }),
      });
      setCreatedStory(story);
      bumpRefresh();

      // Step 2 — generate all media with progress
      setPhase("generating");
      await generateAllMedia(story, (p) => setProgress(p));
      bumpRefresh();
      setPhase("done");
      toast.success("Cinematic series ready!", {
        description: `"${story.title}" — ${story.chapters.length} chapters generated.`,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  function handleViewSeries() {
    if (createdStory) {
      openStory(createdStory.id);
    }
  }

  function handleReset() {
    setPhase("idle");
    setSourceText("");
    setTitle("");
    setProgress(null);
    setCreatedStory(null);
    setErrorMsg("");
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 sm:py-12">
      <button
        onClick={backToLibrary}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to library
      </button>

      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs font-medium text-primary mb-4">
          <Wand2 className="h-3.5 w-3.5" />
          New Series
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Tell me a story
        </h1>
        <p className="mt-3 text-muted-foreground">
          Paste any story below. Our AI director will split it into chapters,
          paint a cinematic scene for each moment, and narrate every word.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-2 block">
            Title <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Lighthouse Keeper's Star"
            maxLength={120}
            className="w-full rounded-xl bg-card border border-border px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Your story</label>
            <button
              onClick={() => {
                setSourceText(SAMPLE_STORY);
                setTitle("The Lighthouse Keeper's Star");
              }}
              className="text-xs text-primary hover:text-amber-300 transition inline-flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Try a sample
            </button>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Once upon a time, in a village at the edge of the world..."
            rows={12}
            className="w-full rounded-xl bg-card border border-border px-4 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/40 transition resize-y ct-scroll"
          />
          <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>{charCount} characters</span>
            <span>{charCount < 40 ? `${40 - charCount} more needed` : "Ready"}</span>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!canSubmit && phase === "idle"}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold shadow-lg transition",
            canSubmit
              ? "bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {phase === "idle" && (
            <>
              <Sparkles className="h-4 w-4" />
              Create Cinematic Series
            </>
          )}
          {phase === "structuring" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your story…
            </>
          )}
          {phase === "generating" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Producing the cinema…
            </>
          )}
          {phase === "done" && (
            <>
              <Check className="h-4 w-4" />
              Series Ready — Watch Now
            </>
          )}
          {phase === "error" && (
            <>
              <AlertCircle className="h-4 w-4" />
              Try Again
            </>
          )}
        </button>
      </div>

      {/* Generation overlay */}
      <AnimatePresence>
        {(phase === "structuring" ||
          phase === "generating" ||
          phase === "done" ||
          phase === "error") && (
          <GenerationPanel
            phase={phase}
            progress={progress}
            story={createdStory}
            errorMsg={errorMsg}
            onViewSeries={handleViewSeries}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GenerationPanel({
  phase,
  progress,
  story,
  errorMsg,
  onViewSeries,
  onReset,
}: {
  phase: Phase;
  progress: GenerateProgress | null;
  story: StoryData | null;
  errorMsg: string;
  onViewSeries: () => void;
  onReset: () => void;
}) {
  const steps = [
    { key: "structuring", label: "Breaking story into chapters", icon: Film },
    { key: "generating", label: "Painting scenes & narration", icon: ImageIcon },
    { key: "done", label: "Series complete", icon: Check },
  ];

  const phaseIndex =
    phase === "structuring" ? 0 : phase === "generating" ? 1 : phase === "done" ? 2 : 0;

  const percent = progress
    ? Math.round((progress.done / Math.max(progress.total, 1)) * 100)
    : phase === "structuring"
    ? 8
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-8"
    >
      <div className="rounded-2xl bg-card ring-1 ring-border/60 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/60">
          {story && (
            <h3 className="font-semibold text-lg leading-tight">{story.title}</h3>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            {phase === "structuring" && "Our AI director is reading your story…"}
            {phase === "generating" && "Generating cinematic assets in parallel…"}
            {phase === "done" && "Your series is ready to premiere."}
            {phase === "error" && "Something went wrong."}
          </p>

          {/* progress bar */}
          {(phase === "structuring" || phase === "generating") && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{phase === "structuring" ? "Analyzing" : `${progress?.done ?? 0} / ${progress?.total ?? 0} assets`}</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-amber-300"
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="mt-4 rounded-lg bg-destructive/10 ring-1 ring-destructive/30 px-4 py-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Steps */}
        {phase !== "error" && (
          <div className="p-5 space-y-3">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const state =
                i < phaseIndex ? "done" : i === phaseIndex ? "active" : "pending";
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid place-items-center h-8 w-8 rounded-full ring-1 transition",
                      state === "done" && "bg-emerald-500/20 ring-emerald-400/40 text-emerald-300",
                      state === "active" && "bg-primary/20 ring-primary/40 text-primary",
                      state === "pending" && "bg-muted ring-border text-muted-foreground"
                    )}
                  >
                    {state === "done" ? (
                      <Check className="h-4 w-4" />
                    ) : state === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      state === "pending" ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}

            {/* Asset breakdown while generating */}
            {phase === "generating" && story && progress && (
              <div className="mt-4 pt-4 border-t border-border/60">
                <ChapterProgress story={story} progress={progress} />
              </div>
            )}
          </div>
        )}

        {/* Done actions */}
        {phase === "done" && story && (
          <div className="p-5 pt-0">
            <button
              onClick={onViewSeries}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
            >
              <Film className="h-4 w-4" />
              Go to Series
            </button>
            <button
              onClick={onReset}
              className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition"
            >
              Create another
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="p-5 pt-0">
            <button
              onClick={onReset}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:brightness-110 transition"
            >
              Start over
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChapterProgress({
  story,
  progress,
}: {
  story: StoryData;
  progress: GenerateProgress;
}) {
  // Compute per-chapter readiness using the live `completed` set
  const rows = story.chapters.map((ch, ci) => {
    const total = 1 + ch.scenes.length; // audio + scenes
    const done =
      (ch.audioStatus === "ready" || progress.completed.includes(`audio-${ch.id}`) ? 1 : 0) +
      ch.scenes.filter(
        (sc) => sc.status === "ready" || progress.completed.includes(`scene-${sc.id}`)
      ).length;
    return { ci, title: ch.title, done, total };
  });

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto ct-scroll pr-1">
      {rows.map((r) => (
        <div key={r.ci} className="flex items-center gap-3 text-xs">
          <span className="grid place-items-center h-6 w-6 rounded-md bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
            {r.ci + 1}
          </span>
          <span className="flex-1 truncate text-muted-foreground">{r.title}</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Volume2 className="h-3 w-3" />
            <ImageIcon className="h-3 w-3" />
            {r.done}/{r.total}
          </span>
        </div>
      ))}
    </div>
  );
}
