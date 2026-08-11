// One-time migration: for attachments whose bytes are still only in the Cloudflare
// R2 bucket (from when attachment storage briefly lived there), pulls them back down
// to local disk under data/attachments/, converting images to WebP along the way so
// they end up in the same compressed format newly-received attachments use. Run this
// once on the VPS after deploying the move-back-to-local-disk change, then verify a
// few messages with images open correctly in the app before removing the R2_* env
// vars and the bucket itself — this script never deletes anything from R2.
import { eq } from "drizzle-orm";
import { db, sqlite } from "./index";
import { messageAttachments } from "./schema";
import { prepareAttachmentForStorage, saveAttachmentBytes } from "../lib/email/attachment-storage";
import { objectExists as existsLocally } from "../lib/email/local-storage";

const R2_ENV_VARS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"] as const;

async function main() {
  if (!R2_ENV_VARS.every((name) => process.env[name])) {
    console.log("R2 env vars are not set — nothing to migrate from R2 (all attachments already live on local disk).");
    sqlite.close();
    return;
  }

  // Imported lazily so a deployment that never configured R2 doesn't need the
  // @aws-sdk packages installed just to boot this script's env check above.
  const { getObjectBytes: getObjectBytesFromR2, objectExists: existsInR2 } = await import("../lib/email/r2");

  const rows = await db.select().from(messageAttachments);
  console.log(`Found ${rows.length} attachment record(s) in the database.`);

  let migrated = 0;
  let alreadyLocal = 0;
  let missingEverywhere = 0;
  let failed = 0;

  for (const row of rows) {
    if (row.purgedAt) continue;

    if (await existsLocally(row.storagePath)) {
      alreadyLocal++;
      continue;
    }

    if (!(await existsInR2(row.storagePath))) {
      console.warn(`  ! ${row.storagePath} — not on local disk and not in R2, skipping`);
      missingEverywhere++;
      continue;
    }

    try {
      const original = await getObjectBytesFromR2(row.storagePath);
      const prepared = await prepareAttachmentForStorage(original, row.contentType, row.filename);
      await saveAttachmentBytes(row.storagePath, prepared.bytes);

      if (prepared.contentType !== row.contentType || prepared.filename !== row.filename || prepared.bytes.byteLength !== row.size) {
        await db
          .update(messageAttachments)
          .set({ contentType: prepared.contentType, filename: prepared.filename, size: prepared.bytes.byteLength })
          .where(eq(messageAttachments.id, row.id));
      }

      migrated++;
      console.log(`  migrated ${row.storagePath} (${(prepared.bytes.byteLength / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed++;
      console.error(`  ! failed to migrate ${row.storagePath}`, err);
    }
  }

  console.log("\nDone.");
  console.log(`  migrated:          ${migrated}`);
  console.log(`  already local:     ${alreadyLocal}`);
  console.log(`  missing everywhere: ${missingEverywhere}`);
  console.log(`  failed:            ${failed}`);
  if (migrated > 0 || alreadyLocal > 0) {
    console.log(
      "\nOpen a few conversations with images in the app to confirm they load, then you can remove the R2_* env vars, delete the bucket, and uninstall @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner."
    );
  }

  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
