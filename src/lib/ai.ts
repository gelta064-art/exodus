import ZAI from "z-ai-web-dev-sdk";
import type { DramaBreakdown } from "./types";
import { VOICE_OPTIONS } from "./types";

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

/** Retry on 429 / transient errors with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, retries = 4): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      const is429 =
        msg.includes("429") || msg.toLowerCase().includes("too many requests");
      if (!is429 || attempt === retries) throw err;
      const wait = Math.min(2000 * 2 ** attempt, 20000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/** Vertical 9:16 cinematic style appended to every scene prompt. */
export const DRAMA_STYLE =
  ", vertical 9:16 cinematic film still, dramatic lighting, shallow depth of field, rich color grading, highly detailed, emotional close-up or atmospheric wide, movie scene, masterpiece";

const DIRECTOR_SYSTEM = `You are "Dramai Director", a master creator of viral vertical mini-dramas — the short-form serialized dramas popular on apps like ReelShort and DramaBox.

You transform a given story into an addictive, dialogue-driven mini-drama series.

NON-NEGOTIABLE RULES:
- Produce exactly 3 episodes.
- Each episode has 3 scenes. Each scene has 1 to 3 spoken dialogue lines.
- It is DIALOGUE, not narration. Characters speak TO each other. Show, don't tell. No narrator.
- Every dialogue line must be SHORT — under 120 characters — and emotionally charged.
- Each episode must end on a CLIFFHANGER: a dramatic "hook" one-liner (under 90 chars) that makes the viewer desperately want the next episode. Think betrayal revealed, identity exposed, a slap, a kiss interrupted.
- Identify 2 to 4 characters. Give each a distinct role (protagonist, antagonist, love interest, rival...).
- Detect the genre from the story (romance, revenge, rebirth, thriller, fantasy, family feud, contract marriage, hidden identity, comeback...).
- Scene "prompt" must describe a VERTICAL 9:16 frame: who is in frame, setting, mood, camera angle (close-up / over-shoulder / wide), lighting. Concrete and visual. No text/letters in image.

VOICE ASSIGNMENT — assign each character one of these EXACT voice ids, distributing distinct voices:
${VOICE_OPTIONS.map((v) => `- "${v}"`).join("\n")}
Give the protagonist "tongtong" if female-leaning or "jam" if male-leaning. Spread the rest so no two main speakers share a voice.

OUTPUT: ONLY a JSON object (no markdown, no prose) matching EXACTLY:
{"title":string(<=50 chars),"description":string(logline <=110 chars),"genre":string,"coverPrompt":string(vertical poster, no text),"characters":[{"name":string,"role":string,"voice":string}],"episodes":[{"title":string,"hook":string,"scenes":[{"prompt":string,"lines":[{"character":string,"text":string,"emotion":string}]}]}]}

"emotion" is one word: angry, cold, shocked, sad, smug, desperate, tender, mocking, fearful, defiant, amused.`;

function extractJson(text: string): unknown {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

/** Have the LLM turn a story into a structured drama series. */
export async function breakdownDrama(
  sourceText: string,
  hintTitle?: string
): Promise<DramaBreakdown> {
  const zai = await getZai();
  const userContent = hintTitle
    ? `Suggested title (inspiration only): ${hintTitle}\n\nStory:\n${sourceText}`
    : `Story:\n${sourceText}`;

  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: DIRECTOR_SYSTEM },
      { role: "user", content: userContent },
    ],
    thinking: { type: "disabled" },
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  let parsed: DramaBreakdown;
  try {
    parsed = extractJson(raw) as DramaBreakdown;
  } catch {
    const retry = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: DIRECTOR_SYSTEM },
        { role: "user", content: userContent },
        { role: "assistant", content: raw },
        {
          role: "user",
          content:
            "That was not valid JSON. Reply with ONLY the JSON object now.",
        },
      ],
      thinking: { type: "disabled" },
    });
    parsed = extractJson(retry.choices[0]?.message?.content ?? "") as DramaBreakdown;
  }

  if (!parsed.episodes?.length) throw new Error("LLM returned no episodes");
  for (const ep of parsed.episodes) {
    if (!ep.scenes?.length) ep.scenes = [];
    for (const sc of ep.scenes) {
      if (!sc.lines?.length) sc.lines = [];
      for (const ln of sc.lines) {
        if (ln.text.length > 280) ln.text = ln.text.slice(0, 277) + "…";
      }
    }
  }
  return parsed;
}

/** Generate a vertical 9:16 image. Returns a PNG Buffer. */
export async function generateImageBuffer(prompt: string): Promise<Buffer> {
  return withRetry(async () => {
    const zai = await getZai();
    const response = await zai.images.generations.create({
      prompt,
      size: "768x1344",
    });
    const base64 = response.data?.[0]?.base64;
    if (!base64) throw new Error("Image generation returned no data");
    return Buffer.from(base64, "base64");
  });
}

/** Generate a single dialogue line's audio using the character's voice. */
export async function generateLineAudio(
  text: string,
  voice: string
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
