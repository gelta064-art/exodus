// Shared types for CineTales

export type StoryStatus = "pending" | "ready" | "error";

export interface SceneData {
  id: string;
  chapterId: string;
  order: number;
  prompt: string;
  caption: string;
  imageUrl: string | null;
  status: string;
  duration: number;
}

export interface ChapterData {
  id: string;
  storyId: string;
  order: number;
  title: string;
  narrationText: string;
  audioUrl: string | null;
  audioStatus: string;
  scenes: SceneData[];
}

export interface StoryData {
  id: string;
  title: string;
  description: string;
  sourceText: string;
  coverPrompt: string;
  coverUrl: string | null;
  coverStatus: string;
  accentColor: string;
  createdAt: string;
  updatedAt: string;
  chapters: ChapterData[];
}

// Shape returned by the LLM story-breakdown call
export interface StoryBreakdown {
  title: string;
  description: string;
  coverPrompt: string;
  chapters: {
    title: string;
    narration: string;
    scenes: { prompt: string; caption: string }[];
  }[];
}

export type AppView = "library" | "create" | "series" | "player";
