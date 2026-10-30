// Shared types for Inkvine — Voice-Cloned Audiobook Reader

export type Shelf = "want_to_read" | "reading" | "read";

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
  author: string | null;
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
  // Goodreads-style social
  shelf: Shelf | null;
  rating: number | null;
  review: string | null;
  reviewAt: string | null;
}

export interface ActivityData {
  id: string;
  type: string;
  reader: string;
  readerAvatar: string;
  documentTitle: string;
  detail: string | null;
  createdAt: string;
}

// Butterfly Engine — living books with animated pages
export interface LivingPageData {
  id: string;
  bookId: string;
  order: number;
  title: string;
  text: string;
  artPrompt: string;
  artUrl: string | null;
  artStatus: string;
  videoUrl: string | null;
  videoStatus: string;
  ambientAudioUrl: string | null;
  audioStatus: string;
}

export interface LivingBookData {
  id: string;
  title: string;
  author: string | null;
  coverPrompt: string;
  coverUrl: string | null;
  createdAt: string;
  pages: LivingPageData[];
}

export type AppView = "library" | "reader" | "voices" | "community" | "discover" | "upload" | "butterfly";

export const VOICE_OPTIONS = [
  "tongtong",
  "jam",
  "chuichui",
  "xiaochen",
  "luodo",
  "kazi",
  "douji",
] as const;

export const SHELVES: { id: Shelf; label: string; emoji: string }[] = [
  { id: "want_to_read", label: "Want to Read", emoji: "📚" },
  { id: "reading", label: "Currently Reading", emoji: "🎧" },
  { id: "read", label: "Read", emoji: "✅" },
];
