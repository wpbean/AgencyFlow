// Retention job: deletes attachment bytes (images and files alike) whose message
// is older than 2 months, to bound disk usage on the VPS. The DB row is kept —
// filename, size, content type — as a record; only the bytes on disk go away. See
// purgedAt on messageAttachments and the "expired" placeholder it drives in the
// inbox UI (src/components/inbox/conversation-thread.tsx).
//
// Meant to run on a schedule via system crontab, not inside the app process —
// see the "attachments:cleanup" npm script and the crontab line documented
// alongside it.
import { and, eq, isNull, lt } from "drizzle-orm";
import { db, sqlite } from "./index";
import { messageAttachments, messages } from "./schema";
import { purgeAttachmentBytes } from "../lib/email/attachment-storage";

const RETENTION_DAYS = 60;

async function main() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({ id: messageAttachments.id, storagePath: messageAttachments.storagePath })
    .from(messageAttachments)
    .innerJoin(messages, eq(messageAttachments.messageId, messages.id))
    .where(and(isNull(messageAttachments.purgedAt), lt(messages.createdAt, cutoff)));

  console.log(`Found ${rows.length} attachment(s) on messages older than ${RETENTION_DAYS} days.`);

  let purged = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await purgeAttachmentBytes(row.storagePath);
      await db.update(messageAttachments).set({ purgedAt: new Date() }).where(eq(messageAttachments.id, row.id));
      purged++;
    } catch (err) {
      failed++;
      console.error(`  ! failed to purge ${row.storagePath}`, err);
    }
  }

  console.log(`\nDone. purged: ${purged}, failed: ${failed}`);
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
