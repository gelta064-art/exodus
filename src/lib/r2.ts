import fs from "fs";
import path from "path";

/**
 * Media storage with three runtime tiers:
 *
 * 1. Cloudflare Workers — native R2 binding (`MEDIA`) via @opennextjs/cloudflare.
 *    Media is stored in R2 and served through /api/storage/[...key] proxy.
 * 2. Node with S3 credentials (R2_ACCESS_KEY_ID etc.) — S3-compatible API.
 * 3. Local dev — public/storage/ on disk.
 */

const STORAGE_ROOT = path.join(process.cwd(), "public", "storage");
const DIRS = ["covers", "chunks", "uploads"] as const;

/* ---------- Native R2 binding (Cloudflare Workers) ---------- */

type R2Like = {
  put: (key: string, value: Uint8Array | ArrayBuffer, opts?: any) => Promise<unknown>;
  get: (key: string) => Promise<{ arrayBuffer: () => Promise<ArrayBuffer> } | null>;
  delete: (key: string) => Promise<void>;
};

async function getNativeR2(): Promise<R2Like | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    if (env?.MEDIA) return env.MEDIA as R2Like;
    return null;
  } catch {
    return null;
  }
}

/* ---------- S3-compatible R2 (Node with credentials) ---------- */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const s3Enabled =
  !!R2_ACCOUNT_ID &&
  !!R2_BUCKET &&
  !!R2_ACCESS_KEY_ID &&
  !!R2_SECRET_ACCESS_KEY &&
  R2_ACCESS_KEY_ID !== "PLACEHOLDER_FILL_ME_IN" &&
  R2_SECRET_ACCESS_KEY !== "PLACEHOLDER_FILL_ME_IN";

let _s3: any = null;
function s3Client(): any {
  if (!_s3) {
    // Lazy require keeps the heavy SDK out of the Workers bundle
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client } = require("@aws-sdk/client-s3");
    _s3 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return _s3;
}

/* ---------- helpers ---------- */

function contentTypeFor(ext: string): string {
  const e = ext.toLowerCase();
  if (e === "png") return "image/png";
  if (e === "jpg" || e === "jpeg") return "image/jpeg";
  if (e === "wav") return "audio/wav";
  if (e === "mp4" || e === "webm") return e === "mp4" ? "video/mp4" : "video/webm";
  return "application/octet-stream";
}

function ensureLocalDirs() {
  for (const dir of DIRS) {
    const p = path.join(STORAGE_ROOT, dir);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

/**
 * Save a media buffer.
 * Returns the public URL path used by the app:
 *  - R2 (native or S3): /api/storage/<key> (or public URL if R2_PUBLIC_URL set)
 *  - Local: /storage/<folder>/<file>
 */
export async function saveMedia(
  buffer: Buffer,
  folder: string,
  ext: string
): Promise<string> {
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const key = `${folder}/${filename}`;

  // Tier 1: native R2 binding (Cloudflare)
  const native = await getNativeR2();
  if (native) {
    await native.put(key, new Uint8Array(buffer), { httpMetadata: { contentType: contentTypeFor(ext) } });
    return `/api/storage/${key}`;
  }

  // Tier 2: S3-compatible API with credentials (Node)
  if (s3Enabled) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await s3Client().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET!,
        Key: key,
        Body: buffer,
        ContentType: contentTypeFor(ext),
      })
    );
    if (R2_PUBLIC_URL) return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
    return `/api/storage/${key}`;
  }

  // Tier 3: local disk (dev)
  ensureLocalDirs();
  const fullPath = path.join(STORAGE_ROOT, folder, filename);
  fs.writeFileSync(fullPath, buffer);
  return `/storage/${folder}/${filename}`;
}

/** Delete a media file by its public URL path. Works across all tiers. */
export async function deleteMedia(urlPath: string | null): Promise<void> {
  if (!urlPath) return;
  try {
    // Extract the object key from any URL shape
    let key: string | null = null;
    if (urlPath.startsWith("http")) {
      key = new URL(urlPath).pathname.slice(1);
    } else if (urlPath.startsWith("/api/storage/")) {
      key = urlPath.replace("/api/storage/", "");
    } else if (urlPath.startsWith("/storage/")) {
      // Local path
      const rel = urlPath.replace(/^\/storage\//, "");
      const fullPath = path.join(STORAGE_ROOT, rel);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      return;
    }
    if (!key) return;

    const native = await getNativeR2();
    if (native) {
      await native.delete(key);
      return;
    }
    if (s3Enabled) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      await s3Client().send(new DeleteObjectCommand({ Bucket: R2_BUCKET!, Key: key }));
    }
  } catch (err) {
    console.error("[storage] delete failed:", err);
  }
}

/**
 * Fetch a media object (for the /api/storage proxy route).
 */
export async function getMedia(
  key: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const contentType = contentTypeFor(ext);

  // Tier 1: native binding
  const native = await getNativeR2();
  if (native) {
    const obj = await native.get(key);
    if (!obj) return null;
    const ab = await obj.arrayBuffer();
    return { buffer: Buffer.from(ab), contentType };
  }

  // Tier 2: S3 API
  if (s3Enabled) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { GetObjectCommand } = require("@aws-sdk/client-s3");
      const resp = await s3Client().send(new GetObjectCommand({ Bucket: R2_BUCKET!, Key: key }));
      const body = await resp.Body.transformToByteArray();
      return { buffer: Buffer.from(body), contentType: resp.ContentType || contentType };
    } catch {
      return null;
    }
  }

  // Tier 3: local disk
  const fullPath = path.join(STORAGE_ROOT, key);
  if (!fs.existsSync(fullPath)) return null;
  return { buffer: fs.readFileSync(fullPath), contentType };
}

/* ---------- Backwards-compatible API used by routes ---------- */

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
