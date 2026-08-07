import "server-only";
import { db } from "@/db";
import { agencies, contacts, tags, agencyTags, opportunities, projects, outreach, activities } from "@/db/schema";
import { and, eq, like, or, desc, asc, inArray, sql, type SQL } from "drizzle-orm";
import type { AgencyStatus, Priority } from "@/db/schema";

export type AgencyListFilters = {
  q?: string;
  status?: AgencyStatus[];
  country?: string[];
  priority?: Priority[];
  source?: string[];
  minScore?: number;
};

export type AgencySort = "updated" | "created" | "name" | "score" | "nextFollowUp";

const PAGE_SIZE = 25;

export async function listAgencies(filters: AgencyListFilters, sort: AgencySort, page: number) {
  const conditions: SQL[] = [];

  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(or(like(agencies.name, term), like(agencies.website, term), like(agencies.city, term))!);
  }
  if (filters.status?.length) conditions.push(inArray(agencies.status, filters.status));
  if (filters.country?.length) conditions.push(inArray(agencies.country, filters.country));
  if (filters.priority?.length) conditions.push(inArray(agencies.priority, filters.priority));
  if (filters.source?.length) conditions.push(inArray(agencies.source, filters.source));
  if (filters.minScore !== undefined) conditions.push(sql`${agencies.leadScore} >= ${filters.minScore}`);

  const where = conditions.length ? and(...conditions) : undefined;

  const orderBy = {
    updated: desc(agencies.updatedAt),
    created: desc(agencies.createdAt),
    name: asc(agencies.name),
    score: desc(agencies.leadScore),
    nextFollowUp: asc(agencies.nextFollowUpAt),
  }[sort];

  const [rows, totalRes] = await Promise.all([
    db
      .select()
      .from(agencies)
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)` }).from(agencies).where(where),
  ]);

  return { rows, total: totalRes[0].count, pageSize: PAGE_SIZE };
}

export async function getAgencyFilterOptions() {
  const [countries, sources] = await Promise.all([
    db.selectDistinct({ country: agencies.country }).from(agencies).where(sql`${agencies.country} is not null`),
    db.selectDistinct({ source: agencies.source }).from(agencies).where(sql`${agencies.source} is not null`),
  ]);
  return {
    countries: countries.map((c) => c.country!).filter(Boolean).sort(),
    sources: sources.map((s) => s.source!).filter(Boolean).sort(),
  };
}

export async function getAgencyById(id: string) {
  const [agency] = await db.select().from(agencies).where(eq(agencies.id, id)).limit(1);
  if (!agency) return null;

  const [agencyContacts, agencyTagRows, agencyOpportunities, agencyProjects, agencyOutreach, agencyActivities] =
    await Promise.all([
      db.select().from(contacts).where(eq(contacts.agencyId, id)).orderBy(desc(contacts.isPrimary), asc(contacts.firstName)),
      db.select({ id: tags.id, name: tags.name, color: tags.color }).from(agencyTags).innerJoin(tags, eq(agencyTags.tagId, tags.id)).where(eq(agencyTags.agencyId, id)),
      db.select().from(opportunities).where(eq(opportunities.agencyId, id)).orderBy(desc(opportunities.updatedAt)),
      db.select().from(projects).where(eq(projects.agencyId, id)).orderBy(desc(projects.updatedAt)),
      db.select().from(outreach).where(eq(outreach.agencyId, id)).orderBy(desc(outreach.createdAt)),
      db.select().from(activities).where(eq(activities.agencyId, id)).orderBy(desc(activities.createdAt)),
    ]);

  return {
    agency,
    contacts: agencyContacts,
    tags: agencyTagRows,
    opportunities: agencyOpportunities,
    projects: agencyProjects,
    outreach: agencyOutreach,
    activities: agencyActivities,
  };
}

export async function getAllTags() {
  return db.select().from(tags).orderBy(asc(tags.name));
}
