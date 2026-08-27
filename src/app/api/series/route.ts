import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { breakdownDrama } from "@/lib/ai";
import { colorForName } from "@/lib/voices";
import { GENRE_PRESETS } from "@/lib/types";
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
        visualDescription: c.visualDescription ?? "",
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

export async function GET() {
  const series = await db.series.findMany({
    include: {
      characters: true,
      episodes: { include: { scenes: { include: { lines: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ series: series.map(serialize) });
}

export async function POST(req: NextRequest) {
  try {
    const { sourceText, title, genreId } = await req.json();
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

    // Look up genre preset (if provided) to steer the LLM director
    const genrePreset = genreId
      ? GENRE_PRESETS.find((g) => g.id === genreId) ?? null
      : null;
    const genreHint = genrePreset
      ? { label: genrePreset.label, tropes: genrePreset.tropes }
      : null;

    const breakdown = await breakdownDrama(sourceText, title, genreHint);

    const series = await db.series.create({
      data: {
        title: breakdown.title.slice(0, 100),
        description: breakdown.description.slice(0, 300),
        genre: breakdown.genre.slice(0, 60),
        sourceText: sourceText.slice(0, 20000),
        coverPrompt: breakdown.coverPrompt,
        characters: {
          create: breakdown.characters.map((c, i) => ({
            name: c.name.slice(0, 60),
            role: c.role.slice(0, 60),
            voice: c.voice,
            visualDescription: (c.visual ?? "").slice(0, 300),
            accentColor: colorForName(c.name),
            order: i,
          })),
        },
        episodes: {
          create: breakdown.episodes.map((ep, i) => ({
            order: i,
            title: ep.title.slice(0, 120),
            hook: ep.hook.slice(0, 200),
            scenes: {
              create: ep.scenes.map((sc, j) => ({
                order: j,
                prompt: sc.prompt,
                lines: {
                  create: sc.lines.map((ln, k) => ({
                    order: k,
                    characterName: ln.character.slice(0, 60),
                    text: ln.text,
                    emotion: ln.emotion.slice(0, 40),
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        characters: true,
        episodes: { include: { scenes: { include: { lines: true } } } },
      },
    });

    return NextResponse.json({ series: serialize(series) });
  } catch (err) {
    console.error("[series/create] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create series" },
      { status: 500 }
    );
  }
}
