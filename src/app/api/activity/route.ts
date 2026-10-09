import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const READERS = [
  { name: "Maya R.", avatar: "📚", color: "#f59e0b" },
  { name: "Theo K.", avatar: "🎧", color: "#a78bfa" },
  { name: "Lena V.", avatar: "📖", color: "#34d399" },
  { name: "Jules P.", avatar: "✨", color: "#fb7185" },
  { name: "Sora M.", avatar: "🌙", color: "#22d3ee" },
  { name: "Ari D.", avatar: "🔥", color: "#fb923c" },
];

const SEED_ACTIVITIES = [
  { type: "finished", readerIdx: 0, docTitle: "The Midnight Library", detail: "rated 5 stars — 'changed how I think about regret'" },
  { type: "started", readerIdx: 1, docTitle: "Atomic Habits", detail: "Chapter 3 of 12" },
  { type: "rated", readerIdx: 2, docTitle: "Project Hail Mary", detail: "4 stars" },
  { type: "shelved", readerIdx: 3, docTitle: "The Song of Achilles", detail: "added to Want to Read" },
  { type: "finished", readerIdx: 4, docTitle: "Klara and the Sun", detail: "rated 5 stars — 'quietly devastating'" },
  { type: "reviewed", readerIdx: 5, docTitle: "Circe", detail: "'A masterclass in voice and perspective'" },
  { type: "started", readerIdx: 0, docTitle: "Piranesi", detail: "Chapter 1 of 9" },
  { type: "shelved", readerIdx: 2, docTitle: "The House in the Cerulean Sea", detail: "added to Currently Reading" },
  { type: "rated", readerIdx: 1, docTitle: "Tomorrow, and Tomorrow, and Tomorrow", detail: "5 stars" },
  { type: "finished", readerIdx: 3, docTitle: "The Seven Husbands of Evelyn Hugo", detail: "rated 4 stars" },
];

export async function GET() {
  // Seed community activity if empty
  let count = await db.activity.count();
  if (count === 0) {
    await db.activity.createMany({
      data: SEED_ACTIVITIES.map((a, i) => {
        const r = READERS[a.readerIdx];
        const created = new Date(Date.now() - i * 1000 * 60 * 37);
        return {
          type: a.type,
          reader: r.name,
          readerAvatar: r.avatar,
          documentTitle: a.docTitle,
          detail: a.detail,
          createdAt: created,
        };
      }),
    });
  }

  const activities = await db.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });
  return NextResponse.json({ activities });
}

export async function POST(req: NextRequest) {
  const { type, documentTitle, detail, reader } = await req.json();
  if (!type || !documentTitle) {
    return NextResponse.json({ error: "type and documentTitle required" }, { status: 400 });
  }
  const activity = await db.activity.create({
    data: {
      type,
      reader: reader || "You",
      readerAvatar: "🌟",
      documentTitle,
      detail: detail || null,
    },
  });
  return NextResponse.json({ activity });
}
