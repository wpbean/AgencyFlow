import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaignRecipients, campaignEvents, emailSuppressions } from "@/db/schema";
import type { WebhookEventPayload } from "resend";

type CampaignWebhookEvent = Extract<
  WebhookEventPayload,
  { type: "email.delivered" | "email.opened" | "email.clicked" | "email.bounced" | "email.complained" }
>;

export function isCampaignWebhookEvent(event: WebhookEventPayload): event is CampaignWebhookEvent {
  return (
    event.type === "email.delivered" ||
    event.type === "email.opened" ||
    event.type === "email.clicked" ||
    event.type === "email.bounced" ||
    event.type === "email.complained"
  );
}

// Correlates a Resend webhook event back to the campaign recipient it belongs to
// (via the Resend message id stored at send time) and records both the rollup
// timestamps/counts on campaign_recipients and a detail row in campaign_events.
export async function handleCampaignEvent(event: CampaignWebhookEvent): Promise<void> {
  const [recipient] = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.resendMessageId, event.data.email_id))
    .limit(1);

  if (!recipient) return;

  switch (event.type) {
    case "email.delivered": {
      if (!recipient.deliveredAt) {
        await db
          .update(campaignRecipients)
          .set({ deliveredAt: new Date() })
          .where(eq(campaignRecipients.id, recipient.id));
      }
      await db.insert(campaignEvents).values({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        type: "DELIVERED",
      });
      break;
    }
    case "email.opened": {
      await db
        .update(campaignRecipients)
        .set({
          openedAt: recipient.openedAt ?? new Date(),
          openCount: sql`${campaignRecipients.openCount} + 1`,
        })
        .where(eq(campaignRecipients.id, recipient.id));
      await db.insert(campaignEvents).values({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        type: "OPENED",
      });
      break;
    }
    case "email.clicked": {
      await db
        .update(campaignRecipients)
        .set({
          clickedAt: recipient.clickedAt ?? new Date(),
          clickCount: sql`${campaignRecipients.clickCount} + 1`,
        })
        .where(eq(campaignRecipients.id, recipient.id));
      await db.insert(campaignEvents).values({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        type: "CLICKED",
        link: event.data.click.link,
      });
      break;
    }
    case "email.bounced": {
      await db
        .update(campaignRecipients)
        .set({ bouncedAt: new Date() })
        .where(eq(campaignRecipients.id, recipient.id));
      await db.insert(campaignEvents).values({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        type: "BOUNCED",
      });
      // Hard/permanent bounces mean the address can't receive mail — suppress it
      // globally so future campaigns don't keep hitting it and hurting deliverability.
      if (event.data.bounce.type.toLowerCase() === "permanent") {
        await db
          .insert(emailSuppressions)
          .values({ email: recipient.email.toLowerCase(), reason: "bounced", campaignId: recipient.campaignId })
          .onConflictDoNothing();
      }
      break;
    }
    case "email.complained": {
      await db
        .update(campaignRecipients)
        .set({ complainedAt: new Date() })
        .where(eq(campaignRecipients.id, recipient.id));
      await db.insert(campaignEvents).values({
        campaignId: recipient.campaignId,
        recipientId: recipient.id,
        type: "COMPLAINED",
      });
      // A spam complaint must always stop future sends to this address.
      await db
        .insert(emailSuppressions)
        .values({ email: recipient.email.toLowerCase(), reason: "complained", campaignId: recipient.campaignId })
        .onConflictDoNothing();
      break;
    }
  }
}
