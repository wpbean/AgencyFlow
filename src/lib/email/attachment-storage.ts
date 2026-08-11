import "server-only";
import sharp from "sharp";
import { getObjectBytes, getSignedGetUrl, objectExists, putObject } from "./r2";

// Attachment bytes live in Cloudflare R2, not on the VPS disk or in SQLite —
// R2's free tier (10GB, zero egress fees) covers a personal-CRM-scale inbox,
// and serving via signed URLs lets the browser pull bytes straight from
// Cloudflare's edge instead of round-tripping through our own server.
//
// Resend caps inbound attachments at 40mb; mirror that here so a malformed
// or hostile download can't run up storage.
export const MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

// Signed URLs are handed straight to the browser for an immediate redirect,
// so they only need to live long enough for that one request.
const SIGNED_URL_TTL_SECONDS = 300;

// Inline message previews only ever render at a few hundred px tall — there's
// no reason to ship a multi-MB camera photo over the wire for that. Thumbnails
// are generated once on first request and cached next to the original so
// repeat opens (and the "old messages are fast" case) don't re-encode.
const THUMBNAIL_MAX_EDGE = 480;

function thumbnailKey(storageKey: string): string {
  return `_thumbnails/${storageKey}.webp`;
}

function sanitizeFilename(filename: string | null | undefined, fallback: string): string {
  const base = (filename || fallback).replace(/[/\\]/g, "_").trim();
  return base.slice(-150) || fallback;
}

export function attachmentStoragePath(messageId: string, attachmentId: string, filename: string | null): string {
  const safeName = sanitizeFilename(filename, attachmentId);
  return `${messageId}/${attachmentId}-${safeName}`;
}

export async function saveAttachmentBytes(storageKey: string, bytes: Buffer, contentType: string): Promise<void> {
  await putObject(storageKey, bytes, contentType);
}

export async function getAttachmentDownloadUrl(
  storageKey: string,
  contentType: string,
  disposition: "inline" | "attachment",
  filename: string
): Promise<string> {
  return getSignedGetUrl(storageKey, SIGNED_URL_TTL_SECONDS, {
    responseContentType: contentType,
    responseContentDisposition: `${disposition}; filename="${filename.replace(/"/g, "")}"`,
  });
}

// Returns the bytes of a small, cached webp preview of an image attachment,
// generating it on first request. Not meant for non-image content types —
// callers should only reach for this on attachments whose contentType starts
// with "image/".
//
// Unlike the full original (served via a redirect to a signed URL, see
// getAttachmentDownloadUrl), thumbnails are proxied through our own route so
// they can carry a stable, long-lived Cache-Control header — a signed URL's
// query string changes on every request, which would defeat the browser
// cache for the exact case (reopening a thread) that most needs it.
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
  await putObject(thumbKey, thumbnail, "image/webp");
  return thumbnail;
}
