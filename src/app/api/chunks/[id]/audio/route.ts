import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTtsBuffer } from "@/lib/ai";
import { saveMediaBuffer, deleteMediaFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const chunk = await db.audioChunk.findUnique({
    where: { id },
    include: { document: true },
  });
  if (!chunk)
    return NextResponse.json({ error: "Chunk not found" }, { status: 404 });

  try {
    await db.audioChunk.update({ where: { id }, data: { status: "pending" } });
    const voice = chunk.document.voiceId || "tongtong";
    const buffer = await generateTtsBuffer(chunk.text, voice);
    const url = saveMediaBuffer(buffer, "chunks", "wav");
    if (chunk.audioUrl) deleteMediaFile(chunk.audioUrl);
    await db.audioChunk.update({
      where: { id },
      data: { audioUrl: url, status: "ready" },
    });
    return NextResponse.json({ audioUrl: url });
  } catch (err) {
    await db.audioChunk.update({ where: { id }, data: { status: "error" } });
    console.error("[chunk audio] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Audio generation failed" },
      { status: 500 }
    );
  }
}
