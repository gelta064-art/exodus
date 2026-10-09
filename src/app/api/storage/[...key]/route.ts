import { NextRequest, NextResponse } from "next/server";
import { getMedia } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy route that serves media objects from R2 (or local disk as fallback).
 * Used when R2_PUBLIC_URL is not set — the browser fetches /api/storage/<key>
 * and this route streams the object from R2.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: parts } = await params;
  const key = parts.join("/");
  const result = await getMedia(key);
  if (!result) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(result.buffer, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": result.buffer.length.toString(),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
