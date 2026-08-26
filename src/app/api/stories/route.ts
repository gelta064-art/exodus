import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { breakdownStory } from "@/lib/ai";
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

export async function GET() {
  const stories = await db.story.findMany({
    include: { chapters: { include: { scenes: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ stories: stories.map(serialize) });
}

export async function POST(req: NextRequest) {
  try {
    const { sourceText, title } = await req.json();
    if (
      !sourceText ||
      typeof sourceText !== "string" ||
      sourceText.trim().length < 40
    ) {
      return NextResponse.json(
        { error: "Please provide a story of at least 40 characters." },
        { status: 400 }
      );
    }

    // 1. Ask the LLM to break the story into a cinematic series structure
    const breakdown = await breakdownStory(sourceText, title);

    // 2. Persist the structure (no media yet)
    const story = await db.story.create({
      data: {
        title: breakdown.title.slice(0, 120),
        description: breakdown.description.slice(0, 300),
        sourceText: sourceText.slice(0, 20000),
        coverPrompt: breakdown.coverPrompt,
        chapters: {
          create: breakdown.chapters.map((ch, i) => ({
            order: i,
            title: ch.title.slice(0, 120),
            narrationText: ch.narration,
            scenes: {
              create: ch.scenes.map((sc, j) => ({
                order: j,
                prompt: sc.prompt,
                caption: sc.caption,
                duration: 8000,
              })),
            },
          })),
        },
      },
      include: { chapters: { include: { scenes: true } } },
    });

    return NextResponse.json({ story: serialize(story) });
  } catch (err) {
    console.error("[stories/create] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create story" },
      { status: 500 }
    );
  }
}
