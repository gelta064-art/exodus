// Shared types for Dramai — AI mini-drama series

export interface CharacterData {
  id: string;
  seriesId: string;
  name: string;
  role: string;
  voice: string;
  visualDescription: string;
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
  characters: { name: string; role: string; voice: string; visual: string }[];
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

/** Genre presets that steer the LLM director toward proven mini-drama tropes. */
export interface GenrePreset {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
  tropes: string;
}

export const GENRE_PRESETS: GenrePreset[] = [
  {
    id: "ceo-romance",
    label: "CEO Romance",
    emoji: "💰",
    blurb: "Cold billionaire, unlikely love",
    tropes:
      "ruthless CEO, power imbalance, boardroom tension, fake relationship turning real, enemies-to-lovers, glamorous wealth",
  },
  {
    id: "contract-marriage",
    label: "Contract Marriage",
    emoji: "💍",
    blurb: "Fake fiancé, real feelings",
    tropes:
      "contract marriage of convenience, fake engagement, arranged marriage resistance, jealous ex-fiancée, forbidden attraction, family pressure",
  },
  {
    id: "revenge",
    label: "Revenge & Comeback",
    emoji: "⚔️",
    blurb: "Wronged, returns powerful",
    tropes:
      "betrayal and exile, returning disguised and powerful, destroying those who wronged them, cold calculated vengeance, identity reveal",
  },
  {
    id: "rebirth",
    label: "Rebirth",
    emoji: "🔄",
    blurb: "Relive with memories",
    tropes:
      "death and rebirth with memories intact, rewriting fate, avoiding past mistakes, secret knowledge of the future, second chance",
  },
  {
    id: "hidden-identity",
    label: "Hidden Identity",
    emoji: "🎭",
    blurb: "Secret self, slow reveal",
    tropes:
      "hidden true identity, living under a false name, disguise as ordinary person, truth exposed at the worst moment, dual life",
  },
  {
    id: "lost-heir",
    label: "Lost Heir",
    emoji: "👑",
    blurb: "Reclaim stolen birthright",
    tropes:
      "lost heir raised among commoners, discovering true lineage, reclaiming stolen inheritance, family conspiracy, rightful power restored",
  },
  {
    id: "supernatural",
    label: "Supernatural",
    emoji: "🐺",
    blurb: "Wolves, vampires, fate",
    tropes:
      "werewolf or vampire romance, fated mates, supernatural packs and hierarchies, hidden supernatural world, forbidden cross-species love",
  },
  {
    id: "family-feud",
    label: "Family Feud",
    emoji: "🔥",
    blurb: "Blood against blood",
    tropes:
      "warring families, sibling rivalry, inheritance war, mother-in-law sabotage, secret family sins, loyalty vs love",
  },
];
