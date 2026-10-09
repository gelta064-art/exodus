"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  Play,
  Pause,
  Loader2,
  X,
  Volume2,
  VolumeX,
  List,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useSeries } from "./hooks";
import { episodePlayItems } from "./progress";
import type { SeriesData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FeedView() {
  const seriesId = useAppStore((s) => s.selectedSeriesId);
  const startEpisodeIndex = useAppStore((s) => s.startEpisodeIndex);
  const back = useAppStore((s) => s.openSeries);
  const { data: series } = useSeries(seriesId);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(startEpisodeIndex);
  const [globalStarted, setGlobalStarted] = React.useState(false);

  const episodes = series?.episodes ?? [];

  React.useEffect(() => {
    setActiveIndex(Math.min(startEpisodeIndex, Math.max(0, episodes.length - 1)));
  }, [startEpisodeIndex, episodes.length]);

  // Scroll the start episode into view on mount
  React.useEffect(() => {
    const el = containerRef.current?.querySelector(
      `[data-ep-idx="${startEpisodeIndex}"]`
    ) as HTMLElement | null;
    el?.scrollIntoView({ behavior: "auto" });
  }, [startEpisodeIndex, seriesId]);

  if (!series) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black text-center px-6">
        <div>
          <p className="text-muted-foreground text-sm">No episodes found.</p>
          <button
            onClick={() => back(series.id)}
            className="mt-4 text-primary text-sm hover:underline"
          >
            Back to series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Top gradient + close */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/70 to-transparent z-30 pointer-events-none" />
      <button
        onClick={() => back(series.id)}
        className="absolute top-4 right-4 z-40 grid place-items-center h-9 w-9 rounded-full bg-black/40 backdrop-blur text-white/90 hover:bg-black/60 transition"
      >
        <X className="h-5 w-5" />
      </button>
      <div className="absolute top-4 left-4 z-40 max-w-[70%]">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
          {series.genre}
        </p>
        <p className="text-sm font-semibold text-white/90 truncate">
          {series.title}
        </p>
      </div>

      {/* Feed */}
      <div
        ref={containerRef}
        className="ct-feed h-full overflow-y-auto"
      >
        {episodes.map((ep, i) => (
          <EpisodeCard
            key={ep.id}
            series={series}
            episodeIndex={i}
            active={i === activeIndex}
            onActive={() => setActiveIndex(i)}
            globalStarted={globalStarted}
            onUserStart={() => setGlobalStarted(true)}
          />
        ))}
        {/* End card */}
        <div className="ct-snap-item h-screen flex flex-col items-center justify-center text-center px-8">
          <div className="text-5xl mb-3">🎬</div>
          <h2 className="text-xl font-bold text-white">That&apos;s a wrap!</h2>
          <p className="mt-1.5 text-sm text-white/60">
            You finished all {episodes.length} episodes of
            <br />
            <span className="text-white/90 font-medium">{series.title}</span>
          </p>
          <button
            onClick={() => back(series.id)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition"
          >
            <List className="h-4 w-4" />
            Back to series
          </button>
        </div>
      </div>
    </div>
  );
}

interface EpisodeCardProps {
  series: SeriesData;
  episodeIndex: number;
  active: boolean;
  onActive: () => void;
  globalStarted: boolean;
  onUserStart: () => void;
}

function EpisodeCard({
  series,
  episodeIndex,
  active,
  onActive,
  globalStarted,
  onUserStart,
}: EpisodeCardProps) {
  const ep = series.episodes[episodeIndex];
  const items = React.useMemo(
    () => episodePlayItems(ep, series.characters),
    [ep, series.characters]
  );

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const [playhead, setPlayhead] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [finished, setFinished] = React.useState(false);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = items.length;
  const current = items[Math.min(playhead, total - 1)];
  const currentSceneOrder = current?.sceneOrder ?? 0;
  const ready =
    items.length > 0 && items.every((it) => it.imageUrl && it.audioUrl);

  // Reset when episode changes
  React.useEffect(() => {
    setPlayhead(0);
    setFinished(false);
    setIsPlaying(false);
  }, [episodeIndex]);

  // Intersection observer to set active card
  React.useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) onActive();
      },
      { threshold: [0.6] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onActive]);

  // When active + globalStarted + ready → autoplay
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active || !ready) return;
    if (globalStarted && !finished) {
      setIsPlaying(true);
    }
    if (!active) {
      audio.pause();
      setIsPlaying(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, globalStarted, ready, finished]);

  // Apply play/pause
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !active) return;
    if (isPlaying) {
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, active]);

  // Mute
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Set audio src when playhead changes
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (audio.src !== current.audioUrl) {
      audio.src = current.audioUrl;
      audio.load();
    }
    if (isPlaying) audio.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playhead, episodeIndex]);

  const pokeControls = React.useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);
  React.useEffect(() => {
    pokeControls();
  }, [isPlaying, pokeControls]);

  const handleEnded = () => {
    if (playhead + 1 < total) {
      setPlayhead((p) => p + 1);
    } else {
      setIsPlaying(false);
      setFinished(true);
    }
  };

  const togglePlay = () => {
    if (!globalStarted) onUserStart();
    if (finished) {
      setPlayhead(0);
      setFinished(false);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
    pokeControls();
  };

  // Scene image: track which scene to show (changes with playhead)
  const sceneImageUrl = current?.imageUrl ?? null;

  // Progress fraction
  const progress = total > 0 ? (playhead + (isPlaying ? 0.5 : 0)) / total : 0;

  return (
    <div
      ref={cardRef}
      data-ep-idx={episodeIndex}
      className="ct-snap-item relative h-screen w-full flex items-center justify-center overflow-hidden"
      onMouseMove={pokeControls}
      onClick={togglePlay}
    >
      {/* Stage: vertical 9:16 area */}
      <div className="relative h-full w-full max-w-[30rem] mx-auto">
        {/* Scene image with crossfade on scene change */}
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            {sceneImageUrl ? (
              <motion.div
                key={`${episodeIndex}-${currentSceneOrder}`}
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sceneImageUrl}
                  alt=""
                  className={cn(
                    "h-full w-full object-cover",
                    currentSceneOrder % 2 === 0
                      ? "animate-kenburns"
                      : "animate-kenburns-alt"
                  )}
                />
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                className="absolute inset-0 ct-shimmer grid place-items-center"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preload next scene image (approx) */}
          {items[playhead + 1]?.imageUrl &&
            items[playhead + 1].sceneOrder !== currentSceneOrder && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={items[playhead + 1]!.imageUrl!}
                alt=""
                className="hidden"
              />
            )}

          {/* Overlays */}
          <div className="absolute inset-0 ct-vignette pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Hidden audio */}
        <audio
          ref={audioRef}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="auto"
        />

        {/* Episode label (top) */}
        <div className="absolute top-14 left-4 z-20 pointer-events-none">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
            Episode {episodeIndex + 1}
          </p>
          <p className="text-sm font-semibold text-white/90 drop-shadow">
            {ep.title}
          </p>
        </div>

        {/* Center play button when paused */}
        <AnimatePresence>
          {!isPlaying && !finished && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="absolute inset-0 z-20 m-auto h-16 w-16 grid place-items-center rounded-full bg-white/90 text-black shadow-2xl hover:scale-105 transition"
            >
              {!ready ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Play className="h-7 w-7 fill-current ml-0.5" />
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Dialogue subtitle */}
        <AnimatePresence mode="wait">
          {current && isPlaying && !finished && (
            <motion.div
              key={`${episodeIndex}-${playhead}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-28 inset-x-4 z-20 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold text-black shadow-lg"
                  style={{ backgroundColor: current.color }}
                >
                  {current.characterName}
                  <span className="text-[9px] font-medium opacity-70 uppercase tracking-wide">
                    {current.emotion}
                  </span>
                </span>
                <p className="animate-subtitle text-lg sm:text-xl font-semibold text-white leading-snug drop-shadow-lg max-w-md">
                  {current.text}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls + progress */}
        <AnimatePresence>
          {showControls && !finished && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="absolute bottom-6 inset-x-4 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* progress dots (one per line) */}
              <div className="flex items-center gap-1 mb-3">
                {items.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-all",
                      i < playhead
                        ? "bg-white/70"
                        : i === playhead
                        ? "bg-primary"
                        : "bg-white/20"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="grid place-items-center h-9 w-9 rounded-full bg-black/40 backdrop-blur text-white/90 hover:bg-black/60 transition"
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>

                <span className="text-xs text-white/70 tabular-nums">
                  {Math.min(playhead + 1, total)} / {total}
                </span>

                <button
                  onClick={togglePlay}
                  className="grid place-items-center h-9 w-9 rounded-full bg-black/40 backdrop-blur text-white/90 hover:bg-black/60 transition"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* swipe hint */}
              <div className="mt-3 flex justify-center">
                <span className="animate-hint inline-flex flex-col items-center text-[10px] text-white/60">
                  <ChevronUp className="h-4 w-4" />
                  swipe up for next
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Finished / hook screen */}
        <AnimatePresence>
          {finished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 grid place-items-center bg-black/80 backdrop-blur-sm p-8 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-xs">
                <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">
                  End of Episode {episodeIndex + 1}
                </p>
                <p className="text-2xl font-bold text-white leading-snug mb-2">
                  {ep.hook}
                </p>
                {episodeIndex < series.episodes.length - 1 ? (
                  <>
                    <p className="text-sm text-white/60 mb-6">
                      What happens next?
                    </p>
                    <SwipeHint />
                  </>
                ) : (
                  <p className="text-sm text-white/60 mt-4">
                    Final episode — swipe up to wrap up.
                  </p>
                )}
                <button
                  onClick={togglePlay}
                  className="mt-6 text-xs text-white/60 hover:text-white underline underline-offset-4"
                >
                  Replay episode
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SwipeHint() {
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <span className="grid place-items-center h-12 w-12 rounded-full bg-primary/20 ring-1 ring-primary/40 animate-hint">
        <ChevronUp className="h-6 w-6 text-primary" />
      </span>
      <span className="text-xs font-semibold text-primary">Swipe up</span>
    </div>
  );
}
