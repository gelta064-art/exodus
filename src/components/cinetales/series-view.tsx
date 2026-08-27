"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Trash2,
  ChevronRight,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Mic2,
  ImageIcon,
  Volume2,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useSeries } from "./hooks";
import { seriesProgress, formatDate } from "./progress";
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
  const seriesId = useAppStore((s) => s.selectedSeriesId);
  const backToLibrary = useAppStore((s) => s.backToLibrary);
  const openFeed = useAppStore((s) => s.openFeed);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const { data: series, isLoading } = useSeries(seriesId);

  const [finishing, setFinishing] = React.useState(false);
  const [progress, setProgress] = React.useState<GenerateProgress | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!series) return;
    setDeleting(true);
    try {
      await api(`/api/series/${series.id}`, { method: "DELETE" });
      bumpRefresh();
      toast.success("Series deleted");
      backToLibrary();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleFinish() {
    if (!series) return;
    setFinishing(true);
    setProgress(null);
    try {
      await generateAllMedia(series, (p) => setProgress(p));
      bumpRefresh();
      toast.success("All assets generated");
    } catch {
      toast.error("Generation incomplete");
    } finally {
      setFinishing(false);
      setProgress(null);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-md w-full px-4 py-6 space-y-3">
        <Skeleton className="h-56 rounded-2xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!series) {
    return (
      <div className="mx-auto max-w-md w-full px-4 py-16 text-center">
        <p className="text-muted-foreground">Series not found.</p>
        <button
          onClick={backToLibrary}
          className="mt-4 text-primary hover:underline text-sm"
        >
          Back to library
        </button>
      </div>
    );
  }

  const prog = seriesProgress(series);
  const ready = prog.ready;

  return (
    <div className="mx-auto max-w-md w-full px-4 py-6">
      <button
        onClick={backToLibrary}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl ring-1 ring-border/60 mb-5">
        <div className="relative aspect-[16/10] w-full bg-muted">
          {series.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={series.coverUrl}
              alt={series.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="ct-shimmer h-full w-full grid place-items-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/15 px-2 py-0.5 rounded">
              {series.genre}
            </span>
            {ready ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5 text-[10px] font-bold ring-1 ring-emerald-400/30">
                READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-200 px-2 py-0.5 text-[10px] font-bold ring-1 ring-amber-400/30">
                {prog.percent}% ready
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-white drop-shadow leading-tight">
            {series.title}
          </h1>
          <p className="mt-1 text-xs text-white/70 line-clamp-2">
            {series.description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-white/60">
            <span>{series.episodes.length} episodes</span>
            <span className="inline-flex items-center gap-0.5">
              <Mic2 className="h-2.5 w-2.5" />
              {series.characters.length} cast
            </span>
            <span>{formatDate(series.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Cast */}
      {series.characters.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
            Cast
          </p>
          <div className="flex flex-wrap gap-2">
            {series.characters.map((c) => (
              <div
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-card ring-1 ring-border/60 px-2.5 py-1"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: c.accentColor }}
                />
                <span className="text-xs font-medium">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">{c.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Play + delete */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => openFeed(series.id, 0)}
          disabled={!ready}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition",
            ready
              ? "bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Play className="h-4 w-4 fill-current" />
          Play from Ep.1
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              disabled={deleting}
              className="inline-flex items-center justify-center rounded-xl bg-card ring-1 ring-border hover:ring-destructive/50 hover:text-destructive px-3.5 py-3 text-sm transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this series?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes “{series.title}” and all its generated
                media.
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

      {/* Finish generating banner */}
      {!ready && (
        <div className="mb-5 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/30 p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-100">
                Generating assets
              </p>
              <p className="text-[11px] text-amber-200/70 mt-0.5">
                {prog.done} of {prog.total} done
              </p>
              {finishing && progress && (
                <div className="mt-2 w-36 h-1 overflow-hidden rounded-full bg-amber-500/20">
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 text-amber-950 px-3 py-1.5 text-xs font-semibold hover:bg-amber-300 transition disabled:opacity-60 shrink-0"
          >
            {finishing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {finishing ? "…" : "Finish"}
          </button>
        </div>
      )}

      {/* Episodes */}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
        Episodes
      </p>
      <div className="space-y-2.5">
        {series.episodes.map((ep, i) => {
          const epLines = ep.scenes.reduce((a, s) => a + s.lines.length, 0);
          const epReady =
            ep.scenes.every((s) => s.status === "ready") &&
            ep.scenes.every((s) => s.lines.every((l) => l.status === "ready"));
          const firstImg = ep.scenes.find((s) => s.imageUrl)?.imageUrl;
          return (
            <motion.button
              key={ep.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => openFeed(series.id, i)}
              className={cn(
                "group w-full text-left flex items-center gap-3 rounded-xl bg-card ring-1 ring-border/60 p-2.5 transition",
                epReady
                  ? "hover:ring-primary/40 hover:bg-card/80 cursor-pointer"
                  : "opacity-70"
              )}
            >
              {/* thumbnail */}
              <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {firstImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={firstImg}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center">
                    {ep.scenes.some((s) => s.status === "pending") ? (
                      <Loader2 className="h-4 w-4 text-muted-foreground/50 animate-spin" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                )}
                <span className="absolute bottom-0.5 left-0.5 grid place-items-center h-4 w-4 rounded-full bg-black/70 text-[9px] font-bold text-white">
                  {i + 1}
                </span>
              </div>

              {/* info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium truncate">{ep.title}</h3>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  &ldquo;{ep.hook}&rdquo;
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-0.5">
                    <ImageIcon className="h-2.5 w-2.5" />
                    {ep.scenes.length}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <Volume2 className="h-2.5 w-2.5" />
                    {epLines}
                  </span>
                  {epReady ? (
                    <span className="text-emerald-400">ready</span>
                  ) : (
                    <span className="text-amber-300">generating…</span>
                  )}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
