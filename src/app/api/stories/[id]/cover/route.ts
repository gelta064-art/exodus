import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateImageBuffer, CINEMATIC_STYLE } from "@/lib/ai";
import { saveMediaBuffer, deleteMediaFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await db.story.findUnique({ where: { id } });
  if (!story) return NextResponse.json({ error: "Story not found" }, { status: 404 });

  try {
    await db.story.update({ where: { id }, data: { coverStatus: "pending" } });
    const buffer = await generateImageBuffer(
      story.coverPrompt + CINEMATIC_STYLE,
      "1344x768"
    );
    const url = saveMediaBuffer(buffer, "covers", "png");

    // Remove old cover if replacing
    if (story.coverUrl) deleteMediaFile(story.coverUrl);

    await db.story.update({
      where: { id },
      data: { coverUrl: url, coverStatus: "ready" },
    });
    return NextResponse.json({ coverUrl: url });
  } catch (err) {
    await db.story.update({ where: { id }, data: { coverStatus: "error" } });
    console.error("[cover] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cover generation failed" },
      { status: 500 }
    );
  }
}
