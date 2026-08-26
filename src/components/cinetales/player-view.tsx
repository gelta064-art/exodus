"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Loader2,
  Film,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useStory } from "./hooks";
import { cn } from "@/lib/utils";

const CONTROLS_HIDE_MS = 3500;

export function PlayerView() {
  const storyId = useAppStore((s) => s.selectedStoryId);
  const startChapterIndex = useAppStore((s) => s.startChapterIndex);
  const openSeries = useAppStore((s) => s.openStory);
  const { data: story } = useStory(storyId);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [chapterIndex, setChapterIndex] = React.useState(startChapterIndex);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [muted, setMuted] = React.useState(false);
  const [loadingAudio, setLoadingAudio] = React.useState(false);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const [showChapterTitle, setShowChapterTitle] = React.useState(true);

  const chapters = story?.chapters ?? [];
  const chapter = chapters[chapterIndex];
  const scenes = chapter?.scenes ?? [];

  // Reset chapter index when story changes
  React.useEffect(() => {
    setChapterIndex(Math.min(startChapterIndex, Math.max(0, chapters.length - 1)));
  }, [storyId, startChapterIndex, chapters.length]);

  // Derived current scene based on audio time
  const segmentDuration =
    scenes.length > 0 && duration > 0 ? duration / scenes.length : 0;
  const sceneIndex =
    segmentDuration > 0
      ? Math.min(scenes.length - 1, Math.floor(currentTime / segmentDuration))
      : 0;
  const currentScene = scenes[sceneIndex];

  // Show chapter title overlay briefly when chapter changes
  React.useEffect(() => {
    setShowChapterTitle(true);
    const t = setTimeout(() => setShowChapterTitle(false), 4000);
    return () => clearTimeout(t);
  }, [chapterIndex]);

  // Audio event handlers
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!chapter?.audioUrl) return;

    setLoadingAudio(true);
    setCurrentTime(0);
    setDuration(0);

    const onLoaded = () => {
      setDuration(audio.duration || 0);
      setLoadingAudio(false);
      if (isPlaying) audio.play().catch(() => {});
    };
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnd = () => {
      if (chapterIndex < chapters.length - 1) {
        setChapterIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapterIndex, chapter?.audioUrl]);

  // Apply play/pause when toggled
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Apply mute
  React.useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  // Controls auto-hide
  const pokeControls = React.useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (isPlaying) setControlsVisible(false);
    }, CONTROLS_HIDE_MS);
  }, [isPlaying]);

  React.useEffect(() => {
    pokeControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying((p) => !p);
    pokeControls();
  };

  const goChapter = (delta: number) => {
    const next = chapterIndex + delta;
    if (next < 0 || next >= chapters.length) return;
    setChapterIndex(next);
    setIsPlaying(true);
    pokeControls();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * duration;
    setCurrentTime(audio.currentTime);
  };

  if (!story) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onMouseMove={pokeControls}
      onClick={() => setControlsVisible((v) => !v && true)}
    >
      {/* Scene image stage */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          {currentScene?.imageUrl ? (
            <motion.div
              key={`${chapterIndex}-${sceneIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentScene.imageUrl}
                alt=""
                className={cn(
                  "h-full w-full object-cover",
                  sceneIndex % 2 === 0 ? "animate-kenburns" : "animate-kenburns-alt"
                )}
              />
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              className="absolute inset-0 ct-shimmer grid place-items-center"
            >
              <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preload next scene */}
        {scenes[sceneIndex + 1]?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={scenes[sceneIndex + 1].imageUrl} alt="" className="hidden" />
        )}

        {/* Cinematic overlays */}
        <div className="absolute inset-0 ct-vignette pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent pointer-events-none" />
      </div>

      {/* Letterbox bars */}
      <div className="absolute top-0 inset-x-0 h-[6vh] ct-letterbox pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[6vh] ct-letterbox pointer-events-none" />

      {/* Hidden audio */}
      <audio ref={audioRef} src={chapter?.audioUrl ?? undefined} preload="auto" />

      {/* Top bar */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[6vh] left-0 right-0 z-20 px-5 sm:px-8 py-4 flex items-center justify-between"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                openSeries(story.id);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-black/40 backdrop-blur px-3 py-2 text-sm text-white/90 hover:bg-black/60 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                Now Playing
              </p>
              <p className="text-sm font-medium text-white/90 truncate max-w-[60vw]">
                {story.title}
              </p>
            </div>

            <div className="rounded-lg bg-black/40 backdrop-blur px-3 py-2 text-sm text-white/80">
              {chapterIndex + 1} / {chapters.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapter title overlay (auto fade) */}
      <AnimatePresence>
        {showChapterTitle && chapter && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.6 }}
            className="absolute top-[14vh] left-0 right-0 z-10 px-8 text-center pointer-events-none"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-2">
              Chapter {chapterIndex + 1}
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg">
              {chapter.title}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center play button (when paused) */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute inset-0 z-10 m-auto h-20 w-20 grid place-items-center rounded-full bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-105 transition"
          >
            {loadingAudio ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Play className="h-9 w-9 fill-current ml-1" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Caption (current scene) */}
      <AnimatePresence mode="wait">
        {currentScene?.caption && isPlaying && (
          <motion.div
            key={`${chapterIndex}-${sceneIndex}-cap`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-[20vh] left-0 right-0 z-10 px-8 text-center pointer-events-none"
          >
            <p className="inline-block text-base sm:text-lg text-white/95 font-medium drop-shadow-lg bg-black/30 backdrop-blur-sm rounded-full px-4 py-1.5">
              {currentScene.caption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom controls */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-[6vh] left-0 right-0 z-20 px-5 sm:px-8 pb-6 pt-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Scrubber */}
            <div className="mb-3 flex items-center gap-3 text-xs text-white/70">
              <span className="tabular-nums">{fmt(currentTime)}</span>
              <div
                onClick={seek}
                className="group relative flex-1 h-2 rounded-full bg-white/20 cursor-pointer overflow-hidden"
              >
                <div
                  className="absolute inset-y-0 left-0 bg-primary group-hover:bg-amber-300 transition-colors"
                  style={{
                    width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                  }}
                />
                {/* scene segment markers */}
                {scenes.length > 1 && segmentDuration > 0 && (
                  <div className="absolute inset-0 flex">
                    {scenes.map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 border-r border-black/30 last:border-r-0"
                      />
                    ))}
                  </div>
                )}
              </div>
              <span className="tabular-nums">{fmt(duration)}</span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => goChapter(-1)}
                disabled={chapterIndex === 0}
                className="text-white/80 hover:text-white disabled:opacity-30 transition p-2"
                title="Previous chapter"
              >
                <SkipBack className="h-6 w-6" />
              </button>

              <button
                onClick={togglePlay}
                className="grid place-items-center h-14 w-14 rounded-full bg-white text-black hover:scale-105 transition shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : loadingAudio ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={() => goChapter(1)}
                disabled={chapterIndex >= chapters.length - 1}
                className="text-white/80 hover:text-white disabled:opacity-30 transition p-2"
                title="Next chapter"
              >
                <SkipForward className="h-6 w-6" />
              </button>

              {/* Scene dots + mute */}
              <div className="hidden sm:flex items-center gap-2 ml-2">
                {scenes.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === sceneIndex
                        ? "w-6 bg-primary"
                        : "w-1.5 bg-white/40"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={() => setMuted((m) => !m)}
                className="text-white/80 hover:text-white transition p-2 ml-auto"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End-of-series marker */}
      {chapterIndex === chapters.length - 1 && !isPlaying && currentTime >= duration - 0.5 && duration > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-30 grid place-items-center bg-black/70"
        >
          <div className="text-center">
            <Film className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-xl font-semibold text-white mb-1">The End</p>
            <p className="text-sm text-white/60 mb-6">
              You finished “{story.title}”
            </p>
            <button
              onClick={() => openSeries(story.id)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold hover:brightness-110 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to series
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
