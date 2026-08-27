import fs from "fs";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "public", "storage");

const DIRS = ["covers", "scenes", "lines"] as const;

export function ensureStorageDirs() {
  for (const dir of DIRS) {
    const p = path.join(STORAGE_ROOT, dir);
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  }
}

/** Save a Buffer to public/storage and return the public URL path. */
export function saveMediaBuffer(
  buffer: Buffer,
  folder: (typeof DIRS)[number],
  ext: string
): string {
  ensureStorageDirs();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const fullPath = path.join(STORAGE_ROOT, folder, filename);
  fs.writeFileSync(fullPath, buffer);
  return `/storage/${folder}/${filename}`;
}

/** Delete a media file given its public URL path (no-op if missing). */
export function deleteMediaFile(urlPath: string | null) {
  if (!urlPath) return;
  try {
    const rel = urlPath.replace(/^\/storage\//, "");
    const fullPath = path.join(STORAGE_ROOT, rel);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  } catch {
    // ignore
  }
}
