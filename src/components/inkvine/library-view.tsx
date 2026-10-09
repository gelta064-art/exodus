"use client";

import { Sparkles, Upload, FileText, Book, FileType2, Clock, Play, Pause, Loader2, Trash2, Mic2 } from "lucide-react";
import { useDocuments, useVoices } from "./hooks";
import { useAppStore } from "@/lib/store";
import { voiceConfig } from "@/lib/voices";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import * as React from "react";

export function LibraryView() {
  const { data: docs, isLoading } = useDocuments();
  const { data: voices } = useVoices();
  const setView = useAppStore((s) => s.setView);
  const openReader = useAppStore((s) => s.openReader);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);

  const totalChunks = docs?.reduce((a, d) => a + d.chunks.length, 0) ?? 0;
  const readyChunks = docs?.reduce(
    (a, d) => a + d.chunks.filter((c) => c.status === "ready").length,
    0
  ) ?? 0;
  const totalChars = docs?.reduce((a, d) => a + d.charCount, 0) ?? 0;

  // "Now playing" = most recently updated doc with some progress, or first doc
  const featured = docs?.[0];

  async function handleDelete(id: string) {
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      bumpRefresh();
      toast.success("Document deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6">
      {/* Top stats row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {docs?.length ?? 0} {docs?.length === 1 ? "document" : "documents"} ·{" "}
            {totalChars.toLocaleString()} characters · {readyChunks}/{totalChunks}{" "}
            chunks ready
          </p>
        </div>
        <button
          onClick={() => setView("upload")}
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-8 rounded-lg" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : !docs || docs.length === 0 ? (
        <EmptyState onUpload={() => setView("upload")} />
      ) : (
        <div className="space-y-6">
          {/* Primary media card (featured / now playing) */}
          {featured && <FeaturedCard doc={featured} onPlay={() => openReader(featured.id)} voices={voices ?? []} />}

          {/* Document list */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              All Documents
            </p>
            <div className="space-y-2">
              {docs.map((doc, i) => {
                const ready = doc.chunks.filter((c) => c.status === "ready").length;
                const total = doc.chunks.length;
                const vcfg = voiceConfig(doc.voiceId);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-center gap-3 rounded-xl bg-card ring-1 ring-border/60 p-3 hover:ring-primary/30 transition cursor-pointer"
                    onClick={() => openReader(doc.id)}
                  >
                    <FileTypeIcon fileType={doc.fileType} />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{doc.title}</h3>
                      <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                        <span className="uppercase">{doc.fileType}</span>
                        <span>{(doc.charCount / 1000).toFixed(1)}k chars</span>
                        <span className="inline-flex items-center gap-0.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: vcfg.color }}
                          />
                          {vcfg.label}
                        </span>
                        <span>{ready}/{total} ready</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openReader(doc.id); }}
                        className="grid place-items-center h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="grid place-items-center h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete document?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This removes “{doc.title}” and all its generated audio.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedCard({ doc, onPlay, voices }: { doc: any; onPlay: () => void; voices: any[] }) {
  const ready = doc.chunks.filter((c: any) => c.status === "ready").length;
  const total = doc.chunks.length;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const vcfg = voiceConfig(doc.voiceId);
  const isReady = ready === total && total > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-border/60">
      <div className="flex gap-0">
        {/* Cover */}
        <div className="relative w-28 sm:w-36 shrink-0 bg-muted overflow-hidden">
          {doc.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.coverUrl} alt={doc.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Book className="h-8 w-8 text-primary/40" />
            </div>
          )}
        </div>

        {/* Info + controls */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium mb-1">
                Now in Library
              </p>
              <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">{doc.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.fileName}</p>
            </div>
            {isReady ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-300 px-2 py-0.5 text-[10px] font-bold ring-1 ring-emerald-400/30 shrink-0">
                READY
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-200 px-2 py-0.5 text-[10px] font-bold ring-1 ring-amber-400/30 shrink-0">
                {percent}%
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{Math.round((doc.charCount / 900) * 0.12)} min
            </span>
            <span className="inline-flex items-center gap-1">
              <Mic2 className="h-3 w-3" style={{ color: vcfg.color }} />
              {vcfg.label}
            </span>
            <span>{doc.chunks.length} chunks</span>
          </div>

          <div className="mt-auto pt-3 flex items-center gap-2">
            <button
              onClick={onPlay}
              disabled={!isReady}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
                isReady
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:brightness-110"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Play className="h-4 w-4 fill-current" />
              Listen
            </button>
            {!isReady && (
              <span className="text-xs text-amber-300 inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {ready}/{total} chunks ready
              </span>
            )}
            {/* progress bar */}
            <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted ml-2">
              <div
                className="h-full bg-gradient-to-r from-primary to-amber-300 transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTypeIcon({ fileType }: { fileType: string }) {
  const colors: Record<string, string> = {
    txt: "text-sky-300",
    md: "text-sky-300",
    epub: "text-emerald-300",
    pdf: "text-rose-300",
  };
  return (
    <div className={cn("grid place-items-center h-10 w-10 rounded-lg bg-muted shrink-0", colors[fileType] || "text-muted-foreground")}>
      <FileType2 className="h-5 w-5" />
    </div>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 sm:p-14 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <Book className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">Your library is empty</h2>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
        Upload an EPUB, PDF, or TXT file. Inkvine parses it, chunks the text, and
        narrates it in your chosen synthetic voice.
      </p>
      <button
        onClick={onUpload}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
      >
        <Upload className="h-4 w-4" />
        Upload a document
      </button>
    </div>
  );
}
