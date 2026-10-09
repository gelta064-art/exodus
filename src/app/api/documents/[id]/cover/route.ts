import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCoverBuffer } from "@/lib/ai";
import { saveMediaBuffer, deleteMediaFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc)
    return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (!doc.coverPrompt) {
    return NextResponse.json(
      { error: "No cover prompt available" },
      { status: 400 }
    );
  }

  try {
    const buffer = await generateCoverBuffer(doc.coverPrompt);
    const url = saveMediaBuffer(buffer, "covers", "png");
    if (doc.coverUrl) deleteMediaFile(doc.coverUrl);
    await db.document.update({ where: { id }, data: { coverUrl: url } });
    return NextResponse.json({ coverUrl: url });
  } catch (err) {
    console.error("[cover] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cover failed" },
      { status: 500 }
    );
  }
}
