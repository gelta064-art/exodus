"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Home as HomeIcon, Library as LibraryIcon, Compass, Users, Mic, Plus } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { LibraryView } from "@/components/inkvine/library-view";
import { ReaderView } from "@/components/inkvine/reader-view";
import { VoiceStudioView } from "@/components/inkvine/voice-studio-view";
import { CommunityView } from "@/components/inkvine/community-view";
import { DiscoverView } from "@/components/inkvine/discover-view";
import { UploadView } from "@/components/inkvine/upload-view";
import { ButterflyReaderView } from "@/components/inkvine/butterfly-reader-view";
import { StoryView } from "@/components/inkvine/story-view";
import { NowPlayingBar } from "@/components/inkvine/now-playing-bar";
import { cn } from "@/lib/utils";

export default function Home() {
  const view = useAppStore((s) => s.view);
  const nowPlaying = useAppStore((s) => s.nowPlaying);
  const immersive = view === "reader" || view === "butterfly" || view === "story";

  const navItems = [
    { id: "library" as const, label: "Home", icon: HomeIcon, view: "library" as const },
    { id: "discover" as const, label: "Discover", icon: Compass, view: "discover" as const },
    { id: "community" as const, label: "Community", icon: Users, view: "community" as const },
    { id: "voices" as const, label: "Voices", icon: Mic, view: "voices" as const },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left sidebar (Audible-style vertical rail) — hidden in immersive reader */}
      {!immersive && (
        <aside className="hidden md:flex w-56 lg:w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border sticky top-0 h-screen">
          {/* Logo */}
          <div className="px-5 h-14 flex items-center border-b border-sidebar-border">
            <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary/15 ring-1 ring-primary/30 text-primary mr-2.5">
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight text-sidebar-foreground text-lg">
              Ink<span className="text-primary">vine</span>
            </span>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = view === item.view || (item.view === "library" && view === "reader");
              return (
                <button
                  key={item.id}
                  onClick={() => useAppStore.getState().setView(item.view)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Upload button at bottom */}
          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={() => useAppStore.getState().setView("upload")}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                view === "upload"
                  ? "bg-primary text-primary-foreground"
                  : "bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/70"
              )}
            >
              <Plus className="h-4 w-4" />
              Upload
            </button>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar (visible only on small screens) */}
        {!immersive && (
          <header className="md:hidden sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-sidebar border-b border-sidebar-border">
            <button onClick={() => useAppStore.getState().backToLibrary()} className="flex items-center gap-2">
              <span className="grid place-items-center h-7 w-7 rounded-lg bg-primary/15 ring-1 ring-primary/30 text-primary">
                <BookOpen className="h-4 w-4" />
              </span>
              <span className="font-semibold text-sidebar-foreground">Ink<span className="text-primary">vine</span></span>
            </button>
            <div className="flex items-center gap-1">
              <MobileNavBtn view={view} target="library" icon={<HomeIcon className="h-4 w-4" />} />
              <MobileNavBtn view={view} target="discover" icon={<Compass className="h-4 w-4" />} />
              <MobileNavBtn view={view} target="community" icon={<Users className="h-4 w-4" />} />
              <MobileNavBtn view={view} target="voices" icon={<Mic className="h-4 w-4" />} />
            </div>
          </header>
        )}

        {/* Main scrollable content */}
        <main className="flex-1 flex flex-col min-h-0">
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
              {view === "butterfly" && <ButterflyReaderView />}
              {view === "story" && <StoryView />}
              {view === "voices" && <VoiceStudioView />}
              {view === "community" && <CommunityView />}
              {view === "discover" && <DiscoverView />}
              {view === "upload" && <UploadView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Now Playing mini-player bar (Audible-style, fixed bottom) */}
      {!immersive && nowPlaying && <NowPlayingBar />}
    </div>
  );
}

function MobileNavBtn({ view, target, icon }: { view: string; target: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={() => useAppStore.getState().setView(target as any)}
      className={cn(
        "grid place-items-center h-9 w-9 rounded-lg transition",
        view === target || (target === "library" && view === "reader")
          ? "bg-primary/15 text-primary"
          : "text-sidebar-foreground/60 hover:text-sidebar-foreground"
      )}
    >
      {icon}
    </button>
  );
}
