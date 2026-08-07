"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { agencies, contacts } from "@/db/schema";
import { calculateLeadScore } from "@/lib/scoring";
import { getSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity";
import { emptyToNull } from "@/lib/utils";
import { splitList, normalizeWebsite, normalizeEmail, MAX_CSV_ROWS, type CsvAgencyRow } from "@/lib/csv";

export type CsvRowPreview = {
  row: CsvAgencyRow;
  status: "valid" | "duplicate" | "invalid";
  reason?: string;
};

export async function previewCsvImportAction(rows: CsvAgencyRow[]): Promise<CsvRowPreview[]> {
  const trimmed = rows.slice(0, MAX_CSV_ROWS);

  const [existingAgencies, existingContacts] = await Promise.all([
    db.select({ website: agencies.website }).from(agencies),
    db.select({ email: contacts.email }).from(contacts),
  ]);

  const existingWebsites = new Set(existingAgencies.map((a) => normalizeWebsite(a.website)).filter(Boolean));
  const existingEmails = new Set(existingContacts.map((c) => normalizeEmail(c.email)).filter(Boolean));

  const seenWebsites = new Set<string>();
  const seenEmails = new Set<string>();

  return trimmed.map((row) => {
    const name = row.agency_name?.trim();
    if (!name) {
      return { row, status: "invalid", reason: "Missing agency_name" };
    }

    const website = normalizeWebsite(row.website);
    const email = normalizeEmail(row.email);

    if (website && (existingWebsites.has(website) || seenWebsites.has(website))) {
      return { row, status: "duplicate", reason: `Website already exists: ${row.website}` };
    }
    if (email && (existingEmails.has(email) || seenEmails.has(email))) {
      return { row, status: "duplicate", reason: `Email already exists: ${row.email}` };
    }

    if (website) seenWebsites.add(website);
    if (email) seenEmails.add(email);

    return { row, status: "valid" };
  });
}

export async function commitCsvImportAction(rows: CsvAgencyRow[]): Promise<{ imported: number }> {
  const trimmed = rows.slice(0, MAX_CSV_ROWS);
  const settings = await getSettings();
  let imported = 0;

  for (const row of trimmed) {
    const name = row.agency_name?.trim();
    if (!name) continue;

    const services = splitList(row.services);
    const technologies = splitList(row.technologies);
    const leadScore = calculateLeadScore(
      { services, technologies, source: row.source, description: row.notes },
      settings.scoringWeights
    );

    const [agency] = await db
      .insert(agencies)
      .values({
        name,
        website: emptyToNull(row.website?.trim()),
        country: emptyToNull(row.country?.trim()),
        city: emptyToNull(row.city?.trim()),
        source: emptyToNull(row.source?.trim()) ?? "CSV Import",
        services,
        technologies,
        notes: emptyToNull(row.notes?.trim()),
        status: "NEW",
        priority: "MEDIUM",
        leadScore,
      })
      .returning();

    if (row.contact_name?.trim() || row.email?.trim()) {
      const [firstName, ...rest] = (row.contact_name?.trim() || "Contact").split(" ");
      await db.insert(contacts).values({
        agencyId: agency.id,
        firstName,
        lastName: rest.length ? rest.join(" ") : null,
        email: emptyToNull(row.email?.trim()),
        jobTitle: emptyToNull(row.job_title?.trim()),
        isPrimary: true,
      });
    }

    await logActivity({ agencyId: agency.id, type: "AGENCY_CREATED", title: "Agency imported from CSV" });
    imported++;
  }

  revalidatePath("/agencies");
  revalidatePath("/dashboard");
  return { imported };
}
