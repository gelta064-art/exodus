"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, RotateCcw, ChevronRight, Loader2, Skull, Sparkles, History as HistoryIcon, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Choice {
  id: string;
  text: string;
  tone: string;
}

interface Scene {
  title: string;
  text: string;
  choices: Choice[];
  isEnding: boolean;
}

interface HistoryItem {
  sceneText: string;
  choiceText: string | null;
}

const TONE_COLORS: Record<string, string> = {
  bold: "#f59e0b",
  cautious: "#22d3ee",
  cruel: "#ef4444",
  clever: "#a78bfa",
  reckless: "#fb923c",
  ruthless: "#dc2626",
  merciful: "#34d399",
  defiant: "#fbbf24",
  manipulative: "#c084fc",
  desperate: "#f87171",
};

export function StoryView() {
  const back = useAppStore((s) => s.backToLibrary);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [scene, setScene] = React.useState<Scene | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showHistory, setShowHistory] = React.useState(false);
  const [pendingChoice, setPendingChoice] = React.useState<string | null>(null);

  // Fetch opening scene on mount
  React.useEffect(() => {
    fetchScene([], undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchScene(hist: HistoryItem[], choice?: string) {
    setLoading(true);
    setPendingChoice(choice ?? null);
    try {
      const res = await api<{ scene: Scene }>("/api/story", {
        method: "POST",
        body: JSON.stringify({ history: hist, choice }),
      });
      setScene(res.scene);
    } catch (err) {
      console.error(err);
      setScene({
        title: "The Story Stalled",
        text: "Something went wrong with the narrative engine. Try restarting.",
        choices: [],
        isEnding: true,
      });
    } finally {
      setLoading(false);
      setPendingChoice(null);
    }
  }

  function handleChoice(choice: Choice) {
    if (!scene || loading) return;
    const newHistory: HistoryItem[] = [
      ...history,
      { sceneText: scene.text, choiceText: choice.text },
    ];
    setHistory(newHistory);
    fetchScene(newHistory, choice.text);
  }

  function handleRestart() {
    setHistory([]);
    fetchScene([], undefined);
  }

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto ct-scroll">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-border/40">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <button
            onClick={back}
            className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Library
          </button>
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-lg bg-red-500/15 ring-1 ring-red-500/30 text-red-400">
              <Skull className="h-4 w-4" />
            </span>
            <span className="font-semibold text-sm">Death Note</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground hidden sm:inline">
              Interactive
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(true)}
              className="grid place-items-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
              title="Story history"
            >
              <HistoryIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleRestart}
              className="grid place-items-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
              title="Restart story"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Story content */}
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 pb-32">
        {/* Chapter indicator */}
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-400/60 mb-2">
          Chapter {history.length + 1}
        </p>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center"
            >
              <Loader2 className="h-8 w-8 animate-spin text-red-400/60 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {pendingChoice ? "The story bends to your will…" : "The notebook awaits…"}
              </p>
            </motion.div>
          ) : scene ? (
            <motion.div
              key={history.length + "-" + scene.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
            >
              {/* Scene card */}
              <div className="rounded-2xl bg-gradient-to-br from-card to-card/60 ring-1 ring-border/60 p-6 sm:p-8 mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground">
                  {scene.title}
                </h2>
                <p className="text-sm sm:text-base leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {scene.text}
                </p>
              </div>

              {/* Choices */}
              {!scene.isEnding && scene.choices.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1">
                    What do you do?
                  </p>
                  <div className="space-y-2.5">
                    {scene.choices.map((c, i) => {
                      const color = TONE_COLORS[c.tone] || "#f59e0b";
                      return (
                        <motion.button
                          key={c.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                          onClick={() => handleChoice(c)}
                          disabled={loading}
                          className="group w-full text-left rounded-xl bg-card ring-1 ring-border/60 p-4 hover:ring-2 transition-all hover:translate-x-1 disabled:opacity-50"
                          style={{ ["--tone" as any]: color }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-0.5 grid place-items-center h-7 w-7 rounded-full shrink-0 text-[11px] font-bold transition group-hover:scale-110"
                              style={{ backgroundColor: color + "22", color }}
                            >
                              {c.id.toUpperCase()}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-snug">{c.text}</p>
                              <p
                                className="text-[10px] uppercase tracking-wide mt-1 font-medium"
                                style={{ color }}
                              >
                                {c.tone}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground transition shrink-0 mt-1" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ending */}
              {scene.isEnding && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-gradient-to-br from-red-500/10 to-card ring-1 ring-red-500/30 p-6 text-center"
                >
                  <Sparkles className="h-8 w-8 text-red-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-2">The End</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your story has reached its conclusion. {history.length} chapters written.
                  </p>
                  <button
                    onClick={handleRestart}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500 text-white px-5 py-2.5 text-sm font-semibold hover:bg-red-400 transition"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Begin Again
                  </button>
                </motion.div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* History drawer */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-card border-l border-border/60 overflow-y-auto ct-scroll"
            >
              <div className="sticky top-0 bg-card/95 backdrop-blur px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <HistoryIcon className="h-4 w-4 text-red-400" />
                  Your Path
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {history.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Your story has just begun.
                  </p>
                )}
                {history.map((h, i) => (
                  <div key={i} className="relative pl-5">
                    {/* timeline line */}
                    {i < history.length - 1 && (
                      <span className="absolute left-1.5 top-2 bottom-0 w-px bg-border" />
                    )}
                    <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-red-500/40 ring-2 ring-red-500/20" />
                    <p className="text-[10px] uppercase tracking-wide text-red-400/60 mb-1">
                      Chapter {i + 1}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-3 mb-1.5">
                      {h.sceneText.slice(0, 120)}…
                    </p>
                    {h.choiceText && (
                      <p className="text-xs font-medium text-foreground/80 flex items-start gap-1">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-red-400 shrink-0" />
                        {h.choiceText}
                      </p>
                    )}
                  </div>
                ))}
                {scene && !loading && (
                  <div className="relative pl-5 pt-2 border-t border-border/60">
                    <span className="absolute left-0 top-3 h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-500/30 animate-pulse" />
                    <p className="text-[10px] uppercase tracking-wide text-red-400/60 mb-1">
                      Chapter {history.length + 1} (current)
                    </p>
                    <p className="text-xs font-medium">{scene.title}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
