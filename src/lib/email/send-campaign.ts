import "server-only";
import { eq, and, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignRecipients } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { getResendClient } from "./resend";
import { buildCampaignEmail } from "./campaign";
import { getSuppressedEmailSet } from "./suppression";
import { buildCampaignRecipientMessageId } from "./reply-threading";

const BATCH_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

// Guards against the scheduler tick and a manual "Send"/"Retry" click racing on the
// same campaign — the app runs as a single process, so an in-memory lock is enough.
const sendingLocks = new Set<string>();

export async function sendCampaign(
  campaignId: string,
  opts?: { limit?: number }
): Promise<{ sent: number; failed: number; skipped: number }> {
  if (sendingLocks.has(campaignId)) return { sent: 0, failed: 0, skipped: 0 };
  sendingLocks.add(campaignId);
  try {
    return await sendCampaignUnlocked(campaignId, opts);
  } finally {
    sendingLocks.delete(campaignId);
  }
}

async function sendCampaignUnlocked(
  campaignId: string,
  opts?: { limit?: number }
): Promise<{ sent: number; failed: number; skipped: number }> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!campaign) throw new Error("Campaign not found.");
  if (!campaign.fromEmail) throw new Error("Set a From email for this campaign before sending.");

  const allPending = await db
    .select()
    .from(campaignRecipients)
    .where(and(eq(campaignRecipients.campaignId, campaignId), eq(campaignRecipients.status, "PENDING")))
    .orderBy(campaignRecipients.createdAt);

  if (allPending.length === 0) return { sent: 0, failed: 0, skipped: 0 };

  const pending = opts?.limit !== undefined ? allPending.slice(0, Math.max(0, opts.limit)) : allPending;
  if (pending.length === 0) return { sent: 0, failed: 0, skipped: 0 };

  await db.update(campaigns).set({ status: "SENDING", updatedAt: new Date() }).where(eq(campaigns.id, campaignId));

  const suppressed = await getSuppressedEmailSet();

  const toSend = pending.filter((r) => !suppressed.has(r.email.toLowerCase()));
  const toSkip = pending.filter((r) => suppressed.has(r.email.toLowerCase()));

  if (toSkip.length > 0) {
    await db
      .update(campaignRecipients)
      .set({ status: "SKIPPED", error: "Unsubscribed" })
      .where(inArray(campaignRecipients.id, toSkip.map((r) => r.id)));
  }

  const from = campaign.fromName ? `${campaign.fromName} <${campaign.fromEmail}>` : campaign.fromEmail;
  const settings = await getSettings();
  const replyTo = settings.campaignReplyTo || undefined;
  const resend = getResendClient();

  let sent = 0;
  let failed = 0;

  for (const batch of chunk(toSend, BATCH_SIZE)) {
    const payload = batch.map((r) => {
      const email = buildCampaignEmail(
        campaign.subject,
        campaign.body,
        { first_name: r.firstName, last_name: r.lastName, email: r.email },
        campaign.design,
        { campaignId: campaign.id, recipientId: r.id }
      );
      return {
        from,
        to: r.email,
        replyTo,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: { "Message-ID": buildCampaignRecipientMessageId(r.id) },
      };
    });

    try {
      const { data, error } = await resend.batch.send(payload);
      if (error) throw new Error(error.message);

      const results = data?.data ?? [];
      for (let i = 0; i < batch.length; i++) {
        const messageId = results[i]?.id;
        await db
          .update(campaignRecipients)
          .set({ status: "SENT", sentAt: new Date(), resendMessageId: messageId ?? null })
          .where(eq(campaignRecipients.id, batch[i].id));
        sent++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Send failed";
      await db
        .update(campaignRecipients)
        .set({ status: "FAILED", error: message })
        .where(inArray(campaignRecipients.id, batch.map((r) => r.id)));
      failed += batch.length;
    }
  }

  const [{ count: pendingRemaining }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaignRecipients)
    .where(and(eq(campaignRecipients.campaignId, campaignId), eq(campaignRecipients.status, "PENDING")));

  const status = pendingRemaining > 0 ? "SENDING" : failed > 0 && sent === 0 ? "FAILED" : "SENT";

  await db
    .update(campaigns)
    .set({
      status,
      sentCount: campaign.sentCount + sent,
      failedCount: campaign.failedCount + failed,
      skippedCount: campaign.skippedCount + toSkip.length,
      sentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(campaigns.id, campaignId));

  return { sent, failed, skipped: toSkip.length };
}
