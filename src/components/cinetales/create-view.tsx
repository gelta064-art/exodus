"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Loader2,
  Check,
  AlertCircle,
  Clapperboard,
  Mic2,
  ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import type { SeriesData } from "@/lib/types";
import { generateAllMedia, type GenerateProgress } from "./generator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SAMPLE_STORY = `Maya was the invisible intern everyone ignored — until the company's cold, ruthless CEO, Daniel Vale, suddenly announced her as his fake fiancée to block an arranged marriage his board was forcing on him.

She hated him. He barely noticed her. But the contract was signed: three months, pretend to be in love, then walk away rich.

The problem? Daniel's arranged fiancée, the elegant and dangerous Vivian, isn't about to lose. And Maya's old childhood friend Leo — now a rival executive — knows a secret about Maya's past that could shatter everything.

As board meetings become battlegrounds and gala nights turn into war zones, the line between fake and real starts to blur. Daniel begins to see Maya. Maya begins to trust Daniel. And Vivian begins to plot.`;

type Phase = "idle" | "structuring" | "generating" | "done" | "error";

export function CreateView() {
  const [sourceText, setSourceText] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState<GenerateProgress | null>(null);
  const [created, setCreated] = React.useState<SeriesData | null>(null);
  const [errorMsg, setErrorMsg] = React.useState("");

  const backToLibrary = useAppStore((s) => s.backToLibrary);
  const openFeed = useAppStore((s) => s.openFeed);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const charCount = sourceText.length;
  const canSubmit = sourceText.trim().length >= 40 && phase === "idle";

  async function handleCreate() {
    if (!canSubmit) return;
    setPhase("structuring");
    setErrorMsg("");
    setProgress(null);

    try {
      const { series } = await api<{ series: SeriesData }>("/api/series", {
        method: "POST",
        body: JSON.stringify({
          sourceText,
          title: title.trim() || undefined,
        }),
      });
      setCreated(series);
      bumpRefresh();

      setPhase("generating");
      await generateAllMedia(series, (p) => setProgress(p));
      bumpRefresh();
      setPhase("done");
      toast.success("Drama series ready!", {
        description: `"${series.title}" — ${series.episodes.length} episodes.`,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  function handlePlay() {
    if (created) openFeed(created.id, 0);
  }

  function handleReset() {
    setPhase("idle");
    setSourceText("");
    setTitle("");
    setProgress(null);
    setCreated(null);
    setErrorMsg("");
  }

  return (
    <div className="mx-auto max-w-md w-full px-4 py-6">
      <button
        onClick={backToLibrary}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Wand2 className="h-3.5 w-3.5" />
          New Drama
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Create a mini-drama</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste any story. Our AI director writes the script, casts voices, paints
          every scene, and turns it into swipeable episodes.
        </p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Title <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The Contract Fiancée"
            maxLength={120}
            className="w-full rounded-xl bg-card border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Your story</label>
            <button
              onClick={() => {
                setSourceText(SAMPLE_STORY);
                setTitle("The Contract Fiancée");
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
            placeholder="A princess in disguise, a CEO seeking revenge, a love that defies a family feud…"
            rows={9}
            className="w-full rounded-xl bg-card border border-border px-3.5 py-3 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/40 transition resize-y ct-scroll"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{charCount} chars</span>
            <span>
              {charCount < 40 ? `${40 - charCount} more` : "Ready"}
            </span>
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
              Generate Drama
            </>
          )}
          {phase === "structuring" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Writing the script…
            </>
          )}
          {phase === "generating" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Producing episodes…
            </>
          )}
          {phase === "done" && (
            <>
              <Check className="h-4 w-4" />
              Watch Now
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

      <AnimatePresence>
        {(phase === "structuring" ||
          phase === "generating" ||
          phase === "done" ||
          phase === "error") && (
          <GenPanel
            phase={phase}
            progress={progress}
            series={created}
            errorMsg={errorMsg}
            onPlay={handlePlay}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GenPanel({
  phase,
  progress,
  series,
  errorMsg,
  onPlay,
  onReset,
}: {
  phase: Phase;
  progress: GenerateProgress | null;
  series: SeriesData | null;
  errorMsg: string;
  onPlay: () => void;
  onReset: () => void;
}) {
  const steps = [
    { key: "structuring", label: "Writing script & casting voices", icon: Clapperboard },
    { key: "generating", label: "Painting scenes & recording dialogue", icon: Mic2 },
    { key: "done", label: "Series complete", icon: Check },
  ];
  const phaseIndex =
    phase === "structuring" ? 0 : phase === "generating" ? 1 : phase === "done" ? 2 : 0;
  const percent = progress
    ? Math.round((progress.done / Math.max(progress.total, 1)) * 100)
    : phase === "structuring"
    ? 6
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-6"
    >
      <div className="rounded-2xl bg-card ring-1 ring-border/60 overflow-hidden">
        <div className="p-4 border-b border-border/60">
          {series && (
            <>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {series.genre}
                </span>
              </div>
              <h3 className="font-semibold text-base leading-tight">
                {series.title}
              </h3>
            </>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {phase === "structuring" && "AI director is writing your drama…"}
            {phase === "generating" && "Generating scenes & dialogue in parallel…"}
            {phase === "done" && "Your drama is ready to premiere."}
            {phase === "error" && "Something went wrong."}
          </p>

          {(phase === "structuring" || phase === "generating") && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>
                  {phase === "structuring"
                    ? "Analyzing"
                    : `${progress?.done ?? 0} / ${progress?.total ?? 0}`}
                </span>
                <span>{percent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-amber-300"
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="mt-3 rounded-lg bg-destructive/10 ring-1 ring-destructive/30 px-3 py-2 text-xs text-destructive">
              {errorMsg}
            </div>
          )}
        </div>

        {phase !== "error" && (
          <div className="p-4 space-y-2.5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const state =
                i < phaseIndex ? "done" : i === phaseIndex ? "active" : "pending";
              return (
                <div key={s.key} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "grid place-items-center h-7 w-7 rounded-full ring-1 transition shrink-0",
                      state === "done" && "bg-emerald-500/20 ring-emerald-400/40 text-emerald-300",
                      state === "active" && "bg-primary/20 ring-primary/40 text-primary",
                      state === "pending" && "bg-muted ring-border text-muted-foreground"
                    )}
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : state === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      state === "pending" ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}

            {phase === "generating" && series && progress && (
              <div className="mt-3 pt-3 border-t border-border/60">
                <EpisodeProgress series={series} progress={progress} />
              </div>
            )}
          </div>
        )}

        {phase === "done" && series && (
          <div className="p-4 pt-0">
            <button
              onClick={onPlay}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
            >
              <Clapperboard className="h-4 w-4" />
              Watch the drama
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
          <div className="p-4 pt-0">
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

function EpisodeProgress({
  series,
  progress,
}: {
  series: SeriesData;
  progress: GenerateProgress;
}) {
  const rows = series.episodes.map((ep, ei) => {
    const total = ep.scenes.length + ep.scenes.reduce((a, s) => a + s.lines.length, 0);
    const done =
      ep.scenes.filter((s) => s.status === "ready" || progress.completed.includes(`scene-${s.id}`)).length +
      ep.scenes.reduce(
        (a, s) =>
          a + s.lines.filter((l) => l.status === "ready" || progress.completed.includes(`line-${l.id}`)).length,
        0
      );
    return { ei, title: ep.title, done, total };
  });

  return (
    <div className="space-y-1.5 max-h-40 overflow-y-auto ct-scroll pr-1">
      {rows.map((r) => (
        <div key={r.ei} className="flex items-center gap-2 text-[11px]">
          <span className="grid place-items-center h-5 w-5 rounded bg-primary/10 text-primary text-[9px] font-semibold shrink-0">
            {r.ei + 1}
          </span>
          <span className="flex-1 truncate text-muted-foreground">{r.title}</span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <ImageIcon className="h-2.5 w-2.5" />
            <Mic2 className="h-2.5 w-2.5" />
            {r.done}/{r.total}
          </span>
        </div>
      ))}
    </div>
  );
}
