"use client";

import { create } from "zustand";
import type { AppView } from "./types";

interface AppState {
  view: AppView;
  selectedDocId: string | null;
  refreshKey: number;

  setView: (view: AppView) => void;
  openReader: (id: string) => void;
  backToLibrary: () => void;
  bumpRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "library",
  selectedDocId: null,
  refreshKey: 0,

  setView: (view) => set({ view }),
  openReader: (id) => set({ view: "reader", selectedDocId: id }),
  backToLibrary: () => set({ view: "library", selectedDocId: null }),
  bumpRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
