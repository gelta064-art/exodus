import type { SeriesData } from "@/lib/types";

export interface SeriesProgress {
  total: number;
  done: number;
  ready: boolean;
  percent: number;
}

export function seriesProgress(s: SeriesData): SeriesProgress {
  let total = 1; // cover
  let done = s.coverStatus === "ready" ? 1 : 0;
  for (const ep of s.episodes) {
    for (const sc of ep.scenes) {
      total += 1;
      if (sc.status === "ready") done += 1;
      for (const ln of sc.lines) {
        total += 1;
        if (ln.status === "ready") done += 1;
      }
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
    });
  } catch {
    return "";
  }
}

export function totalEpisodes(s: SeriesData): number {
  return s.episodes.length;
}

export function totalLines(s: SeriesData): number {
  let n = 0;
  for (const ep of s.episodes)
    for (const sc of ep.scenes) n += sc.lines.length;
  return n;
}

/** Build a flat playback item list for an episode (scene + line pairs, in order). */
export function episodePlayItems(
  ep: SeriesData["episodes"][number],
  characters: SeriesData["characters"]
) {
  const items: {
    sceneId: string;
    sceneOrder: number;
    imageUrl: string | null;
    lineId: string;
    characterName: string;
    text: string;
    emotion: string;
    audioUrl: string | null;
    voice?: string;
    color: string;
  }[] = [];
  for (const sc of ep.scenes) {
    for (const ln of sc.lines) {
      const ch = characters.find(
        (c) => c.name.toLowerCase() === ln.characterName.toLowerCase()
      );
      items.push({
        sceneId: sc.id,
        sceneOrder: sc.order,
        imageUrl: sc.imageUrl,
        lineId: ln.id,
        characterName: ln.characterName,
        text: ln.text,
        emotion: ln.emotion,
        audioUrl: ln.audioUrl,
        voice: ch?.voice,
        color: ch?.accentColor ?? "#f59e0b",
      });
    }
  }
  return items;
}
