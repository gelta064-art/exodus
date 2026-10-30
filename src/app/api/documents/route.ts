import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cleanText, chunkText, parseDocumentBuffer } from "@/lib/parser";
import { generateDocMeta } from "@/lib/ai";
import type { DocumentData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(doc: any): DocumentData {
  return {
    id: doc.id,
    title: doc.title,
    author: doc.author ?? null,
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
    shelf: doc.shelf ?? null,
    rating: doc.rating ?? null,
    review: doc.review ?? null,
    reviewAt: doc.reviewAt ? doc.reviewAt.toISOString() : null,
  };
}

export async function GET() {
  const docs = await db.document.findMany({
    include: { chunks: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents: docs.map(serialize) });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const voiceId = (formData.get("voiceId") as string) || "tongtong";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split(".").pop()?.toLowerCase() || "txt";
    if (!["txt", "md", "epub", "pdf"].includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: .${ext}. Use TXT, MD, EPUB, or PDF.` },
        { status: 400 }
      );
    }

    // Parse document from in-memory buffer (no fs — Workers compatible)
    const bytes = Buffer.from(await file.arrayBuffer());
    const rawText = await parseDocumentBuffer(bytes, ext);
    const cleaned = cleanText(rawText);

    if (cleaned.length < 20) {
      return NextResponse.json(
        { error: "Document appears to be empty or could not be parsed." },
        { status: 400 }
      );
    }

    // Generate title + cover prompt via LLM (best-effort)
    let meta = { title: fileName.replace(/\.[^.]+$/, ""), coverPrompt: "" };
    try {
      meta = await generateDocMeta(cleaned, fileName.replace(/\.[^.]+$/, ""));
    } catch (e) {
      console.error("[doc meta] error:", e);
    }

    // Chunk text for TTS
    const chunks = chunkText(cleaned);

    // Persist
    const doc = await db.document.create({
      data: {
        title: meta.title,
        fileName,
        fileType: ext,
        rawText: cleaned.slice(0, 200000),
        charCount: cleaned.length,
        coverPrompt: meta.coverPrompt,
        voiceId,
        chunks: {
          create: chunks.map((c) => ({
            order: c.order,
            text: c.text,
            charCount: c.text.length,
          })),
        },
      },
      include: { chunks: true },
    });

    return NextResponse.json({ document: serialize(doc) });
  } catch (err) {
    console.error("[document/create] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process document" },
      { status: 500 }
    );
  }
}
