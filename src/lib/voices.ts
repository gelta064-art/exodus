// Voice profile presets — each maps to a z-ai TTS voice.
// These act as the "Synthetic Cognition" voice profiles in Inkvine.

export interface VoiceConfig {
  label: string;
  description: string;
  color: string; // hex for UI accent
  glow: string; // rgba
  gender: string;
  language: string;
}

export const VOICES: Record<string, VoiceConfig> = {
  tongtong: {
    label: "TongTong",
    description: "Warm and intimate, like a close friend reading to you",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.45)",
    gender: "female",
    language: "zh-CN / en",
  },
  jam: {
    label: "Jam",
    description: "Refined British gentleman, measured and articulate",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.45)",
    gender: "male",
    language: "en-GB",
  },
  chuichui: {
    label: "ChuiChui",
    description: "Bright and lively, energetic narration",
    color: "#34d399",
    glow: "rgba(52,211,153,0.45)",
    gender: "female",
    language: "zh-CN / en",
  },
  xiaochen: {
    label: "XiaoChen",
    description: "Calm, steady, professional audiobook tone",
    color: "#2dd4bf",
    glow: "rgba(45,212,191,0.45)",
    gender: "male",
    language: "zh-CN / en",
  },
  luodo: {
    label: "LuoDo",
    description: "Deeply emotional, brings stories to life",
    color: "#fb7185",
    glow: "rgba(251,113,133,0.45)",
    gender: "female",
    language: "zh-CN / en",
  },
  kazi: {
    label: "Kazi",
    description: "Crystal clear, neutral broadcaster",
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.45)",
    gender: "neutral",
    language: "en",
  },
  douji: {
    label: "DouJi",
    description: "Natural and conversational, like a podcast host",
    color: "#fb923c",
    glow: "rgba(251,146,60,0.45)",
    gender: "male",
    language: "zh-CN / en",
  },
};

const FALLBACK: VoiceConfig = {
  label: "TongTong",
  description: "Default voice",
  color: "#f59e0b",
  glow: "rgba(245,158,11,0.45)",
  gender: "neutral",
  language: "en",
};

export function voiceConfig(voiceId: string): VoiceConfig {
  return VOICES[voiceId] ?? FALLBACK;
}
