"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mic, Plus, Check, Loader2, Waves, User, Sparkles, ArrowLeft } from "lucide-react";
import { useVoices } from "./hooks";
import { useAppStore } from "@/lib/store";
import { voiceConfig, VOICES } from "@/lib/voices";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function VoiceStudioView() {
  const { data: voices, isLoading } = useVoices();
  const bumpRefresh = useAppStore((s) => s.bumpRefresh);
  const back = useAppStore((s) => s.backToLibrary);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newVoiceId, setNewVoiceId] = React.useState("tongtong");
  const [newDesc, setNewDesc] = React.useState("");

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    setCreating(true);
    try {
      await api("/api/voices", {
        method: "POST",
        body: JSON.stringify({
          name: newName,
          voiceId: newVoiceId,
          description: newDesc,
          accentColor: voiceConfig(newVoiceId).color,
          gender: voiceConfig(newVoiceId).gender,
          language: voiceConfig(newVoiceId).language,
        }),
      });
      bumpRefresh();
      toast.success("Voice profile created");
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    } catch (err) {
      toast.error("Failed to create voice profile");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-6">
      <button
        onClick={back}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Library
      </button>

      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 ring-1 ring-primary/20 px-3 py-1 text-xs font-medium text-primary mb-3">
          <Mic className="h-3.5 w-3.5" />
          Voice Studio
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Your voice profiles</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each voice profile maps to a Synthetic Cognition voice model. Switch
          profiles per-document to match the tone — warm narration, refined
          British, emotional storytelling, and more.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voices?.map((v, i) => {
            const cfg = voiceConfig(v.voiceId);
            const selected = selectedId === v.id;
            return (
              <motion.button
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedId(selected ? null : v.id)}
                className={cn(
                  "relative text-left rounded-2xl bg-card ring-1 p-4 transition",
                  selected ? "ring-primary/50 bg-primary/5" : "ring-border/60 hover:ring-primary/30"
                )}
              >
                {v.isCustom && (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[9px] font-bold ring-1 ring-primary/30">
                    <Sparkles className="h-2.5 w-2.5" />
                    CUSTOM
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="grid place-items-center h-10 w-10 rounded-xl shrink-0"
                    style={{ backgroundColor: cfg.color + "22", boxShadow: `0 0 16px ${cfg.glow}` }}
                  >
                    <User className="h-5 w-5" style={{ color: cfg.color }} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{v.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.gender} · {v.language}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {v.description}
                </p>
                {/* Waveform mock */}
                <div className="mt-2.5 flex items-center gap-0.5 h-6">
                  {Array.from({ length: 18 }).map((_, j) => (
                    <span
                      key={j}
                      className="flex-1 rounded-full"
                      style={{
                        height: `${30 + Math.abs(Math.sin(j * 0.7 + i)) * 70}%`,
                        backgroundColor: cfg.color,
                        opacity: selected ? 0.9 : 0.4,
                      }}
                    />
                  ))}
                </div>
              </motion.button>
            );
          })}

          {/* Create new card */}
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-2xl border-2 border-dashed border-border bg-card/40 p-4 flex flex-col items-center justify-center gap-2 min-h-28 hover:border-primary/40 hover:bg-primary/5 transition"
          >
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Plus className="h-5 w-5 text-primary" />
            </span>
            <span className="text-sm font-medium text-muted-foreground">New voice profile</span>
          </button>
        </div>
      )}

      {/* Concept note */}
      <div className="mt-6 rounded-xl bg-card ring-1 ring-border/60 p-4">
        <div className="flex items-start gap-3">
          <span className="grid place-items-center h-8 w-8 rounded-lg bg-primary/15 ring-1 ring-primary/30 shrink-0">
            <Waves className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-medium mb-1">Voice cloning pipeline</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Inkvine voice engine supports custom Synthetic Cognition voice
              clones. In production, the Custom Voice Studio lets users record
              sample phrases or upload clean audio — the embeddings are processed
              via ElevenLabs or a custom inference API, then streamed back as a
              personalized voice model. This demo uses seven high-quality preset
              voices as the baseline voice profiles.
            </p>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowCreate(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card ring-1 ring-border/60 p-5"
          >
            <h3 className="text-lg font-semibold mb-4">New voice profile</h3>

            <label className="text-sm font-medium mb-1.5 block">Profile name</label>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Narrator"
              maxLength={60}
              className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition mb-4"
            />

            <label className="text-sm font-medium mb-1.5 block">Base voice model</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(VOICES).map(([vid, cfg]) => (
                  <button
                    key={vid}
                    onClick={() => setNewVoiceId(vid)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg p-2 ring-1 transition text-left",
                      newVoiceId === vid
                        ? "bg-primary/10 ring-primary/40"
                        : "bg-background ring-border/60 hover:ring-primary/30"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs font-medium truncate">{cfg.label}</span>
                  </button>
                ))}
            </div>

            <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="A description of this voice profile's tone and use case…"
              rows={2}
              maxLength={200}
              className="w-full rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 rounded-lg bg-muted text-muted-foreground py-2.5 text-sm font-medium hover:text-foreground transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Create
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
