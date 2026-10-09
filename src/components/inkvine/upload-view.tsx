"use client";

import * as React from "react";
import { Upload, FileText, Book, FileType2, ArrowLeft, Loader2, Sparkles, Mic2 } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useVoices } from "./hooks";
import { api } from "@/lib/api-client";
import { voiceConfig } from "@/lib/voices";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { DocumentData } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UploadView() {
  const backToLibrary = useAppStore((s) => s.backToLibrary);
  const openReader = useAppStore((s) => s.openReader);
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const { data: voices } = useVoices();

  const [file, setFile] = React.useState<File | null>(null);
  const [voiceId, setVoiceId] = React.useState("tongtong");
  const [phase, setPhase] = React.useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = React.useState<string>("");
  const [created, setCreated] = React.useState<DocumentData | null>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase() || "";
    if (!["txt", "md", "epub", "pdf"].includes(ext)) {
      toast.error(`Unsupported file type: .${ext}. Use TXT, MD, EPUB, or PDF.`);
      return;
    }
    setFile(f);
    setPhase("idle");
    setCreated(null);
  }

  async function handleUpload() {
    if (!file) return;
    setPhase("uploading");
    setProgress("Uploading & parsing…");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("voiceId", voiceId);
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error);
      }
      const { document } = (await res.json()) as { document: DocumentData };
      setCreated(document);
      bumpRefresh();

      // Generate cover (best-effort, non-blocking)
      setProgress("Generating cover…");
      try {
        await api(`/api/documents/${document.id}/cover`, { method: "POST" });
        bumpRefresh();
      } catch (e) {
        console.error("cover failed:", e);
      }

      setPhase("done");
      toast.success("Document uploaded!", {
        description: `${document.chunks.length} chunks ready to narrate.`,
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  function handleReset() {
    setFile(null);
    setCreated(null);
    setPhase("idle");
    setProgress("");
  }

  return (
    <div className="mx-auto max-w-2xl w-full px-4 sm:px-6 py-6">
      <button
        onClick={backToLibrary}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Upload a document</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inkvine parses EPUB, PDF, and TXT files, splits the text into
          TTS-friendly chunks, and narrates each in your selected voice.
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : file
            ? "border-primary/40 bg-primary/5"
            : "border-border bg-card/40 hover:border-primary/30"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.md,.epub,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileTypeIcon fileType={file.name.split(".").pop() || ""} />
            <div className="text-left">
              <p className="text-sm font-medium truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB · click to replace
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Drop a file here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">EPUB · PDF · TXT · MD</p>
          </div>
        )}
      </div>

      {/* Voice selector */}
      <div className="mt-5">
        <label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
          <Mic2 className="h-4 w-4 text-primary" />
          Narration voice
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(voices ?? []).map((v) => {
            const cfg = voiceConfig(v.voiceId);
            return (
              <button
                key={v.id}
                onClick={() => setVoiceId(v.voiceId)}
                className={cn(
                  "flex items-center gap-2 rounded-xl p-2.5 text-left ring-1 transition",
                  voiceId === v.voiceId
                    ? "bg-primary/10 ring-primary/40"
                    : "bg-card ring-border/60 hover:ring-primary/30"
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cfg.color }}
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{v.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{v.gender}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || phase === "uploading"}
        className={cn(
          "mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg transition",
          file && phase !== "uploading"
            ? "bg-primary text-primary-foreground shadow-primary/20 hover:brightness-110"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {phase === "uploading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {progress}
          </>
        ) : phase === "done" ? (
          <>
            <Sparkles className="h-4 w-4" />
            Ready — Open in Reader
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Parse & Create
          </>
        )}
      </button>

      {/* Success panel */}
      <AnimatePresence>
        {phase === "done" && created && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-5 rounded-xl bg-card ring-1 ring-border/60 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium">{created.title}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {created.charCount.toLocaleString()} characters · {created.chunks.length} chunks
              parsed. Generate audio in the reader, or start listening now.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => openReader(created.id)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:brightness-110 transition"
              >
                <Book className="h-4 w-4" />
                Open Reader
              </button>
              <button
                onClick={handleReset}
                className="rounded-lg bg-muted text-muted-foreground px-4 py-2 text-sm hover:text-foreground transition"
              >
                Upload another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
