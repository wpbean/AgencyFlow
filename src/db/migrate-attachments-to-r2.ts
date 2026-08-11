// One-time migration: uploads attachment bytes that are still sitting in the
// local data/attachments/ directory (from before attachment storage moved to
// Cloudflare R2) up to the R2 bucket, keyed by the same storagePath already
// recorded in the DB. Run this once on the VPS after setting the R2_* env
// vars, then verify a few messages with images open correctly in the app
// before manually deleting data/attachments/ to reclaim disk space — this
// script never deletes anything itself.
import fs from "node:fs/promises";
import path from "node:path";
import { db, sqlite } from "./index";
import { messageAttachments } from "./schema";
import { saveAttachmentBytes } from "../lib/email/attachment-storage";
import { objectExists } from "../lib/email/r2";

const LOCAL_ATTACHMENTS_ROOT = path.join(process.cwd(), "data", "attachments");

async function main() {
  const rows = await db.select().from(messageAttachments);
  console.log(`Found ${rows.length} attachment record(s) in the database.`);

  let uploaded = 0;
  let alreadyInR2 = 0;
  let missingLocally = 0;
  let failed = 0;

  for (const row of rows) {
    if (await objectExists(row.storagePath)) {
      alreadyInR2++;
      continue;
    }

    const localPath = path.join(LOCAL_ATTACHMENTS_ROOT, row.storagePath);
    let bytes: Buffer;
    try {
      bytes = await fs.readFile(localPath);
    } catch {
      console.warn(`  ! ${row.storagePath} — no local file and not in R2, skipping`);
      missingLocally++;
      continue;
    }

    try {
      await saveAttachmentBytes(row.storagePath, bytes, row.contentType);
      uploaded++;
      console.log(`  uploaded ${row.storagePath} (${(bytes.byteLength / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed++;
      console.error(`  ! failed to upload ${row.storagePath}`, err);
    }
  }

  console.log("\nDone.");
  console.log(`  uploaded:        ${uploaded}`);
  console.log(`  already in R2:   ${alreadyInR2}`);
  console.log(`  missing locally: ${missingLocally}`);
  console.log(`  failed:          ${failed}`);
  if (uploaded > 0 || alreadyInR2 > 0) {
    console.log(
      "\nOpen a few conversations with images in the app to confirm they load, then you can remove data/attachments/ to free up disk space."
    );
  }

  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
