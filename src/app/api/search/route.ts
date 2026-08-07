import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { agencies, contacts, opportunities, projects } from "@/db/schema";
import { like, or, desc } from "drizzle-orm";
import { isAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ agencies: [], contacts: [], opportunities: [], projects: [] });
  }

  const term = `%${q}%`;

  const [agencyResults, contactResults, opportunityResults, projectResults] = await Promise.all([
    db
      .select({ id: agencies.id, name: agencies.name, website: agencies.website, status: agencies.status })
      .from(agencies)
      .where(or(like(agencies.name, term), like(agencies.website, term), like(agencies.country, term)))
      .orderBy(desc(agencies.updatedAt))
      .limit(6),
    db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        agencyId: contacts.agencyId,
      })
      .from(contacts)
      .where(or(like(contacts.firstName, term), like(contacts.lastName, term), like(contacts.email, term)))
      .limit(6),
    db
      .select({ id: opportunities.id, title: opportunities.title, stage: opportunities.stage, agencyId: opportunities.agencyId })
      .from(opportunities)
      .where(like(opportunities.title, term))
      .limit(6),
    db
      .select({ id: projects.id, name: projects.name, status: projects.status, agencyId: projects.agencyId })
      .from(projects)
      .where(like(projects.name, term))
      .limit(6),
  ]);

  return NextResponse.json({
    agencies: agencyResults,
    contacts: contactResults,
    opportunities: opportunityResults,
    projects: projectResults,
  });
}
