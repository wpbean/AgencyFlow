import "server-only";
import { and, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { startOfDay } from "date-fns";
import { db } from "@/db";
import { campaigns, campaignRecipients } from "@/db/schema";
import { sendCampaign } from "@/lib/email/send-campaign";

// "HH:MM" (server local time) -> minutes since midnight, for comparing against `now`.
function parseSendTimeMinutes(dailySendTime: string): number {
  const [h, m] = dailySendTime.split(":").map(Number);
  return h * 60 + m;
}

function isPastDailySendTime(now: Date, dailySendTime: string | null): boolean {
  if (!dailySendTime) return true;
  return now.getHours() * 60 + now.getMinutes() >= parseSendTimeMinutes(dailySendTime);
}

async function getSentTodayCount(campaignId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(campaignRecipients)
    .where(
      and(
        eq(campaignRecipients.campaignId, campaignId),
        eq(campaignRecipients.status, "SENT"),
        gte(campaignRecipients.sentAt, startOfDay(new Date()))
      )
    );
  return count;
}

export async function runSchedulerTick(): Promise<void> {
  const now = new Date();

  const due = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.status, "SCHEDULED"), lte(campaigns.scheduledAt, now)));

  for (const { id } of due) {
    await db.update(campaigns).set({ status: "SENDING", updatedAt: new Date() }).where(eq(campaigns.id, id));
  }

  const throttled = await db
    .select({ id: campaigns.id, dailyLimit: campaigns.dailyLimit, dailySendTime: campaigns.dailySendTime })
    .from(campaigns)
    .where(and(eq(campaigns.status, "SENDING"), isNotNull(campaigns.dailyLimit)));

  for (const c of throttled) {
    const dailyLimit = c.dailyLimit ?? 0;
    if (dailyLimit <= 0) continue;
    if (!isPastDailySendTime(now, c.dailySendTime)) continue;
    const sentToday = await getSentTodayCount(c.id);
    if (sentToday < dailyLimit) {
      await sendCampaign(c.id, { limit: dailyLimit - sentToday });
    }
  }

  const deferredUnthrottled = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(and(eq(campaigns.status, "SENDING"), isNull(campaigns.dailyLimit), isNotNull(campaigns.scheduledAt)));

  for (const { id } of deferredUnthrottled) {
    await sendCampaign(id);
  }
}
