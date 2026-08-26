import type { StoryData } from "@/lib/types";

export interface StoryProgress {
  total: number;
  done: number;
  ready: boolean;
  /** 0..100 */
  percent: number;
}

/** Compute how many media assets are generated for a story. */
export function storyProgress(story: StoryData): StoryProgress {
  let total = 1; // cover
  let done = story.coverStatus === "ready" ? 1 : 0;

  for (const ch of story.chapters) {
    total += 1; // audio
    if (ch.audioStatus === "ready") done += 1;
    for (const sc of ch.scenes) {
      total += 1;
      if (sc.status === "ready") done += 1;
    }
  }

  return {
    total,
    done,
    ready: done === total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/** Total runtime estimate in seconds (audio unknown until loaded, so count scenes). */
export function totalScenes(story: StoryData): number {
  return story.chapters.reduce((acc, ch) => acc + ch.scenes.length, 0);
}
