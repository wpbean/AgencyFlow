import "server-only";
import { db } from "@/db";
import { campaigns, campaignRecipients } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function listCampaigns() {
  return db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
}

export type CampaignRow = Awaited<ReturnType<typeof listCampaigns>>[number];

export async function getCampaignById(id: string) {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!campaign) return null;

  const recipients = await db
    .select()
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, id))
    .orderBy(desc(campaignRecipients.createdAt));

  return { campaign, recipients };
}

export type CampaignRecipientRow = NonNullable<Awaited<ReturnType<typeof getCampaignById>>>["recipients"][number];
