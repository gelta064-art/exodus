"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Trash2,
  Film,
  ImageIcon,
  Volume2,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useStory } from "./hooks";
import { storyProgress, totalScenes, formatDate } from "./progress";
import { api } from "@/lib/api-client";
import { generateAllMedia, type GenerateProgress } from "./generator";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function SeriesView() {
  const storyId = useAppStore((s) => s.selectedStoryId);
  const backToLibrary = useAppStore((s) => s.backToLibrary);
  const openPlayer = useAppStore((s) => s.openPlayer);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const { data: story, isLoading } = useStory(storyId);

  const [finishing, setFinishing] = React.useState(false);
  const [progress, setProgress] = React.useState<GenerateProgress | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!story) return;
    setDeleting(true);
    try {
      await api(`/api/stories/${story.id}`, { method: "DELETE" });
      bumpRefresh();
      toast.success("Series deleted");
      backToLibrary();
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleFinish() {
    if (!story) return;
    setFinishing(true);
    setProgress(null);
    try {
      await generateAllMedia(story, (p) => setProgress(p));
      bumpRefresh();
      toast.success("All assets generated");
    } catch (err) {
      toast.error("Generation incomplete");
    } finally {
      setFinishing(false);
      setProgress(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-8">
        <Skeleton className="h-64 rounded-2xl mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-16 text-center">
        <p className="text-muted-foreground">Story not found.</p>
        <button
          onClick={backToLibrary}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Back to library
        </button>
      </div>
    );
  }

  const prog = storyProgress(story);
  const pct = prog.percent;

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 sm:py-8">
      <button
        onClick={backToLibrary}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-border/60 mb-8">
        <div className="relative aspect-[21/9] sm:aspect-[3/1] w-full bg-muted">
          {story.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={story.coverUrl}
              alt={story.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="ct-shimmer h-full w-full grid place-items-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-[0.2em] text-primary font-medium">
                  Cinematic Series
                </span>
                {prog.ready ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-emerald-400/30">
                    Ready
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-200 px-2 py-0.5 text-[11px] font-semibold ring-1 ring-amber-400/30">
                    {pct}% ready
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground drop-shadow">
                {story.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-2xl line-clamp-2">
                {story.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Film className="h-3.5 w-3.5 text-primary/80" />
                  {story.chapters.length} chapters
                </span>
                <span className="inline-flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5 text-primary/80" />
                  {totalScenes(story)} scenes
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary/80" />
                  {formatDate(story.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openPlayer(story.id, 0)}
                disabled={!prog.ready}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition",
                  prog.ready
                    ? "bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <Play className="h-4 w-4 fill-current" />
                Play Series
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    disabled={deleting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-card ring-1 ring-border hover:ring-destructive/50 hover:text-destructive px-3.5 py-3 text-sm transition"
                    title="Delete series"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this series?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes “{story.title}” and all its
                      generated media. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      {/* Finish generating banner */}
      {!prog.ready && (
        <div className="mb-6 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-100">
                Some assets are still missing
              </p>
              <p className="text-xs text-amber-200/70 mt-0.5">
                {prog.done} of {prog.total} assets generated. Finish now to play
                the full series.
              </p>
              {finishing && progress && (
                <div className="mt-2 w-48 h-1.5 overflow-hidden rounded-full bg-amber-500/20">
                  <div
                    className="h-full bg-amber-300 transition-all"
                    style={{
                      width: `${Math.round(
                        (progress.done / Math.max(progress.total, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleFinish}
            disabled={finishing}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-400 text-amber-950 px-4 py-2 text-sm font-semibold hover:bg-amber-300 transition disabled:opacity-60"
          >
            {finishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Generate missing
              </>
            )}
          </button>
        </div>
      )}

      {/* Chapters */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Chapters
        </h2>
        {story.chapters.map((ch, i) => {
          const firstScene = ch.scenes[0];
          const chReady =
            ch.audioStatus === "ready" &&
            ch.scenes.every((s) => s.status === "ready");
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <button
                onClick={() => openPlayer(story.id, i)}
                disabled={!chReady}
                className={cn(
                  "group w-full text-left flex items-center gap-4 rounded-xl bg-card ring-1 ring-border/60 p-3 transition",
                  chReady
                    ? "hover:ring-primary/40 hover:bg-card/80 cursor-pointer"
                    : "opacity-70 cursor-not-allowed"
                )}
              >
                {/* thumbnail */}
                <div className="relative h-16 w-24 sm:h-20 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {firstScene?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={firstScene.imageUrl}
                      alt={ch.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      {firstScene?.status === "pending" ? (
                        <Loader2 className="h-5 w-5 text-muted-foreground/50 animate-spin" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>
                  )}
                  {chReady && (
                    <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Play className="h-6 w-6 text-white fill-current" />
                    </span>
                  )}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      Ch. {i + 1}
                    </span>
                    {!chReady && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300">
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        {ch.audioStatus !== "ready" ? "audio" : "scenes"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium truncate mt-0.5">{ch.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      {ch.scenes.length} scenes
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Volume2 className="h-3 w-3" />
                      {ch.audioStatus === "ready" ? "narrated" : "pending"}
                    </span>
                  </div>
                </div>

                <Play
                  className={cn(
                    "h-5 w-5 shrink-0 mr-2 transition",
                    chReady
                      ? "text-primary group-hover:scale-110"
                      : "text-muted-foreground/30"
                  )}
                />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
