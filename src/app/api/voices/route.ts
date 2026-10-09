import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { VOICES } from "@/lib/voices";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PROFILES = Object.entries(VOICES).map(([voiceId, cfg]) => ({
  name: cfg.label,
  voiceId,
  description: cfg.description,
  accentColor: cfg.color,
  gender: cfg.gender,
  language: cfg.language,
  isCustom: false,
}));

export async function GET() {
  // Seed default voice profiles if none exist yet
  let profiles = await db.voiceProfile.findMany({ orderBy: { createdAt: "asc" } });
  if (profiles.length === 0) {
    await db.voiceProfile.createMany({ data: DEFAULT_PROFILES });
    profiles = await db.voiceProfile.findMany({ orderBy: { createdAt: "asc" } });
  }
  return NextResponse.json({ voices: profiles });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, voiceId, accentColor, gender, language } = body;
  if (!name || !voiceId) {
    return NextResponse.json(
      { error: "Name and voiceId are required" },
      { status: 400 }
    );
  }
  const profile = await db.voiceProfile.create({
    data: {
      name: name.slice(0, 60),
      voiceId,
      description: (description || "").slice(0, 200),
      accentColor: accentColor || "#f59e0b",
      gender: gender || "neutral",
      language: language || "en",
      isCustom: true,
    },
  });
  return NextResponse.json({ voice: profile });
}
