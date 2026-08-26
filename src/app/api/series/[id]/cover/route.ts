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
  const series = await db.series.findUnique({ where: { id } });
  if (!series)
    return NextResponse.json({ error: "Series not found" }, { status: 404 });

  try {
    await db.series.update({ where: { id }, data: { coverStatus: "pending" } });
    const buffer = await generateImageBuffer(series.coverPrompt + DRAMA_STYLE);
    const url = saveMediaBuffer(buffer, "covers", "png");
    if (series.coverUrl) deleteMediaFile(series.coverUrl);
    await db.series.update({
      where: { id },
      data: { coverUrl: url, coverStatus: "ready" },
    });
    return NextResponse.json({ coverUrl: url });
  } catch (err) {
    await db.series.update({ where: { id }, data: { coverStatus: "error" } });
    console.error("[cover] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cover failed" },
      { status: 500 }
    );
  }
}
