import "server-only";
import path from "node:path";
import fs from "node:fs/promises";

// Attachment bytes are saved to disk rather than the DB — SQLite plus a
// personal-CRM-scale inbox means a plain directory tree is simpler than
// wiring up blob storage, and it stays outside the repo (data/ is gitignored).
export const ATTACHMENTS_ROOT = path.join(process.cwd(), "data", "attachments");

// Resend caps inbound attachments at 40mb; mirror that here so a malformed
// or hostile download can't fill the disk.
export const MAX_ATTACHMENT_BYTES = 40 * 1024 * 1024;

function sanitizeFilename(filename: string | null | undefined, fallback: string): string {
  const base = (filename || fallback).replace(/[/\\]/g, "_").trim();
  return base.slice(-150) || fallback;
}

export function attachmentStoragePath(messageId: string, attachmentId: string, filename: string | null): string {
  const safeName = sanitizeFilename(filename, attachmentId);
  return path.join(messageId, `${attachmentId}-${safeName}`);
}

export async function saveAttachmentBytes(relativeStoragePath: string, bytes: Buffer): Promise<void> {
  const absolutePath = path.join(ATTACHMENTS_ROOT, relativeStoragePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, bytes);
}

export async function readAttachmentBytes(relativeStoragePath: string): Promise<Buffer> {
  const absolutePath = path.join(ATTACHMENTS_ROOT, relativeStoragePath);
  return fs.readFile(absolutePath);
}
