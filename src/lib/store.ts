"use client";

import { create } from "zustand";
import type { AppView } from "./types";

interface NowPlaying {
  docId: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  chunkIndex: number;
  totalChunks: number;
  timeLeftLabel: string;
  speed: number;
  isPlaying: boolean;
}

interface AppState {
  view: AppView;
  selectedDocId: string | null;
  selectedBookId: string | null;
  refreshKey: number;
  nowPlaying: NowPlaying | null;

  setView: (view: AppView) => void;
  openReader: (id: string) => void;
  openButterfly: (bookId: string) => void;
  backToLibrary: () => void;
  bumpRefresh: () => void;
  setNowPlaying: (np: NowPlaying | null) => void;
  clearNowPlaying: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "library",
  selectedDocId: null,
  selectedBookId: null,
  refreshKey: 0,
  nowPlaying: null,

  setView: (view) => set({ view }),
  openReader: (id) => set({ view: "reader", selectedDocId: id }),
  openButterfly: (bookId) => set({ view: "butterfly", selectedBookId: bookId }),
  backToLibrary: () => set({ view: "library", selectedDocId: null, selectedBookId: null }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  setNowPlaying: (np) => set({ nowPlaying: np }),
  clearNowPlaying: () => set({ nowPlaying: null }),
}));
