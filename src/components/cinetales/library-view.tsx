"use client";

import { Sparkles, Play, Clapperboard, Loader2, ChevronRight, Mic2 } from "lucide-react";
import { useSeriesList } from "./hooks";
import { useAppStore } from "@/lib/store";
import { seriesProgress, totalEpisodes, totalLines, formatDate } from "./progress";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export function LibraryView() {
  const { data: series, isLoading } = useSeriesList();
  const setView = useAppStore((s) => s.setView);
  const openSeries = useAppStore((s) => s.openSeries);
  const openFeed = useAppStore((s) => s.openFeed);

  const hasSeries = !!series && series.length > 0;

  return (
    <div className="mx-auto max-w-md w-full px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center h-9 w-9 rounded-xl bg-primary/15 ring-1 ring-primary/30 text-primary">
            <Clapperboard className="h-5 w-5" />
          </span>
          <div className="leading-none">
            <p className="text-lg font-bold tracking-tight">
              Dra<span className="text-primary">mai</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
              AI Mini-Dramas
            </p>
          </div>
        </div>
        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
        >
          <Sparkles className="h-3.5 w-3.5" />
          New
        </button>
      </div>

      {/* Hero / empty prompt */}
      {!hasSeries && !isLoading && (
        <div className="mb-6 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20 p-5">
          <p className="text-sm font-medium text-primary mb-1">✨ Welcome to Dramai</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Paste any story and our AI turns it into an addictive vertical
            mini-drama — dialogue, characters, cliffhangers and all.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : !hasSeries ? (
        <EmptyState onCreate={() => setView("create")} />
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Your Series
          </p>
          {series.map((s, i) => {
            const prog = seriesProgress(s);
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <SeriesCard
                  title={s.title}
                  genre={s.genre}
                  description={s.description}
                  coverUrl={s.coverUrl}
                  coverStatus={s.coverStatus}
                  episodes={totalEpisodes(s)}
                  lines={totalLines(s)}
                  characters={s.characters.length}
                  ready={prog.ready}
                  percent={prog.percent}
                  date={formatDate(s.createdAt)}
                  onPlay={() => openFeed(s.id, 0)}
                  onOpen={() => openSeries(s.id)}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SeriesCard({
  title,
  genre,
  description,
  coverUrl,
  coverStatus,
  episodes,
  lines,
  characters,
  ready,
  percent,
  date,
  onPlay,
  onOpen,
}: {
  title: string;
  genre: string;
  description: string;
  coverUrl: string | null;
  coverStatus: string;
  episodes: number;
  lines: number;
  characters: number;
  ready: boolean;
  percent: number;
  date: string;
  onPlay: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <div className="flex gap-0">
        {/* Vertical poster */}
        <button
          onClick={onPlay}
          disabled={!ready}
          className="relative h-44 w-[7.5rem] shrink-0 overflow-hidden bg-muted"
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="ct-shimmer h-full w-full" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {ready ? (
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid place-items-center h-11 w-11 rounded-full bg-primary/90 text-primary-foreground shadow-lg group-hover:scale-110 transition">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </span>
            </span>
          ) : (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/70 text-amber-200 px-2 py-0.5 text-[10px] font-semibold ring-1 ring-amber-400/30">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              {percent}%
            </span>
          )}
          {ready && (
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
              <span className="h-1 w-1 rounded-full bg-white animate-pulse-dot" />
              READY
            </span>
          )}
        </button>

        {/* Info */}
        <button
          onClick={onOpen}
          className="flex-1 p-3.5 text-left flex flex-col"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {genre}
            </span>
            <span className="text-[10px] text-muted-foreground">{date}</span>
          </div>
          <h3 className="font-semibold leading-tight line-clamp-2">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 flex-1">
            {description}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{episodes} eps</span>
            <span className="inline-flex items-center gap-0.5">
              <Mic2 className="h-2.5 w-2.5" />
              {characters} cast
            </span>
            <span>{lines} lines</span>
            <ChevronRight className="h-3.5 w-3.5 ml-auto text-muted-foreground/60" />
          </div>
        </button>
      </div>

      {/* Progress bar */}
      {!ready && (
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <Clapperboard className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">No dramas yet</h2>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
        Paste a story and watch it become a swipeable mini-drama series.
      </p>
      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
      >
        <Sparkles className="h-4 w-4" />
        Create your first drama
      </button>
    </div>
  );
}
