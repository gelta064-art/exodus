import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { LivingBookData } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serialize(book: any): LivingBookData {
  return {
    id: book.id,
    title: book.title,
    author: book.author ?? null,
    coverPrompt: book.coverPrompt,
    coverUrl: book.coverUrl,
    createdAt: book.createdAt.toISOString(),
    pages: (book.pages || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map((p: any) => ({
        id: p.id,
        bookId: p.bookId,
        order: p.order,
        title: p.title,
        text: p.text,
        artPrompt: p.artPrompt,
        artUrl: p.artUrl,
        artStatus: p.artStatus,
        videoUrl: p.videoUrl,
        videoStatus: p.videoStatus,
        ambientAudioUrl: p.ambientAudioUrl,
        audioStatus: p.audioStatus,
      })),
  };
}

export async function GET() {
  const books = await db.livingBook.findMany({
    include: { pages: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ books: books.map(serialize) });
}
