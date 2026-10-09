import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateImageBuffer, DRAMA_STYLE } from "@/lib/ai";
import { saveMediaBuffer, deleteMediaFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Fetch the scene with its lines + the whole series' characters (for visual lookup)
  const scene = await db.scene.findUnique({
    where: { id },
    include: {
      lines: true,
      episode: { include: { series: { include: { characters: true } } } },
    },
  });
  if (!scene)
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  try {
    await db.scene.update({ where: { id }, data: { status: "pending" } });

    // Character consistency: collect the visual descriptions of every character
    // who speaks in this scene, and prepend them to the prompt so the image
    // generator keeps faces/looks consistent across scenes.
    const characters = scene.episode.series.characters;
    const speakingNames = new Set(
      scene.lines.map((l) => l.characterName.toLowerCase())
    );
    const visuals = characters
      .filter((c) => speakingNames.has(c.name.toLowerCase()))
      .map((c) => c.visualDescription)
      .filter(Boolean);

    const visualPrefix = visuals.length
      ? `Characters in frame: ${visuals.join("; ")}. `
      : "";

    const buffer = await generateImageBuffer(
      visualPrefix + scene.prompt + DRAMA_STYLE
    );
    const url = saveMediaBuffer(buffer, "scenes", "png");

    if (scene.imageUrl) deleteMediaFile(scene.imageUrl);

    await db.scene.update({
      where: { id },
      data: { imageUrl: url, status: "ready" },
    });
    return NextResponse.json({ imageUrl: url });
  } catch (err) {
    await db.scene.update({ where: { id }, data: { status: "error" } });
    console.error("[scene] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scene image failed" },
      { status: 500 }
    );
  }
}
