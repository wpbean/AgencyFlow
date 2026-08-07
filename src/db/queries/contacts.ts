import "server-only";
import { db } from "@/db";
import { contacts, agencies } from "@/db/schema";
import { eq, desc, asc, like, or, and, inArray, isNotNull, sql, type SQL } from "drizzle-orm";

export type ContactListFilters = {
  q?: string;
  agencyId?: string[];
  jobTitle?: string[];
  source?: string[];
  isPrimary?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
};

export type ContactSort = "created" | "updated" | "name";

const PAGE_SIZE = 25;

const contactSelection = {
  id: contacts.id,
  agencyId: contacts.agencyId,
  agencyName: agencies.name,
  firstName: contacts.firstName,
  lastName: contacts.lastName,
  email: contacts.email,
  phone: contacts.phone,
  jobTitle: contacts.jobTitle,
  linkedinUrl: contacts.linkedinUrl,
  isPrimary: contacts.isPrimary,
  source: contacts.source,
  notes: contacts.notes,
  createdAt: contacts.createdAt,
  updatedAt: contacts.updatedAt,
};

function buildConditions(filters: ContactListFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(
      or(like(contacts.firstName, term), like(contacts.lastName, term), like(contacts.email, term), like(agencies.name, term))!
    );
  }
  if (filters.agencyId?.length) conditions.push(inArray(contacts.agencyId, filters.agencyId));
  if (filters.jobTitle?.length) conditions.push(inArray(contacts.jobTitle, filters.jobTitle));
  if (filters.source?.length) conditions.push(inArray(contacts.source, filters.source));
  if (filters.isPrimary) conditions.push(eq(contacts.isPrimary, true));
  if (filters.hasEmail) conditions.push(sql`${contacts.email} is not null and ${contacts.email} != ''`);
  if (filters.hasPhone) conditions.push(sql`${contacts.phone} is not null and ${contacts.phone} != ''`);
  return conditions;
}

export async function listContacts(filters: ContactListFilters, sort: ContactSort, page: number) {
  const where = and(...buildConditions(filters));

  const orderBy = {
    created: desc(contacts.createdAt),
    updated: desc(contacts.updatedAt),
    name: asc(contacts.firstName),
  }[sort];

  const [rows, totalRes] = await Promise.all([
    db
      .select(contactSelection)
      .from(contacts)
      .leftJoin(agencies, eq(contacts.agencyId, agencies.id))
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ count: sql<number>`count(*)` })
      .from(contacts)
      .leftJoin(agencies, eq(contacts.agencyId, agencies.id))
      .where(where),
  ]);

  return { rows, total: totalRes[0].count, pageSize: PAGE_SIZE };
}

export type ContactRow = Awaited<ReturnType<typeof listContacts>>["rows"][number];

export async function listContactsForExport(filters: ContactListFilters): Promise<ContactRow[]> {
  const where = and(...buildConditions(filters));
  return db
    .select(contactSelection)
    .from(contacts)
    .leftJoin(agencies, eq(contacts.agencyId, agencies.id))
    .where(where)
    .orderBy(desc(contacts.createdAt));
}

export async function listContactsByIds(ids: string[]): Promise<ContactRow[]> {
  if (ids.length === 0) return [];
  return db
    .select(contactSelection)
    .from(contacts)
    .leftJoin(agencies, eq(contacts.agencyId, agencies.id))
    .where(inArray(contacts.id, ids));
}

export async function getAgencyOptions() {
  return db.select({ id: agencies.id, name: agencies.name }).from(agencies).orderBy(agencies.name);
}

export async function getContactFilterOptions() {
  const [jobTitles, sources] = await Promise.all([
    db.selectDistinct({ jobTitle: contacts.jobTitle }).from(contacts).where(isNotNull(contacts.jobTitle)),
    db.selectDistinct({ source: contacts.source }).from(contacts).where(isNotNull(contacts.source)),
  ]);
  return {
    jobTitles: jobTitles.map((j) => j.jobTitle!).filter(Boolean).sort(),
    sources: sources.map((s) => s.source!).filter(Boolean).sort(),
  };
}

export async function getContactsGroupedByAgency(): Promise<Record<string, { id: string; firstName: string; lastName: string | null }[]>> {
  const rows = await db
    .select({ id: contacts.id, agencyId: contacts.agencyId, firstName: contacts.firstName, lastName: contacts.lastName })
    .from(contacts);

  const grouped: Record<string, { id: string; firstName: string; lastName: string | null }[]> = {};
  for (const row of rows) {
    if (!row.agencyId) continue;
    (grouped[row.agencyId] ??= []).push({ id: row.id, firstName: row.firstName, lastName: row.lastName });
  }
  return grouped;
}
