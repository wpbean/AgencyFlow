import "server-only";
import { db } from "@/db";
import { followUps, agencies, type OutreachType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/activity";
import type { AppSettings } from "@/lib/settings";

const NEXT_STEP: Partial<Record<OutreachType, { next: OutreachType; days: (s: AppSettings) => number }>> = {
  INITIAL: { next: "FOLLOW_UP_1", days: (s) => s.followUp1Days },
  FOLLOW_UP_1: { next: "FOLLOW_UP_2", days: (s) => s.followUp2Days },
  FOLLOW_UP_2: { next: "FINAL_FOLLOW_UP", days: (s) => s.finalFollowUpDays },
};

export async function scheduleNextFollowUp(params: {
  agencyId: string;
  contactId?: string | null;
  lastType: OutreachType;
  settings: AppSettings;
}) {
  const step = NEXT_STEP[params.lastType];
  if (!step) return null;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + step.days(params.settings));

  const [followUp] = await db
    .insert(followUps)
    .values({
      agencyId: params.agencyId,
      contactId: params.contactId ?? null,
      type: step.next,
      dueDate,
      status: "PENDING",
    })
    .returning();

  await db.update(agencies).set({ nextFollowUpAt: dueDate }).where(eq(agencies.id, params.agencyId));

  await logActivity({
    agencyId: params.agencyId,
    type: "FOLLOW_UP_SCHEDULED",
    title: `${step.next.replace(/_/g, " ").toLowerCase()} scheduled`,
    description: `Due ${dueDate.toDateString()}`,
  });

  return followUp;
}
