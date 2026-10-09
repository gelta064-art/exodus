import ZAI from "z-ai-web-dev-sdk";

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

/** Generate narration audio (WAV) for a text chunk using the given voice. */
export async function generateTtsBuffer(
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

/** Generate a cover image for a document (vertical poster style). */
export async function generateCoverBuffer(prompt: string): Promise<Buffer> {
  return withRetry(async () => {
    const zai = await getZai();
    const response = await zai.images.generations.create({
      prompt:
        prompt +
        ", vertical book cover, elegant typography-free, atmospheric, literary, high quality",
      size: "768x1344",
    });
    const base64 = response.data?.[0]?.base64;
    if (!base64) throw new Error("Image generation returned no data");
    return Buffer.from(base64, "base64");
  });
}

/** Have the LLM write a cover prompt + title from the document text. */
export async function generateDocMeta(
  rawText: string,
  fallbackTitle: string
): Promise<{ title: string; coverPrompt: string }> {
  const zai = await getZai();
  const sample = rawText.slice(0, 2000);
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: "assistant",
        content:
          'You analyze documents and produce a JSON object with a "title" (under 60 chars) and a "coverPrompt" (a single sentence describing an atmospheric book cover image, no text in image). Respond with ONLY JSON, no markdown.',
      },
      {
        role: "user",
        content: `Document excerpt:\n${sample}\n\nFallback title: ${fallbackTitle}`,
      },
    ],
    thinking: { type: "disabled" },
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  try {
    let t = raw.trim();
    if (t.startsWith("```")) {
      t = t.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
    }
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
    const parsed = JSON.parse(t);
    return {
      title: (parsed.title || fallbackTitle).slice(0, 100),
      coverPrompt: (parsed.coverPrompt || fallbackTitle).slice(0, 300),
    };
  } catch {
    return { title: fallbackTitle.slice(0, 100), coverPrompt: fallbackTitle };
  }
}
