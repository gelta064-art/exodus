import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { saveMediaBuffer } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

let _zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
async function getZai() {
  if (!_zai) _zai = await ZAI.create();
  return _zai;
}

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
      const wait = Math.min(2000 * 2 ** attempt, 20000);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

const ART_STYLE =
  ", vertical 9:16 manga panel illustration, dramatic chiaroscuro lighting, ink wash style, high contrast, atmospheric, cinematic, detailed, no text, no letters, no speech bubbles";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const buffer = await withRetry(async () => {
      const zai = await getZai();
      const response = await zai.images.generations.create({
        prompt: prompt + ART_STYLE,
        size: "768x1344",
      });
      const base64 = response.data?.[0]?.base64;
      if (!base64) throw new Error("Image generation returned no data");
      return Buffer.from(base64, "base64");
    });

    const url = await saveMediaBuffer(buffer, "chunks", "png");
    return NextResponse.json({ imageUrl: url });
  } catch (err) {
    console.error("[story/illustrate] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Illustration failed" },
      { status: 500 }
    );
  }
}
