"use client";

import { Sparkles, Film, Clock, Loader2, ImageIcon, Volume2 } from "lucide-react";
import { useStories } from "./hooks";
import { useAppStore } from "@/lib/store";
import { storyProgress, totalScenes, formatDate } from "./progress";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryView() {
  const { data: stories, isLoading } = useStories();
  const setView = useAppStore((s) => s.setView);
  const openStory = useAppStore((s) => s.openStory);

  const hasStories = !!stories && stories.length > 0;

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Cinematic Storytelling
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Your Cinematic{" "}
              <span className="bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">
                Library
              </span>
            </h1>
            <p className="mt-3 text-muted-foreground max-w-xl">
              Every story becomes a series. AI crafts the chapters, paints each
              scene, and narrates every word — press play and watch it unfold.
            </p>
          </div>
          <button
            onClick={() => setView("create")}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Create New Series
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[16/10] rounded-2xl" />
          ))}
        </div>
      ) : !hasStories ? (
        <EmptyState onCreate={() => setView("create")} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stories.map((story, i) => {
            const prog = storyProgress(story);
            return (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <StoryCard
                  title={story.title}
                  description={story.description}
                  coverUrl={story.coverUrl}
                  coverStatus={story.coverStatus}
                  chapterCount={story.chapters.length}
                  scenes={totalScenes(story)}
                  ready={prog.ready}
                  percent={prog.percent}
                  date={formatDate(story.createdAt)}
                  onClick={() => openStory(story.id)}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StoryCard({
  title,
  description,
  coverUrl,
  coverStatus,
  chapterCount,
  scenes,
  ready,
  percent,
  date,
  onClick,
}: {
  title: string;
  description: string;
  coverUrl: string | null;
  coverStatus: string;
  chapterCount: number;
  scenes: number;
  ready: boolean;
  percent: number;
  date: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full text-left overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 hover:ring-primary/40 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
    >
      {/* Cover */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="ct-shimmer h-full w-full grid place-items-center">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* status badge */}
        <div className="absolute top-3 right-3">
          {ready ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 text-white px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/70 text-amber-200 px-2.5 py-1 text-[11px] font-semibold backdrop-blur ring-1 ring-amber-400/30">
              <Loader2 className="h-3 w-3 animate-spin" />
              {percent}%
            </span>
          )}
        </div>

        {/* title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2 drop-shadow">
            {title}
          </h3>
        </div>
      </div>

      {/* meta */}
      <div className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {description}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Film className="h-3.5 w-3.5 text-primary/80" />
            {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"}
          </span>
          <span className="inline-flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5 text-primary/80" />
            {scenes} scenes
          </span>
          <span className="ml-auto">{date}</span>
        </div>

        {!ready && coverStatus !== "ready" && (
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-10 sm:p-16 text-center">
      <div className="absolute inset-0 ct-vignette pointer-events-none opacity-60" />
      <div className="relative">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <Film className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Your library is empty</h2>
        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
          Paste any story — a fairy tale, a sci-fi epic, a bedtime fable — and
          watch CineTales turn it into a cinematic series, chapter by chapter.
        </p>
        <button
          onClick={onCreate}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
        >
          <Sparkles className="h-4 w-4" />
          Create your first series
        </button>
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Film className="h-3.5 w-3.5 text-primary/70" /> Auto chaptered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ImageIcon className="h-3.5 w-3.5 text-primary/70" /> Scene visuals
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-primary/70" /> Narration
          </span>
        </div>
      </div>
    </div>
  );
}
