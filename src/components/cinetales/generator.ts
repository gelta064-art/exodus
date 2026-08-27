"use client";

import type { SeriesData } from "@/lib/types";
import { api } from "@/lib/api-client";

export interface MediaTask {
  id: string;
  kind: "cover" | "scene" | "line";
  label: string;
  episodeIndex?: number;
}

export interface GenerateProgress {
  done: number;
  total: number;
  task: MediaTask | null;
  failed: MediaTask[];
  completed: string[];
}

function buildTasks(series: SeriesData): MediaTask[] {
  const tasks: MediaTask[] = [];
  tasks.push({ id: "cover", kind: "cover", label: "Cover poster" });
  series.episodes.forEach((ep, ei) => {
    ep.scenes.forEach((sc) => {
      tasks.push({
        id: `scene-${sc.id}`,
        kind: "scene",
        label: `Ep.${ei + 1} scene`,
        episodeIndex: ei,
      });
      sc.lines.forEach((ln) => {
        tasks.push({
          id: `line-${ln.id}`,
          kind: "line",
          label: `Ep.${ei + 1} line`,
          episodeIndex: ei,
        });
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
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (cursor < items.length) {
        const idx = cursor++;
        await worker(items[idx]);
      }
    }
  );
  await Promise.all(runners);
}

/** Generate all media assets for a series with a concurrency pool + live progress. */
export async function generateAllMedia(
  series: SeriesData,
  onProgress: (p: GenerateProgress) => void
): Promise<void> {
  const tasks = buildTasks(series);
  let done = 0;
  const failed: MediaTask[] = [];
  const completed: string[] = [];

  const worker = async (task: MediaTask) => {
    onProgress({
      done,
      total: tasks.length,
      task,
      failed: [...failed],
      completed: [...completed],
    });
    try {
      if (task.kind === "cover") {
        await api(`/api/series/${series.id}/cover`, { method: "POST" });
      } else if (task.kind === "scene") {
        const scId = task.id.replace("scene-", "");
        await api(`/api/scenes/${scId}/image`, { method: "POST" });
      } else {
        const lnId = task.id.replace("line-", "");
        await api(`/api/lines/${lnId}/audio`, { method: "POST" });
      }
      completed.push(task.id);
    } catch (err) {
      console.error("task failed:", task.id, err);
      failed.push(task);
    } finally {
      done += 1;
      onProgress({
        done,
        total: tasks.length,
        task: null,
        failed: [...failed],
        completed: [...completed],
      });
    }
  };

  await runPool(tasks, CONCURRENCY, worker);
}
