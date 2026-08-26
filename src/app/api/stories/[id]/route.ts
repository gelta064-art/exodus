import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteMediaFile } from "@/lib/storage";
import type { StoryData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(story: any): StoryData {
  return {
    id: story.id,
    title: story.title,
    description: story.description,
    sourceText: story.sourceText,
    coverPrompt: story.coverPrompt,
    coverUrl: story.coverUrl,
    coverStatus: story.coverStatus,
    accentColor: story.accentColor,
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    chapters: (story.chapters || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((ch: any) => ({
        id: ch.id,
        storyId: ch.storyId,
        order: ch.order,
        title: ch.title,
        narrationText: ch.narrationText,
        audioUrl: ch.audioUrl,
        audioStatus: ch.audioStatus,
        scenes: (ch.scenes || [])
          .sort((a: any, b: any) => a.order - b.order)
          .map((sc: any) => ({
            id: sc.id,
            chapterId: sc.chapterId,
            order: sc.order,
            prompt: sc.prompt,
            caption: sc.caption,
            imageUrl: sc.imageUrl,
            status: sc.status,
            duration: sc.duration,
          })),
      })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await db.story.findUnique({
    where: { id },
    include: { chapters: { include: { scenes: true } } },
  });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ story: serialize(story) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await db.story.findUnique({
    where: { id },
    include: { chapters: { include: { scenes: true } } },
  });
  if (!story) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clean up media files
  deleteMediaFile(story.coverUrl);
  for (const ch of story.chapters) {
    deleteMediaFile(ch.audioUrl);
    for (const sc of ch.scenes) deleteMediaFile(sc.imageUrl);
  }

  await db.story.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
