"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard, Library, Plus, Film } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LibraryView } from "@/components/cinetales/library-view";
import { CreateView } from "@/components/cinetales/create-view";
import { SeriesView } from "@/components/cinetales/series-view";
import { PlayerView } from "@/components/cinetales/player-view";
import { cn } from "@/lib/utils";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  const isPlayer = view === "player";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      {!isPlayer && (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <button
              onClick={() => useAppStore.getState().backToLibrary()}
              className="flex items-center gap-2.5 group"
            >
              <span className="relative grid place-items-center h-9 w-9 rounded-xl bg-primary/15 ring-1 ring-primary/30 text-primary">
                <Clapperboard className="h-5 w-5" />
              </span>
              <span className="flex flex-col items-start leading-none">
                <span className="text-base font-semibold tracking-tight">
                  Cine<span className="text-primary">Tales</span>
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                  Cinematic Story Series
                </span>
              </span>
            </button>

            <nav className="flex items-center gap-1">
              <NavButton
                active={view === "library" || view === "series" || view === "player"}
                onClick={() => useAppStore.getState().backToLibrary()}
                icon={<Library className="h-4 w-4" />}
                label="Library"
              />
              <NavButton
                active={view === "create"}
                onClick={() => setView("create")}
                icon={<Plus className="h-4 w-4" />}
                label="Create"
              />
            </nav>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            {view === "library" && <LibraryView />}
            {view === "create" && <CreateView />}
            {view === "series" && <SeriesView />}
            {view === "player" && <PlayerView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer (hidden in player) */}
      {!isPlayer && (
        <footer className="mt-auto border-t border-border/60 bg-background/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Film className="h-3.5 w-3.5 text-primary" />
              CineTales — stories reborn as cinema.
            </p>
            <p>
              Powered by{" "}
              <span className="text-foreground/80 font-medium">Z.ai</span> · LLM +
              Image Generation + TTS
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary ring-1 ring-primary/25"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
