"use client";

import { create } from "zustand";
import type { AppView } from "./types";

interface AppState {
  view: AppView;
  selectedStoryId: string | null;
  // when entering the player, which chapter to start at (0-indexed)
  startChapterIndex: number;
  // refresh token — bumped whenever data changes so views refetch
  refreshKey: number;

  setView: (view: AppView) => void;
  openStory: (id: string) => void;
  openPlayer: (storyId: string, chapterIndex?: number) => void;
  backToLibrary: () => void;
  bumpRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "library",
  selectedStoryId: null,
  startChapterIndex: 0,
  refreshKey: 0,

  setView: (view) => set({ view }),
  openStory: (id) => set({ view: "series", selectedStoryId: id }),
  openPlayer: (storyId, chapterIndex = 0) =>
    set({ view: "player", selectedStoryId: storyId, startChapterIndex: chapterIndex }),
  backToLibrary: () => set({ view: "library", selectedStoryId: null }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
