"use client";

import { create } from "zustand";
import type { AppView } from "./types";

interface AppState {
  view: AppView;
  selectedSeriesId: string | null;
  /** when jumping into the feed, which episode to start at */
  startEpisodeIndex: number;
  /** refresh token — bumped whenever data changes so views refetch */
  refreshKey: number;

  setView: (view: AppView) => void;
  openSeries: (id: string) => void;
  openFeed: (seriesId: string, episodeIndex?: number) => void;
  backToLibrary: () => void;
  bumpRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "library",
  selectedSeriesId: null,
  startEpisodeIndex: 0,
  refreshKey: 0,

  setView: (view) => set({ view }),
  openSeries: (id) => set({ view: "series", selectedSeriesId: id }),
  openFeed: (seriesId, episodeIndex = 0) =>
    set({ view: "feed", selectedSeriesId: seriesId, startEpisodeIndex: episodeIndex }),
  backToLibrary: () => set({ view: "library", selectedSeriesId: null }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
