/**
 * Storage facade — re-exports the R2 adapter.
 * Existing API routes import from here (saveMediaBuffer, deleteMediaFile, ensureStorageDirs).
 * When R2 is configured (R2_ACCESS_KEY_ID etc in .env), media uploads to R2.
 * Otherwise it falls back to local disk (public/storage/...).
 */
export {
  saveMediaBuffer,
  deleteMediaFile,
  ensureStorageDirs,
  saveMedia,
  deleteMedia,
  getMedia,
  r2Enabled,
} from "./r2";
