import "server-only";
import { db } from "@/db";
import { campaignRecipients, campaignEvents } from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

function rate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function getCampaignAnalytics(campaignId: string) {
  const [row] = await db
    .select({
      totalRecipients: sql<number>`count(*)`,
      sent: sql<number>`coalesce(sum(case when ${campaignRecipients.status} = 'SENT' then 1 else 0 end), 0)`,
      failed: sql<number>`coalesce(sum(case when ${campaignRecipients.status} = 'FAILED' then 1 else 0 end), 0)`,
      skipped: sql<number>`coalesce(sum(case when ${campaignRecipients.status} = 'SKIPPED' then 1 else 0 end), 0)`,
      delivered: sql<number>`coalesce(sum(case when ${campaignRecipients.deliveredAt} is not null then 1 else 0 end), 0)`,
      opened: sql<number>`coalesce(sum(case when ${campaignRecipients.openedAt} is not null then 1 else 0 end), 0)`,
      opens: sql<number>`coalesce(sum(${campaignRecipients.openCount}), 0)`,
      clicked: sql<number>`coalesce(sum(case when ${campaignRecipients.clickedAt} is not null then 1 else 0 end), 0)`,
      clicks: sql<number>`coalesce(sum(${campaignRecipients.clickCount}), 0)`,
      bounced: sql<number>`coalesce(sum(case when ${campaignRecipients.bouncedAt} is not null then 1 else 0 end), 0)`,
      complained: sql<number>`coalesce(sum(case when ${campaignRecipients.complainedAt} is not null then 1 else 0 end), 0)`,
      unsubscribed: sql<number>`coalesce(sum(case when ${campaignRecipients.unsubscribedAt} is not null then 1 else 0 end), 0)`,
    })
    .from(campaignRecipients)
    .where(eq(campaignRecipients.campaignId, campaignId));

  // Rates are based on "delivered" when that's populated (requires the Resend
  // webhook + domain tracking to be configured); until then, fall back to "sent"
  // so rates aren't stuck at 0/0 just because delivery confirmations aren't wired up.
  const base = row.delivered > 0 ? row.delivered : row.sent;

  return {
    ...row,
    openRate: rate(row.opened, base),
    clickRate: rate(row.clicked, base),
    clickToOpenRate: rate(row.clicked, row.opened),
    bounceRate: rate(row.bounced, row.sent),
    unsubscribeRate: rate(row.unsubscribed, row.sent),
  };
}

export type CampaignAnalytics = Awaited<ReturnType<typeof getCampaignAnalytics>>;

export async function getCampaignEventsOverTime(campaignId: string) {
  const rows = await db
    .select({
      day: sql<string>`strftime('%Y-%m-%d', ${campaignEvents.createdAt}, 'unixepoch')`,
      type: campaignEvents.type,
      count: sql<number>`count(*)`,
    })
    .from(campaignEvents)
    .where(and(eq(campaignEvents.campaignId, campaignId), inArray(campaignEvents.type, ["OPENED", "CLICKED"])))
    .groupBy(sql`strftime('%Y-%m-%d', ${campaignEvents.createdAt}, 'unixepoch')`, campaignEvents.type)
    .orderBy(sql`strftime('%Y-%m-%d', ${campaignEvents.createdAt}, 'unixepoch')`);

  const opened = new Map(rows.filter((r) => r.type === "OPENED").map((r) => [r.day, r.count]));
  const clicked = new Map(rows.filter((r) => r.type === "CLICKED").map((r) => [r.day, r.count]));
  const days = Array.from(new Set(rows.map((r) => r.day))).sort();

  return days.map((day) => ({ day, opened: opened.get(day) ?? 0, clicked: clicked.get(day) ?? 0 }));
}

export async function getCampaignTopLinks(campaignId: string, limit = 10) {
  const rows = await db
    .select({ link: campaignEvents.link, clicks: sql<number>`count(*)` })
    .from(campaignEvents)
    .where(and(eq(campaignEvents.campaignId, campaignId), eq(campaignEvents.type, "CLICKED")))
    .groupBy(campaignEvents.link)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  return rows.filter((r): r is { link: string; clicks: number } => !!r.link);
}

export type CampaignRateSummary = { openRate: number; clickRate: number };

// One aggregate query for every campaign's open/click rate — used by the
// campaigns list page so it isn't running N+1 queries per row.
export async function getCampaignListRates(): Promise<Map<string, CampaignRateSummary>> {
  const rows = await db
    .select({
      campaignId: campaignRecipients.campaignId,
      sent: sql<number>`sum(case when ${campaignRecipients.status} = 'SENT' then 1 else 0 end)`,
      delivered: sql<number>`sum(case when ${campaignRecipients.deliveredAt} is not null then 1 else 0 end)`,
      opened: sql<number>`sum(case when ${campaignRecipients.openedAt} is not null then 1 else 0 end)`,
      clicked: sql<number>`sum(case when ${campaignRecipients.clickedAt} is not null then 1 else 0 end)`,
    })
    .from(campaignRecipients)
    .groupBy(campaignRecipients.campaignId);

  return new Map(
    rows.map((r) => {
      const base = r.delivered > 0 ? r.delivered : r.sent;
      return [r.campaignId, { openRate: rate(r.opened, base), clickRate: rate(r.clicked, base) }];
    })
  );
}
