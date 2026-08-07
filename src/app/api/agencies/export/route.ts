import { NextResponse } from "next/server";
import Papa from "papaparse";
import { db } from "@/db";
import { agencies, contacts } from "@/db/schema";
import { isAuthenticated } from "@/lib/auth";
import { CSV_COLUMNS } from "@/lib/csv";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allAgencies = await db.select().from(agencies);
  const allContacts = await db.select().from(contacts);
  const primaryContactByAgency = new Map(
    allContacts.filter((c) => c.isPrimary).map((c) => [c.agencyId, c])
  );
  for (const c of allContacts) {
    if (!primaryContactByAgency.has(c.agencyId)) primaryContactByAgency.set(c.agencyId, c);
  }

  const rows = allAgencies.map((a) => {
    const contact = primaryContactByAgency.get(a.id);
    return {
      agency_name: a.name,
      website: a.website ?? "",
      country: a.country ?? "",
      city: a.city ?? "",
      email: contact?.email ?? "",
      contact_name: contact ? `${contact.firstName} ${contact.lastName ?? ""}`.trim() : "",
      job_title: contact?.jobTitle ?? "",
      services: (a.services ?? []).join(", "),
      technologies: (a.technologies ?? []).join(", "),
      source: a.source ?? "",
      notes: a.notes ?? "",
    };
  });

  const csv = Papa.unparse({ fields: CSV_COLUMNS, data: rows });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="agencies-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
