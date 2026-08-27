// Shared types for Dramai — AI mini-drama series

export interface CharacterData {
  id: string;
  seriesId: string;
  name: string;
  role: string;
  voice: string;
  accentColor: string;
  order: number;
}

export interface LineData {
  id: string;
  sceneId: string;
  order: number;
  characterName: string;
  text: string;
  emotion: string;
  audioUrl: string | null;
  status: string;
}

export interface SceneData {
  id: string;
  episodeId: string;
  order: number;
  prompt: string;
  imageUrl: string | null;
  status: string;
  lines: LineData[];
}

export interface EpisodeData {
  id: string;
  seriesId: string;
  order: number;
  title: string;
  hook: string;
  scenes: SceneData[];
}

export interface SeriesData {
  id: string;
  title: string;
  description: string;
  genre: string;
  sourceText: string;
  coverPrompt: string;
  coverUrl: string | null;
  coverStatus: string;
  createdAt: string;
  updatedAt: string;
  characters: CharacterData[];
  episodes: EpisodeData[];
}

/** Shape produced by the LLM drama-director call. */
export interface DramaBreakdown {
  title: string;
  description: string;
  genre: string;
  coverPrompt: string;
  characters: { name: string; role: string; voice: string }[];
  episodes: {
    title: string;
    hook: string;
    scenes: {
      prompt: string;
      lines: { character: string; text: string; emotion: string }[];
    }[];
  }[];
}

export type AppView = "feed" | "library" | "create" | "series";

export const VOICE_OPTIONS = [
  "tongtong",
  "jam",
  "chuichui",
  "xiaochen",
  "luodo",
  "kazi",
  "douji",
] as const;
