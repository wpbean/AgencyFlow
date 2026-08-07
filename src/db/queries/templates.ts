import "server-only";
import { db } from "@/db";
import { emailTemplates } from "@/db/schema";
import { eq, asc, isNotNull } from "drizzle-orm";

export async function listTemplates() {
  return db.select().from(emailTemplates).orderBy(asc(emailTemplates.category), asc(emailTemplates.name));
}

export async function getTemplateById(id: string) {
  const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id)).limit(1);
  return template ?? null;
}

// Templates built in the visual designer — the pool offered by the "use a template" picker.
export async function listTemplatesWithDesign() {
  const rows = await db
    .select({ id: emailTemplates.id, name: emailTemplates.name, subject: emailTemplates.subject, design: emailTemplates.design })
    .from(emailTemplates)
    .where(isNotNull(emailTemplates.design))
    .orderBy(asc(emailTemplates.name));

  return rows.filter((r): r is typeof r & { design: NonNullable<typeof r.design> } => r.design !== null);
}
