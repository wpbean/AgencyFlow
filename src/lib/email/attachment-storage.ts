import "server-only";
import sharp from "sharp";
import { deleteObject, getObjectBytes, objectExists, putObject } from "./local-storage";

// Resend caps inbound attachments at 40mb; mirror that here so a malformed
// or hostile download can't fill the disk.
export const MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

// Inline message previews only ever render at a few hundred px tall — there's
// no reason to keep a multi-MB camera photo around for that. Thumbnails are
// generated once on first request and cached next to the original so repeat
// opens (and the "old messages are fast" case) don't re-encode.
const THUMBNAIL_MAX_EDGE = 480;

// Quality for the full-size stored copy — high enough that photos and
// screenshots don't visibly degrade, while still cutting PNG/JPEG size
// substantially. Thumbnails use a lower quality (see getThumbnailBytes)
// since they're only ever shown small.
const STORAGE_WEBP_QUALITY = 82;

function thumbnailKey(storageKey: string): string {
  return `_thumbnails/${storageKey}.webp`;
}

function sanitizeFilename(filename: string | null | undefined, fallback: string): string {
  const base = (filename || fallback).replace(/[/\\]/g, "_").trim();
  return base.slice(-150) || fallback;
}

function withWebpExtension(filename: string | null): string | null {
  if (!filename) return filename;
  const dot = filename.lastIndexOf(".");
  return `${dot === -1 ? filename : filename.slice(0, dot)}.webp`;
}

export function attachmentStoragePath(messageId: string, attachmentId: string, filename: string | null): string {
  const safeName = sanitizeFilename(filename, attachmentId);
  return `${messageId}/${attachmentId}-${safeName}`;
}

// Converts image attachments to WebP before they ever touch disk, so storage
// reflects the compressed size. SVGs are left alone (they can embed scripts
// and shouldn't be re-encoded as a raster), and already-WebP images pass
// through untouched. Non-image attachments (PDFs, docs, etc.) are unaffected.
export async function prepareAttachmentForStorage(
  bytes: Buffer,
  contentType: string,
  filename: string | null
): Promise<{ bytes: Buffer; contentType: string; filename: string | null }> {
  if (!contentType.startsWith("image/") || contentType === "image/svg+xml" || contentType === "image/webp") {
    return { bytes, contentType, filename };
  }

  try {
    const converted = await sharp(bytes).webp({ quality: STORAGE_WEBP_QUALITY }).toBuffer();
    return { bytes: converted, contentType: "image/webp", filename: withWebpExtension(filename) };
  } catch (err) {
    console.error("Failed to convert attachment to WebP, storing original bytes", err);
    return { bytes, contentType, filename };
  }
}

export async function saveAttachmentBytes(storageKey: string, bytes: Buffer): Promise<void> {
  await putObject(storageKey, bytes);
}

export async function getAttachmentBytes(storageKey: string): Promise<Buffer> {
  return getObjectBytes(storageKey);
}

// Deletes the stored original and its cached thumbnail. Used by the 2-month
// retention cleanup job — callers keep the DB row and only clear the bytes.
export async function purgeAttachmentBytes(storageKey: string): Promise<void> {
  await deleteObject(storageKey);
  await deleteObject(thumbnailKey(storageKey));
}

// Returns the bytes of a small, cached webp preview of an image attachment,
// generating it on first request. Not meant for non-image content types —
// callers should only reach for this on attachments whose contentType starts
// with "image/".
export async function getThumbnailBytes(storageKey: string): Promise<Buffer> {
  const thumbKey = thumbnailKey(storageKey);

  if (await objectExists(thumbKey)) {
    return getObjectBytes(thumbKey);
  }

  const original = await getObjectBytes(storageKey);
  const thumbnail = await sharp(original)
    .resize({ width: THUMBNAIL_MAX_EDGE, height: THUMBNAIL_MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 70 })
    .toBuffer();
  await putObject(thumbKey, thumbnail);
  return thumbnail;
}
