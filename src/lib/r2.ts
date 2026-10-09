import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

/**
 * Cloudflare R2 adapter (S3-compatible).
 *
 * If R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY are configured, media is uploaded
 * to R2. Otherwise we fall back to local disk storage (public/storage/...) so
 * the app still works in development.
 */

const STORAGE_ROOT = path.join(process.cwd(), "public", "storage");
const DIRS = ["covers", "chunks", "uploads"] as const;

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // e.g. https://pub-xxxx.r2.dev

const R2_ENDPOINT = R2_ACCOUNT_ID
  ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : "";

/** True when R2 credentials are properly configured (not placeholders). */
export const r2Enabled =
  !!R2_ACCOUNT_ID &&
  !!R2_BUCKET &&
  !!R2_ACCESS_KEY_ID &&
  !!R2_SECRET_ACCESS_KEY &&
  R2_ACCESS_KEY_ID !== "PLACEHOLDER_FILL_ME_IN" &&
  R2_SECRET_ACCESS_KEY !== "PLACEHOLDER_FILL_ME_IN";

let _client: S3Client | null = null;
function client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

function ensureLocalDirs() {
  for (const dir of DIRS) {
    const p = path.join(STORAGE_ROOT, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

/**
 * Save a media buffer. Returns a public URL path.
 * - With R2: uploads to R2, returns /api/storage/<key> (served via our proxy)
 *   OR the R2 public URL if R2_PUBLIC_URL is set.
 * - Without R2: saves locally to public/storage/<folder>/<file>, returns that path.
 */
export async function saveMedia(
  buffer: Buffer,
  folder: string,
  ext: string
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const key = `${folder}/${filename}`;

  if (r2Enabled) {
    const contentType =
      ext === "png" ? "image/png" : ext === "wav" ? "audio/wav" : "application/octet-stream";
    await client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    // If a public URL is configured, return it directly; otherwise route through our proxy
    if (R2_PUBLIC_URL) {
      return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    }
    return `/api/storage/${key}`;
  }

  // Fallback: local disk
  ensureLocalDirs();
  const fullPath = path.join(STORAGE_ROOT, folder, filename);
  fs.writeFileSync(fullPath, buffer);
  return `/storage/${folder}/${filename}`;
}

/** Delete a media file by its public URL path. Works for both R2 and local. */
export async function deleteMedia(urlPath: string | null): Promise<void> {
  if (!urlPath) return;
  try {
    // R2 public URL (https://pub-.../key)
    if (urlPath.startsWith("http")) {
      const u = new URL(urlPath);
      const key = u.pathname.slice(1); // strip leading /
      if (r2Enabled && R2_BUCKET) {
        await client().send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
        );
      }
      return;
    }
    // Our R2 proxy path (/api/storage/<key>)
    if (urlPath.startsWith("/api/storage/")) {
      const key = urlPath.replace("/api/storage/", "");
      if (r2Enabled && R2_BUCKET) {
        await client().send(
          new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
        );
      }
      return;
    }
    // Local path (/storage/<folder>/<file>)
    if (urlPath.startsWith("/storage/")) {
      const rel = urlPath.replace(/^\/storage\//, "");
      const fullPath = path.join(STORAGE_ROOT, rel);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.error("[r2] delete failed:", err);
  }
}

/**
 * Fetch a media object from R2 (for the /api/storage proxy route).
 * Returns { buffer, contentType } or null if not found.
 */
export async function getMedia(
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!r2Enabled) {
    // Serve from local disk
    const fullPath = path.join(STORAGE_ROOT, key);
    if (!fs.existsSync(fullPath)) return null;
    const ext = path.extname(key).slice(1).toLowerCase();
    const contentType =
      ext === "png" ? "image/png" : ext === "wav" ? "audio/wav" : "application/octet-stream";
    return { buffer: fs.readFileSync(fullPath), contentType };
  }

  try {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const resp = await client().send(
      new GetObjectCommand({ Bucket: R2_BUCKET!, Key: key })
    );
    const body = await resp.Body!.transformToByteArray();
    return {
      buffer: Buffer.from(body),
      contentType: resp.ContentType || "application/octet-stream",
    };
  } catch (err) {
    console.error("[r2] get failed:", err);
    return null;
  }
}

/** Backwards-compat with the old sync API used in API routes. */
export function saveMediaBuffer(
  buffer: Buffer,
  folder: (typeof DIRS)[number],
  ext: string
): Promise<string> {
  return saveMedia(buffer, folder, ext);
}

export function deleteMediaFile(urlPath: string | null): Promise<void> {
  return deleteMedia(urlPath);
}

export function ensureStorageDirs() {
  ensureLocalDirs();
}
