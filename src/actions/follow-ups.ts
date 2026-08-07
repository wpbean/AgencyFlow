"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { followUps, agencies } from "@/db/schema";
import { followUpSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import type { ActionState } from "./agencies";

export async function createFollowUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = followUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await db.insert(followUps).values({
    agencyId: data.agencyId,
    contactId: data.contactId || null,
    outreachId: data.outreachId || null,
    templateId: data.templateId || null,
    type: data.type,
    dueDate: data.dueDate,
    notes: data.notes,
  });

  await db.update(agencies).set({ nextFollowUpAt: data.dueDate }).where(eq(agencies.id, data.agencyId));

  await logActivity({
    agencyId: data.agencyId,
    type: "FOLLOW_UP_SCHEDULED",
    title: "Follow-up scheduled",
    description: `Due ${data.dueDate.toDateString()}`,
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/agencies/${data.agencyId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function completeFollowUpAction(id: string) {
  const [followUp] = await db.select().from(followUps).where(eq(followUps.id, id)).limit(1);
  if (!followUp) return;

  await db.update(followUps).set({ status: "COMPLETED", completedAt: new Date(), updatedAt: new Date() }).where(eq(followUps.id, id));

  await logActivity({
    agencyId: followUp.agencyId,
    type: "FOLLOW_UP_COMPLETED",
    title: "Follow-up completed",
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/agencies/${followUp.agencyId}`);
  revalidatePath("/dashboard");
}

export async function skipFollowUpAction(id: string) {
  const [followUp] = await db.select().from(followUps).where(eq(followUps.id, id)).limit(1);
  if (!followUp) return;

  await db.update(followUps).set({ status: "SKIPPED", updatedAt: new Date() }).where(eq(followUps.id, id));

  revalidatePath("/follow-ups");
  revalidatePath(`/agencies/${followUp.agencyId}`);
  revalidatePath("/dashboard");
}

export async function rescheduleFollowUpAction(id: string, newDueDate: Date) {
  const [followUp] = await db.select().from(followUps).where(eq(followUps.id, id)).limit(1);
  if (!followUp) return;

  await db.update(followUps).set({ dueDate: newDueDate, updatedAt: new Date() }).where(eq(followUps.id, id));
  await db.update(agencies).set({ nextFollowUpAt: newDueDate }).where(eq(agencies.id, followUp.agencyId));

  revalidatePath("/follow-ups");
  revalidatePath(`/agencies/${followUp.agencyId}`);
  revalidatePath("/dashboard");
}
