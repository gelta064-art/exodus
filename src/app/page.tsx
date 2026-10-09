"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Mic, Library as LibraryIcon, Sun, Moon } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LibraryView } from "@/components/inkvine/library-view";
import { ReaderView } from "@/components/inkvine/reader-view";
import { VoiceStudioView } from "@/components/inkvine/voice-studio-view";
import { UploadView } from "@/components/inkvine/upload-view";
import { cn } from "@/lib/utils";

export default function Home() {
  const view = useAppStore((s) => s.view);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => useAppStore.getState().backToLibrary()}
            className="flex items-center gap-2.5"
          >
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary/15 ring-1 ring-primary/30 text-primary">
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            <span className="font-semibold tracking-tight">
              Ink<span className="text-primary">vine</span>
            </span>
          </button>

          <nav className="flex items-center gap-1">
            <NavButton
              active={view === "library" || view === "reader"}
              onClick={() => useAppStore.getState().backToLibrary()}
              icon={<LibraryIcon className="h-4 w-4" />}
              label="Library"
            />
            <NavButton
              active={view === "voices"}
              onClick={() => useAppStore.getState().setView("voices")}
              icon={<Mic className="h-4 w-4" />}
              label="Voices"
            />
          </nav>
        </div>
      </header>

      {/* Main content */}
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
            {view === "library" && <LibraryView />}
            {view === "reader" && <ReaderView />}
            {view === "voices" && <VoiceStudioView />}
            {view === "upload" && <UploadView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-background/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Inkvine — your documents, narrated.
          </p>
          <p>
            Powered by <span className="text-foreground/80 font-medium">Z.ai</span> · TTS
          </p>
        </div>
      </footer>
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
