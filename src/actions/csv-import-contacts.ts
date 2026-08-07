"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { agencies, contacts } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { emptyToNull } from "@/lib/utils";
import { normalizeEmail, MAX_CSV_ROWS } from "@/lib/csv";
import { parseBoolean, type CsvContactRow } from "@/lib/csv-contacts";

export type CsvContactRowPreview = {
  row: CsvContactRow;
  status: "valid" | "duplicate" | "invalid";
  reason?: string;
  agencyAction?: "matched" | "create";
};

const NO_AGENCY_KEY = "__none__";

function normalizeName(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase();
}

export async function previewContactsCsvImportAction(rows: CsvContactRow[]): Promise<CsvContactRowPreview[]> {
  const trimmed = rows.slice(0, MAX_CSV_ROWS);

  const [existingAgencies, existingContacts] = await Promise.all([
    db.select({ id: agencies.id, name: agencies.name }).from(agencies),
    db
      .select({ email: contacts.email, firstName: contacts.firstName, lastName: contacts.lastName, agencyId: contacts.agencyId })
      .from(contacts),
  ]);

  const agencyNameToId = new Map(existingAgencies.map((a) => [normalizeName(a.name), a.id]));
  const agencyIdToName = new Map(existingAgencies.map((a) => [a.id, a.name]));

  const existingEmails = new Set(existingContacts.map((c) => normalizeEmail(c.email)).filter(Boolean));
  const existingNameAgencyKeys = new Set(
    existingContacts.map(
      (c) => `${normalizeName(`${c.firstName} ${c.lastName ?? ""}`)}|${c.agencyId ? normalizeName(agencyIdToName.get(c.agencyId)) : NO_AGENCY_KEY}`
    )
  );

  const seenEmails = new Set<string>();
  const seenNameAgencyKeys = new Set<string>();

  return trimmed.map((row) => {
    const firstName = row.first_name?.trim();
    const agencyName = row.agency_name?.trim();

    if (!firstName) return { row, status: "invalid", reason: "Missing first_name" };

    const email = normalizeEmail(row.email);
    const nameAgencyKey = `${normalizeName(`${firstName} ${row.last_name ?? ""}`)}|${agencyName ? normalizeName(agencyName) : NO_AGENCY_KEY}`;

    if (email && (existingEmails.has(email) || seenEmails.has(email))) {
      return { row, status: "duplicate", reason: `Email already exists: ${row.email}` };
    }
    if (!email && (existingNameAgencyKeys.has(nameAgencyKey) || seenNameAgencyKeys.has(nameAgencyKey))) {
      return { row, status: "duplicate", reason: `Contact already exists: ${firstName}` };
    }

    if (email) seenEmails.add(email);
    else seenNameAgencyKeys.add(nameAgencyKey);

    const agencyAction: "matched" | "create" | undefined = !agencyName
      ? undefined
      : agencyNameToId.has(normalizeName(agencyName))
        ? "matched"
        : "create";

    return { row, status: "valid", agencyAction };
  });
}

export async function commitContactsCsvImportAction(rows: CsvContactRow[]): Promise<{ imported: number }> {
  const trimmed = rows.slice(0, MAX_CSV_ROWS);

  const existingAgencies = await db.select({ id: agencies.id, name: agencies.name }).from(agencies);
  const agencyNameToId = new Map(existingAgencies.map((a) => [normalizeName(a.name), a.id]));

  let imported = 0;
  const touchedAgencyIds = new Set<string>();

  for (const row of trimmed) {
    const firstName = row.first_name?.trim();
    if (!firstName) continue;

    const agencyName = row.agency_name?.trim();
    let agencyId: string | null = null;
    if (agencyName) {
      const agencyKey = normalizeName(agencyName);
      agencyId = agencyNameToId.get(agencyKey) ?? null;
      if (!agencyId) {
        const [agency] = await db
          .insert(agencies)
          .values({ name: agencyName, source: "CSV Import", status: "NEW", priority: "MEDIUM" })
          .returning();
        agencyId = agency.id;
        agencyNameToId.set(agencyKey, agencyId);
      }
    }

    const isPrimary = parseBoolean(row.is_primary);
    if (isPrimary && agencyId) {
      await db.update(contacts).set({ isPrimary: false }).where(eq(contacts.agencyId, agencyId));
    }

    await db.insert(contacts).values({
      agencyId,
      firstName,
      lastName: emptyToNull(row.last_name?.trim()),
      email: emptyToNull(row.email?.trim()),
      phone: emptyToNull(row.phone?.trim()),
      jobTitle: emptyToNull(row.job_title?.trim()),
      linkedinUrl: emptyToNull(row.linkedin_url?.trim()),
      isPrimary,
      source: emptyToNull(row.source?.trim()) ?? "CSV Import",
      notes: emptyToNull(row.notes?.trim()),
    });

    if (agencyId) {
      await logActivity({
        agencyId,
        type: "CONTACT_ADDED",
        title: `Contact imported: ${firstName} ${row.last_name?.trim() ?? ""}`.trim(),
      });
      touchedAgencyIds.add(agencyId);
    }

    imported++;
  }

  revalidatePath("/contacts");
  revalidatePath("/agencies");
  revalidatePath("/dashboard");
  for (const agencyId of touchedAgencyIds) {
    revalidatePath(`/agencies/${agencyId}`);
  }

  return { imported };
}
