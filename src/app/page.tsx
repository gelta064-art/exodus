"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Home as HomeIcon, Library, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LibraryView } from "@/components/cinetales/library-view";
import { CreateView } from "@/components/cinetales/create-view";
import { SeriesView } from "@/components/cinetales/series-view";
import { FeedView } from "@/components/cinetales/feed-view";
import { cn } from "@/lib/utils";

export default function Home() {
  const view = useAppStore((s) => s.view);

  // The feed is a full-screen immersive view — no chrome.
  const immersive = view === "feed";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {view === "feed" && <FeedView />}
            {view === "library" && <LibraryView />}
            {view === "create" && <CreateView />}
            {view === "series" && <SeriesView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating bottom nav (app feel) — hidden in immersive feed */}
      {!immersive && (
        <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
          <div className="mx-auto max-w-md px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            <div className="pointer-events-auto rounded-2xl bg-card/80 backdrop-blur-xl ring-1 ring-border/60 shadow-2xl shadow-black/40 px-2 py-1.5 flex items-center justify-around">
              <NavButton
                active={view === "library" || view === "series"}
                onClick={() => useAppStore.getState().backToLibrary()}
                icon={<Library className="h-5 w-5" />}
                label="Library"
              />
              <NavButton
                active={view === "create"}
                onClick={() => useAppStore.getState().setView("create")}
                icon={<Plus className="h-6 w-6" />}
                label="Create"
                primary
              />
              <NavButton
                active={view === "feed"}
                onClick={() => useAppStore.getState().setView("library")}
                icon={<HomeIcon className="h-5 w-5" />}
                label="Home"
              />
            </div>
          </div>
        </nav>
      )}

      {/* Spacer so content isn't hidden behind the floating nav */}
      {!immersive && <div className="h-20 shrink-0" />}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
  primary,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
}) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-0.5 px-4 py-1.5"
      >
        <span className="grid place-items-center h-11 w-11 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition">
          {icon}
        </span>
        <span className="text-[10px] font-medium text-primary">{label}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-0.5 px-5 py-1.5 transition",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
