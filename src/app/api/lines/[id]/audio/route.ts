import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateLineAudio } from "@/lib/ai";
import { saveMediaBuffer, deleteMediaFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const line = await db.line.findUnique({
    where: { id },
    include: { scene: { include: { episode: { include: { series: { include: { characters: true } } } } } } },
  });
  if (!line)
    return NextResponse.json({ error: "Line not found" }, { status: 404 });

  try {
    await db.line.update({ where: { id }, data: { status: "pending" } });

    // Find the character's assigned voice by name within this series
    const series = line.scene.episode.series;
    const character = series.characters.find(
      (c) => c.name.toLowerCase() === line.characterName.toLowerCase()
    );
    const voice = character?.voice ?? "tongtong";

    const buffer = await generateLineAudio(line.text, voice);
    const url = saveMediaBuffer(buffer, "lines", "wav");
    if (line.audioUrl) deleteMediaFile(line.audioUrl);

    await db.line.update({
      where: { id },
      data: { audioUrl: url, status: "ready" },
    });
    return NextResponse.json({ audioUrl: url });
  } catch (err) {
    await db.line.update({ where: { id }, data: { status: "error" } });
    console.error("[line audio] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Line audio failed" },
      { status: 500 }
    );
  }
}
