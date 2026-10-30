"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, List, X, Minus, Plus, Sun, Moon, BookOpen,
  ChevronLeft, ChevronRight, MoreVertical,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useDocument } from "./hooks";
import { paginateText, chapterForPage } from "./pagination";
import { cn } from "@/lib/utils";

type Theme = "dark" | "sepia" | "light";

const THEME_META: Record<Theme, { label: string; icon: any; swatch: string }> = {
  dark: { label: "Dark", icon: Moon, swatch: "#1a1a2e" },
  sepia: { label: "Sepia", icon: BookOpen, swatch: "#f4ecd8" },
  light: { label: "Light", icon: Sun, swatch: "#ffffff" },
};

const FONT_MIN = 14;
const FONT_MAX = 24;
const FONT_STEP = 1;

export function ReaderView() {
  const docId = useAppStore((s) => s.selectedDocId);
  const back = useAppStore((s) => s.backToLibrary);
  const { data: doc, isLoading } = useDocument(docId);

  const [pageIndex, setPageIndex] = React.useState(0);
  const [theme, setTheme] = React.useState<Theme>("dark");
  const [fontSize, setFontSize] = React.useState(17);
  const [showControls, setShowControls] = React.useState(true);
  const [showToc, setShowToc] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [pageDirection, setPageDirection] = React.useState<"next" | "prev">("next");

  // Paginate the document text
  const rawText = doc?.rawText ?? "";
  const paginated = React.useMemo(
    () => (rawText ? paginateText(rawText) : { pages: [], chapters: [] }),
    [rawText]
  );

  const pages = paginated.pages;
  const currentChapter = chapterForPage(pageIndex, paginated.chapters);

  // Reset to page 0 when doc changes
  React.useEffect(() => {
    setPageIndex(0);
    setPageDirection("next");
  }, [docId]);

  // Clamp page index if pages changed
  React.useEffect(() => {
    if (pageIndex > pages.length - 1) setPageIndex(Math.max(0, pages.length - 1));
  }, [pages.length, pageIndex]);

  function goNext() {
    if (pageIndex < pages.length - 1) {
      setPageDirection("next");
      setPageIndex((i) => i + 1);
    }
  }
  function goPrev() {
    if (pageIndex > 0) {
      setPageDirection("prev");
      setPageIndex((i) => i - 1);
    }
  }

  // Tap zones: left third = prev, right third = next, center = toggle controls
  function handleTap(e: React.MouseEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;
    if (x < third) {
      goPrev();
    } else if (x > third * 2) {
      goNext();
    } else {
      setShowControls((v) => !v);
    }
  }

  // Keyboard navigation
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") setShowToc(false), setShowSettings(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pageIndex, pages.length]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background">
        <div className="text-center">
          <BookOpen className="h-8 w-8 text-primary/40 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Opening your book…</p>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background text-center px-6">
        <div>
          <p className="text-muted-foreground text-sm">Document not found.</p>
          <button onClick={back} className="mt-4 text-primary hover:underline text-sm">
            Back to library
          </button>
        </div>
      </div>
    );
  }

  const themeClass = `reader-theme-${theme}`;
  const themeMeta = THEME_META[theme];
  const ThemeIcon = themeMeta.icon;

  return (
    <div className="fixed inset-0 bg-black grid place-items-center md:p-6">
      {/* Phone frame on desktop, full-screen on mobile */}
      <div className={cn(
        "relative w-full h-full bg-black overflow-hidden",
        "md:max-w-[420px] md:h-[calc(100vh-3rem)] md:rounded-[2.5rem] md:ring-[10px] md:ring-zinc-800 md:shadow-2xl",
        "max-md:rounded-none max-md:ring-0"
      )}>
        {/* Reading surface with theme */}
        <div
          className={cn("absolute inset-0 transition-colors duration-300", themeClass)}
          style={{ backgroundColor: "var(--reader-bg)" }}
        >
          {/* Tap zones overlay (transparent, captures taps) */}
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={handleTap}
          />

          {/* Page content */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={pageIndex}
                initial={{ opacity: 0, x: pageDirection === "next" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: pageDirection === "next" ? -20 : 20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col"
              >
                {/* Top spacer for chrome */}
                <div className="h-16 shrink-0" />
                {/* Reading text */}
                <div className="flex-1 overflow-y-auto ct-scroll px-8 sm:px-10">
                  {currentChapter && pageIndex === currentChapter.startIndex && (
                    <p
                      className="text-[11px] uppercase tracking-[0.25em] mb-4 mt-2"
                      style={{ color: "var(--reader-accent)" }}
                    >
                      {currentChapter.title}
                    </p>
                  )}
                  <div
                    className="whitespace-pre-wrap leading-[1.7] font-serif"
                    style={{
                      color: "var(--reader-fg)",
                      fontSize: `${fontSize}px`,
                      fontFamily: "'Georgia', 'Iowan Old Style', 'Palatino Linotype', serif",
                    }}
                  >
                    {pages[pageIndex]?.text || ""}
                  </div>
                </div>
                {/* Bottom spacer */}
                <div className="h-20 shrink-0" />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* === TOP CHROME === */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-0 inset-x-0 z-30"
                style={{ backgroundColor: "var(--reader-bar)" }}
              >
                <div className="flex items-center justify-between px-4 h-16">
                  <button
                    onClick={back}
                    className="grid place-items-center h-9 w-9 rounded-full transition hover:opacity-70"
                    style={{ color: "var(--reader-fg)" }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="text-center min-w-0 flex-1 px-3">
                    <p
                      className="text-[10px] uppercase tracking-[0.15em] truncate"
                      style={{ color: "var(--reader-fg-muted)" }}
                    >
                      {doc.title}
                    </p>
                    {currentChapter && (
                      <p
                        className="text-[11px] font-medium truncate"
                        style={{ color: "var(--reader-fg)" }}
                      >
                        {currentChapter.title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowToc(true)}
                    className="grid place-items-center h-9 w-9 rounded-full transition hover:opacity-70"
                    style={{ color: "var(--reader-fg)" }}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === BOTTOM CHROME (progress + controls) === */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-0 inset-x-0 z-30"
                style={{ backgroundColor: "var(--reader-bar)" }}
              >
                <div className="px-4 py-3 pb-5">
                  {/* Progress slider */}
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="text-[11px] tabular-nums w-8 text-right"
                      style={{ color: "var(--reader-fg-muted)" }}
                    >
                      {pageIndex + 1}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, pages.length - 1)}
                      value={pageIndex}
                      onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setPageDirection(v > pageIndex ? "next" : "prev");
                        setPageIndex(v);
                      }}
                      className="flex-1 ereader-slider"
                      style={{ accentColor: "var(--reader-accent)" }}
                    />
                    <span
                      className="text-[11px] tabular-nums w-8"
                      style={{ color: "var(--reader-fg-muted)" }}
                    >
                      {pages.length}
                    </span>
                  </div>
                  {/* Control row */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setFontSize((f) => Math.max(FONT_MIN, f - FONT_STEP))}
                      disabled={fontSize <= FONT_MIN}
                      className="grid place-items-center h-8 w-8 rounded-full transition disabled:opacity-30 hover:opacity-70"
                      style={{ color: "var(--reader-fg)" }}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: "var(--reader-fg-muted)" }}
                    >
                      A
                    </span>
                    <button
                      onClick={() => setFontSize((f) => Math.min(FONT_MAX, f + FONT_STEP))}
                      disabled={fontSize >= FONT_MAX}
                      className="grid place-items-center h-8 w-8 rounded-full transition disabled:opacity-30 hover:opacity-70"
                      style={{ color: "var(--reader-fg)" }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    {/* Page turn */}
                    <button
                      onClick={goPrev}
                      disabled={pageIndex === 0}
                      className="grid place-items-center h-8 w-8 rounded-full transition disabled:opacity-30 hover:opacity-70"
                      style={{ color: "var(--reader-fg)" }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={goNext}
                      disabled={pageIndex >= pages.length - 1}
                      className="grid place-items-center h-8 w-8 rounded-full transition disabled:opacity-30 hover:opacity-70"
                      style={{ color: "var(--reader-fg)" }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Settings */}
                    <button
                      onClick={() => setShowSettings(true)}
                      className="grid place-items-center h-8 w-8 rounded-full transition hover:opacity-70"
                      style={{ color: "var(--reader-fg)" }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === TABLE OF CONTENTS drawer === */}
          <AnimatePresence>
            {showToc && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowToc(false)}
              >
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 260 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-0 left-0 bottom-0 w-72 max-w-[80%] overflow-y-auto ct-scroll p-5"
                  style={{ backgroundColor: "var(--reader-bar)", color: "var(--reader-fg)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Contents</h3>
                    <button onClick={() => setShowToc(false)} style={{ color: "var(--reader-fg-muted)" }}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {paginated.chapters.length === 0 ? (
                    <p className="text-sm opacity-60">No chapters detected.</p>
                  ) : (
                    <div className="space-y-1">
                      {paginated.chapters.map((ch, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setPageDirection(ch.startIndex > pageIndex ? "next" : "prev");
                            setPageIndex(ch.startIndex);
                            setShowToc(false);
                          }}
                          className={cn(
                            "block w-full text-left rounded-lg px-3 py-2 text-sm transition",
                            currentChapter?.startIndex === ch.startIndex ? "font-semibold" : "opacity-70"
                          )}
                          style={{
                            backgroundColor: currentChapter?.startIndex === ch.startIndex ? "var(--reader-accent)22" : "transparent",
                            color: currentChapter?.startIndex === ch.startIndex ? "var(--reader-accent)" : "var(--reader-fg)",
                          }}
                        >
                          {ch.title}
                          <span className="text-[10px] opacity-50 ml-2">p.{ch.startIndex + 1}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === SETTINGS panel === */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowSettings(false)}
              >
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 260 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-0 inset-x-0 rounded-t-2xl p-5 pb-8"
                  style={{ backgroundColor: "var(--reader-bar)", color: "var(--reader-fg)" }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold">Reading Settings</h3>
                    <button onClick={() => setShowSettings(false)} style={{ color: "var(--reader-fg-muted)" }}>
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Theme */}
                  <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--reader-fg-muted)" }}>
                    Theme
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {(Object.keys(THEME_META) as Theme[]).map((t) => {
                      const meta = THEME_META[t];
                      const TIcon = meta.icon;
                      return (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={cn(
                            "rounded-xl p-3 flex flex-col items-center gap-1.5 ring-1 transition",
                            theme === t ? "ring-2" : "ring-border/40 opacity-70"
                          )}
                          style={{
                            backgroundColor: meta.swatch,
                            color: t === "light" || t === "sepia" ? "#333" : "#fff",
                            borderColor: theme === t ? "var(--reader-accent)" : "transparent",
                          }}
                        >
                          <TIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Font size */}
                  <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--reader-fg-muted)" }}>
                    Font Size
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFontSize((f) => Math.max(FONT_MIN, f - FONT_STEP))}
                      disabled={fontSize <= FONT_MIN}
                      className="grid place-items-center h-10 w-10 rounded-full ring-1 ring-border/40 disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center">
                      <span className="text-2xl font-bold">{fontSize}</span>
                      <span className="text-xs ml-1 opacity-60">px</span>
                    </div>
                    <button
                      onClick={() => setFontSize((f) => Math.min(FONT_MAX, f + FONT_STEP))}
                      disabled={fontSize >= FONT_MAX}
                      className="grid place-items-center h-10 w-10 rounded-full ring-1 ring-border/40 disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
