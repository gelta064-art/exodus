"use client";

import type { DocumentData } from "@/lib/types";
import { api } from "@/lib/api-client";

export interface GenerateProgress {
  done: number;
  total: number;
  completed: string[];
  failed: number;
}

/** Generate audio for all pending chunks of a document, with live progress. */
export async function generateDocumentAudio(
  doc: DocumentData,
  onProgress: (p: GenerateProgress) => void
): Promise<void> {
  const pending = doc.chunks.filter((c) => c.status !== "ready");
  const total = pending.length;
  let done = 0;
  let failed = 0;
  const completed: string[] = [];

  const CONCURRENCY = 2;
  let cursor = 0;
  const runners = Array.from(
    { length: Math.min(CONCURRENCY, total) },
    async () => {
      while (cursor < total) {
        const chunk = pending[cursor++];
        try {
          await api(`/api/chunks/${chunk.id}/audio`, { method: "POST" });
          completed.push(chunk.id);
        } catch (err) {
          console.error("chunk failed:", chunk.id, err);
          failed++;
        } finally {
          done++;
          onProgress({ done, total, completed: [...completed], failed });
        }
      }
    }
  );
  await Promise.all(runners);
}
