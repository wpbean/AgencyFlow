import "server-only";
import { db } from "@/db";
import { activities, type ActivityType } from "@/db/schema";

export async function logActivity(params: {
  agencyId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(activities).values({
    agencyId: params.agencyId,
    type: params.type,
    title: params.title,
    description: params.description,
    metadata: params.metadata,
  });
}
