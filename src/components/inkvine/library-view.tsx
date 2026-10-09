"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Book, FileType2, Play, Pause, Loader2, Trash2, Star,
  Clock, Mic2, Search, ChevronRight, Library as LibraryIcon, Plus,
} from "lucide-react";
import { useDocuments, useVoices } from "./hooks";
import { useAppStore } from "@/lib/store";
import { voiceConfig } from "@/lib/voices";
import { SHELVES, type Shelf } from "@/lib/types";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Filter = "all" | Shelf;

export function LibraryView() {
  const { data: docs, isLoading } = useDocuments();
  const { data: voices } = useVoices();
  const setView = useAppStore((s) => s.setView);
  const openReader = useAppStore((s) => s.openReader);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!docs) return [];
    return docs.filter((d) => {
      if (filter !== "all" && d.shelf !== filter) return false;
      if (query && !d.title.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [docs, filter, query]);

  const currentlyReading = docs?.filter((d) => d.shelf === "reading") ?? [];
  const wantToRead = docs?.filter((d) => d.shelf === "want_to_read") ?? [];
  const read = docs?.filter((d) => d.shelf === "read") ?? [];
  const totalChars = docs?.reduce((a, d) => a + d.charCount, 0) ?? 0;

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
    <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {docs?.length ?? 0} {docs?.length === 1 ? "book" : "books"} ·{" "}
            {Math.round(totalChars / 1000)}k characters ·{" "}
            {currentlyReading.length} reading · {read.length} finished
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles…"
              className="w-40 sm:w-56 rounded-lg bg-card border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
          <button
            onClick={() => setView("upload")}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </button>
        </div>
      </div>

      {/* Shelf filters */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto ct-scroll pb-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="All" emoji="📚" count={docs?.length ?? 0} />
        {SHELVES.map((s) => (
          <FilterChip
            key={s.id}
            active={filter === s.id}
            onClick={() => setFilter(s.id)}
            label={s.label}
            emoji={s.emoji}
            count={docs?.filter((d) => d.shelf === s.id).length ?? 0}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 rounded-2xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        </div>
      ) : !docs || docs.length === 0 ? (
        <EmptyState onUpload={() => setView("upload")} />
      ) : (
        <div className="space-y-8">
          {/* Currently Reading row (NaturalReader-style featured) */}
          {currentlyReading.length > 0 && filter === "all" && !query && (
            <ShelfSection title="Currently Reading" emoji="🎧">
              <div className="flex gap-3 overflow-x-auto ct-scroll pb-2">
                {currentlyReading.map((d) => (
                  <ReadingCard key={d.id} doc={d} onPlay={() => openReader(d.id)} />
                ))}
              </div>
            </ShelfSection>
          )}

          {/* Bookshelf grid */}
          <ShelfSection
            title={filter === "all" ? "Your Books" : SHELVES.find((s) => s.id === filter)?.label || "Books"}
            emoji={filter === "all" ? "📖" : SHELVES.find((s) => s.id === filter)?.emoji}
          >
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground col-span-full py-8 text-center">
                No books on this shelf yet.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filtered.map((d, i) => (
                  <BookCover
                    key={d.id}
                    doc={d}
                    index={i}
                    onOpen={() => openReader(d.id)}
                    onDelete={() => handleDelete(d.id)}
                  />
                ))}
              </div>
            )}
          </ShelfSection>

          {/* Want to Read (horizontal) */}
          {wantToRead.length > 0 && filter === "all" && !query && (
            <ShelfSection title="Want to Read" emoji="📚">
              <div className="flex gap-3 overflow-x-auto ct-scroll pb-2">
                {wantToRead.map((d) => (
                  <div key={d.id} className="w-24 sm:w-28 shrink-0">
                    <MiniCover doc={d} onOpen={() => openReader(d.id)} />
                  </div>
                ))}
              </div>
            </ShelfSection>
          )}
        </div>
      )}
    </div>
  );
}

function ShelfSection({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
        <span>{emoji}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function FilterChip({ active, onClick, label, emoji, count }: { active: boolean; onClick: () => void; label: string; emoji: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 transition shrink-0",
        active
          ? "bg-primary text-primary-foreground ring-primary"
          : "bg-card text-muted-foreground ring-border hover:text-foreground hover:ring-primary/30"
      )}
    >
      <span>{emoji}</span>
      <span>{label}</span>
      <span className={cn("text-[10px]", active ? "opacity-80" : "opacity-50")}>{count}</span>
    </button>
  );
}

function ReadingCard({ doc, onPlay }: { doc: any; onPlay: () => void }) {
  const ready = doc.chunks.filter((c: any) => c.status === "ready").length;
  const total = doc.chunks.length;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const vcfg = voiceConfig(doc.voiceId);
  return (
    <div className="w-72 shrink-0 rounded-2xl bg-card ring-1 ring-border/60 overflow-hidden">
      <div className="flex gap-0">
        <div className="relative w-20 shrink-0 bg-muted overflow-hidden">
          {doc.coverUrl ? (
            <img src={doc.coverUrl} alt={doc.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Book className="h-6 w-6 text-primary/40" />
            </div>
          )}
        </div>
        <div className="flex-1 p-3 flex flex-col">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{doc.title}</h3>
          {doc.author && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">by {doc.author}</p>}
          <div className="mt-1 flex items-center gap-1">
            <StarRating value={doc.rating} size={12} />
          </div>
          <div className="mt-auto pt-2">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{percent}% • {ready}/{total}</span>
              <button onClick={onPlay} className="inline-flex items-center gap-1 rounded-lg bg-primary text-primary-foreground px-2 py-1 text-[11px] font-semibold hover:brightness-110 transition">
                <Play className="h-3 w-3 fill-current" /> Resume
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookCover({ doc, index, onOpen, onDelete }: { doc: any; index: number; onOpen: () => void; onDelete: () => void }) {
  const ready = doc.chunks.filter((c: any) => c.status === "ready").length;
  const total = doc.chunks.length;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const allReady = ready === total && total > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative"
    >
      <button onClick={onOpen} className="block w-full text-left">
        {/* Cover */}
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 group-hover:ring-primary/40 transition shadow-md group-hover:shadow-lg group-hover:shadow-black/30 group-hover:-translate-y-0.5 transition-all">
          {doc.coverUrl ? (
            <img src={doc.coverUrl} alt={doc.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Book className="h-8 w-8 text-primary/40" />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-1.5 right-1.5">
            {allReady ? (
              <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">✓</span>
            ) : (
              <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-amber-950">{percent}%</span>
            )}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="grid place-items-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </span>
          </div>
        </div>
        {/* Info */}
        <div className="mt-1.5 px-0.5">
          <h3 className="text-xs font-medium leading-tight line-clamp-2">{doc.title}</h3>
          {doc.author && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">by {doc.author}</p>}
          <div className="mt-1 flex items-center justify-between">
            <StarRating value={doc.rating} size={11} />
            {doc.shelf && <ShelfBadge shelf={doc.shelf} />}
          </div>
        </div>
      </button>
      {/* Delete (hover) */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="absolute -top-1.5 -left-1.5 grid place-items-center h-6 w-6 rounded-full bg-card ring-1 ring-border text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:ring-destructive/50 transition">
            <Trash2 className="h-3 w-3" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete book?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes “{doc.title}” and all its generated audio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

function MiniCover({ doc, onOpen }: { doc: any; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="block w-full text-left group">
      <div className="relative aspect-[3/4] rounded-md overflow-hidden bg-muted ring-1 ring-border/60 group-hover:ring-primary/40 transition">
        {doc.coverUrl ? (
          <img src={doc.coverUrl} alt={doc.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
            <Book className="h-6 w-6 text-primary/40" />
          </div>
        )}
      </div>
      <h3 className="mt-1 text-[11px] font-medium line-clamp-2 leading-tight">{doc.title}</h3>
    </button>
  );
}

export function StarRating({ value, size = 14, onChange }: { value: number | null; size?: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = React.useState<number | null>(null);
  const display = hover ?? value ?? 0;
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onMouseEnter={() => onChange && setHover(n)}
          onClick={() => onChange?.(n)}
          className={cn(!onChange && "cursor-default", onChange && "cursor-pointer")}
        >
          <Star
            style={{ width: size, height: size }}
            className={cn(
              n <= display ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ShelfBadge({ shelf }: { shelf: Shelf }) {
  const cfg = SHELVES.find((s) => s.id === shelf);
  if (!cfg) return null;
  const colors: Record<string, string> = {
    want_to_read: "bg-sky-500/15 text-sky-300",
    reading: "bg-amber-500/15 text-amber-300",
    read: "bg-emerald-500/15 text-emerald-300",
  };
  return (
    <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide", colors[shelf])}>
      {cfg.emoji}
    </span>
  );
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 sm:p-14 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
        <Book className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-lg font-semibold">Your shelf is empty</h2>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
        Upload an EPUB, PDF, or TXT file. Inkvine parses it, narrates it in your
        chosen voice, and tracks your reading — just like a bookshelf.
      </p>
      <button
        onClick={onUpload}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-lg shadow-primary/20 hover:brightness-110 transition"
      >
        <Upload className="h-4 w-4" />
        Upload your first book
      </button>
    </div>
  );
}
