import "server-only";
import { db } from "@/db";
import { campaigns, campaignRecipients, emailSuppressions } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function listCampaigns() {
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export type CampaignRow = Awaited<ReturnType<typeof listCampaigns>>[number];

export async function getCampaignById(id: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!campaign) return null;

  // Left-joined against the global suppression list so a recipient shows as
  // unsubscribed even if that happened via a different campaign entirely.
  const recipients = await db
    .select({
      id: campaignRecipients.id,
      campaignId: campaignRecipients.campaignId,
      source: campaignRecipients.source,
      contactId: campaignRecipients.contactId,
      eddCustomerId: campaignRecipients.eddCustomerId,
      email: campaignRecipients.email,
      firstName: campaignRecipients.firstName,
      lastName: campaignRecipients.lastName,
      status: campaignRecipients.status,
      error: campaignRecipients.error,
      resendMessageId: campaignRecipients.resendMessageId,
      sentAt: campaignRecipients.sentAt,
      deliveredAt: campaignRecipients.deliveredAt,
      openedAt: campaignRecipients.openedAt,
      openCount: campaignRecipients.openCount,
      clickedAt: campaignRecipients.clickedAt,
      clickCount: campaignRecipients.clickCount,
      bouncedAt: campaignRecipients.bouncedAt,
      complainedAt: campaignRecipients.complainedAt,
      unsubscribedAt: campaignRecipients.unsubscribedAt,
      createdAt: campaignRecipients.createdAt,
      // SQLite has no boolean type — .mapWith(Boolean) converts the raw 0/1 it
      // returns into a real JS boolean, otherwise `0 && <Badge/>` renders a stray "0".
      isUnsubscribed: sql<boolean>`${emailSuppressions.email} is not null`.mapWith(Boolean),
    })
    .from(campaignRecipients)
    .leftJoin(emailSuppressions, sql`lower(${campaignRecipients.email}) = ${emailSuppressions.email}`)
    .where(eq(campaignRecipients.campaignId, id))
    .orderBy(desc(campaignRecipients.createdAt));

  return { campaign, recipients };
}

export type CampaignRecipientRow = NonNullable<Awaited<ReturnType<typeof getCampaignById>>>["recipients"][number];
