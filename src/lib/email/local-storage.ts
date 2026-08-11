import "server-only";
import path from "node:path";
import fs from "node:fs/promises";

// Attachment bytes live on the VPS's own disk under data/attachments/ (gitignored) —
// a personal-CRM-scale inbox doesn't need object storage, and keeping bytes local
// avoids paying an egress/API dependency just to show an inline image.
export const ATTACHMENTS_ROOT = path.join(process.cwd(), "data", "attachments");

function resolvePath(key: string): string {
  return path.join(ATTACHMENTS_ROOT, key);
}

export async function putObject(key: string, bytes: Buffer): Promise<void> {
  const absolutePath = resolvePath(key);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, bytes);
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await fs.access(resolvePath(key));
    return true;
  } catch {
    return false;
  }
}

export async function getObjectBytes(key: string): Promise<Buffer> {
  return fs.readFile(resolvePath(key));
}

// Used by the retention cleanup job. Missing files are not an error — the
// job is idempotent and may re-run over rows it already purged.
export async function deleteObject(key: string): Promise<void> {
  try {
    await fs.unlink(resolvePath(key));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}
