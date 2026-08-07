import "server-only";
import { db } from "@/db";
import { opportunities, agencies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { OPPORTUNITY_STAGES } from "@/db/schema";

function opportunitySelection() {
  return db
    .select({
      id: opportunities.id,
      agencyId: opportunities.agencyId,
      agencyName: agencies.name,
      contactId: opportunities.contactId,
      title: opportunities.title,
      description: opportunities.description,
      type: opportunities.type,
      stage: opportunities.stage,
      expectedRate: opportunities.expectedRate,
      currency: opportunities.currency,
      expectedHours: opportunities.expectedHours,
      probability: opportunities.probability,
      nextAction: opportunities.nextAction,
      nextActionDate: opportunities.nextActionDate,
      notes: opportunities.notes,
      createdAt: opportunities.createdAt,
      updatedAt: opportunities.updatedAt,
    })
    .from(opportunities)
    .innerJoin(agencies, eq(opportunities.agencyId, agencies.id));
}

export async function listOpportunitiesByStage() {
  const rows = await opportunitySelection().orderBy(desc(opportunities.updatedAt));
  const grouped = new Map(OPPORTUNITY_STAGES.map((s) => [s, [] as typeof rows]));
  for (const row of rows) {
    grouped.get(row.stage)?.push(row);
  }
  return OPPORTUNITY_STAGES.map((stage) => ({ stage, items: grouped.get(stage) ?? [] }));
}

export type OpportunityRow = Awaited<ReturnType<typeof listOpportunitiesByStage>>[number]["items"][number];
