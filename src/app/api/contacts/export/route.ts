import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { isAuthenticated } from "@/lib/auth";
import { CSV_CONTACT_COLUMNS, type CsvContactRow } from "@/lib/csv-contacts";
import {
  listContactsForExport,
  listContactsByIds,
  type ContactListFilters,
  type ContactRow,
} from "@/db/queries/contacts";

function toCsvRow(c: ContactRow): CsvContactRow {
  return {
    first_name: c.firstName,
    last_name: c.lastName ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    job_title: c.jobTitle ?? "",
    agency_name: c.agencyName ?? "",
    source: c.source ?? "",
    linkedin_url: c.linkedinUrl ?? "",
    is_primary: c.isPrimary ? "true" : "false",
    notes: c.notes ?? "",
  };
}

function toCsvResponse(rows: CsvContactRow[]) {
  const csv = Papa.unparse({ fields: CSV_CONTACT_COLUMNS, data: rows });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contacts-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function parseList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  return value.split(",").filter(Boolean);
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const filters: ContactListFilters = {
    q: sp.get("q") ?? undefined,
    agencyId: parseList(sp.get("agencyId")),
    jobTitle: parseList(sp.get("jobTitle")),
    source: parseList(sp.get("source")),
    isPrimary: sp.get("isPrimary") === "1" ? true : undefined,
    hasEmail: sp.get("hasEmail") === "1" ? true : undefined,
    hasPhone: sp.get("hasPhone") === "1" ? true : undefined,
  };

  const contacts = await listContactsForExport(filters);
  return toCsvResponse(contacts.map(toCsvRow));
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "No contact ids provided" }, { status: 400 });
  }

  const contacts = await listContactsByIds(ids);
  return toCsvResponse(contacts.map(toCsvRow));
}
