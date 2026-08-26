// Voice → UI color mapping for character name badges.
// Avoids indigo/blue as primary; these are small accent tags.

export interface VoiceConfig {
  label: string;
  color: string; // hex, used for character badge background
  glow: string; // rgba for glow
}

export const VOICES: Record<string, VoiceConfig> = {
  tongtong: { label: "Warm", color: "#f59e0b", glow: "rgba(245,158,11,0.45)" },
  jam: { label: "Refined", color: "#a78bfa", glow: "rgba(167,139,250,0.45)" },
  chuichui: { label: "Lively", color: "#34d399", glow: "rgba(52,211,153,0.45)" },
  xiaochen: { label: "Calm", color: "#2dd4bf", glow: "rgba(45,212,191,0.45)" },
  luodo: { label: "Emotional", color: "#fb7185", glow: "rgba(251,113,133,0.45)" },
  kazi: { label: "Clear", color: "#22d3ee", glow: "rgba(34,211,238,0.45)" },
  douji: { label: "Natural", color: "#fb923c", glow: "rgba(251,146,60,0.45)" },
};

const FALLBACK: VoiceConfig = {
  label: "Voice",
  color: "#f59e0b",
  glow: "rgba(245,158,11,0.45)",
};

export function voiceConfig(voice: string): VoiceConfig {
  return VOICES[voice] ?? FALLBACK;
}

/** Stable color for a character name when voice is unknown. */
const NAME_COLORS = [
  "#f59e0b",
  "#a78bfa",
  "#34d399",
  "#fb7185",
  "#22d3ee",
  "#fb923c",
  "#2dd4bf",
];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return NAME_COLORS[Math.abs(hash) % NAME_COLORS.length];
}
