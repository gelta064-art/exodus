// Shared types for Inkvine — Voice-Cloned Audiobook Reader

export interface VoiceProfileData {
  id: string;
  name: string;
  voiceId: string;
  description: string;
  accentColor: string;
  gender: string;
  language: string;
  isCustom: boolean;
  createdAt: string;
}

export interface AudioChunkData {
  id: string;
  documentId: string;
  order: number;
  text: string;
  charCount: number;
  audioUrl: string | null;
  status: string;
  createdAt: string;
}

export interface DocumentData {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  rawText: string;
  charCount: number;
  coverUrl: string | null;
  coverPrompt: string | null;
  voiceId: string;
  createdAt: string;
  updatedAt: string;
  progress: number;
  lastChunk: number;
  chunks: AudioChunkData[];
}

export type AppView = "library" | "reader" | "voices" | "upload";

export const VOICE_OPTIONS = [
  "tongtong",
  "jam",
  "chuichui",
  "xiaochen",
  "luodo",
  "kazi",
  "douji",
] as const;
