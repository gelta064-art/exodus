"use client";

import { Play, Pause, Moon, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function NowPlayingBar() {
  const np = useAppStore((s) => s.nowPlaying);
  const openReader = useAppStore((s) => s.openReader);
  const clearNowPlaying = useAppStore((s) => s.clearNowPlaying);
  const setNowPlaying = useAppStore((s) => s.setNowPlaying);

  if (!np) return null;

  function togglePlay() {
    // Toggle play state in the store (the reader's audio element responds to this)
    setNowPlaying({ ...np, isPlaying: !np.isPlaying });
    // Also open the reader so the actual audio element can play/pause
    openReader(np.docId);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 md:left-56 lg:left-60">
      <div className="mx-auto max-w-3xl m-3">
        <div className="flex items-center gap-3 rounded-xl bg-card/95 backdrop-blur-xl ring-1 ring-border shadow-2xl shadow-black/50 px-3 py-2.5">
          {/* Thumbnail */}
          <button onClick={() => openReader(np.docId)} className="shrink-0">
            <div className="h-12 w-12 rounded-md overflow-hidden bg-muted ring-1 ring-border/40">
              {np.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={np.coverUrl} alt={np.title} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-base">📖</span>
                </div>
              )}
            </div>
          </button>

          {/* Title + chapter + time */}
          <button onClick={() => openReader(np.docId)} className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate leading-tight">{np.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              Chapter {np.chunkIndex + 1} of {np.totalChunks}
              <span className="mx-1.5 opacity-50">·</span>
              {np.timeLeftLabel} left
              <span className="mx-1.5 opacity-50">·</span>
              <span className="text-primary/80">{np.speed}x</span>
            </p>
          </button>

          {/* Sleep timer (mock) */}
          <button
            className="grid place-items-center h-9 w-9 rounded-full bg-muted/60 text-muted-foreground hover:text-foreground transition shrink-0"
            title="Sleep timer"
          >
            <Moon className="h-4 w-4" />
          </button>

          {/* Play / pause */}
          <button
            onClick={togglePlay}
            className="grid place-items-center h-10 w-10 rounded-full bg-foreground text-background hover:scale-105 transition shrink-0 shadow-lg"
          >
            {np.isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={clearNowPlaying}
            className="grid place-items-center h-7 w-7 rounded-full text-muted-foreground hover:text-foreground transition shrink-0"
            title="Close player"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
