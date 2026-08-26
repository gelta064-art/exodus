"use client";

import type { StoryData } from "@/lib/types";
import { api } from "@/lib/api-client";

export interface MediaTask {
  id: string;
  kind: "cover" | "audio" | "scene";
  label: string;
  chapterIndex?: number;
}

export interface GenerateProgress {
  done: number;
  total: number;
  task: MediaTask | null;
  failed: MediaTask[];
  /** task ids that have completed successfully */
  completed: string[];
}

function buildTasks(story: StoryData): MediaTask[] {
  const tasks: MediaTask[] = [];
  tasks.push({ id: "cover", kind: "cover", label: "Series cover" });
  story.chapters.forEach((ch, ci) => {
    tasks.push({
      id: `audio-${ch.id}`,
      kind: "audio",
      label: `Chapter ${ci + 1} narration`,
      chapterIndex: ci,
    });
    ch.scenes.forEach((sc) => {
      tasks.push({
        id: `scene-${sc.id}`,
        kind: "scene",
        label: `Chapter ${ci + 1} · scene`,
        chapterIndex: ci,
      });
    });
  });
  return tasks;
}

const CONCURRENCY = 2;

async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

/**
 * Generate all media assets for a story with a concurrency pool.
 * Calls onProgress after each task finishes (success or failure).
 */
export async function generateAllMedia(
  story: StoryData,
  onProgress: (p: GenerateProgress) => void
): Promise<void> {
  const tasks = buildTasks(story);
  let done = 0;
  const failed: MediaTask[] = [];
  const completed: string[] = [];

  const worker = async (task: MediaTask) => {
    onProgress({ done, total: tasks.length, task, failed: [...failed], completed: [...completed] });
    try {
      if (task.kind === "cover") {
        await api(`/api/stories/${story.id}/cover`, { method: "POST" });
      } else if (task.kind === "audio") {
        const chId = task.id.replace("audio-", "");
        await api(`/api/chapters/${chId}/audio`, { method: "POST" });
      } else {
        const scId = task.id.replace("scene-", "");
        await api(`/api/scenes/${scId}/image`, { method: "POST" });
      }
      completed.push(task.id);
    } catch (err) {
      console.error("task failed:", task.id, err);
      failed.push(task);
    } finally {
      done += 1;
      onProgress({ done, total: tasks.length, task: null, failed: [...failed], completed: [...completed] });
    }
  };

  await runPool(tasks, CONCURRENCY, worker);
}
