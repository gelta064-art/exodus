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
  const chapter = await db.chapter.findUnique({ where: { id } });
  if (!chapter)
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });

  try {
    await db.chapter.update({
      where: { id },
      data: { audioStatus: "pending" },
    });
    const buffer = await generateTtsBuffer(chapter.narrationText, "xiaochen");
    const url = saveMediaBuffer(buffer, "audio", "wav");

    if (chapter.audioUrl) deleteMediaFile(chapter.audioUrl);

    await db.chapter.update({
      where: { id },
      data: { audioUrl: url, audioStatus: "ready" },
    });
    return NextResponse.json({ audioUrl: url });
  } catch (err) {
    await db.chapter.update({
      where: { id },
      data: { audioStatus: "error" },
    });
    console.error("[audio] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Audio generation failed" },
      { status: 500 }
    );
  }
}
