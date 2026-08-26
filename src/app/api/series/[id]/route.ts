import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteMediaFile } from "@/lib/storage";
import type { SeriesData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(s: any): SeriesData {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    genre: s.genre,
    sourceText: s.sourceText,
    coverPrompt: s.coverPrompt,
    coverUrl: s.coverUrl,
    coverStatus: s.coverStatus,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    characters: (s.characters || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((c: any) => ({
        id: c.id,
        seriesId: c.seriesId,
        name: c.name,
        role: c.role,
        voice: c.voice,
        accentColor: c.accentColor,
        order: c.order,
      })),
    episodes: (s.episodes || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((ep: any) => ({
        id: ep.id,
        seriesId: ep.seriesId,
        order: ep.order,
        title: ep.title,
        hook: ep.hook,
        scenes: (ep.scenes || [])
          .sort((a: any, b: any) => a.order - b.order)
          .map((sc: any) => ({
            id: sc.id,
            episodeId: sc.episodeId,
            order: sc.order,
            prompt: sc.prompt,
            imageUrl: sc.imageUrl,
            status: sc.status,
            lines: (sc.lines || [])
              .sort((a: any, b: any) => a.order - b.order)
              .map((ln: any) => ({
                id: ln.id,
                sceneId: ln.sceneId,
                order: ln.order,
                characterName: ln.characterName,
                text: ln.text,
                emotion: ln.emotion,
                audioUrl: ln.audioUrl,
                status: ln.status,
              })),
          })),
      })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const s = await db.series.findUnique({
    where: { id },
    include: {
      characters: true,
      episodes: { include: { scenes: { include: { lines: true } } } },
    },
  });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ series: serialize(s) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const s = await db.series.findUnique({
    where: { id },
    include: {
      characters: true,
      episodes: { include: { scenes: { include: { lines: true } } } },
    },
  });
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  deleteMediaFile(s.coverUrl);
  for (const ep of s.episodes)
    for (const sc of ep.scenes) {
      deleteMediaFile(sc.imageUrl);
      for (const ln of sc.lines) deleteMediaFile(ln.audioUrl);
    }

  await db.series.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
