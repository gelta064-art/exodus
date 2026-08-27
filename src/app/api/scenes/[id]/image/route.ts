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
  const scene = await db.scene.findUnique({ where: { id } });
  if (!scene)
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });

  try {
    await db.scene.update({ where: { id }, data: { status: "pending" } });
    const buffer = await generateImageBuffer(scene.prompt + DRAMA_STYLE);
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
