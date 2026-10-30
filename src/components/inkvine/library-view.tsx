"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Upload, Book, Play, MoreVertical, Star, Search, Plus, Clock,
} from "lucide-react";
import { useDocuments, useLivingBooks } from "./hooks";
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

export function LibraryView() {
  const { data: docs, isLoading } = useDocuments();
  const { data: livingBooks } = useLivingBooks();
  const setView = useAppStore((s) => s.setView);
  const openReader = useAppStore((s) => s.openReader);
  const openButterfly = useAppStore((s) => s.openButterfly);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!docs) return [];
    if (!query) return docs;
    return docs.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()));
  }, [docs, query]);

  const reading = docs?.filter((d) => d.shelf === "reading") ?? [];
  const wantToRead = docs?.filter((d) => d.shelf === "want_to_read") ?? [];
  const read = docs?.filter((d) => d.shelf === "read") ?? [];

  async function handleDelete(id: string) {
    try {
      await api(`/api/documents/${id}`, { method: "DELETE" });
      bumpRefresh();
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  if (!docs || docs.length === 0) {
    return (
      <div className="mx-auto max-w-2xl w-full px-4 py-16">
        <EmptyState onUpload={() => setView("upload")} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-6 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-32 sm:w-48 rounded-lg bg-card border border-border pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
          <button
            onClick={() => setView("upload")}
            className="grid place-items-center h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {query ? (
        /* Search results */
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Results ({filtered.length})
          </h2>
          <div className="flex gap-4 overflow-x-auto ct-scroll pb-2">
            {filtered.map((d, i) => (
              <BookCard key={d.id} doc={d} index={i} onOpen={() => openReader(d.id)} onDelete={() => handleDelete(d.id)} />
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {/* Living Books (Butterfly Engine) */}
          {livingBooks && livingBooks.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-300/80 mb-3 flex items-center gap-1.5">
                <span className="text-cyan-300">🦋</span>
                Living Books
                <span className="text-[9px] text-muted-foreground font-normal normal-case tracking-normal ml-1">tap the butterfly to bring pages alive</span>
              </h2>
              <div className="flex gap-4 overflow-x-auto ct-scroll pb-2 -mx-1 px-1">
                {livingBooks.map((b, i) => (
                  <motion.button
                    key={b.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => openButterfly(b.id)}
                    className="group relative shrink-0 w-32 sm:w-36 text-left"
                  >
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted ring-1 ring-cyan-400/20 group-hover:ring-cyan-300/50 transition shadow-md group-hover:shadow-lg group-hover:shadow-cyan-500/10 group-hover:-translate-y-0.5 transition-all">
                      {(b.coverUrl || b.pages[0]?.artUrl) && (
                        <img src={(b.coverUrl || b.pages[0]?.artUrl) as string} alt={b.title} className="h-full w-full object-cover" />
                      )}
                      {!b.coverUrl && !b.pages[0]?.artUrl && (
                        <div className="h-full w-full grid place-items-center bg-gradient-to-br from-cyan-500/10 to-indigo-500/10">
                          <Book className="h-8 w-8 text-cyan-300/30" />
                        </div>
                      )}
                      {/* butterfly badge */}
                      <span className="absolute top-2 right-2 grid place-items-center h-6 w-6 rounded-full bg-cyan-400/20 ring-1 ring-cyan-300/50 text-cyan-200 text-xs animate-butterfly-glow">
                        🦋
                      </span>
                      {/* hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-2xl">🦋</span>
                      </div>
                    </div>
                    <h3 className="mt-2 text-xs font-semibold leading-tight line-clamp-2">{b.title}</h3>
                    {b.author && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">By {b.author}</p>}
                    <p className="text-[10px] text-cyan-300/60 mt-0.5">{b.pages.length} pages</p>
                  </motion.button>
                ))}
              </div>
            </section>
          )}

          {/* Continue listening */}
          {reading.length > 0 && (
            <Carousel title="Continue listening">
              {reading.map((d, i) => (
                <ContinueCard key={d.id} doc={d} index={i} onOpen={() => openReader(d.id)} />
              ))}
            </Carousel>
          )}

          {/* Want to read */}
          {wantToRead.length > 0 && (
            <Carousel title="Want to read">
              {wantToRead.map((d, i) => (
                <BookCard key={d.id} doc={d} index={i} onOpen={() => openReader(d.id)} onDelete={() => handleDelete(d.id)} />
              ))}
            </Carousel>
          )}

          {/* Read */}
          {read.length > 0 && (
            <Carousel title="Finished">
              {read.map((d, i) => (
                <BookCard key={d.id} doc={d} index={i} onOpen={() => openReader(d.id)} onDelete={() => handleDelete(d.id)} />
              ))}
            </Carousel>
          )}

          {/* All books */}
          <Carousel title="All books">
            {docs.map((d, i) => (
              <BookCard key={d.id} doc={d} index={i} onOpen={() => openReader(d.id)} onDelete={() => handleDelete(d.id)} />
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
}

function Carousel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">{title}</h2>
      <div className="flex gap-4 overflow-x-auto ct-scroll pb-2 -mx-1 px-1">
        {children}
      </div>
    </section>
  );
}

/** Audible-style book card: cover + title + By author + kebab menu */
function BookCard({ doc, index, onOpen, onDelete }: { doc: any; index: number; onOpen: () => void; onDelete: () => void }) {
  const ready = doc.chunks.filter((c: any) => c.status === "ready").length;
  const total = doc.chunks.length;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const allReady = ready === total && total > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group relative shrink-0 w-32 sm:w-36"
    >
      <button onClick={onOpen} className="block w-full text-left">
        {/* Cover */}
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 group-hover:ring-primary/40 transition shadow-md group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
          {doc.coverUrl ? (
            <img src={doc.coverUrl} alt={doc.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Book className="h-8 w-8 text-primary/40" />
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-2 right-2">
            {allReady ? (
              <span className="rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">✓</span>
            ) : (
              <span className="rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[9px] font-bold text-amber-950">{percent}%</span>
            )}
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="grid place-items-center h-10 w-10 rounded-full bg-foreground text-background shadow-lg">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </span>
          </div>
        </div>
        {/* Title + author */}
        <h3 className="mt-2 text-xs font-semibold leading-tight line-clamp-2">{doc.title}</h3>
        {doc.author && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">By {doc.author}</p>}
        {/* Rating */}
        {doc.rating && (
          <div className="mt-1 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={cn("h-2.5 w-2.5", n <= doc.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            ))}
          </div>
        )}
      </button>
      {/* Kebab menu */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button className="absolute top-1.5 left-1.5 grid place-items-center h-6 w-6 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 hover:bg-black/80 transition">
            <MoreVertical className="h-3 w-3" />
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

/** Featured "Continue listening" card with progress bar + resume button */
function ContinueCard({ doc, index, onOpen }: { doc: any; index: number; onOpen: () => void }) {
  const ready = doc.chunks.filter((c: any) => c.status === "ready").length;
  const total = doc.chunks.length;
  const percent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const vcfg = voiceConfig(doc.voiceId);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group shrink-0 w-64 sm:w-72"
    >
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-[3/4] sm:aspect-[16/10] sm:w-full rounded-lg overflow-hidden bg-muted ring-1 ring-border/60 group-hover:ring-primary/40 transition shadow-lg group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all">
          {doc.coverUrl ? (
            <img src={doc.coverUrl} alt={doc.title} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/15 to-primary/5">
              <Book className="h-10 w-10 text-primary/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 drop-shadow">{doc.title}</h3>
            {doc.author && <p className="text-[11px] text-white/70 mt-0.5 truncate">By {doc.author}</p>}
            {/* Progress bar */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1 overflow-hidden rounded-full bg-white/20">
                <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-[10px] text-white/80 font-medium tabular-nums">{percent}%</span>
            </div>
            {/* Voice + resume */}
            <div className="mt-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[10px] text-white/60">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: vcfg.color }} />
                {vcfg.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-foreground text-background px-2.5 py-1 text-[10px] font-semibold">
                <Play className="h-2.5 w-2.5 fill-current" /> Resume
              </span>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
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
        Upload an EPUB, PDF, or TXT file. Inkvine parses it, narrates it in your
        chosen voice, and shelves it — just like a personal audiobook library.
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

// Re-export StarRating + ShelfBadge for the reader view
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
            className={cn(n <= display ? "fill-amber-400 text-amber-400" : "fill-transparent text-muted-foreground/40")}
          />
        </button>
      ))}
    </div>
  );
}
