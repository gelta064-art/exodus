import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deleteMediaFile } from "@/lib/storage";
import type { DocumentData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc: any): DocumentData {
  return {
    id: doc.id,
    title: doc.title,
    fileName: doc.fileName,
    fileType: doc.fileType,
    rawText: doc.rawText,
    charCount: doc.charCount,
    coverUrl: doc.coverUrl,
    coverPrompt: doc.coverPrompt,
    voiceId: doc.voiceId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    progress: doc.progress,
    lastChunk: doc.lastChunk,
    chunks: (doc.chunks || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((ch: any) => ({
        id: ch.id,
        documentId: ch.documentId,
        order: ch.order,
        text: ch.text,
        charCount: ch.charCount,
        audioUrl: ch.audioUrl,
        status: ch.status,
        createdAt: ch.createdAt.toISOString(),
      })),
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await db.document.findUnique({
    where: { id },
    include: { chunks: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: serialize(doc) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const data: any = {};
  if (typeof body.voiceId === "string") data.voiceId = body.voiceId;
  if (typeof body.progress === "number") data.progress = body.progress;
  if (typeof body.lastChunk === "number") data.lastChunk = body.lastChunk;

  const doc = await db.document.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = await db.document.findUnique({
    where: { id },
    include: { chunks: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  deleteMediaFile(doc.coverUrl);
  for (const ch of doc.chunks) deleteMediaFile(ch.audioUrl);

  await db.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
