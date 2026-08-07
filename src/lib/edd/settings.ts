import "server-only";
import { db } from "@/db";
import { eddIntegration } from "@/db/schema";
import { eq } from "drizzle-orm";

export const EDD_INTEGRATION_ROW_ID = "default";

export type EddIntegrationRow = typeof eddIntegration.$inferSelect;

export async function getEddIntegration(): Promise<EddIntegrationRow | null> {
  const [row] = await db.select().from(eddIntegration).where(eq(eddIntegration.id, EDD_INTEGRATION_ROW_ID)).limit(1);
  return row ?? null;
}

export async function upsertEddIntegration(
  patch: Partial<typeof eddIntegration.$inferInsert>
): Promise<EddIntegrationRow> {
  const existing = await getEddIntegration();
  if (existing) {
    await db.update(eddIntegration).set(patch).where(eq(eddIntegration.id, EDD_INTEGRATION_ROW_ID));
  } else {
    await db.insert(eddIntegration).values({ id: EDD_INTEGRATION_ROW_ID, ...patch });
  }
  return (await getEddIntegration())!;
}
