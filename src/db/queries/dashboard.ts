import "server-only";
import { db } from "@/db";
import { agencies, followUps, opportunities, activities } from "@/db/schema";
import { and, eq, inArray, lt, gte, lte, desc, sql, isNotNull } from "drizzle-orm";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export async function getDashboardStats() {
  const today0 = startOfToday();
  const today1 = endOfToday();

  const [
    totalAgencies,
    newLeads,
    waitingForReply,
    followUpsToday,
    interested,
    activeOpportunities,
    clients,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(agencies),
    db.select({ count: sql<number>`count(*)` }).from(agencies).where(eq(agencies.status, "NEW")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(agencies)
      .where(inArray(agencies.status, ["CONTACTED", "FOLLOW_UP"])),
    db
      .select({ count: sql<number>`count(*)` })
      .from(followUps)
      .where(and(eq(followUps.status, "PENDING"), gte(followUps.dueDate, today0), lte(followUps.dueDate, today1))),
    db.select({ count: sql<number>`count(*)` }).from(agencies).where(eq(agencies.status, "INTERESTED")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(opportunities)
      .where(sql`${opportunities.stage} not in ('WON','LOST')`),
    db.select({ count: sql<number>`count(*)` }).from(agencies).where(eq(agencies.status, "CLIENT")),
  ]);

  return {
    totalAgencies: totalAgencies[0].count,
    newLeads: newLeads[0].count,
    waitingForReply: waitingForReply[0].count,
    followUpsToday: followUpsToday[0].count,
    interested: interested[0].count,
    activeOpportunities: activeOpportunities[0].count,
    clients: clients[0].count,
  };
}

const PIPELINE_STAGES = [
  "NEW",
  "QUALIFIED",
  "CONTACTED",
  "FOLLOW_UP",
  "REPLIED",
  "INTERESTED",
  "INTERVIEW",
  "TRIAL",
  "PROJECT",
  "CLIENT",
] as const;

export async function getPipelineCounts() {
  const rows = await db
    .select({ status: agencies.status, count: sql<number>`count(*)` })
    .from(agencies)
    .groupBy(agencies.status);

  const counts = new Map(rows.map((r) => [r.status, r.count]));
  return PIPELINE_STAGES.map((stage) => ({ stage, count: counts.get(stage) ?? 0 }));
}

export async function getTodaysActions() {
  const today0 = startOfToday();
  const today1 = endOfToday();

  const [overdue, dueToday, newAgencyLeads, upcomingInterviews] = await Promise.all([
    db
      .select({
        id: followUps.id,
        agencyId: followUps.agencyId,
        agencyName: agencies.name,
        dueDate: followUps.dueDate,
        type: followUps.type,
      })
      .from(followUps)
      .innerJoin(agencies, eq(followUps.agencyId, agencies.id))
      .where(and(eq(followUps.status, "PENDING"), lt(followUps.dueDate, today0)))
      .orderBy(followUps.dueDate)
      .limit(6),
    db
      .select({
        id: followUps.id,
        agencyId: followUps.agencyId,
        agencyName: agencies.name,
        dueDate: followUps.dueDate,
        type: followUps.type,
      })
      .from(followUps)
      .innerJoin(agencies, eq(followUps.agencyId, agencies.id))
      .where(and(eq(followUps.status, "PENDING"), gte(followUps.dueDate, today0), lte(followUps.dueDate, today1)))
      .orderBy(followUps.dueDate)
      .limit(6),
    db
      .select({ id: agencies.id, name: agencies.name, createdAt: agencies.createdAt })
      .from(agencies)
      .where(eq(agencies.status, "NEW"))
      .orderBy(desc(agencies.createdAt))
      .limit(5),
    db
      .select({
        id: opportunities.id,
        agencyId: opportunities.agencyId,
        agencyName: agencies.name,
        title: opportunities.title,
        nextActionDate: opportunities.nextActionDate,
      })
      .from(opportunities)
      .innerJoin(agencies, eq(opportunities.agencyId, agencies.id))
      .where(and(eq(opportunities.stage, "INTERVIEW"), isNotNull(opportunities.nextActionDate), gte(opportunities.nextActionDate, today0), lte(opportunities.nextActionDate, daysFromNow(7))))
      .orderBy(opportunities.nextActionDate)
      .limit(5),
  ]);

  return { overdue, dueToday, newAgencyLeads, upcomingInterviews };
}

export async function getRecentActivity(limit = 15) {
  return db
    .select({
      id: activities.id,
      agencyId: activities.agencyId,
      agencyName: agencies.name,
      type: activities.type,
      title: activities.title,
      description: activities.description,
      createdAt: activities.createdAt,
    })
    .from(activities)
    .innerJoin(agencies, eq(activities.agencyId, agencies.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
export type PipelineCounts = Awaited<ReturnType<typeof getPipelineCounts>>;
export type TodaysActions = Awaited<ReturnType<typeof getTodaysActions>>;
export type RecentActivity = Awaited<ReturnType<typeof getRecentActivity>>;
