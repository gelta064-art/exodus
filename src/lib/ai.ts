import ZAI from "z-ai-web-dev-sdk";
import type { StoryBreakdown } from "./types";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

/** Retry an async fn on rate-limit (429) / transient errors with backoff. */
async function withRetry<T>(fn: () => Promise<T>, retries = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      const is429 = msg.includes("429") || msg.toLowerCase().includes("too many requests");
      if (!is429 || attempt === retries) throw err;
      // exponential backoff: 2s, 4s, 8s, 16s
      const wait = Math.min(2000 * 2 ** attempt, 20000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/** Visual style suffix appended to every scene prompt for cinematic consistency. */
export const CINEMATIC_STYLE =
  ", cinematic film still, dramatic atmospheric lighting, rich color grading, highly detailed, depth of field, epic movie scene, 35mm photography, masterpiece";

const BREAKDOWN_SYSTEM = `You are "CineTales Director", an expert cinematic storyteller. You transform written stories into episodic cinematic series.

You will receive a story. Break it into 3 to 4 chapters that flow as a series. For EACH chapter you must produce:
- "title": a short evocative chapter title (e.g. "Chapter 1: The Awakening"). Keep it under 60 chars.
- "narration": a vivid second-person or third-person narration of this chapter's events, written to be spoken aloud. It MUST be between 350 and 900 characters. Make it engaging, sensory, and dramatic — like an audiobook narrator.
- "scenes": an array of 2 to 3 cinematic scenes. Each scene has:
    - "prompt": a single descriptive sentence for an AI image generator describing the visual of this moment (subject, setting, mood, action, lighting). Do NOT include text/letters in the image. Do NOT mention "cinematic" — that is added automatically. Focus on concrete visual content.
    - "caption": a very short on-screen caption (under 50 chars) summarizing the moment.

Also produce for the whole series:
- "title": a compelling series title (under 60 chars).
- "description": a one-sentence logline (under 160 chars).
- "coverPrompt": a single descriptive sentence for a striking cinematic poster/cover image that captures the essence of the whole series. No text in image.

Respond with ONLY a JSON object, no markdown, no explanation. The JSON must match this exact shape:
{"title": string, "description": string, "coverPrompt": string, "chapters": [{"title": string, "narration": string, "scenes": [{"prompt": string, "caption": string}]}]}`;

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  // Find first { and last }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

/** Break a story into a structured cinematic series using the LLM. */
export async function breakdownStory(
  sourceText: string,
  hintTitle?: string
): Promise<StoryBreakdown> {
  const zai = await getZai();

  const userContent = hintTitle
    ? `Suggested title (use as inspiration): ${hintTitle}\n\nStory:\n${sourceText}`
    : `Story:\n${sourceText}`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: BREAKDOWN_SYSTEM },
      { role: "user", content: userContent },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  let parsed: StoryBreakdown;
  try {
    parsed = extractJson(raw) as StoryBreakdown;
  } catch {
    // Retry once with a firmer instruction
    const retry = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: BREAKDOWN_SYSTEM },
        { role: "user", content: userContent },
        {
          role: "assistant",
          content: raw,
        },
        {
          role: "user",
          content:
            "Your previous response was not valid JSON. Respond with ONLY the JSON object now, no other text.",
        },
      ],
      thinking: { type: "disabled" },
    });
    parsed = extractJson(retry.choices[0]?.message?.content ?? "") as StoryBreakdown;
  }

  // Validate / clamp
  if (!parsed.chapters || !Array.isArray(parsed.chapters) || parsed.chapters.length === 0) {
    throw new Error("LLM did not return any chapters");
  }
  for (const ch of parsed.chapters) {
    if (!ch.scenes || !Array.isArray(ch.scenes)) ch.scenes = [];
    // Clamp narration length to stay within TTS 1024 char limit
    if (ch.narration && ch.narration.length > 950) {
      ch.narration = ch.narration.slice(0, 947).trim() + "…";
    }
  }
  return parsed;
}

/** Generate a single image. Returns a Buffer of the PNG. */
export async function generateImageBuffer(prompt: string, size: string): Promise<Buffer> {
  return withRetry(async () => {
    const zai = await getZai();
    const response = await zai.images.generations.create({
      prompt,
      size: size as "1024x1024",
    });
    const base64 = response.data?.[0]?.base64;
    if (!base64) throw new Error("Image generation returned no data");
    return Buffer.from(base64, "base64");
  });
}

/** Generate narration audio (WAV) for a text chunk. Returns a Buffer. */
export async function generateTtsBuffer(
  text: string,
  voice: string = "xiaochen"
): Promise<Buffer> {
  return withRetry(async () => {
    const zai = await getZai();
    const safe = text.slice(0, 1020);
    const response = await zai.audio.tts.create({
      input: safe,
      voice,
      speed: 1.0,
      response_format: "wav",
      stream: false,
    });
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(new Uint8Array(arrayBuffer));
  });
}
