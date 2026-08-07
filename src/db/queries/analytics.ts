import "server-only";
import { db } from "@/db";
import { agencies, outreach, activities, projects } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

const CONTACTED_STATUSES = ["CONTACTED", "FOLLOW_UP", "REPLIED", "INTERESTED", "INTERVIEW", "TRIAL", "PROJECT", "CLIENT"];
const REPLIED_STATUSES = ["REPLIED", "INTERESTED", "INTERVIEW", "TRIAL", "PROJECT", "CLIENT"];
const INTERESTED_STATUSES = ["INTERESTED", "INTERVIEW", "TRIAL", "PROJECT", "CLIENT"];
const INTERVIEW_STATUSES = ["INTERVIEW", "TRIAL", "PROJECT", "CLIENT"];
const PROJECT_STATUSES_LIST = ["PROJECT", "CLIENT"];

// `list` is always a fixed internal constant (never user input), so raw interpolation is safe here.
function inList(column: typeof agencies.status, list: string[]) {
  const values = sql.raw(list.map((v) => `'${v}'`).join(","));
  return sql<number>`sum(case when ${column} in (${values}) then 1 else 0 end)`;
}

export async function getConversionFunnel() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      contacted: inList(agencies.status, CONTACTED_STATUSES),
      replied: inList(agencies.status, REPLIED_STATUSES),
      interested: inList(agencies.status, INTERESTED_STATUSES),
      interview: inList(agencies.status, INTERVIEW_STATUSES),
      project: inList(agencies.status, PROJECT_STATUSES_LIST),
      client: sql<number>`sum(case when ${agencies.status} = 'CLIENT' then 1 else 0 end)`,
    })
    .from(agencies);

  return row;
}

export type ConversionFunnel = Awaited<ReturnType<typeof getConversionFunnel>>;

function rate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function computeConversionRates(f: ConversionFunnel) {
  return {
    contactedToReply: rate(f.replied, f.contacted),
    replyToInterested: rate(f.interested, f.replied),
    interestedToInterview: rate(f.interview, f.interested),
    interviewToProject: rate(f.project, f.interview),
    projectToClient: rate(f.client, f.project),
  };
}

export async function getOutreachOverTime(months = 6) {
  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${outreach.sentAt}, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
    .from(outreach)
    .where(sql`${outreach.sentAt} is not null`)
    .groupBy(sql`strftime('%Y-%m', ${outreach.sentAt}, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m', ${outreach.sentAt}, 'unixepoch')`);

  return fillMonths(rows, months);
}

export async function getActivityOverTime(type: "REPLY_RECEIVED" | "PROJECT_CREATED", months = 6) {
  const rows = await db
    .select({
      month: sql<string>`strftime('%Y-%m', ${activities.createdAt}, 'unixepoch')`,
      count: sql<number>`count(*)`,
    })
    .from(activities)
    .where(eq(activities.type, type))
    .groupBy(sql`strftime('%Y-%m', ${activities.createdAt}, 'unixepoch')`)
    .orderBy(sql`strftime('%Y-%m', ${activities.createdAt}, 'unixepoch')`);

  return fillMonths(rows, months);
}

function fillMonths(rows: { month: string; count: number }[], months: number) {
  const map = new Map(rows.map((r) => [r.month, r.count]));
  const result: { month: string; count: number }[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    result.push({ month: key, count: map.get(key) ?? 0 });
  }
  return result;
}

export async function getLeadsByCountry() {
  const rows = await db
    .select({ country: agencies.country, count: sql<number>`count(*)` })
    .from(agencies)
    .where(sql`${agencies.country} is not null`)
    .groupBy(agencies.country)
    .orderBy(sql`count(*) desc`)
    .limit(12);
  return rows.map((r) => ({ country: r.country!, count: r.count }));
}

export async function getLeadsBySource() {
  const rows = await db
    .select({ source: agencies.source, count: sql<number>`count(*)` })
    .from(agencies)
    .where(sql`${agencies.source} is not null`)
    .groupBy(agencies.source)
    .orderBy(sql`count(*) desc`)
    .limit(10);
  return rows.map((r) => ({ source: r.source!, count: r.count }));
}

export async function getCountryBreakdown() {
  const rows = await db
    .select({
      country: agencies.country,
      leads: sql<number>`count(*)`,
      contacted: inList(agencies.status, CONTACTED_STATUSES),
      replied: inList(agencies.status, REPLIED_STATUSES),
      interested: inList(agencies.status, INTERESTED_STATUSES),
      client: sql<number>`sum(case when ${agencies.status} = 'CLIENT' then 1 else 0 end)`,
    })
    .from(agencies)
    .where(sql`${agencies.country} is not null`)
    .groupBy(agencies.country)
    .orderBy(sql`count(*) desc`);

  const projectCounts = await db
    .select({ country: agencies.country, projects: sql<number>`count(*)` })
    .from(projects)
    .innerJoin(agencies, eq(projects.agencyId, agencies.id))
    .where(sql`${agencies.country} is not null`)
    .groupBy(agencies.country);
  const projectMap = new Map(projectCounts.map((p) => [p.country, p.projects]));

  return rows.map((r) => ({
    country: r.country!,
    leads: r.leads,
    contacted: r.contacted,
    replied: r.replied,
    interested: r.interested,
    projects: projectMap.get(r.country) ?? 0,
    clients: r.client,
    replyRate: rate(r.replied, r.contacted),
  }));
}
