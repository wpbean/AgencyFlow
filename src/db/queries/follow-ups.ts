import "server-only";
import { db } from "@/db";
import { followUps, agencies, contacts, emailTemplates } from "@/db/schema";
import { and, eq, lt, gte, lte, desc, asc } from "drizzle-orm";

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

export async function getFollowUpBadgeCounts() {
  const today0 = startOfToday();
  const today1 = endOfToday();

  const [overdue, dueToday] = await Promise.all([
    db
      .select({ id: followUps.id })
      .from(followUps)
      .where(and(eq(followUps.status, "PENDING"), lt(followUps.dueDate, today0))),
    db
      .select({ id: followUps.id })
      .from(followUps)
      .where(and(eq(followUps.status, "PENDING"), gte(followUps.dueDate, today0), lte(followUps.dueDate, today1))),
  ]);

  return { overdue: overdue.length, dueToday: dueToday.length };
}

function followUpSelection() {
  return db
    .select({
      id: followUps.id,
      agencyId: followUps.agencyId,
      agencyName: agencies.name,
      agencyStatus: agencies.status,
      contactId: followUps.contactId,
      contactName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactEmail: contacts.email,
      agencyWebsite: agencies.website,
      agencyCountry: agencies.country,
      outreachId: followUps.outreachId,
      templateId: followUps.templateId,
      templateName: emailTemplates.name,
      type: followUps.type,
      dueDate: followUps.dueDate,
      status: followUps.status,
      completedAt: followUps.completedAt,
      notes: followUps.notes,
      createdAt: followUps.createdAt,
    })
    .from(followUps)
    .innerJoin(agencies, eq(followUps.agencyId, agencies.id))
    .leftJoin(contacts, eq(followUps.contactId, contacts.id))
    .leftJoin(emailTemplates, eq(followUps.templateId, emailTemplates.id));
}

export async function getFollowUpsGrouped() {
  const today0 = startOfToday();
  const today1 = endOfToday();

  const [overdue, dueToday, upcoming, completed] = await Promise.all([
    followUpSelection().where(and(eq(followUps.status, "PENDING"), lt(followUps.dueDate, today0))).orderBy(asc(followUps.dueDate)),
    followUpSelection().where(and(eq(followUps.status, "PENDING"), gte(followUps.dueDate, today0), lte(followUps.dueDate, today1))).orderBy(asc(followUps.dueDate)),
    followUpSelection().where(and(eq(followUps.status, "PENDING"), gte(followUps.dueDate, new Date(today1.getTime() + 1)))).orderBy(asc(followUps.dueDate)),
    followUpSelection().where(eq(followUps.status, "COMPLETED")).orderBy(desc(followUps.completedAt)).limit(30),
  ]);

  return { overdue, dueToday, upcoming, completed };
}

export type FollowUpRow = Awaited<ReturnType<typeof getFollowUpsGrouped>>["overdue"][number];

export async function getFollowUpsForAgency(agencyId: string) {
  return followUpSelection().where(eq(followUps.agencyId, agencyId)).orderBy(desc(followUps.dueDate));
}
