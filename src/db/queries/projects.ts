import "server-only";
import { db } from "@/db";
import { projects, agencies } from "@/db/schema";
import { eq, desc, inArray, and, type SQL } from "drizzle-orm";
import type { ProjectStatus } from "@/db/schema";

function projectSelection() {
  return db
    .select({
      id: projects.id,
      agencyId: projects.agencyId,
      agencyName: agencies.name,
      opportunityId: projects.opportunityId,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      startDate: projects.startDate,
      endDate: projects.endDate,
      hourlyRate: projects.hourlyRate,
      currency: projects.currency,
      estimatedHours: projects.estimatedHours,
      actualHours: projects.actualHours,
      notes: projects.notes,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(agencies, eq(projects.agencyId, agencies.id));
}

export async function listProjects(status?: ProjectStatus[]) {
  const conditions: SQL[] = [];
  if (status?.length) conditions.push(inArray(projects.status, status));
  return projectSelection()
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(projects.updatedAt));
}

export type ProjectRow = Awaited<ReturnType<typeof listProjects>>[number];

export async function getClientAgencies() {
  const rows = await db
    .select({
      id: agencies.id,
      name: agencies.name,
      website: agencies.website,
      country: agencies.country,
      updatedAt: agencies.updatedAt,
    })
    .from(agencies)
    .where(eq(agencies.status, "CLIENT"));

  const allProjects = await projectSelection().orderBy(desc(projects.updatedAt));

  return rows.map((agency) => {
    const agencyProjects = allProjects.filter((p) => p.agencyId === agency.id);
    return {
      ...agency,
      totalProjects: agencyProjects.length,
      activeProjects: agencyProjects.filter((p) => p.status === "ACTIVE").length,
      lastProject: agencyProjects[0] ?? null,
    };
  });
}
